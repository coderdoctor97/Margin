import { describe, expect, it, vi } from 'vitest';
import { KeyboardAudio, loadSoundPreferences } from '../src/audio/keyboard-audio.js';

class MemoryStorage {
  constructor(value = null) { this.value = value; }
  getItem() { return this.value; }
  setItem(_key, value) { this.value = value; }
}

function fakeAudioContext() {
  const source = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
  return {
    state: 'running',
    destination: {},
    resume: vi.fn(),
    close: vi.fn(),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(3) })),
    createBufferSource: vi.fn(() => ({ ...source })),
    createGain: vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() })),
  };
}

describe('keyboard sound', () => {
  it('uses safe defaults and recovers from malformed preferences', () => {
    expect(loadSoundPreferences(new MemoryStorage('{bad'))).toEqual({ enabled: true, volume: 0.28 });
    expect(loadSoundPreferences(new MemoryStorage(JSON.stringify({ enabled: false, volume: 5 })))).toEqual({ enabled: false, volume: 1 });
  });

  it('does not play before deliberate unlock or when disabled', async () => {
    const context = fakeAudioContext();
    const audio = new KeyboardAudio({
      storage: new MemoryStorage(),
      contextFactory: () => context,
      assetLoader: async () => ({ sampleRate: 8000, samples: [0, 20, -10] }),
    });
    expect(audio.play()).toBe(false);
    expect(await audio.unlock()).toBe(true);
    expect(audio.play()).toBe(true);
    expect(context.createBufferSource).toHaveBeenCalledOnce();
    audio.setEnabled(false);
    expect(audio.play()).toBe(false);
  });

  it('saves volume and enabled preferences', () => {
    const storage = new MemoryStorage();
    const audio = new KeyboardAudio({ storage });
    audio.setVolume(0.42);
    audio.setEnabled(false);
    expect(JSON.parse(storage.value)).toEqual({ enabled: false, volume: 0.42 });
  });
});