import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeProvider>
      <App />
    </SafeProvider>
  </StrictMode>,
)
