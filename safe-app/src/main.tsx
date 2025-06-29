// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)

import { createRoot } from 'react-dom/client'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <SafeProvider>
    <App />
  </SafeProvider>
)
