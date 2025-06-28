# safe-message-cli

Sign and verify messages with Gnosis Safe.

## Install

```bash
npm install
# or globally
npm install -g .
```

## Usage

### Sign messages

```bash
node sign.js --safe 0x... --key 0x... --msg message.txt --rpc https://...
```

### Verify signatures

Offchain (recover signer):
```bash
node verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://...
```

With expected signer check:
```bash
node verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://... --signer 0x...
```

Onchain (EIP-1271):
```bash
node verify.js --safe 0x... --sig 0x... --msg message.txt --rpc https://... --onchain
```

## Options

### sign.js
- `--safe` Safe address
- `--key` Owner private key  
- `--msg` Message file path
- `--rpc` RPC endpoint

### verify.js
- `--safe` Safe address
- `--sig` Signature to verify
- `--msg` Message file path  
- `--rpc` RPC endpoint
- `--signer` Expected signer address (optional)
- `--onchain` Use EIP-1271 verification (optional)

## Example

```bash
echo "hello world" > msg.txt

node sign.js \
  --safe 0x1234... \
  --key 0xabcd... \
  --msg msg.txt \
  --rpc https://mainnet.infura.io/v3/...

node verify.js \
  --safe 0x1234... \
  --sig 0x5678... \
  --msg msg.txt \
  --rpc https://mainnet.infura.io/v3/... \
  --onchain
```

Both tools use standard exit codes (0 = success, 1 = failure) for scripting.
