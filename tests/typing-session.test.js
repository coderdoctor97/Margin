import { describe, expect, it } from 'vitest';
import { calculateStatistics } from '../src/core/statistics.js';
import { keyboardInputFromEvent, TypingSession } from '../src/core/typing-session.js';

describe('typing session engine', () => {
  it('matches characters, keeps mistakes after Backspace, and completes exactly', () => {
    let clock = 0;
    const session = new TypingSession('ab', { now: () => clock });
    session.start();
    expect(session.evaluate('x')).toMatchObject({ correct: false, index: 0 });
    expect(session.errorCount).toBe(1);
    expect(session.backspace()).toBe(true);
    expect(session.evaluations[0]).toBeNull();
    expect(session.errorCount).toBe(1);
    session.evaluate('a');
    expect(session.status).toBe('running');
    clock = 1000;
    session.evaluate('b');
    expect(session.status).toBe('completed');
    expect(session.statistics().progress).toBe(100);
  });

  it('pauses, resumes, excludes paused time, and restarts', () => {
    let clock = 0;
    const session = new TypingSession('abc', { now: () => clock });
    session.start();
    session.evaluate('a');
    clock = 1000;
    session.pause();
    clock = 6000;
    expect(session.evaluate('b')).toBeNull();
    session.resume();
    clock = 7000;
    session.evaluate('b');
    expect(session.elapsedMs()).toBe(2000);
    session.restart();
    expect(session.snapshot()).toMatchObject({ status: 'idle', cursor: 0, errorCount: 0, started: false });
  });

  it('starts timing on the first evaluated keystroke', () => {
    let clock = 5000;
    const session = new TypingSession('a', { now: () => clock });
    session.start();
    clock = 8000;
    expect(session.elapsedMs()).toBe(0);
    session.evaluate('a');
    expect(session.elapsedMs()).toBe(0);
  });

  it('accepts printable Unicode and line breaks but ignores shortcuts', () => {
    expect(keyboardInputFromEvent({ key: 'é', ctrlKey: false, metaKey: false, altKey: false })).toBe('é');
    expect(keyboardInputFromEvent({ key: 'Enter', ctrlKey: false, metaKey: false, altKey: false })).toBe('\n');
    expect(keyboardInputFromEvent({ key: 'Tab', ctrlKey: false, metaKey: false, altKey: false })).toBe('\t');
    expect(keyboardInputFromEvent({ key: 'v', ctrlKey: true, metaKey: false, altKey: false })).toBeNull();
    expect(keyboardInputFromEvent({ key: 'Shift', ctrlKey: false, metaKey: false, altKey: false })).toBeNull();
  });
});

describe('statistics formulas', () => {
  it('uses correct characters divided by five per elapsed minute', () => {
    const stats = calculateStatistics({ correctKeystrokes: 250, evaluatedKeystrokes: 300, cursor: 300, totalCharacters: 600, elapsedMs: 60000 });
    expect(stats.wpm).toBe(50);
    expect(stats.accuracy).toBeCloseTo(83.333, 2);
    expect(stats.progress).toBe(50);
  });

  it('handles zero time and no evaluated keys without Infinity or NaN', () => {
    expect(calculateStatistics({ elapsedMs: 0 })).toMatchObject({ wpm: 0, accuracy: 100, progress: 0 });
  });
});