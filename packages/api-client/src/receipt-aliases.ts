// SCKRL-921 spike: Austrian receipt-token normalizer and curated alias seed.
// Categorization only. Not wired into parseReceiptText; measured offline first.
import type { ItemCategoryId } from './items';

export const retailChainIds = ['billa', 'hofer', 'lidl', 'spar', 'penny'] as const;
export type RetailChainId = (typeof retailChainIds)[number];

export type NormalizedReceiptToken = {
  readonly chainHint: RetailChainId | null;
  readonly norm: string;
  readonly tokens: readonly string[];
};

export type AliasMatchMethod = 'exact_chain' | 'exact' | 'token' | 'fuzzy' | 'none';

export type AliasMatch = {
  readonly alias: string | null;
  readonly categoryId: ItemCategoryId | null;
  readonly method: AliasMatchMethod;
  readonly score: number;
};

// Longest first so multi-word brands win.
const houseBrandPrefixes: readonly { readonly chain: RetailChainId; readonly prefix: string }[] = [
  { chain: 'hofer', prefix: 'zurueck zum ursprung' },
  { chain: 'lidl', prefix: 'ein gutes stueck heimat' },
  { chain: 'billa', prefix: 'ja natuerlich' },
  { chain: 'billa', prefix: 'billa corso' },
  { chain: 'billa', prefix: 'billa bio' },
  { chain: 'spar', prefix: 'spar natur pur' },
  { chain: 'spar', prefix: 'spar premium' },
  { chain: 'lidl', prefix: 'chef select' },
  { chain: 'spar', prefix: 's budget' },
  { chain: 'billa', prefix: 'clever' },
  { chain: 'billa', prefix: 'billa' },
  { chain: 'spar', prefix: 'spar' },
  { chain: 'hofer', prefix: 'milsani' },
  { chain: 'hofer', prefix: 'choceur' },
  { chain: 'hofer', prefix: 'gut bio' },
  { chain: 'hofer', prefix: 'backbox' },
  { chain: 'lidl', prefix: 'milbona' },
  { chain: 'lidl', prefix: 'pilos' },
  { chain: 'lidl', prefix: 'cien' },
  { chain: 'lidl', prefix: 'solevita' },
  { chain: 'lidl', prefix: 'freeway' },
  { chain: 'lidl', prefix: 'crownfield' },
  { chain: 'penny', prefix: 'echt bio' },
];

// Receipt abbreviations seen on AT till rolls -> expanded token.
const abbreviations: Readonly<Record<string, string>> = {
  vollm: 'vollmilch',
  vm: 'vollmilch',
  hmilch: 'haltbarmilch',
  fettarmm: 'fettarmmilch',
  joghu: 'joghurt',
  jogh: 'joghurt',
  natjog: 'naturjoghurt',
  'schl.obers': 'schlagobers',
  schlobers: 'schlagobers',
  schlag: 'schlagobers',
  sauerr: 'sauerrahm',
  topf: 'topfen',
  kaes: 'kaese',
  bergk: 'bergkaese',
  emment: 'emmentaler',
  mozz: 'mozzarella',
  sem: 'semmel',
  semm: 'semmel',
  kaiserse: 'kaisersemmel',
  vollkb: 'vollkornbrot',
  toastbr: 'toastbrot',
  hendl: 'huhn',
  haehnbr: 'haehnchenbrust',
  putenbr: 'putenbrust',
  faschiert: 'faschiertes',
  schwkar: 'schweinskarree',
  extrawu: 'extrawurst',
  schink: 'schinken',
  erdaepf: 'erdaepfel',
  kart: 'kartoffel',
  paradeis: 'paradeiser',
  zwieb: 'zwiebel',
  kar: 'karotten',
  champ: 'champignons',
  mineralw: 'mineralwasser',
  minw: 'mineralwasser',
  orangens: 'orangensaft',
  apfels: 'apfelsaft',
  tk: 'tiefkuehl',
  schoko: 'schokolade',
  schok: 'schokolade',
  spag: 'spaghetti',
  weizenm: 'weizenmehl',
  zuck: 'zucker',
  olivenoe: 'olivenoel',
  sonnenbl: 'sonnenblumenoel',
};

