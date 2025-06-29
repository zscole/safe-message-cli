import React, { useState, useEffect } from 'react';
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK();
  
  // State management
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [messageHash, setMessageHash] = useState('');
  const [recoveredSigner, setRecoveredSigner] = useState('');
  const [isValidSignature, setIsValidSignature] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Debug logging effect
  useEffect(() => {
    const logs: string[] = [];
    
    // Check iframe context
    const inIframe = window.parent !== window;
    logs.push(`🖼️ Running in iframe: ${inIframe}`);
    
    // Check Safe SDK state
    logs.push(`🔗 SDK connected: ${connected}`);
    logs.push(`📱 Safe object exists: ${!!safe}`);
    
    if (safe) {
      logs.push(`🏠 Safe address: ${safe.safeAddress}`);
      logs.push(`⛓️ Chain ID: ${safe.chainId}`);
    }
    
    // Check SDK methods
    logs.push(`🛠️ SDK.txs exists: ${!!sdk?.txs}`);
    logs.push(`🛠️ SDK.eth exists: ${!!sdk?.eth}`);
    
    // Browser context
    logs.push(`🌐 User agent: ${navigator.userAgent.slice(0, 50)}...`);
    logs.push(`📍 Current URL: ${window.location.href}`);
    
    setDebugInfo(logs);
    
    // Console logging for iframe inspection
    console.log('🔍 Safe App Debug Info:', {
      inIframe,
      connected,
      safeExists: !!safe,
      safeAddress: safe?.safeAddress,
      chainId: safe?.chainId,
      sdkExists: !!sdk,
      txsExists: !!sdk?.txs,
      ethExists: !!sdk?.eth
    });
    
  }, [connected, safe, sdk]);

  // Early return with debug info if not connected
  if (!connected) {
    return (
      <div className="App">
        <div className="app-header">
          <h1>🔧 Safe App Diagnostics</h1>
          <p>Debugging Safe Apps SDK connection...</p>
        </div>
        
        <div className="result-card" style={{ background: '#fff3cd', borderColor: '#ffeaa7' }}>
          <h4>⏳ Loading Safe context...</h4>
          <div style={{ marginTop: '16px' }}>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ 
                fontFamily: 'monospace', 
                fontSize: '12px', 
                padding: '4px 0',
                color: '#666'
              }}>
                {log}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#856404' }}>
            <strong>Expected behavior:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Should be running in iframe: true</li>
              <li>SDK should connect within 2-3 seconds</li>
              <li>Safe address should appear once connected</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const handleSignAndVerify = async () => {
    if (!message.trim()) {
      setError('Please enter a message to sign');
      return;
    }
  
    setLoading(true);
    setError('');
    setSignature('');
    setMessageHash('');
    setRecoveredSigner('');
    setIsValidSignature(null);
  
    try {
      // Hash the message using ethers (EIP-191 personal message)
      const msgHash = ethers.hashMessage(message);
      setMessageHash(msgHash);
  
      // SignMessageLib contract and function ABI
      const SIGN_MESSAGE_LIB = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2';
      const signMessageInterface = new ethers.Interface([
        'function signMessage(bytes _data)'
      ]);
      const signMessageData = signMessageInterface.encodeFunctionData('signMessage', [msgHash]);
  
      // DelegateCall transaction via Safe SDK
      const transaction = {
        to: SIGN_MESSAGE_LIB,
        value: '0',
        data: signMessageData,
        operation: 1 // DelegateCall
      };
  
      const txResponse = await sdk.txs.send({ txs: [transaction] });
      const safeTxHash = txResponse.safeTxHash;
      setSignature(`Signed on-chain: ${safeTxHash}`);
      setRecoveredSigner(safe.safeAddress);
  
      // ⏳ Wait for execution by polling the transaction service
      let isExecuted = false;
      let retry = 0;
      while (!isExecuted && retry < 30) {
        const txDetails = await sdk.txs.getBySafeTxHash(safeTxHash);
        if (txDetails?.executedAt) {
          isExecuted = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 3000));
        retry++;
      }
  
      if (!isExecuted) {
        throw new Error('Signature transaction was not executed in time. Try again.');
      }
  
      // EIP-1271 verification
      const isValidSigInterface = new ethers.Interface([
        'function isValidSignature(bytes32 _hash, bytes _signature) external view returns (bytes4)'
      ]);
      const callData = isValidSigInterface.encodeFunctionData('isValidSignature', [msgHash, '0x']);
  
      const result = await sdk.eth.call([{
        to: safe.safeAddress,
        data: callData
      }]);
  
      const EIP1271_MAGIC_VALUE = '0x1626ba7e';
      const isValid = result === EIP1271_MAGIC_VALUE;
      setIsValidSignature(isValid);
  
    } catch (err) {
      console.error('Signing/verification error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const clearResults = () => {
    setMessage('');
    setSignature('');
    setMessageHash('');
    setRecoveredSigner('');
    setIsValidSignature(null);
    setError('');
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>✅ Safe Message Signing</h1>
        <p>EIP-712 message signing with EIP-1271 verification</p>
      </div>

      <div className="safe-status">
        <div className="status-indicator connected">✅ Connected to Safe</div>
        <div className="safe-info">
          <p><strong>Safe Address:</strong> <code>{safe.safeAddress}</code></p>
          <p><strong>Chain ID:</strong> {safe.chainId}</p>
        </div>
      </div>

      {/* Debug Panel - Remove this in production */}
      <div className="result-card" style={{ background: '#f8f9fa', borderColor: '#e9ecef', marginBottom: '20px' }}>
        <h4>🔍 Connection Debug Info</h4>
        <div style={{ marginTop: '12px' }}>
          {debugInfo.map((log, index) => (
            <div key={index} style={{ 
              fontFamily: 'monospace', 
              fontSize: '11px', 
              padding: '2px 0',
              color: '#495057'
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="tab-content">
          <div className="input-group">
            <label htmlFor="message">Message to Sign</label>
            <textarea
              id="message"
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={4}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              className={`action-button ${loading ? 'disabled' : 'primary'}`}
              onClick={handleSignAndVerify}
              disabled={loading || !message.trim()}
            >
              {loading ? 'Processing...' : 'Sign & Verify'}
            </button>
            
            {(signature || error) && (
              <button
                className="action-button"
                onClick={clearResults}
                style={{ background: '#6c757d', color: 'white' }}
              >
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="result-card error">
              <h4>❌ Error</h4>
              <p>{error}</p>
            </div>
          )}

          {signature && (
            <div className="result-card success">
              <h4>📝 Signature Results</h4>
              
              <div className="result-details">
                <p><strong>Original Message:</strong></p>
                <code className="signature-code">{message}</code>

                <p><strong>Message Hash:</strong></p>
                <code className="signature-code">{messageHash}</code>

                <p><strong>Signature:</strong></p>
                <code className="signature-code">{signature}</code>

                <p><strong>Recovered Signer:</strong></p>
                <code className="signature-code">{recoveredSigner}</code>

                <p><strong>EIP-1271 Verification:</strong></p>
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '6px', 
                  background: isValidSignature ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${isValidSignature ? '#c3e6cb' : '#f5c6cb'}`,
                  marginTop: '8px'
                }}>
                  {isValidSignature === true && (
                    <span style={{ color: '#155724', fontWeight: 'bold' }}>
                      ✅ Valid - Signature verified on-chain
                    </span>
                  )}
                  {isValidSignature === false && (
                    <span style={{ color: '#721c24', fontWeight: 'bold' }}>
                      ❌ Invalid - Signature failed on-chain verification
                    </span>
                  )}
                  {isValidSignature === null && (
                    <span style={{ color: '#856404', fontWeight: 'bold' }}>
                      ⏳ Verifying...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 