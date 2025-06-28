import React, { useState, useEffect } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { ethers } from 'ethers'
import { safeMessageHash } from './lib/safe'

const SIGN_MESSAGE_LIB_ADDRESS = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2'

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK()
  const [activeTab, setActiveTab] = useState('sign')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [isInSafe, setIsInSafe] = useState(false)
  
  // Form states
  const [message, setMessage] = useState('')
  const [verifyMessage, setVerifyMessage] = useState('')
  const [verifySignature, setVerifySignature] = useState('')
  const [verifyAddress, setVerifyAddress] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!connected) {
        setConnectionStatus('timeout')
        setIsInSafe(false)
      }
    }, 3000)

    if (connected) {
      clearTimeout(timeout)
      setConnectionStatus('connected')
      setIsInSafe(true)
    }

    return () => clearTimeout(timeout)
  }, [connected])

  useEffect(() => {
    const checkSafeContext = () => {
      try {
        if (window.parent !== window) {
          setIsInSafe(true)
        } else {
          setTimeout(() => {
            if (!connected) {
              setIsInSafe(false)
              setConnectionStatus('standalone')
            }
          }, 2000)
        }
      } catch (e) {
        setIsInSafe(false)
        setConnectionStatus('standalone')
      }
    }
    
    checkSafeContext()
  }, [connected])



  const handleSign = async () => {
    if (!message.trim() || !connected) return
    
    setLoading(true)
    setResult('')
    
    try {
      const messageHash = safeMessageHash(safe.safeAddress, message.trim(), safe.chainId.toString())
      
      const signMessageData = new ethers.Interface([
        'function signMessage(bytes _data)'
      ]).encodeFunctionData('signMessage', [messageHash])

      const transaction = {
        to: SIGN_MESSAGE_LIB_ADDRESS,
        value: '0',
        data: signMessageData,
        operation: 1 // DelegateCall
      }

      const response = await sdk.txs.send({ txs: [transaction] })
      setResult(`✅ Message signed successfully!\n\nTransaction Hash: ${response.safeTxHash}\n\nMessage Hash: ${messageHash}\n\nThis message is now stored on-chain and can be verified using EIP-1271.`)
      setMessage('')
    } catch (error) {
      console.error('Signing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult(`❌ Error signing message: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyMessage.trim() || !verifySignature.trim()) return
    
    setLoading(true)
    setResult('')
    
    try {
      const messageHash = safeMessageHash(safe.safeAddress, verifyMessage.trim(), safe.chainId.toString())
      const signerAddress = verifyAddress.trim() || safe.safeAddress
      
      // First try offchain recovery
      try {
        const recoveredAddress = ethers.verifyMessage(verifyMessage.trim(), verifySignature.trim())
        if (recoveredAddress.toLowerCase() === signerAddress.toLowerCase()) {
          setResult(`✅ Valid signature!\n\nSigner: ${recoveredAddress}\nMessage Hash: ${messageHash}\nVerification: Offchain (EOA signature)`)
          return
        }
      } catch (e) {
        // Continue to EIP-1271 check
      }
      
      // EIP-1271 verification requires RPC call
      setResult(`⚠️ EIP-1271 verification requires RPC access.\n\nMessage Hash: ${messageHash}\nExpected Signer: ${signerAddress}\n\nTo verify this Safe signature, use the CLI tool:\nnpx safe-verify "${verifyMessage.trim()}" "${verifySignature.trim()}" --safe ${signerAddress} --rpc YOUR_RPC_URL`)
      
    } catch (error) {
      console.error('Verification error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult(`❌ Error verifying signature: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  interface TabButtonProps {
    id: string
    label: string
    active: boolean
    onClick: () => void
  }

  const TabButton = ({ id, label, active, onClick }: TabButtonProps) => (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        border: 'none',
        borderBottom: active ? '2px solid #12ff80' : '2px solid transparent',
        background: 'none',
        cursor: 'pointer',
        fontWeight: active ? 'bold' : 'normal',
        color: active ? '#12ff80' : '#666'
      }}
    >
      {label}
    </button>
  )

  interface InputGroupProps {
    label: string
    children: React.ReactNode
  }

  const InputGroup = ({ label, children }: InputGroupProps) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{label}</label>
      {children}
    </div>
  )

  interface ButtonProps {
    onClick: () => void
    children: React.ReactNode
    disabled?: boolean
  }

  const Button = ({ onClick, children, disabled = false }: ButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '12px 24px',
        backgroundColor: disabled || loading ? '#ccc' : '#12ff80',
        color: disabled || loading ? '#666' : '#000',
        border: 'none',
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold'
      }}
    >
      {loading ? 'Processing...' : children}
    </button>
  )

  if (!connected || !isInSafe) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Safe Message Tools</h1>
        {connectionStatus === 'connecting' ? (
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px' }}>
            <p>Connecting to Safe...</p>
          </div>
        ) : (
          <div style={{ background: '#f8d7da', padding: '20px', borderRadius: '8px' }}>
            <h2>⚠️ Not running in Safe interface</h2>
            <p>This app needs to be loaded within the Safe interface to work properly.</p>
            <p>To use this app:</p>
            <ol>
              <li>Open your Safe at <a href="https://app.safe.global" target="_blank">app.safe.global</a></li>
              <li>Go to "Apps" section</li>
              <li>Click "Add custom app"</li>
              <li>Enter this URL: <code>https://safe-message-cli-git-main-zscoles-projects.vercel.app/</code></li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Safe Message Tools</h1>
        <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', fontSize: '14px' }}>
          <strong>Safe:</strong> {safe.safeAddress} <span style={{ color: '#666' }}>• Chain {safe.chainId}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '30px' }}>
        <TabButton
          id="sign"
          label="Sign Message"
          active={activeTab === 'sign'}
          onClick={() => setActiveTab('sign')}
        />
        <TabButton
          id="verify"
          label="Verify Signature"
          active={activeTab === 'verify'}
          onClick={() => setActiveTab('verify')}
        />
      </div>

      {activeTab === 'sign' && (
        <div>
          <h2>Sign EIP-712 Safe Message</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Creates an on-chain message signature using the SignMessageLib contract.
          </p>
          
          <InputGroup label="Message to Sign">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </InputGroup>

          <Button onClick={handleSign} disabled={!message.trim()}>
            Sign Message
          </Button>
        </div>
      )}

      {activeTab === 'verify' && (
        <div>
          <h2>Verify Message Signature</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Verify signatures using offchain recovery or EIP-1271 onchain verification.
          </p>
          
          <InputGroup label="Original Message">
            <textarea
              value={verifyMessage}
              onChange={(e) => setVerifyMessage(e.target.value)}
              placeholder="Enter the original message..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </InputGroup>

          <InputGroup label="Signature">
            <input
              type="text"
              value={verifySignature}
              onChange={(e) => setVerifySignature(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </InputGroup>

          <InputGroup label="Signer Address (optional - defaults to current Safe)">
            <input
              type="text"
              value={verifyAddress}
              onChange={(e) => setVerifyAddress(e.target.value)}
              placeholder={safe.safeAddress}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </InputGroup>

          <Button onClick={handleVerify} disabled={!verifyMessage.trim() || !verifySignature.trim()}>
            Verify Signature
          </Button>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: result.includes('❌') ? '#f8d7da' : result.includes('⚠️') ? '#fff3cd' : '#e8f5e8',
          borderRadius: '8px',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {result}
        </div>
      )}
    </div>
  )
}

export default App 