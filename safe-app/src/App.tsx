// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)

import React, { useState, useRef, useEffect } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { ethers } from 'ethers'
import './App.css'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (connected && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [connected])

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
    return (
      <div className="safe-app">
        <div className="connecting-screen">
          <h2>Safe Tools</h2>
          <p>Connecting to Safe...</p>
        </div>
      </div>
    )
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
      const messageBytes = ethers.toUtf8Bytes(message.trim())

      const signMessageInterface = new ethers.Interface([
        'function signMessage(bytes _data)'
      ])
      
      const txData = signMessageInterface.encodeFunctionData('signMessage', [messageBytes])

      const transaction = {
        to: SIGN_MESSAGE_LIB,
        value: '0',
        data: txData,
        operation: 1 // DelegateCall
      }

      const { safeTxHash } = await sdk.txs.send({ txs: [transaction] })

      // Poll for execution
      let executed = false
      let attempts = 0
      const maxAttempts = 30

      while (!executed && attempts < maxAttempts) {
        const txDetails = await sdk.txs.getBySafeTxHash(safeTxHash)
        if (txDetails.executedAt) {
          executed = true
          break
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      }

      if (!executed) {
        throw new Error('Transaction not executed within timeout')
      }

      const safeMessageHash = getSafeMessageHash(message.trim())

      // Verify using EIP-1271
      const isValidSigInterface = new ethers.Interface([
        'function isValidSignature(bytes32 _hash, bytes _signature) external view returns (bytes4)'
      ])

      const callData = isValidSigInterface.encodeFunctionData('isValidSignature', [
        safeMessageHash,
        '0x' // Empty signature for on-chain signed messages
      ])

      const callResult = await sdk.eth.call([{
        to: safe.safeAddress,
        data: callData
      }])

      const isValid = callResult === EIP1271_MAGIC_VALUE

      // For Safe messages, the "signature" is the message hash itself when verified via EIP-1271
      const signature = safeMessageHash

      setResult({
        originalMessage: message.trim(),
        safeMessageHash,
        safeTxHash,
        signerAddress: safe.safeAddress,
        signature,
        isValid
      })

      setSuccess(true)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
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
          <h1 className="safe-app-title">Safe Tools</h1>
          <p className="safe-app-description">
            Sign and verify messages using your Gnosis Safe. Useful for proving Safe ownership or interacting with offchain services.
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