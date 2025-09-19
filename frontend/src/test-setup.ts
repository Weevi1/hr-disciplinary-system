// src/test-setup.ts - Main test environment setup
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase config to prevent actual connections during tests
vi.mock('./config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn()
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn()
  },
  storage: {
    ref: vi.fn()
  }
}))

// Mock browser APIs
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock File and FileReader for PDF/image testing
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.name = filename
    this.size = parts.join('').length
    this.type = properties?.type || 'text/plain'
  }
}

global.FileReader = class MockFileReader {
  readAsDataURL() {
    setTimeout(() => {
      this.onload({ target: { result: 'data:image/png;base64,mock-data' } })
    }, 0)
  }
}

// Mock canvas for PDF generation testing
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}))

// Mock Audio for audio recording tests
global.Audio = vi.fn(() => ({
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

// Mock MediaRecorder for audio recording
global.MediaRecorder = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
}))

global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() => 
    Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }],
    })
  ),
}

// Mock URL.createObjectURL for file downloads
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = vi.fn()

// Console error suppression for expected test errors
const originalConsoleError = console.error
beforeEach(() => {
  console.error = (...args) => {
    // Suppress expected Firebase testing errors
    if (
      args[0]?.includes?.('Firebase') ||
      args[0]?.includes?.('auth') ||
      args[0]?.includes?.('firestore')
    ) {
      return
    }
    originalConsoleError(...args)
  }
})

afterEach(() => {
  console.error = originalConsoleError
  vi.clearAllMocks()
})