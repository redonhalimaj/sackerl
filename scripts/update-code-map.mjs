import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Only source syntax and type information are read. No application or env files execute.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'docs/code-map');
const check = process.argv.includes('--check');
const roots = [
  'apps/mobile/app',
  'apps/mobile/lib',
  'apps/mobile/components',
  'apps/web/app',
  'apps/web/lib',
  'packages/api-client/src',
  'packages/ui/src',
  'packages/tokens/src',
];
const walk = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const files = roots
  .flatMap((directory) => walk(path.join(root, directory)))
  .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.(test|spec|d)\.tsx?$/.test(file));
const config = ts.readConfigFile(path.join(root, 'tsconfig.base.json'), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(files, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const pageName = (file) =>
  `Methods - ${file.replace(/\.(tsx?|sql)$/, '').replace(/[^A-Za-z0-9-]+/g, '-')}`;
const sources = files.map((file) => program.getSourceFile(file)).filter(Boolean);
const nodes = new Map();
const definitions = new Map();
const sqlNames = new Map();
const edges = new Map();

function callableName(node) {
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.body) {
    return node.name?.getText() ?? 'default';
  }
  if (ts.isConstructorDeclaration(node) && node.body) return 'constructor';
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (ts.isVariableDeclaration(node.parent)) return node.parent.name.getText();
    if (ts.isPropertyAssignment(node.parent)) return node.parent.name.getText();
    const wrapper = node.parent;
    if (
      ts.isCallExpression(wrapper) &&
      wrapper.arguments[0] === node &&
      ts.isVariableDeclaration(wrapper.parent) &&
      /^(useCallback|useMemo|memo|forwardRef)$/.test(wrapper.expression.getText().split('.').at(-1))
    ) {
      return wrapper.parent.name.getText();
    }
    if (node.name) return node.name.getText();
  }
  return undefined;
}

function register(node, file, name, line, kind = 'TypeScript') {
  const key = `${file}:${name}`;
  if (node && nodes.has(key)) throw new Error(`Ambiguous callable identity: ${key}`);
  // Overloads with no body are excluded; distinct lexical owners qualify nested names.
  const id = `s-${createHash('sha256').update(key).digest('hex').slice(0, 12)}`;
  const symbol = { key, id, file, name, line, kind, page: pageName(file) };
  nodes.set(key, symbol);
  if (node) {
    definitions.set(node, symbol);
    if (ts.isVariableDeclaration(node.parent) || ts.isPropertyAssignment(node.parent)) {
      definitions.set(node.parent, symbol);
    } else if (ts.isCallExpression(node.parent) && ts.isVariableDeclaration(node.parent.parent)) {
      definitions.set(node.parent.parent, symbol);
    }
  }
  return symbol;
}

for (const source of sources) {
  function visit(node, owners = []) {
    const name = callableName(node);
    const className = ts.isClassDeclaration(node) ? node.name?.getText() : undefined;
    if (name)
      register(
        node,
        relative(source.fileName),
        [...owners, name].join('.'),
        source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      );
    ts.forEachChild(node, (child) =>
      visit(child, name || className ? [...owners, name ?? className] : owners),
    );
  }
  visit(source);
}

const migrations = walk(path.join(root, 'supabase/migrations'))
  .filter((file) => file.endsWith('.sql'))
  .sort();
