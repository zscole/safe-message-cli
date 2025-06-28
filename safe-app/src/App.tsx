import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

export default function App() {
  const { safe, sdk, connected } = useSafeAppsSDK()

  // Simple one-time log without useEffect dependencies that could cause loops
  console.log('Safe App loaded - connected:', connected)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Safe Message Tools</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <p><strong>Status:</strong> {connected ? '✅ Connected to Safe' : '❌ Not Connected'}</p>
        {safe?.safeAddress && <p><strong>Safe:</strong> {safe.safeAddress}</p>}
      </div>

      {connected ? (
        <div style={{ padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
          <h3>✅ Safe App Working!</h3>
          <p>This Safe App is properly connected and ready for message signing.</p>
        </div>
      ) : (
        <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
          <p>Connecting to Safe...</p>
        </div>
      )}
    </div>
  )
} 