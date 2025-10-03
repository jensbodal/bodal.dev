// Test setup file for Vitest
// This file runs before each test suite

// Mock Web Audio API for tests (Tone.js requires it)
global.AudioContext = class AudioContext {} as any;
global.OfflineAudioContext = class OfflineAudioContext {} as any;

// Mock navigator.vibrate
if (!navigator.vibrate) {
  Object.defineProperty(navigator, 'vibrate', {
    value: () => true,
    writable: true,
  });
}
