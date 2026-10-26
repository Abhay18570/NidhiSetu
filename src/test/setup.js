import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

// Use the browser environment's storage, even when Node exposes its own
// localStorage/sessionStorage globals (Node 25+).
for (const key of ['localStorage', 'sessionStorage']) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: globalThis.jsdom.window[key],
  });
}

// Ensure standard crypto and crypto.subtle are available in test environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
} else if (!globalThis.crypto.subtle && webcrypto?.subtle) {
  globalThis.crypto.subtle = webcrypto.subtle;
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

if (!globalThis.window.matchMedia) {
  globalThis.window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

if (!globalThis.window.scrollTo) {
  globalThis.window.scrollTo = () => {};
}
