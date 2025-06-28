import React from 'react'
import ReactDOM from 'react-dom/client'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <SafeProvider>
      <App />
    </SafeProvider>
  </React.StrictMode>
) 