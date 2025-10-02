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

// Initialize Sentry for error tracking
initSentry()

// Initialize Firebase Performance Monitoring
initPerformance()

// Initialize device detection and compatibility fixes
initializeLegacySupport()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
