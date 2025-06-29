// MIT License
// © Zak Cole — https://numbergroup.xyz (@zscole)

import React, { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { ethers } from 'ethers'
import './App.css'

const SIGN_MESSAGE_LIB = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2'
const EIP1271_MAGIC_VALUE = '0x1626ba7e'

function App() {
  console.log('🎯 App component rendering...')
  
  const { safe, sdk, connected } = useSafeAppsSDK()
  
  // CRITICAL: Log the exact handshake state (with safe cross-origin handling)
  console.log('[Safe SDK Debug - CRITICAL]', {
    iframe: window.parent !== window,
    connected,
    safe: safe || 'NULL',
    sdk: sdk || 'NULL',
    hasGlobalSafe: typeof window !== 'undefined' && (window as any).Safe,
    currentURL: window.location.href
  })
  
  console.log('🔗 Safe SDK detailed state:', { 
    connected, 
    safeAddress: safe?.safeAddress, 
    chainId: safe?.chainId,
    sdkVersion: sdk ? 'SDK loaded' : 'SDK not loaded',
    sdkMethods: sdk ? Object.keys(sdk) : 'no SDK',
    safeObject: safe ? Object.keys(safe) : 'no safe object'
  })

  // Test SDK functionality
  React.useEffect(() => {
    console.log('🔄 useEffect triggered with SDK state:', { connected, sdk: !!sdk, safe: !!safe })
    
    if (sdk) {
      console.log('✅ SDK is available, testing methods...')
      console.log('📋 SDK methods available:', Object.keys(sdk))
      
      // Test basic SDK functionality
      if (sdk.safe) {
        console.log('🔐 SDK.safe methods:', Object.keys(sdk.safe))
      }
      if (sdk.txs) {
        console.log('📝 SDK.txs methods:', Object.keys(sdk.txs))
      }
      
      // If not connected, try to manually trigger Safe detection
      if (!connected) {
        console.log('🔄 SDK loaded but not connected, attempting manual detection...')
        
        // Sometimes Safe needs a moment to establish connection
        setTimeout(() => {
          console.log('⏰ Delayed check - SDK state:', { 
            connected, 
            safe: !!safe, 
            safeAddress: safe?.safeAddress 
          })
        }, 1000)
        
        setTimeout(() => {
          console.log('⏰ Final check - SDK state:', { 
            connected, 
            safe: !!safe, 
            safeAddress: safe?.safeAddress 
          })
        }, 3000)
      }
    } else {
      console.log('❌ SDK not available in useEffect')
    }
  }, [sdk, connected, safe])
  
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    originalMessage: string
    safeMessageHash: string
    safeTxHash: string
    isValid: boolean
  } | null>(null)
  const [error, setError] = useState('')

  console.log('📱 App state:', { connected, loading, hasResult: !!result, hasError: !!error })

  if (!connected) {
    console.log('❌ Not connected to Safe - showing loading state')
    return <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Connecting to Safe...</h2>
      <p>Please wait while we establish connection with your Safe.</p>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Debug info:</p>
        <p>SDK: {sdk ? '✅ Loaded' : '❌ Not loaded'}</p>
        <p>Safe: {safe ? '✅ Available' : '❌ Not available'}</p>
        <p>Connected: {connected ? '✅ Yes' : '❌ No'}</p>
      </div>
    </div>
  }

  console.log('✅ Connected to Safe - rendering main app')

  // Compute Safe EIP-712 message hash
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
      // Convert message to bytes for SignMessageLib
      const messageBytes = ethers.toUtf8Bytes(message.trim())

      // Create SignMessageLib transaction - uses bytes memory, not bytes32
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

      // Send transaction
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

      // Get the Safe message hash that was stored by SignMessageLib
      const safeMessageHash = getSafeMessageHash(message.trim())

      // Verify signature using EIP-1271 with the Safe message hash
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