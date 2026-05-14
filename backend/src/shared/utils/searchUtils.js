/**
 * searchUtils.js
 *
 * Centralized search utilities:
 * 1. Synonym expansion — maps common terms to aliases
 * 2. Typo tolerance  — builds a forgiving regex from a query
 * 3. Score ranking   — re-ranks DB results by relevance
 */

// ─── 1. Synonym Map ───────────────────────────────────────────────────────────
// Keys are what users type; values are extra terms to include in the query.
const SYNONYM_MAP = {
  laptop:       ['notebook', 'macbook', 'chromebook', 'computer', 'pc'],
  mobile:       ['phone', 'smartphone', 'iphone', 'android', 'handset'],
  phone:        ['mobile', 'smartphone', 'iphone', 'android'],
  book:         ['textbook', 'novel', 'guide', 'notes', 'material'],
  textbook:     ['book', 'notes', 'study material', 'guide'],
  cycle:        ['bicycle', 'bike'],
  bicycle:      ['cycle', 'bike'],
  bike:         ['cycle', 'bicycle'],
  bag:          ['backpack', 'rucksack', 'satchel', 'handbag'],
  backpack:     ['bag', 'rucksack'],
  headphone:    ['earphone', 'earbuds', 'headset', 'airpods'],
  earphone:     ['headphone', 'earbuds', 'headset'],
  chair:        ['seat', 'stool', 'furniture'],
  table:        ['desk', 'furniture'],
  calculator:   ['casio', 'scientific calculator'],
  printer:      ['inkjet', 'laser printer'],
  camera:       ['dslr', 'mirrorless', 'webcam'],
  charger:      ['adapter', 'power bank', 'cable'],
  keyboard:     ['mechanical keyboard', 'wireless keyboard'],
  monitor:      ['screen', 'display'],
  mattress:     ['bed', 'bedding', 'foam'],
  fan:          ['cooler', 'air cooler', 'table fan', 'ceiling fan'],
  shoes:        ['sneakers', 'footwear', 'sandals', 'boots', 'chappal'],
  clothes:      ['clothing', 'shirt', 'jeans', 'jacket', 'hoodie', 'tshirt', 'dress'],
  watch:        ['smartwatch', 'wristwatch'],
  speaker:      ['bluetooth speaker', 'portable speaker', 'jbl'],
  tablet:       ['ipad', 'android tablet'],
  pen:          ['pencil', 'marker', 'stationery'],
  stationery:   ['pen', 'pencil', 'eraser', 'ruler', 'notebook'],
  gym:          ['dumbbell', 'fitness', 'weights', 'resistance band'],
  cricket:      ['bat', 'ball', 'sports'],
  football:     ['soccer ball', 'sports'],
  guitar:       ['instrument', 'acoustic', 'electric guitar'],
  notes:        ['handwritten notes', 'study material', 'textbook'],
};

/**
 * Given a search query, returns an expanded array of terms including synonyms.
 * e.g. "laptop" → ["laptop", "notebook", "macbook", "chromebook", "computer", "pc"]
 */
const expandWithSynonyms = (query = '') => {
  const normalized = query.trim().toLowerCase();
  const terms = normalized.split(/\s+/).filter(Boolean);
  const expanded = new Set(terms);

  terms.forEach((term) => {
    const synonyms = SYNONYM_MAP[term];
    if (synonyms) {
      synonyms.forEach((s) => expanded.add(s));
    }
  });

  return [...expanded];
};

// ─── 2. Typo Tolerance ────────────────────────────────────────────────────────

/**
 * Builds a MongoDB $or clause that is tolerant of common typos:
 * - Character transpositions ("electrnics" → "electronics")
 * - Missing characters ("electronis")
 * - Extra characters ("electronnics")
 *
 * Strategy: split into individual characters and match docs containing
 * at least (n-1) consecutive chars from the query as a regex.
 * For short queries (≤3 chars), just use a standard regex.
 */
