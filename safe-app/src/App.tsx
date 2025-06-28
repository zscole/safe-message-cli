import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

function App() {
  const { safe, sdk, connected } = useSafeAppsSDK()

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Safe Message Tools</h1>
      
      {connected ? (
        <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px' }}>
          <h2>✅ Connected to Safe</h2>
          <p><strong>Safe Address:</strong> {safe.safeAddress}</p>
          <p><strong>Chain ID:</strong> {safe.chainId}</p>
          
        </div>
      ) : (
        <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px' }}>
          <p>Connecting to Safe...</p>
        </div>
      )}
    </div>
  )
}

export default App 