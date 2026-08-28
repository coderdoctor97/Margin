export function calculateStatistics({
  correctKeystrokes = 0,
  evaluatedKeystrokes = 0,
  cursor = 0,
  totalCharacters = 0,
  elapsedMs = 0,
} = {}) {
  const safeElapsed = Math.max(0, Number(elapsedMs) || 0);
  const elapsedMinutes = safeElapsed / 60000;
  // Extrapolating a rate from a fraction of a second produces absurd numbers (34
  // keystrokes at 0.4s reads ~1000 WPM). Report nothing until a second has elapsed.
  const wpm = safeElapsed >= 1000 ? (correctKeystrokes / 5) / elapsedMinutes : 0;
  const accuracy = evaluatedKeystrokes > 0
    ? (correctKeystrokes / evaluatedKeystrokes) * 100
    : 100;
  const progress = totalCharacters > 0
    ? Math.min(100, (Math.max(0, cursor) / totalCharacters) * 100)
    : 0;

  return {
    wpm: Number.isFinite(wpm) ? wpm : 0,
    accuracy: Number.isFinite(accuracy) ? accuracy : 100,
    progress: Number.isFinite(progress) ? progress : 0,
    elapsedMs: safeElapsed,
  };
}

export function formatElapsed(elapsedMs) {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}