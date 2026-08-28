const SOUND_STORAGE_KEY = 'margin.sound';
const DEFAULT_PREFERENCES = Object.freeze({ enabled: true, volume: 0.28 });

export function loadSoundPreferences(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(SOUND_STORAGE_KEY));
    return {
      enabled: typeof value?.enabled === 'boolean' ? value.enabled : DEFAULT_PREFERENCES.enabled,
      volume: Number.isFinite(value?.volume) ? Math.min(1, Math.max(0, value.volume)) : DEFAULT_PREFERENCES.volume,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveSoundPreferences(preferences, storage = globalThis.localStorage) {
  const safe = {
    enabled: Boolean(preferences.enabled),
    volume: Math.min(1, Math.max(0, Number(preferences.volume) || 0)),
  };
  try {
    storage.setItem(SOUND_STORAGE_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}

export class KeyboardAudio {
  constructor({
    storage = globalThis.localStorage,
    contextFactory = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
    assetLoader = () => fetch('/assets/audio/key-click.pcm.json').then((response) => {
      if (!response.ok) throw new Error('Sound asset unavailable');
      return response.json();
    }),
  } = {}) {
    this.storage = storage;
    this.contextFactory = contextFactory;
    this.assetLoader = assetLoader;
    this.preferences = loadSoundPreferences(storage);
    this.context = null;
    this.buffer = null;
    this.asset = null;
    this.unlocked = false;
    this.activeSources = [];
    this.preloadPromise = null;
  }

  preload() {
    if (!this.preloadPromise) {
      this.preloadPromise = this.assetLoader().then((asset) => {
        if (!asset || !Array.isArray(asset.samples) || !Number.isFinite(asset.sampleRate)) {
          throw new Error('Invalid sound asset');
        }
        this.asset = asset;
        return asset;
      }).catch(() => null);
    }
    return this.preloadPromise;
  }

  async unlock() {
    if (this.unlocked) return true;
    const asset = await this.preload();
    if (!asset) return false;
    try {
      this.context ||= this.contextFactory();
      if (this.context.state === 'suspended') await this.context.resume();
      this.buffer = this.context.createBuffer(1, asset.samples.length, asset.sampleRate);
      const channel = this.buffer.getChannelData(0);
      asset.samples.forEach((sample, index) => { channel[index] = Math.max(-1, Math.min(1, sample / 127)); });
      this.unlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  setEnabled(enabled) {
    this.preferences.enabled = Boolean(enabled);
    saveSoundPreferences(this.preferences, this.storage);
  }

  setVolume(volume) {
    this.preferences.volume = Math.min(1, Math.max(0, Number(volume) || 0));
    saveSoundPreferences(this.preferences, this.storage);
  }

  play() {
    if (!this.preferences.enabled || !this.unlocked || !this.buffer || this.context?.state !== 'running') return false;
    while (this.activeSources.length >= 6) this.activeSources.shift()?.stop();
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.buffer;
    gain.gain.value = this.preferences.volume;
    source.connect(gain);
    gain.connect(this.context.destination);
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter((active) => active !== source);
    };
    source.start();
    return true;
  }

  destroy() {
    this.activeSources.forEach((source) => source.stop());
    this.activeSources = [];
    this.context?.close?.();
    this.context = null;
    this.buffer = null;
    this.unlocked = false;
  }
}