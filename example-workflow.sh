#!/bin/bash

# Example workflow
SAFE="0x1234567890123456789012345678901234567890"
KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC="https://mainnet.infura.io/v3/your-key"
MSG="example-message.txt"

echo "Signing message..."
node sign.js --safe $SAFE --key $KEY --msg $MSG --rpc $RPC

echo -e "\nVerifying signature..."
# Extract signature from above output and verify
# node verify.js --safe $SAFE --sig $SIG --msg $MSG --rpc $RPC --onchain 