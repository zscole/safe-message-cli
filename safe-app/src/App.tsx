// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)

import React, { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { ethers } from 'ethers'
import './App.css'

const SIGN_MESSAGE_LIB = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2'
const EIP1271_MAGIC_VALUE = '0x1626ba7e'

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    originalMessage: string
    safeMessageHash: string
    safeTxHash: string
    isValid: boolean
  } | null>(null)
  const [error, setError] = useState('')

  if (!connected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Connecting to Safe...</h2>
        <p>Please wait while we establish connection with your Safe.</p>
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

  const signAndVerify = async () => {
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    setLoading(true)
    setError('')
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

      setResult({
        originalMessage: message.trim(),
        safeMessageHash,
        safeTxHash,
        isValid
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessage('')
    setResult(null)
    setError('')
  }

  return (
    <div className="safe-app">
      <div className="safe-app-header">
        <h1>Message Signing</h1>
        <div className="safe-info">
          <span className="safe-address">{safe.safeAddress}</span>
          <span className="chain-id">Chain {safe.chainId}</span>
        </div>
      </div>

      <div className="safe-app-content">
        <div className="input-section">
          <label htmlFor="message-input">Message</label>
          <textarea
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to sign..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="button-section">
          <button
            onClick={signAndVerify}
            disabled={loading || !message.trim()}
            className="primary-button"
          >
            {loading ? 'Signing & Verifying...' : 'Sign & Verify'}
          </button>
          
          {(result || error) && (
            <button onClick={reset} className="secondary-button">
              Reset
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
              <label>Original Message</label>
              <div className="code-block">{result.originalMessage}</div>
            </div>

            <div className="result-item">
              <label>Safe Message Hash</label>
              <div className="code-block">{result.safeMessageHash}</div>
            </div>

            <div className="result-item">
              <label>Safe Transaction Hash</label>
              <div className="code-block">{result.safeTxHash}</div>
            </div>

            <div className="result-item">
              <label>EIP-1271 Verification</label>
              <div className={`verification-result ${result.isValid ? 'valid' : 'invalid'}`}>
                {result.isValid ? '✅ Valid' : '❌ Invalid'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p style={{ fontSize: '12px', textAlign: 'center', color: '#666', marginTop: '2rem' }}>
          Built by <a href="https://numbergroup.xyz" target="_blank" rel="noreferrer">Zak Cole</a> —
          <a href="https://github.com/zscole/safe-message-cli" target="_blank" rel="noreferrer">source</a>
        </p>
      </div>
    </div>
  )
}

export default App 