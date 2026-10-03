import { isItemQuantityUnit, type ItemCategoryId, type ItemQuantityUnit } from './items';
import { ApiRequestError } from './profile';

export const receiptItemConfidenceLevels = ['high', 'mid', 'needs_review'] as const;

export type ReceiptItemConfidenceLevel = (typeof receiptItemConfidenceLevels)[number];

export type ParsedReceiptLineItem = {
  readonly categoryId: ItemCategoryId;
  readonly confidence: number;
  readonly confidenceLevel: ReceiptItemConfidenceLevel;
  readonly inferredName: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly rawText: string;
};

export type ParsedReceiptDocument = {
  readonly currency: string;
  readonly items: readonly ParsedReceiptLineItem[];
  readonly purchasedOn: string | null;
  readonly storeName: string | null;
  readonly totalCents: number | null;
};

type QuantityParseResult = {
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly recognised: boolean;
};

type ProductNameMatch = {
  readonly canonicalName: string;
  readonly matched: boolean;
};

const maxReceiptLines = 120;
const totalLinePattern =
  /\b(total|summe|gesamt|betrag|somme|a payer|montant|totale|importo|da pagare)\b/i;
const skipLinePattern =
  /\b(receipt|beleg|bon|ticket|rechnung|invoice|tax|vat|mwst|iva|tva|card|karte|visa|cash|bar|change|rueckgeld|merci|danke|thank you|subtotal|zwischensumme)\b/i;
const datePattern =
  /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b|\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/;
const trailingMoneyPattern =
  /(?:\s|^)(?:eur|chf|usd|gbp|€|fr\.)?\s*(\d{1,5}[,.]\d{2})(?:\s*(?:eur|chf|usd|gbp|€|fr\.))?\s*$/i;

const productSynonyms: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: 'Apples', pattern: /\b(apfel|aepfel|apples?|pomme?s?|mele?)\b/i },
  { name: 'Bananas', pattern: /\b(bananen|bananes?|bananas?)\b/i },
  { name: 'Bread', pattern: /\b(brot|bread|pain|pane)\b/i },
  { name: 'Cheese', pattern: /\b(kaese|kase|cheese|fromage|formaggio)\b/i },
  { name: 'Chicken', pattern: /\b(chicken|huhn|haehnchen|poulet|pollo)\b/i },
  { name: 'Milk', pattern: /\b(milch|milk|lait|latte)\b/i },
  { name: 'Pasta', pattern: /\b(pasta|spaghetti|penne|nudeln)\b/i },
  { name: 'Rice', pattern: /\b(reis|rice|riz|riso)\b/i },
  { name: 'Tomatoes', pattern: /\b(tomaten?|tomates?|pomodori|pomodoro)\b/i },
  { name: 'Water', pattern: /\b(wasser|water|eau|acqua)\b/i },
  { name: 'Yogurt', pattern: /\b(joghurt|yogurt|yoghurt|yaourt)\b/i },
];

const categoryRules: readonly { readonly categoryId: ItemCategoryId; readonly pattern: RegExp }[] =
  [
    {
      categoryId: 'produce',
      pattern:
        /\b(apfel|aepfel|apples?|bananas?|banane|bananen|carrots?|karotte|tomates?|tomatoes|pomodori|pomodoro|cucumbers?|gurke|salad|salat|lettuce|onions?|zwiebel|garlic|knoblauch|pommes?|mele?)\b/i,
    },
    {
      categoryId: 'dairy',
      pattern:
        /\b(milk|milch|lait|latte|yogurt|yoghurt|joghurt|yaourt|cheese|kaese|kase|fromage|formaggio|egg|eier)\b/i,
    },
    {
      categoryId: 'meat',
      pattern:
        /\b(chicken|huhn|haehnchen|beef|rind|fish|fisch|poisson|poulet|pollo|viande|meat)\b/i,
    },
    { categoryId: 'bakery', pattern: /\b(bread|brot|pain|pane|croissant|baguette)\b/i },
    { categoryId: 'drinks', pattern: /\b(water|wasser|eau|acqua|juice|saft|jus|beer|bier)\b/i },
    { categoryId: 'frozen', pattern: /\b(frozen|tiefkuehl|surgeles?|surgelato)\b/i },
    { categoryId: 'canned', pattern: /\b(canned|dose|konserve|conserve|barattolo)\b/i },
    { categoryId: 'snacks', pattern: /\b(chips|snack|cookies?|keks|biscuit|cracker|chocolate)\b/i },
    { categoryId: 'spices', pattern: /\b(salt|salz|sel|sale|pepper|pfeffer|poivre|pepe|spice)\b/i },
    {
      categoryId: 'pantry',
      pattern: /\b(pasta|spaghetti|penne|rice|reis|riz|riso|flour|mehl|farine|olio|oil)\b/i,
    },
  ];

