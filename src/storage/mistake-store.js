import { findWords, normalizeWordKey } from '../core/text.js';

export const MISTAKE_STORAGE_KEY = 'margin.mistakes';
export const MISTAKE_SCHEMA_VERSION = 2;

function emptyData() {
  return { version: MISTAKE_SCHEMA_VERSION, words: {} };
}

function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeRecord(record, fallbackWord = '') {
  const display = String(record?.display ?? record?.word ?? fallbackWord).trim().slice(0, 120);
  const key = normalizeWordKey(display);
  const isSingleWord = findWords(display).some(({ word }) => normalizeWordKey(word) === key);
  if (!key || !isSingleWord) return null;
  return {
    key,
    display,
    mistakeCount: Math.max(1, safeInteger(record?.mistakeCount ?? record?.count, 1)),
    sessionCount: Math.max(1, safeInteger(record?.sessionCount ?? record?.sessions, 1)),
    lastPracticed: safeDate(record?.lastPracticed) || new Date(0).toISOString(),
    context: String(record?.context ?? '').replace(/\s+/gu, ' ').trim().slice(0, 180),
  };
}

function mergeRecord(target, incoming) {
  if (!target) return { ...incoming };
  const incomingIsNewer = new Date(incoming.lastPracticed) >= new Date(target.lastPracticed);
  return {
    ...target,
    display: incomingIsNewer ? incoming.display : target.display,
    mistakeCount: target.mistakeCount + incoming.mistakeCount,
    sessionCount: target.sessionCount + incoming.sessionCount,
    lastPracticed: incomingIsNewer ? incoming.lastPracticed : target.lastPracticed,
    context: incomingIsNewer && incoming.context ? incoming.context : target.context,
  };
}

export function migrateMistakeData(raw) {
  const migrated = emptyData();
  if (!raw || typeof raw !== 'object') return migrated;

  let records = [];
  if (raw.version === MISTAKE_SCHEMA_VERSION && raw.words && typeof raw.words === 'object' && !Array.isArray(raw.words)) {
    records = Object.entries(raw.words).map(([key, record]) => normalizeRecord(record, key));
  } else if (raw.version === 1 && Array.isArray(raw.words)) {
    records = raw.words.map((record) => normalizeRecord(record));
  } else if (Array.isArray(raw)) {
    records = raw.map((record) => normalizeRecord(record));
  } else {
    return migrated;
  }

  records.filter(Boolean).forEach((record) => {
    migrated.words[record.key] = mergeRecord(migrated.words[record.key], record);
  });
  return migrated;
}

export class MistakeStore {
  constructor({ storage = globalThis.localStorage, now = () => new Date() } = {}) {
    this.storage = storage;
    this.now = now;
    this.sessionWords = new Set();
    this.data = this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(MISTAKE_STORAGE_KEY);
      if (!raw) return emptyData();
      const migrated = migrateMistakeData(JSON.parse(raw));
      this.storage.setItem(MISTAKE_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      try { this.storage.removeItem(MISTAKE_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
      return emptyData();
    }
  }

  persist() {
    try {
      this.storage.setItem(MISTAKE_STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  list() {
    return Object.values(this.data.words)
      .map((record) => ({ ...record }))
      .sort((a, b) => b.mistakeCount - a.mistakeCount || new Date(b.lastPracticed) - new Date(a.lastPracticed));
  }

  recordMistake({ word, context = '', sessionId = 'unknown', at = this.now() }) {
    const display = String(word ?? '').trim();
    const key = normalizeWordKey(display);
    if (!key || !findWords(display).some(({ word: found }) => normalizeWordKey(found) === key)) return null;
    const sessionKey = `${sessionId}:${key}`;
    const existing = this.data.words[key];
    const isNewSession = !this.sessionWords.has(sessionKey);
    this.sessionWords.add(sessionKey);
    this.data.words[key] = {
      key,
      display: existing?.display || display,
      mistakeCount: (existing?.mistakeCount || 0) + 1,
      sessionCount: (existing?.sessionCount || 0) + (isNewSession ? 1 : 0),
      lastPracticed: new Date(at).toISOString(),
      context: String(context || existing?.context || '').replace(/\s+/gu, ' ').trim().slice(0, 180),
    };
    this.persist();
    return { ...this.data.words[key] };
  }

  markPracticed(words, sessionId, at = this.now()) {
    words.forEach((word) => {
      const key = normalizeWordKey(word);
      const existing = this.data.words[key];
      if (!existing) return;
      const sessionKey = `${sessionId}:${key}`;
      if (!this.sessionWords.has(sessionKey)) {
        existing.sessionCount += 1;
        this.sessionWords.add(sessionKey);
      }
      existing.lastPracticed = new Date(at).toISOString();
    });
    this.persist();
  }

  remove(keyOrWord) {
    const key = normalizeWordKey(keyOrWord);
    const existed = Boolean(this.data.words[key]);
    delete this.data.words[key];
    this.persist();
    return existed;
  }

  clear() {
    this.data = emptyData();
    this.sessionWords.clear();
    this.persist();
  }

  exportJSON() {
    return JSON.stringify({
      ...this.data,
      exportedAt: this.now().toISOString(),
      product: 'Margin',
    }, null, 2);
  }

  importJSON(json, { merge = true } = {}) {
    let parsed;
    try {
      parsed = typeof json === 'string' ? JSON.parse(json) : json;
    } catch {
      throw new Error('That file is not valid JSON.');
    }
    const supportedShape = Array.isArray(parsed)
      || (parsed?.version === 1 && Array.isArray(parsed.words))
      || (parsed?.version === MISTAKE_SCHEMA_VERSION && parsed.words && typeof parsed.words === 'object' && !Array.isArray(parsed.words));
    if (!supportedShape) throw new Error('That JSON file is not a supported Margin mistake-history export.');
    const imported = migrateMistakeData(parsed);
    if (Object.keys(imported.words).length === 0 && Object.keys(parsed?.words || {}).length > 0) {
      throw new Error('No valid mistake-word records were found in that file.');
    }
    if (!merge) {
      this.data = imported;
    } else {
      Object.values(imported.words).forEach((record) => {
        this.data.words[record.key] = mergeRecord(this.data.words[record.key], record);
      });
    }
    this.persist();
    return this.list();
  }
}

export function buildMistakePractice(records, maxWords = 120) {
  const valid = records.filter(Boolean);
  if (valid.length === 0) return '';
  const queue = [];
  const finiteLimit = Math.max(maxWords, valid.length);
  valid.forEach((record) => queue.push(record.display));
  valid
    .slice()
    .sort((a, b) => b.mistakeCount - a.mistakeCount)
    .forEach((record) => {
      const extra = Math.min(2, Math.max(0, Math.floor(record.mistakeCount / 3)));
      for (let index = 0; index < extra && queue.length < finiteLimit; index += 1) queue.push(record.display);
    });
  return queue.slice(0, finiteLimit).map((word, index) => `${word}${(index + 1) % 8 === 0 ? '\n' : ' '}`).join('').trim();
}