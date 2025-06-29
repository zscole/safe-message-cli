# Safe Tools

The easiest way to sign and verify messages with your Gnosis Safe. Built for simple, reliable message signing without extra setup or painful workarounds.

[![Live App](https://img.shields.io/badge/Live%20App-safe--tools-12ff80?style=flat-square)](https://safe-message-cli-git-main-zscoles-projects.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## 🚀 Quick Start

### Use the Safe App

1. Go to [app.safe.global](https://app.safe.global)
2. Open the **Apps** tab in your Safe
3. Click **Add Custom App**
4. Paste: `https://safe-message-cli-git-main-zscoles-projects.vercel.app`

Once added, Safe Tools will appear in your app list for easy message signing.

### Install CLI Tools

```bash
npm install -g safe-message-tools
```

## 🎯 What it's for

- **Sign messages** from your Safe
- **Authenticate** with apps and services  
- **Prove Safe ownership** onchain or offchain
- **Generate verifiable signatures** for any use case

## 🛠️ Usage

### Safe App Interface

The web interface provides a clean, simple way to sign messages directly from your Safe:

- Enter any message you want to sign
- Approve the transaction in your Safe
- Get back a verifiable signature that proves Safe ownership
- Copy results for use in other applications

### CLI Tools

For developers and automation:

```bash
# Sign with private key
safe-sign --safe 0x... --key 0x... --message "Hello World" --rpc https://...

# Verify signature onchain
safe-verify --safe 0x... --signature 0x... --message "Hello World" --rpc https://... --onchain

# Hardware wallet signing (Ledger)
safe-hw --safe 0x... --message "Hello World" --rpc https://...

# Coordinate multiple signatures  
safe-collect --safe 0x... --message "Hello World" --rpc https://... --sig 0x... --signer 0x...
```

## 🏗️ How it works

Safe Tools uses the official Safe SignMessageLib contract and EIP-1271 standard:

1. **EIP-712 hashing**: Messages are hashed using Safe's domain separator
2. **On-chain signing**: Creates a transaction to the SignMessageLib contract  
3. **EIP-1271 verification**: Automatically verifies signature validity
4. **Standard compliance**: Works with any service that supports EIP-1271

## 🔧 Development

### Repository Structure

```
├── safe-app/          # Safe App (React + Vite)
├── cli/               # Command-line tools  
├── lib/               # Shared utilities
└── package.json       # CLI package configuration
```

### Local Development

```bash
# Clone repository
git clone https://github.com/zscole/safe-message-cli.git
cd safe-message-cli

# Install dependencies
npm run install-all

# Start development server
npm run dev
```

The Safe App will be available at `http://localhost:5174` - add this URL as a custom app in your Safe interface for testing.

### Building

```bash
# Build Safe App for production
npm run build

# Install CLI tools globally from source
npm install -g .
```

## 📋 Standards

- **EIP-712**: Typed data signing with Safe domain separation
- **EIP-1271**: On-chain signature verification standard
- **Safe Apps SDK**: Official integration with Safe interface
- **Browser compatible**: No Node.js dependencies in web interface

## 🛡️ Security

- Uses official Safe SignMessageLib contract (`0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2`)
- No custom smart contracts deployed
- All operations require Safe owner approval
- Open source and auditable code

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live App**: https://safe-message-cli-git-main-zscoles-projects.vercel.app
- **Safe Apps Directory**: Submit as custom app in your Safe
- **GitHub**: https://github.com/zscole/safe-message-cli

---

Built by [Zak Cole](https://x.com/0xzak) at [Number Group](https://numbergroup.xyz)
