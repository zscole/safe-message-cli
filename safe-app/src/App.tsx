import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';
import './App.css';

function App() {
  const { safe, connected } = useSafeAppsSDK();

  if (!connected) return <p>Loading Safe context...</p>;

  return (
    <div className="App">
      <h1>Safe Message CLI</h1>
      <p>Connected: Yes</p>
      <p>Safe Address: {safe?.safeAddress}</p>
    </div>
  );
}

export default App; 