import { calculateStatistics } from './statistics.js';
import { toCharacters } from './text.js';

const SESSION_STATES = new Set(['idle', 'running', 'paused', 'completed', 'ended']);

export class TypingSession {
  constructor(text, { now = () => performance.now() } = {}) {
    this.now = now;
    this.load(text);
  }

  load(text) {
    this.source = String(text ?? '');
    this.characters = toCharacters(this.source);
    this.status = 'idle';
    this.cursor = 0;
    this.evaluations = Array(this.characters.length).fill(null);
    this.correctKeystrokes = 0;
    this.evaluatedKeystrokes = 0;
    this.errorCount = 0;
    this.started = false;
    this.activeStartedAt = null;
    this.accumulatedMs = 0;
    return this.snapshot();
  }

  transition(next) {
    if (!SESSION_STATES.has(next)) throw new Error(`Unknown session state: ${next}`);
    this.status = next;
  }

  start() {
    if (this.status !== 'idle') return false;
    this.transition('running');
    return true;
  }

  resume() {
    if (this.status !== 'paused') return false;
    this.transition('running');
    if (this.started) this.activeStartedAt = this.now();
    return true;
  }

  pause() {
    if (this.status !== 'running') return false;
    this.captureElapsed();
    this.transition('paused');
    return true;
  }

  restart() {
    return this.load(this.source);
  }

  end() {
    if (this.status === 'completed' || this.status === 'ended') return false;
    this.captureElapsed();
    this.transition('ended');
    return true;
  }

  captureElapsed() {
    if (this.activeStartedAt !== null) {
      this.accumulatedMs += Math.max(0, this.now() - this.activeStartedAt);
      this.activeStartedAt = null;
    }
  }

  elapsedMs() {
    if (this.activeStartedAt === null) return this.accumulatedMs;
    return this.accumulatedMs + Math.max(0, this.now() - this.activeStartedAt);
  }

  evaluate(input) {
    if (this.status !== 'running' || this.cursor >= this.characters.length) return null;
    const inputCharacters = toCharacters(input);
    if (inputCharacters.length !== 1) return null;

    if (!this.started) {
      this.started = true;
      this.activeStartedAt = this.now();
    }

    const index = this.cursor;
    const expected = this.characters[index];
    const correct = inputCharacters[0] === expected;
    this.evaluations[index] = correct ? 'correct' : 'incorrect';
    this.cursor += 1;
    this.evaluatedKeystrokes += 1;
    if (correct) this.correctKeystrokes += 1;
    else this.errorCount += 1;

    if (this.cursor === this.characters.length) {
      this.captureElapsed();
      this.transition('completed');
    }

    return { index, expected, input: inputCharacters[0], correct, completed: this.status === 'completed' };
  }

  backspace() {
    if (this.status !== 'running' || this.cursor === 0) return false;
    this.cursor -= 1;
    this.evaluations[this.cursor] = null;
    return true;
  }

  statistics() {
    return calculateStatistics({
      correctKeystrokes: this.correctKeystrokes,
      evaluatedKeystrokes: this.evaluatedKeystrokes,
      cursor: this.cursor,
      totalCharacters: this.characters.length,
      elapsedMs: this.elapsedMs(),
    });
  }

  snapshot() {
    return {
      source: this.source,
      characters: [...this.characters],
      status: this.status,
      cursor: this.cursor,
      evaluations: [...this.evaluations],
      correctKeystrokes: this.correctKeystrokes,
      evaluatedKeystrokes: this.evaluatedKeystrokes,
      errorCount: this.errorCount,
      started: this.started,
      statistics: this.statistics(),
    };
  }
}

export function keyboardInputFromEvent(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === 'Enter') return '\n';
  if (event.key === 'Tab') return '\t';
  return toCharacters(event.key).length === 1 ? event.key : null;
}