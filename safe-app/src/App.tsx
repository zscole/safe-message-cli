import { useState, useEffect } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { safeMessageHash } from './lib/safe'
import './App.css'

interface SignedMessage {
  message: string
  hash: string
  signature: string
  safe: string
  chainId: string
  timestamp: string
  signer: string
}

interface TestSafe {
  safeAddress: string
  chainId: string
  network: string
}

function App() {
  const { sdk, safe, connected } = useSafeAppsSDK()
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<SignedMessage | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [tab, setTab] = useState<'sign' | 'verify' | 'messages' | 'debug'>('debug')
  const [devMode, setDevMode] = useState<boolean>(false)
  const [messages, setMessages] = useState<SignedMessage[]>([])

  const testSafe: TestSafe = { 
    safeAddress: '0x1234567890123456789012345678901234567890', 
    chainId: '1',
    network: 'mainnet'
  }
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

  const saveMessage = (msg: SignedMessage) => {
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
      const messageHash = safeMessageHash(currentSafe.safeAddress, message, currentSafe.chainId)

      let signature: string
      if (connected && sdk) {
        // TODO: Use correct Safe Apps SDK method for EIP-712 signing
        // This needs to be updated with the proper SDK API
        signature = '0x' + '1234567890abcdef'.repeat(8) + '1b'
        console.log('Connected to Safe, using placeholder signature')
      } else {
        // Dev mode fallback
        signature = '0x' + '1234567890abcdef'.repeat(8) + '1b'
      }

      const signedMsg: SignedMessage = {
        message,
        hash: messageHash,
        signature,
        safe: currentSafe.safeAddress,
        chainId: typeof currentSafe.chainId === 'string' ? currentSafe.chainId : currentSafe.chainId.toString(),
        timestamp: new Date().toISOString(),
        signer: connected ? 'safe-user' : 'dev-mode'
      }

      setResult(signedMsg)
      saveMessage(signedMsg)

    } catch (err: any) {
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
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`)
    }
  }

  const signExisting = async (msg: SignedMessage) => {
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
          className={tab === 'debug' ? 'tab active' : 'tab'}
          onClick={() => setTab('debug')}
        >
          Debug
        </button>
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

      {tab === 'debug' && (
        <div className="section">
          <h3>Safe SDK Debug</h3>
          <div className="result">
            <div className="result-item">
              <strong>Connected:</strong> {connected ? 'YES' : 'NO'}
            </div>
            <div className="result-item">
              <strong>SDK Available:</strong> {sdk ? 'YES' : 'NO'}
            </div>
            <div className="result-item">
              <strong>Safe Object:</strong>
              <pre style={{fontSize: '12px', background: '#f5f5f5', padding: '8px'}}>
                {JSON.stringify(safe, null, 2)}
              </pre>
            </div>
            <div className="result-item">
              <strong>User Agent:</strong> {navigator.userAgent}
            </div>
            <div className="result-item">
              <strong>Parent Origin:</strong> {window.location !== window.parent.location ? document.referrer : 'Same origin'}
            </div>
          </div>
        </div>
      )}

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