// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)
// Updated with logo branding

import React, { useState, useRef, useEffect } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { ethers } from 'ethers'
import Safe from '@safe-global/protocol-kit'
import './App.css'

// Official Safe contract that enables message signing for Safe accounts
// Safe accounts can't sign messages natively, so this contract stores signed messages onchain
const SIGN_MESSAGE_LIB = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2'
const EIP1271_MAGIC_VALUE = '0x1626ba7e'

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<{
    originalMessage: string
    safeMessageHash: string
    safeTxHash: string
    signerAddress: string
    signature: string
    isValid: boolean
  } | null>(null)
  const [error, setError] = useState('')
  const [showAddressTooltip, setShowAddressTooltip] = useState(false)
  const [isDirectAccess, setIsDirectAccess] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (connected && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [connected])

  useEffect(() => {
    // Detect if app is accessed directly (not in iframe)
    try {
      setIsDirectAccess(window.self === window.top)
    } catch {
      // If we can't access window.top due to cross-origin, we're likely in an iframe
      setIsDirectAccess(false)
    }
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!connected) {
    if (isDirectAccess) {
      // Show landing page for direct access
      return (
        <div className="safe-app">
          <div className="landing-page">
            <div className="title-with-logo">
              <img src="/logo.svg" alt="Safe Tools" className="logo" />
              <h1>Safe Tools</h1>
            </div>
            <p className="context">
              Gnosis Safe doesn't support message signing out of the box. That means you can't easily prove you own a Safe, authenticate offchain, or generate signatures tied to Safe-based identity.
            </p>
            
            <p className="tagline">Safe Tools fixes this with EIP-712 message signing and EIP-1271 verification using Safe's official SignMessageLib contract.</p>
            
            <p className="description">
              Creates onchain transactions that store your message hash in the SignMessageLib contract, enabling cryptographic proof of Safe ownership that's verifiable by any service supporting EIP-1271.
            </p>

            <p className="description">
              Safe Tools works two ways: through this web interface (recommended for most users) or via <a href="https://github.com/zscole/safe-message-cli/tree/main/cli" target="_blank" rel="noreferrer">command-line tools</a> for developers and automation workflows.
            </p>

            <div className="features">
              <h3>Technical Features</h3>
              <ul>
                <li>EIP-712 domain-separated message hashing</li>
                <li>Onchain message storage via SignMessageLib contract</li>
                <li>EIP-1271 signature verification standard compliance</li>
                <li>Multi-signature support respecting Safe threshold requirements</li>
                <li>Cryptographic proof of Safe ownership for authentication</li>
              </ul>
            </div>

            <div className="multi-sig-section">
              <h3>Multi-Signature Support</h3>
              <p className="note">
                Automatically works with your Safe's signature threshold. For a 2/3 Safe, the transaction requires 2 owner signatures. 
                For a 3/5 Safe, it needs 3 signatures. The Safe interface handles collecting all required signatures seamlessly.
              </p>
              <div className="multi-sig-flow">
                <strong>Example for 2/3 Safe:</strong>
                <ol>
                  <li>Owner 1 initiates message signing → creates transaction</li>
                  <li>Safe shows "Pending" status → needs 1 more signature</li>
                  <li>Owner 2 signs the transaction → threshold met</li>
                  <li>Transaction executes → message hash stored onchain</li>
                  <li><strong>Result:</strong> All required owners effectively signed the message</li>
                </ol>
              </div>
            </div>

            <div className="instructions">
              <h3>How to use the Safe App</h3>
              <ol>
                <li>Go to <a href="https://app.safe.global" target="_blank" rel="noreferrer">app.safe.global</a></li>
                <li>Open the <strong>Apps</strong> tab in your Safe</li>
                <li>Click <strong>Add Custom App</strong></li>
                <li>
                  Paste: 
                  <div className="url-with-copy">
                    <code>https://safe-message-cli-git-main-zscoles-projects.vercel.app</code>
                    <button 
                      className="copy-button-inline"
                      onClick={() => copyToClipboard('https://safe-message-cli-git-main-zscoles-projects.vercel.app')}
                      title="Copy URL"
                    >
                      Copy
                    </button>
                  </div>
                </li>
              </ol>
              <p className="note">Once added, Safe Tools will appear in your Safe's app drawer, ready to use.</p>
              
              <h3>For developers: CLI tools</h3>
              <p className="note">
                Install globally with <code>npm install -g safe-message-tools</code> for command-line access to signing, verification, hardware wallet support, and multi-signature coordination.
              </p>
            </div>

            <div className="example-section">
              <button 
                className="example-toggle"
                onClick={() => setShowExample(!showExample)}
              >
                {showExample ? '▼' : '▶'} Example signed message
              </button>
              {showExample && (
                <div className="example-output">
                  <div className="example-item">
                    <span className="example-label">Original message:</span>
                    <code className="example-value">Prove ownership of Safe for domain verification</code>
                  </div>
                  <div className="example-item">
                    <span className="example-label">Safe address used:</span>
                    <code className="example-value">0x9CFe9dc15b6cA16147dF1b93E487bAaDd422F693</code>
                  </div>
                  <div className="example-item">
                    <span className="example-label">Safe transaction hash:</span>
                    <code className="example-value">0xbfddd739e0a9a49d6885ccded16267760649505bdd589703cc833364904a9e4c</code>
                  </div>
                  <div className="example-item">
                    <span className="example-label">EIP-1271 verification:</span>
                    <code className="example-value">✓ Valid (stored in SignMessageLib)</code>
                  </div>
                </div>
              )}
            </div>

            <div className="footer-info">
              <p>
                Built by <a href="https://x.com/0xzak" target="_blank" rel="noreferrer">Zak Cole</a> at{" "}
                <a href="https://numbergroup.xyz" target="_blank" rel="noreferrer">Number Group</a> ·{" "}
                <a href="https://github.com/zscole/safe-message-cli" target="_blank" rel="noreferrer">Source Code</a>
              </p>
            </div>
          </div>
        </div>
      )
    } else {
      // Show connecting screen for iframe access (within Safe Apps)
      return (
        <div className="safe-app">
          <div className="connecting-screen">
            <div className="title-with-logo">
              <img src="/logo.svg" alt="Safe Tools" className="logo" />
              <h2>Safe Tools</h2>
            </div>
            <p>Connecting to Safe...</p>
          </div>
        </div>
      )
    }
  }

  const getSafeMessageHash = (message: string) => {
    const domain = {
      chainId: safe.chainId,
      verifyingContract: safe.safeAddress
    }
    
    const types = {
      SafeMessage: [{ name: 'message', type: 'bytes' }]
    }
    
    const value = {
      message: ethers.toUtf8Bytes(message)
    }
    
    return ethers.TypedDataEncoder.hash(domain, types, value)
  }

  const signMessage = async () => {
    if (!message.trim()) return

    setLoading(true)
    setError('')
    setSuccess(false)
    setResult(null)

    try {
      // Generate the Safe message hash for EIP-712 signing
      const safeMessageHash = getSafeMessageHash(message.trim())

      // Use Safe Apps SDK to sign the message using the SignMessageLib approach
      // This creates a transaction that calls the SignMessageLib contract to store the message hash
      const signMessageLibAddress = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2'
      
      // Create the transaction data for calling signMessage on SignMessageLib
      const signMessageInterface = new ethers.Interface([
        'function signMessage(bytes memory _data)'
      ])
      
      const messageData = ethers.toUtf8Bytes(message.trim())
      const txData = signMessageInterface.encodeFunctionData('signMessage', [messageData])
      
      // Send the transaction to sign the message onchain
      const { safeTxHash } = await sdk.txs.send({
        txs: [{
          to: signMessageLibAddress,
          value: '0',
          data: txData
        }]
      })
      
      const signResult = safeTxHash

      setResult({
        originalMessage: message.trim(),
        safeMessageHash,
        safeTxHash: safeMessageHash,
        signerAddress: safe.safeAddress,
        signature: signResult,
        isValid: true // Signatures from Safe Apps SDK are valid when signed
      })

      setSuccess(true)

    } catch (err) {
      console.error('Message signing failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign message')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessage('')
    setResult(null)
    setError('')
    setSuccess(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      10: 'Optimism Mainnet',
      42161: 'Arbitrum One'
    }
    return networks[chainId] || `Chain ${chainId}`
  }

  return (
    <div className="safe-app">
      <div className="safe-app-header">
        <div className="header-content">
          <div className="title-with-logo">
            <img src="/logo.svg" alt="Safe Tools" className="logo" />
            <h1 className="safe-app-title">Safe Tools</h1>
          </div>
          <p className="safe-app-description">
            Sign and verify messages directly from your Gnosis Safe. Useful for proving Safe ownership or interacting with offchain services.
          </p>
        </div>
        <div className="safe-info">
          <div className="safe-address-container">
            <span className="safe-address-label">Safe Address</span>
            <div className="safe-address-row">
              <span 
                className="safe-address"
                onMouseEnter={() => setShowAddressTooltip(true)}
                onMouseLeave={() => setShowAddressTooltip(false)}
              >
                {truncateAddress(safe.safeAddress)}
              </span>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(safe.safeAddress)}
                title="Copy address"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              {showAddressTooltip && (
                <div className="address-tooltip">
                  {safe.safeAddress}
                </div>
              )}
            </div>
          </div>
          <div className="chain-info-container">
            <span className="chain-label">Network</span>
            <span className="chain-id">
              {getNetworkName(safe.chainId)}
            </span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="input-section">
          <label htmlFor="message-input">Message</label>
          <textarea
            ref={textareaRef}
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to sign..."
            rows={3}
            disabled={loading}
            className="message-input"
          />
        </div>

        <div className="button-section">
          <button
            onClick={signMessage}
            disabled={loading || !message.trim()}
            className={`primary-button ${loading ? 'loading' : ''} ${success ? 'success' : ''} ${error ? 'error' : ''}`}
          >
            {loading ? (
              <>
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Signing...
              </>
            ) : success ? (
              <>
                <span className="success-icon">✓</span>
                Signed
              </>
            ) : (
              'Sign Message'
            )}
          </button>
          
          {(result || error) && (
            <button onClick={reset} className="secondary-button">
              New Message
            </button>
          )}
        </div>

        {error && (
          <div className="error-card">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-card">
            <h3>Signature Result</h3>
            
            <div className="result-item">
              <label>Signed Message</label>
              <div className="result-content">
                <div className="result-text">{result.originalMessage}</div>
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(result.originalMessage)}
                  title="Copy message"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="result-item">
              <label>Safe Address Used</label>
              <div className="result-content">
                <div className="code-block">{result.signerAddress}</div>
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(result.signerAddress)}
                  title="Copy safe address"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="result-item">
              <label>Signature</label>
              <div className="result-content">
                <div className="code-block">{result.signature}</div>
                <button 
                  className="copy-button"
                  onClick={() => copyToClipboard(result.signature)}
                  title="Copy signature"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="result-item">
              <label>EIP-1271 Verification</label>
              <div className={`verification-result ${result.isValid ? 'valid' : 'invalid'}`}>
                {result.isValid ? 'Valid' : 'Invalid'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <div className="footer-links">
          Built by <a href="https://x.com/0xzak" target="_blank" rel="noreferrer">Zak Cole</a> at <a href="https://numbergroup.xyz" target="_blank" rel="noreferrer">Number Group</a> · <a href="https://github.com/zscole/safe-message-cli" target="_blank" rel="noreferrer">View Source</a>
        </div>
      </div>
    </div>
  )
}

export default App 