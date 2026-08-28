const BLOCK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'DT', 'DD', 'FIGCAPTION',
  'FIGURE', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'LI', 'MAIN',
  'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR', 'UL',
]);
const DOUBLE_BREAK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'FIGCAPTION', 'FIGURE',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'SECTION', 'TABLE',
]);
const WORD_PATTERN = /[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+|[-‐‑‒–—][\p{L}\p{N}\p{M}]+)*/gu;

export function toCharacters(text) {
  return Array.from(String(text ?? ''));
}

export function countCharacters(text) {
  return toCharacters(text).length;
}

export function countWords(text) {
  return Array.from(String(text ?? '').matchAll(WORD_PATTERN)).length;
}

export function cleanPracticeText(text, { trim = true } = {}) {
  let clean = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (trim) clean = clean.replace(/^\s+|\s+$/gu, '');
  return clean;
}

function appendBreak(parts, amount) {
  let existing = 0;
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const value = parts[index];
    const trailing = value.match(/\n+$/)?.[0].length || 0;
    existing += trailing;
    if (trailing !== value.length) break;
  }
  if (existing < amount) parts.push('\n'.repeat(amount - existing));
}

function appendNodeText(node, parts, inPre = false) {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.nodeValue || '';
    if (!inPre && /^\s*\n\s*$/.test(value)) return;
    parts.push(value);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

  const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName : '';
  if (tag === 'BR') {
    appendBreak(parts, 1);
    return;
  }
  if (tag === 'IMG') return;

  const isBlock = BLOCK_TAGS.has(tag);
  const breakSize = DOUBLE_BREAK_TAGS.has(tag) ? 2 : 1;
  if (isBlock && parts.length) appendBreak(parts, breakSize);

  Array.from(node.childNodes).forEach((child, index, children) => {
    appendNodeText(child, parts, inPre || tag === 'PRE');
    if (tag === 'TR' && ['TD', 'TH'].includes(child.tagName) && index < children.length - 1) parts.push('\t');
  });

  if (isBlock) appendBreak(parts, breakSize);
}

export function nodeToPracticeText(node) {
  const parts = [];
  appendNodeText(node, parts);
  return cleanPracticeText(parts.join(''));
}

export function extractSelectionText(selection, previewRoot) {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';
  const range = selection.getRangeAt(0);
  const common = range.commonAncestorContainer;
  if (common !== previewRoot && !previewRoot.contains(common)) return '';
  return nodeToPracticeText(range.cloneContents());
}

export function findWords(text) {
  const characters = toCharacters(text);
  const utf16ToCharacter = new Map();
  let utf16Index = 0;
  characters.forEach((character, index) => {
    for (let offset = 0; offset < character.length; offset += 1) {
      utf16ToCharacter.set(utf16Index + offset, index);
    }
    utf16Index += character.length;
  });
  utf16ToCharacter.set(utf16Index, characters.length);

  return Array.from(String(text ?? '').matchAll(WORD_PATTERN), (match) => ({
    word: match[0],
    start: utf16ToCharacter.get(match.index) ?? 0,
    end: utf16ToCharacter.get(match.index + match[0].length) ?? characters.length,
  }));
}

export function wordAtCharacter(text, characterIndex) {
  return findWords(text).find(({ start, end }) => characterIndex >= start && characterIndex < end) || null;
}

export function contextAround(text, wordMatch, maxLength = 110) {
  if (!wordMatch) return '';
  const characters = toCharacters(text);
  const radius = Math.max(15, Math.floor((maxLength - (wordMatch.end - wordMatch.start)) / 2));
  const start = Math.max(0, wordMatch.start - radius);
  const end = Math.min(characters.length, wordMatch.end + radius);
  let context = characters.slice(start, end).join('').replace(/\s+/gu, ' ').trim();
  if (start > 0) context = `...${context}`;
  if (end < characters.length) context = `${context}...`;
  return context;
}

export function normalizeWordKey(word) {
  return String(word ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .trim();
}

export function isMeaningfulText(text) {
  return /[\p{L}\p{N}\p{P}\p{S}]/u.test(String(text ?? ''));
}