export function isReceiptItemConfidenceLevel(value: unknown): value is ReceiptItemConfidenceLevel {
  return (
    typeof value === 'string' &&
    receiptItemConfidenceLevels.includes(value as ReceiptItemConfidenceLevel)
  );
}

export function confidenceLevelForScore(confidence: number): ReceiptItemConfidenceLevel {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new ApiRequestError('Receipt item confidence must be between 0 and 1.', 400);
  }

  if (confidence >= 0.85) {
    return 'high';
  }

  return confidence >= 0.65 ? 'mid' : 'needs_review';
}

export function parseReceiptText(text: string): ParsedReceiptDocument {
  const lines = normaliseReceiptLines(text);

  return {
    currency: inferCurrency(lines),
    items: lines.map(parseLineItem).filter((item): item is ParsedReceiptLineItem => item !== null),
    purchasedOn: inferPurchasedOn(lines),
    storeName: inferStoreName(lines),
    totalCents: inferTotalCents(lines),
  };
}

function normaliseReceiptLines(text: string): readonly string[] {
  const value = text.trim();

  if (!value) {
    throw new ApiRequestError('Receipt OCR text is required.', 400);
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, maxReceiptLines);
}

function inferCurrency(lines: readonly string[]): string {
  const joined = lines.join(' ');

  if (/\bCHF\b|Fr\./i.test(joined)) {
    return 'CHF';
  }

  if (/\bUSD\b|\$/i.test(joined)) {
    return 'USD';
  }

  if (/\bGBP\b|£/i.test(joined)) {
    return 'GBP';
  }

  return 'EUR';
}

