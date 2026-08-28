import { describe, expect, it } from 'vitest';
import {
  extractSelectionText,
  findWords,
  nodeToPracticeText,
  normalizeWordKey,
  wordAtCharacter,
} from '../src/core/text.js';

describe('selection cleanup and word boundaries', () => {
  it('preserves paragraph and explicit line breaks', () => {
    const root = document.createElement('article');
    root.innerHTML = '<h1>Heading</h1><p>First line<br>Second line</p><p>Next paragraph</p>';
    expect(nodeToPracticeText(root)).toBe('Heading\n\nFirst line\nSecond line\n\nNext paragraph');
  });

  it('extracts an arbitrary selection only from the preview', () => {
    const root = document.createElement('article');
    root.innerHTML = '<p>Alpha bravo.</p><p>Charlie delta.</p>';
    document.body.append(root);
    const range = document.createRange();
    range.setStart(root.firstElementChild.firstChild, 6);
    range.setEnd(root.lastElementChild.firstChild, 7);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    expect(extractSelectionText(selection, root)).toBe('bravo.\n\nCharlie');
  });

  it('maps Unicode, apostrophe, and hyphenated words', () => {
    const text = "L'été co-operate re‑enter 東京42 stop.";
    expect(findWords(text).map(({ word }) => word)).toEqual(["L'été", 'co-operate', 're‑enter', '東京42', 'stop']);
    expect(wordAtCharacter(text, 2)?.word).toBe("L'été");
    expect(wordAtCharacter(text, 9)?.word).toBe('co-operate');
    expect(wordAtCharacter(text, 5)).toBeNull();
    expect(wordAtCharacter(text, Array.from(text).length - 1)).toBeNull();
  });

  it('normalizes only the deduplication key', () => {
    expect(normalizeWordKey('Re-Enter')).toBe('re-enter');
    expect(normalizeWordKey('DON’T')).toBe("don't");
  });
});