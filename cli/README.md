# CLI Tools

Command-line automation tools for Safe message signing and transaction management.

## Tools

### Message Signing & Verification
- **`sign.js`** - Sign messages with private keys
- **`verify.js`** - Verify signatures (offchain/onchain EIP-1271)
- **`sign-hw.js`** - Hardware wallet message signing (Ledger)

### Multi-signature Workflows  
- **`collect-signatures.js`** - Collect and verify multiple signatures
- **`safe-transaction.js`** - Create, sign, and execute Safe transactions

## Usage Examples

```bash
# Sign a message
node sign.js --safe 0x... --key 0x... --msg message.txt --rpc https://mainnet.infura.io/...

# Verify signature onchain
node verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://... --onchain

# Sign with Ledger
node sign-hw.js --safe 0x... --msg message.txt --rpc https://... --wallet ledger

# Collect signatures for coordination
node collect-signatures.js --safe 0x... --msg message.txt --rpc https://... --sig 0x... --signer 0x...

# Create and sign Safe transaction
node safe-transaction.js --safe 0x... --to 0x... --value 1000000000000000000 --rpc https://... --key 0x...
```

## Global Installation

```bash
# Install globally for convenience
npm install -g ..

# Use anywhere
safe-sign --safe 0x... --key 0x... --msg message.txt --rpc https://...
safe-verify --safe 0x... --sig 0x... --msg message.txt --rpc https://... --onchain
``` 