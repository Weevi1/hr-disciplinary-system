import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
import App from './App.tsx'

// 🔍 Initialize Sentry error tracking (production only)
import { initSentry } from './config/sentry'

// 📊 Initialize Firebase Performance Monitoring (production only)
import { initPerformance } from './config/performance'

// 🚨 Initialize legacy device support for 2012-era phones (South Africa rollout)
import { initializeLegacySupport } from './utils/deviceDetection'

// Migration utilities no longer needed - nested structure already implemented

// 🚀 PERFORMANCE OPTIMIZATION: Defer non-critical monitoring initialization
// Initialize device detection synchronously (needed for compatibility)
initializeLegacySupport()

// Defer Sentry and Performance monitoring to requestIdleCallback
// This saves ~75KB + blocking time on startup
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    initSentry()
    initPerformance()
  }, { timeout: 2000 })
} else {
  // Fallback for older browsers (run after 1 second)
  setTimeout(() => {
    initSentry()
    initPerformance()
  }, 1000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
