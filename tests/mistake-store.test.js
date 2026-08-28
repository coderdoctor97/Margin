import { describe, expect, it } from 'vitest';
import { buildMistakePractice, MISTAKE_STORAGE_KEY, MistakeStore } from '../src/storage/mistake-store.js';

class MemoryStorage {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

describe('mistake history', () => {
  it('deduplicates display variants and retains the learning signal', () => {
    const storage = new MemoryStorage();
    const store = new MistakeStore({ storage, now: () => new Date('2025-01-01T00:00:00Z') });
    store.recordMistake({ word: 'Practice', context: 'Daily Practice helps.', sessionId: 'one' });
    store.recordMistake({ word: 'practice', context: 'practice again', sessionId: 'one' });
    store.recordMistake({ word: 'PRACTICE', context: 'PRACTICE later', sessionId: 'two' });
    expect(store.list()).toEqual([expect.objectContaining({ display: 'Practice', mistakeCount: 3, sessionCount: 2 })]);
  });

  it('migrates a version 1 array', () => {
    const old = { version: 1, words: [{ word: "Don't", count: 4, sessions: 2, context: 'Do not stop.', lastPracticed: '2024-01-01T00:00:00Z' }] };
    const store = new MistakeStore({ storage: new MemoryStorage({ [MISTAKE_STORAGE_KEY]: JSON.stringify(old) }) });
    expect(store.list()[0]).toMatchObject({ key: "don't", mistakeCount: 4, sessionCount: 2 });
  });

  it('recovers from malformed storage safely', () => {
    const storage = new MemoryStorage({ [MISTAKE_STORAGE_KEY]: '{broken' });
    const store = new MistakeStore({ storage });
    expect(store.list()).toEqual([]);
    expect(storage.getItem(MISTAKE_STORAGE_KEY)).toBeNull();
  });

  it('exports, imports, merges, and rejects invalid JSON', () => {
    const source = new MistakeStore({ storage: new MemoryStorage() });
    source.recordMistake({ word: 'co-operate', context: 'We co-operate.', sessionId: 'one' });
    const target = new MistakeStore({ storage: new MemoryStorage() });
    target.importJSON(source.exportJSON());
    expect(target.list()[0]).toMatchObject({ display: 'co-operate', mistakeCount: 1 });
    expect(() => target.importJSON('{nope')).toThrow(/valid JSON/i);
    expect(() => target.importJSON('{"version":99,"words":{}}')).toThrow(/not a supported/i);
  });

  it('weights repeated mistakes with a finite cap', () => {
    const text = buildMistakePractice([
      { display: 'steady', mistakeCount: 20 },
      { display: 'rhythm', mistakeCount: 1 },
    ]);
    expect(text.match(/steady/g)).toHaveLength(3);
    expect(text.match(/rhythm/g)).toHaveLength(1);
    expect(text.split(/\s+/)).toHaveLength(4);
  });
});