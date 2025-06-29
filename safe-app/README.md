# Safe Message Signing App

A Safe App for signing messages using the SignMessageLib contract and verifying them with EIP-1271.

## Features

- Sign messages on-chain using Safe's SignMessageLib
- Verify signatures using EIP-1271 standard
- Native Safe interface integration
- Real-time transaction polling

## Development

```bash
npm install
npm run dev
```

## Usage

1. Load the app in your Safe at [app.safe.global](https://app.safe.global)
2. Add custom app with URL: `https://safe-message-cli-git-main-zscoles-projects.vercel.app/`
3. Enter your message and click "Sign & Verify"
4. The app will create a Safe transaction to sign the message on-chain
5. Results show the message hash, transaction hash, and EIP-1271 verification status

## License

MIT © [Zak Cole](https://numbergroup.xyz)