const buildTypoTolerantRegex = (query = '') => {
  const term = query.trim();
  if (!term) return null;

  // Escape special regex chars
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (term.length <= 3) {
    return new RegExp(escaped, 'i');
  }

  // Build partial-match patterns: all substrings of length ≥ ceil(len * 0.7)
  const minLen = Math.ceil(term.length * 0.72);
  const patterns = new Set();

  for (let start = 0; start <= term.length - minLen; start++) {
    const sub = term.slice(start, start + minLen);
    const escapedSub = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.add(escapedSub);
  }

  // Combine into alternation: (pattern1|pattern2|...)
  const alternation = [...patterns].join('|');
  return new RegExp(alternation, 'i');
};

/**
 * Returns a $or clause for a given field that checks both exact regex and typo-tolerant regex.
 */
const buildFieldMatcher = (field, query) => {
  const exactRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const typoRegex = buildTypoTolerantRegex(query);

  if (!typoRegex || exactRegex.source === typoRegex.source) {
    return { [field]: exactRegex };
  }

  return { $or: [{ [field]: exactRegex }, { [field]: typoRegex }] };
};

// ─── 3. Enhanced Relevance Scoring ───────────────────────────────────────────

const normalizeText = (value = '') => value.toString().trim().toLowerCase();

/**
 * Score a single product against a search query.
 * Higher score = more relevant.
 */
const scoreProduct = (product, query) => {
  const q = normalizeText(query);
  if (!q) return 0;

  const title       = normalizeText(product.title || '');
  const description = normalizeText(product.description || '');
  const category    = normalizeText(product.category || '');
  const terms       = q.split(/\s+/).filter(Boolean);

  let score = 0;

  // ── Exact title match (highest signal) ──
  if (title === q)             score += 200;
  if (title.startsWith(q))    score += 80;
  if (title.includes(q))      score += 50;

  // ── Category match ──
  if (category === q)          score += 60;
  if (category.includes(q))   score += 35;

  // ── Description match ──
  if (description.includes(q)) score += 15;

  // ── Individual word matches ──
  terms.forEach((term) => {
    if (title.includes(term))       score += 20;
    if (category.includes(term))    score += 12;
    if (description.includes(term)) score += 5;
  });

  // ── Synonym bonus: if a synonym is found in the title/category, reward it ──
  const synonymTerms = expandWithSynonyms(q);
  synonymTerms.forEach((syn) => {
    if (syn !== q) {
      if (title.includes(syn))    score += 8;
      if (category.includes(syn)) score += 6;
    }
  });

  // ── Popularity signals (capped to avoid domination) ──
  score += Math.min(product.views || 0, 100) * 0.15;
  score += Math.min(product.averageRating || 0, 5) * 4;
  score += Math.min(product.reviewCount || 0, 20) * 0.6;

  return score;
};

/**
 * Re-ranks an array of products by relevance score descending.
 */
const rankByRelevance = (products, query) => {
  return products
    .map((p) => ({ product: p, score: scoreProduct(p, query) }))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
};

// ─── 4. Build combined MongoDB $or for search ─────────────────────────────────

/**
 * Builds a rich MongoDB $or search clause that includes:
 * - Exact regex match on title, description, category
 * - Typo-tolerant regex on title
 * - All synonym expansions on title and category
 */
const buildSearchClause = (query = '') => {
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactRegex = new RegExp(escaped, 'i');
  const typoRegex  = buildTypoTolerantRegex(query);

  const clauses = [
    { title:       exactRegex },
    { description: exactRegex },
    { category:    exactRegex },
  ];

  // Typo-tolerant title match
  if (typoRegex && typoRegex.source !== exactRegex.source) {
    clauses.push({ title: typoRegex });
  }

  // Synonym expansion — match any synonym in title or category
  const synonyms = expandWithSynonyms(query);
  synonyms.forEach((syn) => {
    if (syn !== query.trim().toLowerCase()) {
      const synRegex = new RegExp(syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      clauses.push({ title: synRegex });
      clauses.push({ category: synRegex });
    }
  });

  return { $or: clauses };
};

module.exports = {
  expandWithSynonyms,
  buildTypoTolerantRegex,
  buildFieldMatcher,
  scoreProduct,
  rankByRelevance,
  buildSearchClause,
};