// Tokens that are pure noise on receipts.
const noiseTokens = new Set(['stk', 'st', 'x', 'pkg', 'pkt', 'aktion', 'ak', 'kl', 'gr', 'gew', 'a', 'b', 'c']);

export function foldGerman(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function normalizeReceiptToken(raw: string): NormalizedReceiptToken {
  let value = foldGerman(raw)
    // trailing price and tax class (e.g. "1,99 A", "2.49 €")
    .replace(/\s*(?:eur|€)?\s*-?\d{1,5}[,.]\d{2}\s*(?:eur|€)?\s*[a-d]?\s*$/i, '')
    // multipliers like "2 x" / "2x"
    .replace(/\b\d+\s*x\b/g, ' ')
    // pack sizes, fat %, weight lines
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|mg|ml|cl|l|ltr|stk|st|%)(?=\s|$|[^a-z])/g, ' ')
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|g)?\s*\/\s*kg\b/g, ' ')
    .replace(/[!*/_()"'+:;,]/g, ' ')
    .replace(/\bh-milch\b/g, 'haltbarmilch')
    .replace(/-/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let chainHint: RetailChainId | null = null;

  for (const brand of houseBrandPrefixes) {
    if (value === brand.prefix || value.startsWith(`${brand.prefix} `)) {
      chainHint = brand.chain;
      value = value.slice(brand.prefix.length).trim();
      break;
    }
  }

  const tokens = value
    .split(' ')
    .map((token) => token.replace(/\.+$/, ''))
    .map((token) => abbreviations[token] ?? token)
    .filter((token) => token.length > 0 && !noiseTokens.has(token));

  return { chainHint, norm: tokens.join(' '), tokens };
}

type SeedEntry = readonly [alias: string, categoryId: ItemCategoryId, chain?: RetailChainId];

const c = (categoryId: ItemCategoryId, aliases: string): SeedEntry[] =>
  aliases
    .split('|')
    .map((alias) => alias.trim())
    .filter(Boolean)
    .map((alias) => [alias, categoryId] as const);

// Curated Austrian receipt vocabulary (folded). Origin: seed. Synthetic-authored, no catalog data.
export const austrianAliasSeed: readonly SeedEntry[] = [
  ...c(
    'dairy',
    'milch|vollmilch|haltbarmilch|fettarmmilch|leichtmilch|heumilch|bergbauernmilch|frischmilch|laktosefrei milch|' +
      'joghurt|naturjoghurt|fruchtjoghurt|griechisch joghurt|skyr|kefir|buttermilch|sauermilch|topfen|magertopfen|' +
      'schlagobers|obers|kaffeeobers|sauerrahm|creme fraiche|butter|teebutter|kaese|bergkaese|emmentaler|gouda|' +
      'edamer|mozzarella|feta|parmesan|frischkaese|camembert|brie|gorgonzola|raclette|schmelzkaese|hartkaese|' +
      'eier|freilandeier|bodenhaltung eier|pudding|milchreis|mascarpone|ricotta|halloumi|cottage cheese|' +
      'trinkjoghurt|hafer drink|haferdrink|sojadrink|mandeldrink|almdudler joghurt',
  ),
  ...c(
    'produce',
    'aepfel|apfel|bananen|banane|birnen|orangen|mandarinen|zitronen|limetten|trauben|weintrauben|erdbeeren|' +
      'heidelbeeren|himbeeren|kiwi|ananas|mango|avocado|melone|wassermelone|nektarinen|pfirsiche|marillen|' +
      'zwetschken|kirschen|paradeiser|tomaten|cherrytomaten|rispenparadeiser|gurke|gurken|salat|eisbergsalat|' +
      'vogerlsalat|rucola|blattsalat|kopfsalat|zwiebel|zwiebeln|rote zwiebel|knoblauch|karotten|karotte|' +
      'erdaepfel|kartoffel|speiseerdaepfel|paprika|zucchini|melanzani|brokkoli|karfiol|kohlrabi|lauch|porree|' +
      'jungzwiebel|sellerie|spinat|kohl|weisskraut|rotkraut|champignons|pilze|ingwer|kraeuter|petersilie|' +
      'schnittlauch|basilikum|kuerbis|fenchel|radieschen|rote rueben|suesskartoffel|mais kolben',
  ),
  ...c(
    'meat',
    'huhn|haehnchen|haehnchenbrust|huehnerbrust|huehnerkeule|hendlfilet|putenbrust|pute|putenschnitzel|' +
      'faschiertes|rindfaschiertes|gemischtes faschiertes|rind|rindfleisch|beiried|tafelspitz|gulaschfleisch|' +
      'schwein|schweinefleisch|schweinskarree|schweinsschnitzel|schnitzel|kotelett|speck|bauchspeck|schinken|' +
      'beinschinken|extrawurst|wurst|leberkaese|frankfurter|wiener wuerstel|wuerstel|debreziner|salami|' +
      'kantwurst|polnische|krakauer|bratwurst|kabanossi|lachs|lachsfilet|forelle|thunfisch|fisch|fischstaebchen|' +
      'garnelen|shrimps|kalb|lamm|aufschnitt|prosciutto|chorizo',
  ),
  ...c(
    'bakery',
    'brot|semmel|kaisersemmel|kornspitz|weckerl|baguette|ciabatta|toastbrot|toast|vollkornbrot|roggenbrot|' +
      'bauernbrot|schwarzbrot|mischbrot|croissant|kipferl|plunder|krapfen|brioche|striezel|laugenstange|' +
      'brezel|salzstangerl|knaeckebrot|tortilla|wraps|fladenbrot|zwieback|topfengolatsche|nussschnecke|' +
      'mohnflesserl|bauernbrot laib|dinkelbrot|burger buns',
  ),
  ...c(
    'drinks',
    'wasser|mineralwasser|mineral|vöslauer|voeslauer|roemerquelle|gasteiner|juice|saft|orangensaft|apfelsaft|' +
      'multivitaminsaft|eistee|limonade|almdudler|cola|coca cola|pepsi|fanta|sprite|red bull|energy drink|' +
      'bier|ottakringer|goesser|stiegl|zipfer|puntigamer|radler|wein|rotwein|weisswein|gruener veltliner|' +
      'sekt|prosecco|kaffee|kaffeebohnen|espresso|tee|kamillentee|pfefferminztee|kakao|sirup|holundersirup|' +
      'spezi|tonic|soda|skiwasser|frucade|pago|rauch|hohes c|smoothie|schnaps|vodka|rum',
  ),
  ...c(
    'frozen',
    'tiefkuehl|tk pizza|pizza|tiefkuehlgemuese|tk gemuese|tk spinat|tk erbsen|pommes|pommes frites|' +
      'kroketten|eis|speiseeis|eiscreme|magnum|cornetto|fischstaebchen tk|germknoedel|marillenknoedel|' +
      'tk beeren|eiswuerfel|tk lachs|tk garnelen|tk kraeuter|frozen yogurt|tk strudel',
  ),
  ...c(
    'canned',
    'dose|konserve|thunfisch dose|mais|maiskoerner|bohnen|kidneybohnen|kichererbsen|linsen dose|' +
      'paradeiser passiert|passata|tomatenmark|gehackte tomaten|sauerkraut|essiggurken|gurkerl|oliven|' +
      'kokosmilch|pfirsiche dose|ananas dose|ravioli dose|gulaschsuppe dose|sardinen|apfelmus|rote rueben glas|' +
      'champignons dose|erbsen dose|eintopf',
  ),
  ...c(
    'snacks',
    'chips|kartoffelchips|soletti|erdnussflips|popcorn|nachos|cracker|kekse|keks|biskotten|manner|' +
      'manner schnitten|waffeln|schnitten|schokolade|milka|ritter sport|lindt|mozartkugel|bensdorp|' +
      'gummibaerchen|haribo|bonbons|zuckerl|muesliriegel|nuesse|erdnuesse|cashews|studentenfutter|mandeln|' +
      'pralinen|lebkuchen|kuchen|muffin|donut|riegel|knabbergebaeck|salzstangen|reiswaffeln|' +
      'mannerschnitten|kinder riegel|pick up|twix|snickers|mars',
  ),
  ...c(
    'spices',
    'salz|meersalz|jodsalz|pfeffer|paprikapulver|edelsuess|kuemmel|curry|zimt|oregano|majoran|' +
      'muskat|chili|chiliflocken|knoblauchpulver|gewuerz|gewuerzmischung|suppenwuerze|kraeutersalz|' +
      'vanillezucker|backpulver|germ|trockengerm|lorbeer|thymian|rosmarin|kurkuma|gemuesesuppenwuerfel|' +
      'suppenwuerfel|bruehe|senf|ketchup|mayonnaise|essig|balsamico|sojasauce',
  ),
  ...c(
    'pantry',
    'mehl|weizenmehl|dinkelmehl|griess|zucker|staubzucker|kristallzucker|honig|marmelade|konfituere|' +
      'nutella|nougatcreme|erdnussbutter|reis|basmatireis|risottoreis|nudeln|spaghetti|penne|fusilli|' +
      'eiernudeln|spaetzle|gnocchi|lasagne|couscous|bulgur|quinoa|haferflocken|muesli|cornflakes|' +
      'oel|olivenoel|sonnenblumenoel|rapsoel|kernoel|kuerbiskernoel|linsen|semmelbroesel|paniermehl|' +
      'pesto|tomatensauce|nudelsauce|fertigsuppe|instantnudeln|kaffeepads|kapseln|puddingpulver|' +
      'schokostreusel|backmischung|kakao pulver|maisstaerke|haferkleie|chiasamen|sonnenblumenkerne|kuerbiskerne',
  ),
];

const seedIndex = new Map<string, ItemCategoryId>();
for (const [alias, categoryId] of austrianAliasSeed) {
  const key = normalizeReceiptToken(alias).norm;
  if (key && !seedIndex.has(key)) {
    seedIndex.set(key, categoryId);
  }
}

export function aliasSeedSize(): number {
  return seedIndex.size;
}

function trigrams(value: string): Set<string> {
  // pg_trgm style: per word, padded with two leading and one trailing space.
  const set = new Set<string>();
  for (const word of value.split(' ').filter(Boolean)) {
    const padded = `  ${word} `;
    for (let i = 0; i < padded.length - 2; i += 1) {
      set.add(padded.slice(i, i + 3));
    }
  }
  return set;
}

export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const gram of ta) {
    if (tb.has(gram)) {
      shared += 1;
    }
  }
  return shared / (ta.size + tb.size - shared);
}

