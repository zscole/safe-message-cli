# Safe Tools - Safe App Directory Submission

## App Information

**Name**: Safe Tools  
**Description**: Sign and verify messages using your Gnosis Safe. Useful for proving Safe ownership or interacting with offchain services.  
**Current URL**: https://safe-message-cli-git-main-zscoles-projects.vercel.app  
**GitHub Repository**: https://github.com/zscole/safe-message-cli  

## Submission Checklist

### ✅ Manifest Requirements
- [x] `manifest.json` at root directory with required fields
- [x] Name under 50 characters: "Safe Tools" (10 characters)
- [x] Description under 200 characters (139 characters)
- [x] Square SVG icon minimum 128x128px
- [x] CORS properly configured for manifest access

### ✅ Technical Requirements
- [x] App auto-connects to Safe using Safe Apps React SDK
- [x] Handles case where user previously connected other wallet
- [x] Professional UI with proper error handling
- [x] Mobile responsive design
- [x] Production-ready code quality

### ✅ Smart Contract Information
**Primary Contract**: SignMessageLib  
**Address**: `0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2`  
**Network**: Ethereum Mainnet (and other networks where Safe is deployed)  
**Verification**: This is an official Safe contract, verified on Etherscan  
**Purpose**: Enables Safe accounts to sign arbitrary messages via EIP-1271

## App Functionality

### Core Features
1. **Message Signing**: Users input arbitrary text messages
2. **EIP-712 Hashing**: Messages are hashed using Safe's EIP-712 domain
3. **On-chain Signing**: Creates transaction to SignMessageLib contract
4. **EIP-1271 Verification**: Automatically verifies signature validity
5. **Copy Functionality**: Users can copy all output data

### User Flow
1. User enters message in text area (auto-focused)
2. Clicks "Sign Message" button (disabled if empty)
3. Safe transaction modal appears for approval
4. Transaction executes via SignMessageLib delegate call
5. App polls for execution completion
6. Displays signed message, Safe address, signature hash, and verification status
7. Copy buttons allow easy sharing of results

### Technical Implementation
- **Frontend**: React + TypeScript + Vite
- **Safe Integration**: @safe-global/safe-apps-react-sdk
- **Ethereum Library**: ethers.js v6
- **Styling**: Custom CSS with accessibility compliance
- **Deployment**: Vercel with proper CORS/CSP headers

## Security Considerations

### Smart Contract Security
- Uses official Safe SignMessageLib contract (audited by Safe team)
- No custom smart contracts deployed
- All transactions go through Safe's standard approval process
- Read-only EIP-1271 verification calls

### Frontend Security
- No storage of private keys or sensitive data
- All operations require explicit user approval via Safe
- Proper input sanitization and validation
- No external API calls or third-party dependencies for core functionality

## Test Plan

### Manual Testing Checklist
1. **Connection Testing**
   - [ ] Load app in Safe Apps section
   - [ ] Verify auto-connection to Safe
   - [ ] Confirm Safe address and network display correctly

2. **Core Functionality**
   - [ ] Input field auto-focuses on load
   - [ ] Sign button disabled when input empty
   - [ ] Sign button shows loading state during transaction
   - [ ] Transaction modal appears with correct data
   - [ ] App waits for transaction execution
   - [ ] Results display correctly after signing

3. **UI/UX Testing**
   - [ ] Responsive design on mobile devices
   - [ ] Copy buttons work for all output fields
   - [ ] Error states display properly
   - [ ] Loading states are clear and informative
   - [ ] Address truncation and tooltip functionality

4. **Edge Cases**
   - [ ] Very long messages (>1000 characters)
   - [ ] Special characters and Unicode
   - [ ] Network switching during operation
   - [ ] Transaction rejection by user
   - [ ] Connection loss during signing

### Automated Testing
- TypeScript compilation without errors
- React component rendering tests
- Safe Apps SDK integration tests
- CORS header validation

## Network Support

**Supported Networks**: All networks where Safe is deployed
- Ethereum Mainnet
- Polygon Mainnet  
- Arbitrum One
- Optimism Mainnet
- Sepolia Testnet
- And others as supported by Safe

**SignMessageLib Availability**: The SignMessageLib contract is deployed consistently across all Safe-supported networks at the same address.

## ABI for Transaction Decoding

```json
{
  "inputs": [
    {
      "internalType": "bytes",
      "name": "_data",
      "type": "bytes"
    }
  ],
  "name": "signMessage",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}
```

**Contract Interface**: The app interacts with the `signMessage(bytes _data)` function of SignMessageLib via delegatecall from the Safe.

## Maintenance and Support

**Developer**: Zak Cole ([@0xzak](https://x.com/0xzak))  
**Organization**: Number Group ([numbergroup.xyz](https://numbergroup.xyz))  
**Support**: Available via GitHub issues and Discord  
**Update Frequency**: As needed for bug fixes and Safe SDK updates  

## Additional Notes

- App follows Safe's design patterns and UX guidelines
- No tracking or analytics implemented (privacy-focused)
- Open source with MIT license
- Production deployment uses official Safe Apps SDK
- All user data stays local (no server-side storage)

## Video Walkthrough

A video demonstration of the app functionality is available at: [Recording to be provided]

---

**Submission Date**: December 2024  
**Safe SDK Version**: @safe-global/safe-apps-react-sdk@^4.7.0  
**App Version**: 1.0.0 