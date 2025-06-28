# safe-message-cli

CLI tools for Gnosis Safe message signing and verification.

## Install

```bash
npm install
```

For hardware wallet support:
```bash  
npm install @ledgerhq/hw-transport-node-hid @ledgerhq/hw-app-eth
```

## Usage

### Message signing

```bash
# Private key
node sign.js --safe 0x... --key 0x... --msg message.txt --rpc https://...

# Hardware wallet
node sign-hw.js --safe 0x... --wallet ledger --msg message.txt --rpc https://...
```

### Signature verification

```bash
# Offchain
node verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://...

# Onchain (EIP-1271)  
node verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://... --onchain
```

### Multi-signature collection

```bash
# Collect signatures
node collect-signatures.js --safe 0x... --msg proposal.txt --rpc https://... \
  --sig 0x... --signer 0x...

# Verify all
node collect-signatures.js --safe 0x... --msg proposal.txt --rpc https://... --verify
```

### Safe transactions

```bash
# Create and sign
node safe-transaction.js --safe 0x... --to 0x... --value 1000000000000000000 \
  --key 0x... --rpc https://...

# Execute  
node safe-transaction.js --safe 0x... --to 0x... --execute \
  --executor-key 0x... --rpc https://...
```

## Tools

**sign.js** - Sign messages with private keys  
**sign-hw.js** - Sign messages with hardware wallets  
**verify.js** - Verify signatures (offchain/onchain)  
**collect-signatures.js** - Collect and verify multiple signatures  
**safe-transaction.js** - Create, sign, and execute Safe transactions

## Architecture

- Direct private key or hardware wallet signing
- File-based signature coordination  
- Standard RPC calls only
- No external services required

Uses EIP-712 for Safe message signing and EIP-1271 for onchain verification.
