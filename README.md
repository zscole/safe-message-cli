# Safe Message Tools

Safe App + CLI tools for EIP-712 message signing with multi-signature coordination.

## Setup

```bash
npm run setup
npm run dev
```

Add `http://localhost:3000` as a custom app in your Safe interface.

## Structure

```
├── safe-app/          # React app for Safe interface
├── cli/               # Command-line tools  
├── lib/               # Shared EIP-712 utilities
└── package.json
```

## Safe App

Simplified browser app that works within Safe interface:
- Sign messages using Safe Apps SDK + ethers.js
- Local storage for message history (dev/demo)
- Clean interface without heavy dependencies
- No webpack polyfill issues

## CLI Tools

Production automation tools for developers:

```bash
# Sign with private key
node cli/sign.js --safe 0x... --key 0x... --msg message.txt --rpc https://...

# Verify signature onchain
node cli/verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://... --onchain

# Hardware wallet signing
node cli/sign-hw.js --safe 0x... --msg message.txt --rpc https://... --wallet ledger

# Coordinate multiple signatures  
node cli/collect-signatures.js --safe 0x... --msg message.txt --rpc https://... --sig 0x... --signer 0x...
```

Global install: `npm install -g .` then use `safe-sign`, `safe-verify`, etc.

## Architecture

**Safe App**: Uses only Safe Apps SDK + ethers.js for clean browser compatibility. Avoids heavy Protocol Kit dependencies that cause webpack issues.

**CLI Tools**: Full-featured with Protocol Kit, API Kit, hardware wallet support, and file-based coordination for production workflows.

Both use the same EIP-712 domain separation for message compatibility.

## Standards

- EIP-712 typed data with Safe domain
- EIP-1271 onchain signature verification  
- Safe Apps SDK integration
- Browser-compatible dependencies
