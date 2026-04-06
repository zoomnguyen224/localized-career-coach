import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder and ReadableStream for jsdom
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

global.TextEncoder = TextEncoder as typeof global.TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder
global.ReadableStream = ReadableStream as typeof global.ReadableStream

// Polyfill crypto.randomUUID for jsdom
if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...((typeof crypto !== 'undefined' && crypto) || {}),
      randomUUID: () => {
        const bytes = new Uint8Array(16)
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
        bytes[6] = (bytes[6] & 0x0f) | 0x40
        bytes[8] = (bytes[8] & 0x3f) | 0x80
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'))
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
      },
    },
    writable: true,
  })
}

// Only set up browser-specific mocks in jsdom environment
if (typeof window !== 'undefined') {
  // Mock ResizeObserver (required by Recharts)
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}
