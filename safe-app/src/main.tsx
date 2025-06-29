// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)

import { createRoot } from 'react-dom/client'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import App from './App.tsx'
import './index.css'

console.log('🚀 Starting Safe App...')
console.log('🌍 Environment:', {
  isDev: import.meta.env.DEV,
  baseUrl: import.meta.env.BASE_URL,
  isInIframe: window !== window.parent
})

// Test if manifest.json is accessible
fetch('/manifest.json')
  .then(res => res.json())
  .then(manifest => {
    console.log('📋 Manifest loaded:', manifest)
    console.log('🔍 Manifest validation:', {
      hasName: !!manifest.name,
      hasDescription: !!manifest.description,
      hasIconPath: !!manifest.iconPath,
      hasVersion: !!manifest.version,
      hasId: !!manifest.id,
      providedBy: manifest.providedBy
    })
  })
  .catch(err => console.error('❌ Manifest loading failed:', err))

// Check Safe environment detection
console.log('🔗 Safe environment check:', {
  currentOrigin: window.location.origin,
  inIframe: window !== window.parent,
  userAgent: navigator.userAgent.includes('Safe'),
  hasPostMessage: typeof window.postMessage === 'function',
  hasParentPostMessage: typeof window.parent?.postMessage === 'function'
})

// Listen for Safe communication and respond appropriately
window.addEventListener('message', (event) => {
  try {
    console.log('📨 Received message from parent:', {
      origin: event.origin,
      data: event.data,
      source: event.source === window.parent ? 'parent' : 'other'
    })
    
    // Send readiness signal to Safe
    if (event.origin.includes('safe.global') || event.origin.includes('app.safe.global')) {
      console.log('🤝 Sending readiness signal to Safe...')
      window.parent?.postMessage({
        messageId: 'SAFE_APP_READY',
        data: {
          name: 'Safe Message Tools',
          version: '1.0.0'
        }
      }, event.origin)
    }
  } catch (error) {
    console.log('⚠️ Message handling error (safe to ignore):', error instanceof Error ? error.message : String(error))
  }
})

// Send initial readiness signal after DOM load
setTimeout(() => {
  try {
    console.log('🚀 Sending initial Safe App readiness signal...')
    window.parent?.postMessage({
      messageId: 'SAFE_APP_READY',
      data: {
        name: 'Safe Message Tools',
        version: '1.0.0'
      }
    }, '*')
  } catch (error) {
    console.log('⚠️ Initial signal error (safe to ignore):', error instanceof Error ? error.message : String(error))
  }
}, 100)

// Test Safe SDK imports
console.log('📦 Safe SDK check:', {
  SafeProvider: typeof SafeProvider,
  hasSDK: !!SafeProvider
})

// Ensure SafeProvider is configured for proper detection
console.log('🔧 Configuring SafeProvider for Safe detection...')

createRoot(document.getElementById('root')!).render(
  <SafeProvider loader={<div>Loading Safe App...</div>}>
    <App />
  </SafeProvider>
)

console.log('📦 Safe App mounted with SafeProvider and loader')
