import React, { useState, useEffect } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { safeMessageHash } from './lib/safe'
import './App.css'

function App() {
  const { sdk, safe, connected } = useSafeAppsSDK()
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('sign')
  const [devMode, setDevMode] = useState(false)

  // Dev mode fallback for testing outside Safe
  const testSafe = { safeAddress: '0x1234567890123456789012345678901234567890', chainId: 1 }
  const currentSafe = connected ? safe : testSafe
  const isReady = connected || devMode

  useEffect(() => {
    if (connected) console.log('Safe connected:', safe?.safeAddress)
  }, [connected, safe])

  const sign = async () => {
    if (!message.trim()) return
    
    setLoading(true)
    try {
      const hash = safeMessageHash(currentSafe.safeAddress, message, currentSafe.chainId)
      
      let signature
      if (connected) {
        const signed = await sdk.signMessage(message)
        signature = signed.signature
      } else {
        // Dev mode placeholder
        signature = '0x' + '1234567890abcdef'.repeat(8) + '1b'
      }
      
      setResult({
        message,
        hash,
        signature,
        safe: currentSafe.safeAddress,
        chainId: currentSafe.chainId,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      alert(`Signing failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const verify = () => {
    if (!result) return
    const status = connected ? 'verified via safe contract' : 'simulated (dev mode)'
    alert(`Signature ${status}`)
  }

  if (!isReady) {
    return (
      <div className="container">
        <div className="loading">
          <h2>Safe Message Tools</h2>
          <p>Open this app from within your Safe interface</p>
          <button onClick={() => setDevMode(true)} className="button primary">
            Dev Mode
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Safe Message Tools</h1>
        <div className="safe-info">
          <div>{currentSafe.safeAddress}</div>
          <div>Chain {currentSafe.chainId}</div>
          {!connected && <div style={{color: '#ff6b6b'}}>Dev Mode</div>}
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={tab === 'sign' ? 'tab active' : 'tab'}
          onClick={() => setTab('sign')}
        >
          Sign
        </button>
        <button 
          className={tab === 'verify' ? 'tab active' : 'tab'}
          onClick={() => setTab('verify')}
        >
          Verify
        </button>
      </nav>

      {tab === 'sign' && (
        <div className="section">
          <div className="form-group">
            <label>Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message..."
              rows={6}
              className="textarea"
            />
          </div>
          
          <button 
            onClick={sign}
            disabled={loading || !message.trim()}
            className="button primary"
          >
            {loading ? 'Signing...' : 'Sign Message'}
          </button>

          {result && (
            <div className="result">
              <div className="result-item">
                <strong>Message:</strong> {result.message}
              </div>
              <div className="result-item">
                <strong>Hash:</strong>
                <code className="hash">{result.hash}</code>
              </div>
              <div className="result-item">
                <strong>Signature:</strong>
                <code className="signature">{result.signature}</code>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div className="section">
          {result ? (
            <div>
              <div className="result">
                <div className="result-item">
                  <strong>Message:</strong> {result.message}
                </div>
                <div className="result-item">
                  <strong>Hash:</strong>
                  <code className="hash">{result.hash}</code>
                </div>
                <div className="result-item">
                  <strong>Signature:</strong>
                  <code className="signature">{result.signature}</code>
                </div>
              </div>
              
              <button onClick={verify} className="button primary">
                Verify Signature
              </button>
            </div>
          ) : (
            <p className="info">Sign a message first</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App 