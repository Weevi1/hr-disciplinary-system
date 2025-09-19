// vitest.integration.config.ts - Firebase Integration Testing Configuration
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts', './src/test-firebase-setup.ts'],
    include: ['src/**/*.integration.test.{js,ts,tsx}'],
    testTimeout: 30000, // Longer timeout for Firebase operations
    hookTimeout: 30000,
    css: true,
    pool: 'forks', // Required for Firebase emulator isolation
    poolOptions: {
      forks: {
        singleFork: true // Prevent conflicts with Firebase emulator connections
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})