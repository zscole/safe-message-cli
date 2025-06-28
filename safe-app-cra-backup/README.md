# Safe Message App

Simplified Safe App for EIP-712 message signing within Safe interface.

## Architecture

Uses minimal dependencies to avoid webpack polyfill issues:
- **Safe Apps SDK** for Safe interface integration
- **ethers.js** for EIP-712 signing
- **localStorage** for message history (dev/demo)

## Why Simplified?

The full Safe Protocol Kit + API Kit dependencies cause webpack 5 polyfill issues with deprecated `ethereumjs-util` that requires Node.js modules (`stream`, `assert`, etc.) that don't work in browsers without complex polyfills.

This simplified version provides the core functionality without the headaches.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd safe-app
npm install --legacy-peer-deps
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

## Features

- Sign messages through Safe interface
- View message history 
- Development mode for testing
- Clean, minimal dependencies
- No webpack polyfill errors

## API

### Safe Apps SDK Methods Used

- `useSafeAppsSDK()` - Get Safe context and SDK instance
- `sdk.signTypedMessage()` - Request EIP-712 signature from Safe
- `sdk.eth.call()` - Verify signatures via Safe contract

### Core Functions

- `safeTypedData(safe, message, chainId)` - Generate EIP-712 structure
- `safeMessageHash(safe, message, chainId)` - Calculate message hash 

## Production Use

For production multi-sig coordination, use the CLI tools which have full Protocol Kit + API Kit support without browser constraints. 