function inferPurchasedOn(lines: readonly string[]): string | null {
  for (const line of lines) {
    const parsed = parseDate(line);

    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function parseDate(line: string): string | null {
  const match = line.match(datePattern);

  if (!match) {
    return null;
  }

  if (match[1] && match[2] && match[3]) {
    return buildIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  if (match[4] && match[5] && match[6]) {
    const rawYear = Number(match[6]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    return buildIsoDate(year, Number(match[5]), Number(match[4]));
  }

  return null;
}

function buildIsoDate(year: number, month: number, day: number): string | null {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 2000 ||
    year > 2100
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function inferStoreName(lines: readonly string[]): string | null {
  for (const line of lines.slice(0, 8)) {
    if (
      shouldSkipMetadataLine(line) ||
      totalLinePattern.test(line) ||
      trailingMoneyPattern.test(line)
    ) {
      continue;
    }

    const storeName = cleanName(line);

    if (/[a-z]/i.test(storeName) && storeName.length >= 2) {
      return titleCase(storeName);
    }
  }

  return null;
}

function inferTotalCents(lines: readonly string[]): number | null {
  for (const line of [...lines].reverse()) {
    if (!totalLinePattern.test(line)) {
      continue;
    }

    const money = parseTrailingMoney(line);

    if (money) {
      return money.cents;
    }
  }

  return null;
}

function parseLineItem(line: string): ParsedReceiptLineItem | null {
  if (shouldSkipMetadataLine(line) || totalLinePattern.test(line)) {
    return null;
  }

  const money = parseTrailingMoney(line);

  if (!money) {
    return null;
  }

  const rawName = line
    .slice(0, money.index)
    .replace(/[.:;,-]+$/g, '')
    .trim();

  if (!/[a-z]/i.test(rawName) || rawName.length < 2) {
    return null;
  }

  const quantity = parseQuantity(rawName);
  const productName = normaliseProductName(quantity.name);
  const categoryId = inferCategoryId(`${productName.canonicalName} ${rawName}`);
  const confidence = scoreLineItem({
    categoryRecognised: categoryId !== 'pantry' || /\b(pasta|rice|reis|riso|riz)\b/i.test(rawName),
    productName,
    productRecognised: productName.matched,
    quantityRecognised: quantity.recognised,
    rawName,
  });

  return {
    categoryId,
    confidence,
    confidenceLevel: confidenceLevelForScore(confidence),
    inferredName: productName.canonicalName,
    qtyUnit: quantity.qtyUnit,
    qtyValue: quantity.qtyValue,
    rawText: line,
  };
}

function shouldSkipMetadataLine(line: string): boolean {
  return skipLinePattern.test(line) || datePattern.test(line) || /^[#*= -]+$/.test(line);
}

function parseTrailingMoney(
  line: string,
): { readonly cents: number; readonly index: number } | null {
  const match = line.match(trailingMoneyPattern);

  if (!match?.[1] || typeof match.index !== 'number') {
    return null;
  }

  return {
    cents: moneyToCents(match[1]),
    index: match.index,
  };
}

function moneyToCents(value: string): number {
  const [units = '0', cents = '0'] = value.replace(',', '.').split('.');

  return Number(units) * 100 + Number(cents.padEnd(2, '0').slice(0, 2));
}

function parseQuantity(value: string): QuantityParseResult {
  const cleaned = cleanName(value);
  const leadingCount = cleaned.match(
    /^(\d+(?:[,.]\d+)?)\s*(?:x|pcs?|stk|st|pz|pieces?)\b\s*(.+)$/i,
  );

  if (leadingCount?.[1] && leadingCount[2]) {
    return {
      name: leadingCount[2],
      qtyUnit: 'pcs',
      qtyValue: parseQuantityNumber(leadingCount[1]),
      recognised: true,
    };
  }

  const leadingMeasure = cleaned.match(/^(\d+(?:[,.]\d+)?)\s*(kg|g|ml|l)\b\s*(.+)$/i);

  if (leadingMeasure?.[1] && leadingMeasure[2] && leadingMeasure[3]) {
    return {
      name: leadingMeasure[3],
      qtyUnit: normaliseQuantityUnit(leadingMeasure[2]),
      qtyValue: parseQuantityNumber(leadingMeasure[1]),
      recognised: true,
    };
  }

  const trailingMeasure = cleaned.match(/^(.+?)\s+(\d+(?:[,.]\d+)?)\s*(kg|g|ml|l)$/i);

  if (trailingMeasure?.[1] && trailingMeasure[2] && trailingMeasure[3]) {
    return {
      name: trailingMeasure[1],
      qtyUnit: normaliseQuantityUnit(trailingMeasure[3]),
      qtyValue: parseQuantityNumber(trailingMeasure[2]),
      recognised: true,
    };
  }

  return {
    name: cleaned,
    qtyUnit: 'pcs',
    qtyValue: 1,
    recognised: false,
  };
}

function parseQuantityNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normaliseQuantityUnit(unit: string): ItemQuantityUnit {
  const value = unit.toLowerCase();

  if (isItemQuantityUnit(value)) {
    return value;
  }

  return 'pcs';
}

function normaliseProductName(rawName: string): ProductNameMatch {
  const value = cleanName(rawName);

  for (const synonym of productSynonyms) {
    if (synonym.pattern.test(value)) {
      return { canonicalName: synonym.name, matched: true };
    }
  }

  return { canonicalName: titleCase(value), matched: false };
}

function inferCategoryId(value: string): ItemCategoryId {
  for (const rule of categoryRules) {
    if (rule.pattern.test(value)) {
      return rule.categoryId;
    }
  }

  return 'pantry';
}

function scoreLineItem(input: {
  readonly categoryRecognised: boolean;
  readonly productName: ProductNameMatch;
  readonly productRecognised: boolean;
  readonly quantityRecognised: boolean;
  readonly rawName: string;
}): number {
  let score = 0.62;

  if (input.rawName.length >= 4) {
    score += 0.05;
  }

  if (input.quantityRecognised) {
    score += 0.06;
  }

  if (input.categoryRecognised) {
    score += 0.07;
  }

  if (input.productRecognised) {
    score += 0.15;
  }

  if (/[^a-z0-9\s.-]/i.test(input.rawName)) {
    score -= 0.04;
  }

  if (input.productName.canonicalName.length < 3) {
    score -= 0.12;
  }

  return Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
}

function cleanName(value: string): string {
  return value
    .replace(/^\d{3,}\s+/, '')
    .replace(/\b(bio|organic|fresh|frisch|frais|fresco)\b/gi, '')
    .replace(/[*/_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}
