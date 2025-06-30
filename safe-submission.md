# Safe Tools - Safe Apps Directory Submission

## App Information

**App Name:** Safe Tools  
**Live URL:** https://safetools.io  
**Manifest URL:** https://safetools.io/manifest.json  
**GitHub Repository:** https://github.com/zscole/safe-message-cli  
**Contact:** zak@numbergroup.xyz  

## Description

Safe Tools enables message signing and verification for Gnosis Safe accounts using the official SignMessageLib contract. The app creates EIP-1271 compliant signatures by storing message hashes onchain, enabling Safe accounts to prove ownership and authenticate with offchain services.

## Technical Details

- **Safe Apps SDK:** Properly integrated using `@safe-global/safe-apps-react-sdk`
- **Supported Networks:** Ethereum, Polygon, Optimism, Arbitrum, Sepolia, Goerli, Gnosis Chain, Base, zkSync Era
- **Smart Contracts:** Uses official Safe SignMessageLib contract (`0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2`)
- **Standards:** EIP-712 message hashing, EIP-1271 signature verification
- **Multi-signature:** Automatic threshold handling via Safe transaction system

## Security & Verification

**Audit:** N/A (no custom smart contracts deployed)  
**Sourcify Verification:** N/A (uses existing Safe infrastructure)  
**Open Source:** MIT license, full source code available on GitHub

## Test Plan

The app behavior is fully testable via the live UI:

1. **Connection Test:** App detects Safe environment and displays Safe address/network
2. **Message Signing:** Enter message → approve Safe transaction → receive signature output
3. **Multi-signature:** Works with any Safe threshold (2/3, 3/5, etc.) via Safe's transaction approval flow
4. **Output Formats:** Displays both standard signature data and MEW/MyCrypto-compatible JSON
5. **Copy Functions:** All signature data can be copied to clipboard
6. **Error Handling:** Clear error messages for invalid inputs or connection issues

## Features

- Message signing using Safe's SignMessageLib contract
- EIP-1271 compliant signature verification
- MEW/MyCrypto compatible output format
- Multi-signature coordination via Safe transaction system
- Copy-to-clipboard functionality for all outputs
- Retro terminal aesthetic with authentic 80s computing theme
- Progressive enhancement (works as landing page and Safe App)

## No External Dependencies

- No wallet connection prompts
- No user tracking or analytics
- No custom token requirements
- Pure Safe Apps SDK integration 