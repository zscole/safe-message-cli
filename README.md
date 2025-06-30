# Safe Tools

The easiest way to sign and verify messages with your Gnosis Safe. Built for simple, reliable message signing with an authentic retro terminal interface. Features EIP-712 message signing, EIP-1271 verification, and MEW/MyCrypto-compatible output formats.

[![Live App](https://img.shields.io/badge/Live%20App-safetools.io-12ff80?style=flat-square)](https://www.safetools.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## 🚀 Quick Start

### Use the Safe App

1. Go to [app.safe.global](https://app.safe.global)
2. Open the **Apps** tab in your Safe
3. Click **Add Custom App**
4. Paste: `https://www.safetools.io`

Once added, Safe Tools will appear in your Safe's app drawer for easy message signing.

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

The web interface provides an authentic retro terminal experience for signing messages directly from your Safe:

- **Retro terminal UI**: Authentic 80s hacker aesthetic with scanlines and terminal effects
- **Simple workflow**: Enter any message, approve the Safe transaction, get verifiable results  
- **Multiple output formats**: Standard signature + MEW/MyCrypto-compatible JSON
- **Copy-to-clipboard**: One-click copying for all signature data and JSON formats
- **Multi-signature support**: Automatically handles Safe threshold requirements (2/3, 3/5, etc.)
- **EIP-1271 verification**: Onchain signature validation using Safe's SignMessageLib contract

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

1. **EIP-712 hashing**: Messages are hashed using Safe's domain separator for security
2. **Onchain transaction**: Creates a transaction to SignMessageLib contract (`0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2`)
3. **Multi-signature coordination**: Safe interface handles threshold requirements automatically
4. **Dual output formats**: Standard signature + MEW/MyCrypto-compatible JSON for broad compatibility
5. **EIP-1271 verification**: Onchain signature validation that any service can verify
6. **Cross-platform support**: Works in Safe Apps interface and as standalone CLI tools

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

## 📋 Output Formats

### Standard Signature Output
- Original message text
- Safe address used for signing
- Signature/transaction hash
- EIP-1271 verification status

### MEW/MyCrypto-Compatible JSON
```json
{
  "address": "0x9CFe9dc15b6cA16147dF1b93E487bAaDd422F693",
  "msg": "Prove ownership of Safe for domain verification", 
  "sig": "0xbfddd739e0a9a49d6885ccded16267760649505bdd589703cc833364904a9e4c",
  "version": "2"
}
```

## 📋 Standards

- **EIP-712**: Typed data signing with Safe domain separation
- **EIP-1271**: Onchain signature verification standard
- **Safe Apps SDK**: Official integration with Safe interface
- **MEW/MyCrypto**: Compatible JSON signature format
- **Browser compatible**: No Node.js dependencies in web interface

## 🛡️ Security

- Uses official Safe SignMessageLib contract (`0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2`)
- No custom smart contracts deployed
- All operations require Safe owner approval
- Open source and auditable code

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live App**: https://www.safetools.io
- **Safe Apps**: Add as custom app in your Safe interface
- **GitHub**: https://github.com/zscole/safe-message-cli

---

Built by [Zak Cole](https://x.com/0xzak) at [Number Group](https://numbergroup.xyz)
