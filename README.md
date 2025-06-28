# Safe Message Tools

A complete Safe App for message signing and verification with EIP-712 and EIP-1271 support.

## 🚀 Quick Setup

```bash
# Install everything
npm run install-all

# Start Safe App
npm run dev
```

Then add `http://localhost:3000` as a custom app in your Safe interface.

## 📁 Project Structure

```
safe-message-tools/
├── safe-app/          # Primary Safe App (React)
│   ├── src/
│   ├── public/
│   └── package.json
├── cli/               # CLI automation tools
│   ├── sign.js
│   ├── verify.js
│   ├── sign-hw.js
│   ├── collect-signatures.js
│   └── safe-transaction.js
├── lib/               # Shared utilities
│   └── safe.js
└── package.json       # Project coordination
```

## 🌐 Safe App (Primary Interface)

Browser-based Safe App that integrates directly with your Safe interface:
- **Message signing** through Safe's multi-signature interface
- **EIP-1271 verification** for onchain signature validation  
- **Multi-signature workflows** with automatic Safe context
- **Professional UI** matching Safe's design language

### Development Mode
The Safe App includes a development mode for testing outside the Safe interface.

## 🖥️ CLI Tools (Automation Support)

Command-line tools for developers and automation:
- **sign.js** - Sign messages with private keys  
- **verify.js** - Verify signatures (offchain/onchain)  
- **sign-hw.js** - Hardware wallet signing (Ledger)
- **collect-signatures.js** - Multi-signature collection
- **safe-transaction.js** - Safe transaction management

### CLI Usage
```bash
# Sign message
node cli/sign.js --safe 0x... --key 0x... --msg message.txt --rpc https://...

# Verify signature  
node cli/verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://... --onchain

# Global installation (optional)
npm install -g .
safe-sign --safe 0x... --key 0x... --msg message.txt --rpc https://...
```

## Use Cases

**Safe App**: Primary interface for teams and manual operations  
**CLI Tools**: Perfect for automation, CI/CD, and server-side workflows

## Architecture

Both interfaces share core EIP-712 utilities (`lib/safe.js`):
- Safe App uses Safe's multi-signature interface
- CLI tools support direct private key and hardware wallet signing  
- Standard RPC calls only - no external services required
- Full EIP-1271 onchain verification support

## Standards

- **EIP-712** for typed data signing with Safe domain separation
- **EIP-1271** for onchain signature verification
- **Safe Apps SDK** for seamless Safe interface integration
