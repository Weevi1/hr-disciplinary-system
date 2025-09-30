import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/accessibility.css'
import App from './App.tsx'

// 🚨 Initialize legacy device support for 2012-era phones (South Africa rollout)
import { initializeLegacySupport } from './utils/deviceDetection'

// Migration utilities no longer needed - nested structure already implemented

// Initialize device detection and compatibility fixes
initializeLegacySupport()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
