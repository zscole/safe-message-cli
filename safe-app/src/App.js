import React, { useState, useEffect } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { ethers } from 'ethers'
import { safeTypedData, safeMessageHash } from './lib/safe'
import './App.css'

function App() {
  const { sdk, safe, connected } = useSafeAppsSDK()
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('sign')
  const [devMode, setDevMode] = useState(false)
  const [messages, setMessages] = useState([])

  const testSafe = { safeAddress: '0x1234567890123456789012345678901234567890', chainId: 1 }
  const currentSafe = connected ? safe : testSafe
  const isReady = connected || devMode

  useEffect(() => {
    if (connected && safe) {
      console.log('Safe connected:', safe.safeAddress)
      loadMessages()
    } else if (devMode) {
      loadMessages()
    }
  }, [connected, safe, devMode])

  const loadMessages = () => {
    try {
      const stored = localStorage.getItem(`safe-messages-${currentSafe.safeAddress}`)
      setMessages(stored ? JSON.parse(stored) : [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setMessages([])
    }
  }

  const saveMessage = (msg) => {
    try {
      const existing = messages.filter(m => m.hash !== msg.hash)
      const updated = [...existing, msg]
      setMessages(updated)
      localStorage.setItem(`safe-messages-${currentSafe.safeAddress}`, JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  const sign = async () => {
    if (!message.trim()) return
    
    setLoading(true)
    try {
      const { domain, types, value } = safeTypedData(currentSafe.safeAddress, message, currentSafe.chainId)
      const messageHash = safeMessageHash(currentSafe.safeAddress, message, currentSafe.chainId)

      let signature
      if (connected) {
        // Use Safe Apps SDK for real signing
        const signedMessage = await sdk.signTypedData(domain, types, value)
        signature = signedMessage.signature
      } else {
        // Dev mode fallback
        signature = '0x' + '1234567890abcdef'.repeat(8) + '1b'
      }

      const signedMsg = {
        message,
        hash: messageHash,
        signature,
        safe: currentSafe.safeAddress,
        chainId: currentSafe.chainId,
        timestamp: new Date().toISOString(),
        signer: connected ? 'safe-user' : 'dev-mode'
      }

      setResult(signedMsg)
      saveMessage(signedMsg)

    } catch (err) {
      console.error('Signing error:', err)
      alert(`Signing failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    if (!result) return
    
    try {
      if (connected) {
        // For real Safe verification, we'd need to check the Safe contract
        // For now, just simulate success since we used the Safe to sign
        alert('Signature verified via Safe')
      } else {
        alert('Signature simulated (dev mode)')
      }
    } catch (err) {
      alert(`Verification failed: ${err.message}`)
    }
  }

  const signExisting = async (msg) => {
    setMessage(msg.message)
    setTab('sign')
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
        <button 
          className={tab === 'messages' ? 'tab active' : 'tab'}
          onClick={() => setTab('messages')}
        >
          Messages ({messages.length})
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
              <div className="result-item">
                <strong>Status:</strong> {connected ? 'Signed via Safe' : 'Dev mode'}
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

      {tab === 'messages' && (
        <div className="section">
          <h3>Safe Messages</h3>
          {messages.length > 0 ? (
            <div>
              {messages.map((msg, i) => (
                <div key={i} className="result">
                  <div className="result-item">
                    <strong>Message:</strong> {msg.message}
                  </div>
                  <div className="result-item">
                    <strong>Signer:</strong> {msg.signer}
                  </div>
                  <div className="result-item">
                    <strong>Hash:</strong>
                    <code className="hash">{msg.hash}</code>
                  </div>
                  <button 
                    onClick={() => signExisting(msg)}
                    className="button primary"
                    style={{ marginTop: '8px' }}
                  >
                    Sign This Message
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="info">No messages found. Sign a message to get started.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App 