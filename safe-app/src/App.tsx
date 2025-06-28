import React, { useState } from 'react';
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

  if (!connected) return <p>Loading Safe context...</p>;

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
      // 1. Hash the message using ethers (for EIP-191 personal message)
      const msgHash = ethers.hashMessage(message);
      setMessageHash(msgHash);

      // 2. Create transaction to SignMessageLib for on-chain signing
      const SIGN_MESSAGE_LIB = '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2';
      const signMessageInterface = new ethers.Interface([
        'function signMessage(bytes _data)'
      ]);

      const signMessageData = signMessageInterface.encodeFunctionData('signMessage', [msgHash]);

      const transaction = {
        to: SIGN_MESSAGE_LIB,
        value: '0',
        data: signMessageData,
        operation: 1 // DelegateCall
      };

      // 3. Send transaction to sign the message on-chain
      const txResponse = await sdk.txs.send({ txs: [transaction] });
      setSignature(`Signed on-chain: ${txResponse.safeTxHash}`);
      setRecoveredSigner(safe.safeAddress);

      // 4. Call isValidSignature on the Safe contract
      const isValidSigInterface = new ethers.Interface([
        'function isValidSignature(bytes32 _hash, bytes _signature) external view returns (bytes4)'
      ]);

      // For on-chain signed messages, we check with empty signature since it's stored on-chain
      const callData = isValidSigInterface.encodeFunctionData('isValidSignature', [
        msgHash,
        '0x' // Empty signature for on-chain signed messages
      ]);

      const result = await sdk.eth.call([{
        to: safe.safeAddress,
        data: callData
      }]);

      // Check if result matches EIP-1271 magic value
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
        <h1>Safe Message Signing</h1>
        <p>EIP-712 message signing with EIP-1271 verification</p>
      </div>

      <div className="safe-status">
        <div className="status-indicator connected">✅ Connected to Safe</div>
        <div className="safe-info">
          <p><strong>Safe Address:</strong> <code>{safe.safeAddress}</code></p>
          <p><strong>Chain ID:</strong> {safe.chainId}</p>
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