export const fuzzyThreshold = 0.55;

// Scores map onto the existing confidence tiers: >=0.85 high, >=0.65 mid, else needs_review.
export function matchReceiptAlias(raw: string): AliasMatch {
  const { norm, tokens } = normalizeReceiptToken(raw);
  const none: AliasMatch = { alias: null, categoryId: null, method: 'none', score: 0 };

  if (!norm) {
    return none;
  }

  const exact = seedIndex.get(norm);
  if (exact) {
    return { alias: norm, categoryId: exact, method: 'exact', score: 0.9 };
  }

  // Longest contiguous token run that is a known alias (e.g. "bergkaese gerieben").
  for (let size = tokens.length - 1; size >= 1; size -= 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      const phrase = tokens.slice(start, start + size).join(' ');
      const hit = seedIndex.get(phrase);
      if (hit && phrase.length >= 3) {
        return { alias: phrase, categoryId: hit, method: 'token', score: 0.75 };
      }
    }
  }

  let best: { alias: string; categoryId: ItemCategoryId; sim: number } | null = null;
  for (const token of tokens.length > 1 ? [norm, ...tokens] : [norm]) {
    if (token.length < 4) {
      continue;
    }
    for (const [alias, categoryId] of seedIndex) {
      const sim = trigramSimilarity(token, alias);
      if (sim >= fuzzyThreshold && (!best || sim > best.sim)) {
        best = { alias, categoryId, sim };
      }
    }
  }

  if (best) {
    return {
      alias: best.alias,
      categoryId: best.categoryId,
      method: 'fuzzy',
      score: Math.round((0.4 + best.sim * 0.4) * 1000) / 1000,
    };
  }

  return none;
}
