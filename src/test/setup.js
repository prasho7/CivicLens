import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia if undefined in jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill URL.createObjectURL
if (typeof window !== 'undefined' && window.URL && !window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'blob:mock-image-preview';
  window.URL.revokeObjectURL = () => {};
}