const sqlDefinitions = [];
for (const file of migrations) {
  const content = fs.readFileSync(file, 'utf8');
  const pattern =
    /create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\([\s\S]*?\$\$([\s\S]*?)\$\$\s*;/gi;
  for (const match of content.matchAll(pattern)) {
    const item = register(
      null,
      relative(file),
      match[1],
      content.slice(0, match.index).split('\n').length,
      'SQL function',
    );
    // Later migrations replace earlier definitions of the same SQL function.
    const previous = sqlNames.get(match[1]);
    if (previous) nodes.delete(previous.key);
    sqlNames.set(match[1], item);
    sqlDefinitions.push({ item, body: match[2] });
  }
}

function edge(from, to, kind) {
  if (!from || !to || from.key === to.key) return;
  edges.set(`${from.key}|${to.key}|${kind}`, { from, to, kind });
}
function resolve(expression) {
  const target = ts.isPropertyAccessExpression(expression) ? expression.name : expression;
  let symbol = checker.getSymbolAtLocation(target);
  if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  return symbol?.declarations?.map((decl) => definitions.get(decl)).find(Boolean);
}
for (const source of sources) {
  function visit(node, owner) {
    const current = definitions.get(node) ?? owner;
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const declaration = checker.getResolvedSignature(node)?.declaration;
      edge(current, definitions.get(declaration) ?? resolve(node.expression), 'call');
      for (const argument of node.arguments ?? []) {
        if (ts.isIdentifier(argument) || ts.isPropertyAccessExpression(argument)) {
          edge(current, resolve(argument), 'argument reference');
        }
      }
      const first = node.arguments?.[0];
      if (
        first &&
        ts.isStringLiteral(first) &&
        /(?:rpc|requestRpc\w*)$/i.test(node.expression.getText())
      ) {
        edge(current, sqlNames.get(first.text), 'RPC');
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      edge(current, resolve(node.tagName), 'JSX');
    }
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression
    ) {
      edge(current, resolve(node.initializer.expression), 'JSX callback');
    }
    ts.forEachChild(node, (child) => visit(child, current));
  }
  visit(source, undefined);
}
for (const { item, body } of sqlDefinitions) {
  if (!nodes.has(item.key)) continue;
  for (const match of body.matchAll(/public\.(\w+)\s*\(/g))
    edge(item, sqlNames.get(match[1]), 'SQL call');
}

const ordered = [...nodes.values()].sort((a, b) => a.key.localeCompare(b.key, 'en'));
const allEdges = [...edges.values()];
const pages = new Map();
for (const item of ordered) {
  if (!pages.has(item.page)) pages.set(item.page, []);
  pages.get(item.page).push(item);
}
const link = (item) => `[[${item.page}#^${item.id}|${item.name}]]`;
const sourceLink = (file, line) => `[${file}](<../../../${file}>)${line ? `, line ${line}` : ''}`;
const output = new Map();
for (const [page, items] of pages) {
  const sections = items.map((item) => {
    const outgoing = allEdges.filter((relation) => relation.from === item);
    const incoming = allEdges.filter((relation) => relation.to === item);
    const render = (relations, direction) =>
      relations
        .sort(
          (a, b) =>
            a[direction].key.localeCompare(b[direction].key, 'en') || a.kind.localeCompare(b.kind),
        )
        .map((relation) => `${link(relation[direction])} (${relation.kind})`)
        .join(', ');
    return (
      `## ${item.name}\n\n${item.kind}. ${sourceLink(item.file, item.line)}. ^${item.id}\n\n` +
      `Calls / references: ${render(outgoing, 'to') || 'No resolved internal relationship.'}\n\n` +
      `Used by: ${render(incoming, 'from') || 'No resolved internal caller; may be a framework entry point or dynamic callback.'}\n`
    );
  });
  output.set(
    `generated/${page}.md`,
    `---\ntags: [code-map, generated]\n---\n\n# ${page}\n\n` +
      '[[Method Index]] · [[Maintenance]]\n\nGenerated by `pnpm code:map`; do not edit manually. ' +
      'Relationships are static evidence, not execution order.\n\n' +
      sections.join('\n'),
  );
}
output.set(
  'Method Index.md',
  `---\ntags: [code-map, generated]\n---\n\n# Method Index\n\n` +
    '[[Sackerl Code Map]] · [[Maintenance]]\n\n' +
    `Generated from ${sources.length} runtime TypeScript files and ${migrations.length} SQL migrations: ` +
    `**${nodes.size} named callables**, **${allEdges.length} resolved relationships**, **${pages.size} module notes**.\n\n` +
    'Open a module to see each method, its source line, what it calls and what uses it. ' +
    'In Obsidian, open its Local graph to explore connected modules.\n\n' +
    '## How to read the evidence\n\n' +
    '- `call`: TypeScript resolves a call/new expression to this implementation.\n' +
    '- `JSX` / `JSX callback`: component or handler reference; React decides when it runs.\n' +
    '- `argument reference`: a named function passed as an argument (for example `items.map(mapRow)`); the receiving function controls its use.\n' +
    '- `RPC`: a literal RPC name matches a SQL function in the checked-in migrations.\n' +
    '- `SQL call`: a schema-qualified function reference in the latest SQL function body.\n' +
    '- Anonymous callbacks are attributed to their nearest named owner. Calls inside effects or callbacks are not necessarily immediate.\n' +
    '- This is not a complete runtime call graph: route discovery, dependency injection, computed names, HTTP boundaries, SQL triggers, dynamic callbacks and platform resolution need the curated flow notes.\n' +
    '- Native and web source variants are indexed; default TypeScript resolution does not model Metro platform selection.\n' +
    '- Tests, generated/build output, third-party libraries, object data and types are excluded. No detected caller does **not** mean unused. SQL migration presence does **not** mean deployed.\n\n' +
    '## Modules\n\n| Module | Named callables |\n| --- | ---: |\n' +
    [...pages]
      .map(([page, items]) => `| [[${page}\\|${items[0].file}]] | ${items.length} |`)
      .join('\n') +
    '\n',
);

let changed = 0;
for (const [file, contents] of output) {
  const target = path.join(destination, file);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === contents) continue;
  changed += 1;
  if (!check) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
}
const generated = path.join(destination, 'generated');
if (fs.existsSync(generated)) {
  for (const file of fs
    .readdirSync(generated)
    .filter((file) => file.startsWith('Methods - ') && file.endsWith('.md'))) {
    if (!output.has(`generated/${file}`)) {
      changed += 1;
      if (!check) fs.unlinkSync(path.join(generated, file));
    }
  }
}
process.stdout.write(
  `${check ? 'Checked' : 'Generated'} code map: ${nodes.size} callables, ${allEdges.length} relationships, ${pages.size} modules; ${changed} ${check ? 'stale' : 'updated'} files.\n`,
);
if (check && changed) process.exitCode = 1;
