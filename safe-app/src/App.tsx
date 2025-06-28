import { useState } from 'react';
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';
import { ethers } from 'ethers';
import './App.css';

interface SignedMessage {
  message: string;
  signature: string;
  safe: string;
  chainId: number;
  timestamp: string;
}

interface VerificationResult {
  message: string;
  signature: string;
  isValid: boolean;
  safe: string;
  timestamp: string;
  method: 'off-chain' | 'on-chain';
}

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK();
  const [activeTab, setActiveTab] = useState<'sign' | 'verify'>('sign');
  
  // Sign tab state
  const [message, setMessage] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signResult, setSignResult] = useState<SignedMessage | null>(null);
  
  // Verify tab state
  const [verifyMessage, setVerifyMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);

  const signMessage = async () => {
    if (!message.trim() || !connected || !safe.safeAddress) {
      alert('Please enter a message and ensure Safe is connected');
      return;
    }
    
    setSignLoading(true);
    try {
      // Sign the message using Safe Apps SDK - creates a transaction for message signing
      const signResponse = await sdk.txs.signMessage(message);

      const result: SignedMessage = {
        message,
        signature: 'safeTxHash' in signResponse ? signResponse.safeTxHash : JSON.stringify(signResponse),
        safe: safe.safeAddress,
        chainId: safe.chainId,
        timestamp: new Date().toISOString()
      };

      setSignResult(result);
      setMessage('');
    } catch (error) {
      console.error('Signing failed:', error);
      alert('Signing failed: ' + (error as Error).message);
    } finally {
      setSignLoading(false);
    }
  };

  const verifySignature = async () => {
    if (!verifyMessage.trim() || !connected || !safe.safeAddress) {
      alert('Please enter a message');
      return;
    }
    
    setVerifyLoading(true);
    try {
      // Get provider for contract calls
      const rpcUrl = safe.chainId === 1 ? 'https://cloudflare-eth.com' : 
                     safe.chainId === 5 ? 'https://ethereum-goerli.publicnode.com' :
                     safe.chainId === 11155111 ? 'https://ethereum-sepolia.publicnode.com' :
                     'https://cloudflare-eth.com';
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Safe contract ABI for EIP-1271
      const safeAbi = [
        'function isValidSignature(bytes32 _dataHash, bytes _signature) public view returns (bytes4)'
      ];
      
      const safeContract = new ethers.Contract(safe.safeAddress, safeAbi, provider);
      const EIP1271_MAGIC_VALUE = '0x1626ba7e';
      
      let isValid = false;
      let method: 'off-chain' | 'on-chain' = 'off-chain';
      
      if (signature.trim()) {
        // Verify off-chain signature
        try {
          const messageHash = ethers.hashMessage(verifyMessage);
          const result = await safeContract.isValidSignature(messageHash, signature);
          isValid = result === EIP1271_MAGIC_VALUE;
          method = 'off-chain';
        } catch (error) {
          console.error('Off-chain verification failed:', error);
          isValid = false;
        }
      } else {
        // Check on-chain signature approval
        try {
          const messageHash = ethers.hashMessage(verifyMessage);
          const result = await safeContract.isValidSignature(messageHash, '0x');
          isValid = result === EIP1271_MAGIC_VALUE;
          method = 'on-chain';
        } catch (error) {
          console.error('On-chain verification failed:', error);
          isValid = false;
        }
      }

      const result: VerificationResult = {
        message: verifyMessage,
        signature: signature || '(on-chain verification)',
        isValid,
        safe: safe.safeAddress,
        timestamp: new Date().toISOString(),
        method
      };

      setVerifyResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed: ' + (error as Error).message);
    } finally {
      setVerifyLoading(false);
    }
  };



  return (
    <div className="app">
      <header className="app-header">
        <h1>Safe Message Tools</h1>
        <p>EIP-712 message signing and EIP-1271 verification</p>
      </header>
      
      <div className="safe-status">
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '✅ Connected to Safe' : '❌ Not Connected'}
        </div>
        {safe.safeAddress && (
          <div className="safe-info">
            <p><strong>Safe Address:</strong> <code>{safe.safeAddress}</code></p>
            <p><strong>Chain ID:</strong> {safe.chainId}</p>
            {safe.threshold && safe.owners && (
              <p><strong>Multi-sig:</strong> {safe.threshold}/{safe.owners.length} owners required</p>
            )}
          </div>
        )}
      </div>

      {connected ? (
        <div className="main-content">
          <div className="tab-header">
            <button 
              className={activeTab === 'sign' ? 'active' : ''}
              onClick={() => setActiveTab('sign')}
            >
              Sign Message
            </button>
            <button 
              className={activeTab === 'verify' ? 'active' : ''}
              onClick={() => setActiveTab('verify')}
            >
              Verify Message
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'sign' && (
              <div className="sign-tab">
                <h3>Sign Message</h3>
                <p>Sign a message using the Safe Apps SDK</p>
                
                <textarea
                  className="message-input"
                  placeholder="Enter your message to sign..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                
                <button
                  className={`action-button ${signLoading || !message.trim() ? 'disabled' : 'primary'}`}
                  onClick={signMessage}
                  disabled={signLoading || !message.trim()}
                >
                  {signLoading ? 'Signing...' : 'Sign Message'}
                </button>

                {signResult && (
                  <div className="result-card success">
                    <h4>✅ Message Signed Successfully</h4>
                    <div className="result-details">
                      <p><strong>Message:</strong> "{signResult.message}"</p>
                      <p><strong>Safe:</strong> <code>{signResult.safe}</code></p>
                      <p><strong>Chain ID:</strong> {signResult.chainId}</p>
                      <p><strong>Signature:</strong></p>
                      <code className="signature-code">{signResult.signature}</code>
                      <p><strong>Signed at:</strong> {signResult.timestamp}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verify' && (
              <div className="verify-tab">
                <h3>Verify Message Signature</h3>
                <p>Verify a message signature using EIP-1271 standard</p>
                
                <div className="input-group">
                  <label>Original Message:</label>
                  <textarea
                    className="message-input"
                    placeholder="Enter the original message..."
                    value={verifyMessage}
                    onChange={(e) => setVerifyMessage(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Signature (optional for on-chain verification):</label>
                  <input
                    type="text"
                    className="signature-input"
                    placeholder="0x... or leave empty to check on-chain signatures"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </div>
                
                <button
                  className={`action-button ${verifyLoading || !verifyMessage.trim() ? 'disabled' : 'success'}`}
                  onClick={verifySignature}
                  disabled={verifyLoading || !verifyMessage.trim()}
                >
                  {verifyLoading ? 'Verifying...' : 'Verify Message'}
                </button>

                {verifyResult && (
                  <div className={`result-card ${verifyResult.isValid ? 'success' : 'error'}`}>
                    <h4>{verifyResult.isValid ? '✅ Valid Signature' : '❌ Invalid Signature'}</h4>
                    <div className="result-details">
                      <p><strong>Message:</strong> "{verifyResult.message}"</p>
                      <p><strong>Safe:</strong> <code>{verifyResult.safe}</code></p>
                      <p><strong>Verification Method:</strong> {verifyResult.method}</p>
                      <p><strong>Signature:</strong></p>
                      <code className="signature-code">{verifyResult.signature}</code>
                      <p><strong>Result:</strong> {verifyResult.isValid ? 'This signature is valid for the connected Safe' : 'This signature is not valid for the connected Safe'}</p>
                      <p><strong>Verified at:</strong> {verifyResult.timestamp}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="connecting">
          <p>Connecting to Safe...</p>
        </div>
      )}
    </div>
  );
}

export default App; 