# Safe Message Tools - Safe App

A Safe App for signing and verifying messages using EIP-712 domain separation, built with the [Safe Apps SDK](https://docs.safe.global/apps-sdk-get-started).

## Features

- **Message Signing**: Sign messages using Safe's multi-signature capabilities
- **Signature Verification**: Verify signatures against the Safe contract using EIP-1271
- **Automatic Safe Context**: No need to manually enter Safe address or chain ID
- **Clean UI**: Professional interface matching Safe's design patterns

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd safe-app
npm install
npm start
```

The app will run on `http://localhost:3000`

### Testing in Safe

1. Open your Safe at [app.safe.global](https://app.safe.global)
2. Go to Apps → Add custom app
3. Enter the app URL: `http://localhost:3000`
4. The app will load with automatic Safe context

## Deployment

### Build for production

```bash
npm run build
```

### Deploy options

1. **IPFS**: Upload the `build` folder to IPFS for decentralized hosting
2. **Vercel/Netlify**: Connect your GitHub repo for automatic deployments  
3. **GitHub Pages**: Use the built files for static hosting

### Submit to Safe App Store

Once deployed, you can submit your app to the Safe App Store:

1. Fork the [Safe Apps repository](https://github.com/safe-global/safe-apps)
2. Add your app details to the registry
3. Submit a pull request

## Usage

### Within Safe Interface

1. Open the app in your Safe
2. **Sign tab**: Enter a message and click "Sign Message"
3. **Verify tab**: View and verify the signature using EIP-1271

### Example Flow

```
1. Enter message: "Approve proposal #123"
2. Click "Sign Message" → Safe prompts for signatures
3. Once signed, switch to "Verify" tab
4. Click "Verify with Safe Contract" → Confirms validity
```

## Architecture

- Uses `@safe-global/safe-apps-react-sdk` for Safe integration
- Reuses core utilities from CLI tools (`lib/safe.js`)
- EIP-712 structured data signing with Safe domain
- EIP-1271 contract-based signature verification

## API

### Safe Apps SDK Methods Used

- `useSafeAppsSDK()` - Get Safe context and SDK instance
- `sdk.signTypedMessage()` - Request EIP-712 signature from Safe
- `sdk.eth.call()` - Verify signatures via Safe contract

### Core Functions

- `safeTypedData(safe, message, chainId)` - Generate EIP-712 structure
- `safeMessageHash(safe, message, chainId)` - Calculate message hash 