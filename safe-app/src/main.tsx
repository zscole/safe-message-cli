import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeProvider>
      <App />
    </SafeProvider>
  </StrictMode>,
)
