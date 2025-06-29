# Safe App Development Reference

This document captures everything learned from building a working Safe App with proper EIP-712 message signing integration.

## ✅ Working Setup

**Working URL:** https://safe-message-cli-git-main-zscoles-projects.vercel.app
- HTTP 200 (no authentication issues)
- Proper CORS headers
- Correct iframe embedding policies
- Safe SDK integration working
- SecurityError issues resolved

## 🏗️ Architecture Overview

```
safe-message-cli/
├── cli/                    # Node.js CLI tools
│   ├── sign.js            # Sign messages via private key
│   ├── verify.js          # Verify EIP-1271 signatures
│   ├── sign-hw.js         # Hardware wallet integration
│   ├── collect-signatures.js  # Multi-sig coordination
│   └── safe-transaction.js    # Safe transaction management
├── lib/
│   └── safe.js            # Shared utilities
└── safe-app/              # Safe App (React + Vite)
    ├── src/
    │   ├── main.tsx       # Entry point with SafeProvider
    │   ├── App.tsx        # Main Safe App component
    │   └── lib/safe.ts    # Safe utilities for web
    ├── public/
    │   └── manifest.json  # Safe App metadata
    └── vercel.json        # Deployment headers
```

## 🔑 Critical Success Factors

### 1. Safe SDK Setup (main.tsx)
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import SafeProvider from '@safe-global/safe-apps-react-sdk'
import './index.css'

// DO NOT USE React.StrictMode - causes infinite re-render loops
ReactDOM.createRoot(document.getElementById('root')!).render(
  <SafeProvider>
    <App />
  </SafeProvider>
)
```

**Key Points:**
- ❌ **Never use React.StrictMode** - breaks Safe SDK initialization
- ✅ Use `SafeProvider` (default import, no props needed)
- ✅ No manual SDK instance creation required

### 2. Safe App Component (App.tsx)
```tsx
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'

export default function App() {
  const { safe, sdk, connected } = useSafeAppsSDK()
  
  // ❌ NEVER do this - causes infinite loops:
  // useEffect(() => { ... }, [safe, sdk, connected])
  
  // ✅ Simple logging without useEffect dependencies:
  console.log('Safe App loaded - connected:', connected)
  
  // Component logic...
}
```

**Key Points:**
- ❌ **Avoid useEffect with SDK dependencies** - causes infinite re-renders
- ✅ Use simple console.log for debugging
- ✅ Check `connected` state before SDK operations

### 3. Deployment Headers (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://app.safe.global https://*.safe.global;"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

**Key Points:**
- ❌ **Never use X-Frame-Options** - conflicts with iframe embedding
- ✅ Use CSP `frame-ancestors` for iframe control
- ✅ Enable CORS with `Access-Control-Allow-Origin: *`

### 4. Safe App Metadata (manifest.json)
```json
{
  "name": "Safe Message Tools",
  "description": "Sign and verify messages using Safe EIP-712 format",
  "version": "1.0.0",
  "iconPath": "logo.svg",
  "providedBy": {
    "name": "Safe Message Tools",
    "url": "https://github.com/your-repo"
  }
}
```

## 🔥 Critical SecurityError Debugging

### White Screen with SecurityError
**Symptom:** App loads a white screen inside Safe with SecurityError in console:
```
SecurityError: Failed to read a named property 'origin' from 'Location': 
Blocked a frame with origin "https://your-app.vercel.app" from accessing a cross-origin frame.
```

**Root Cause:** Attempting to access `window.parent.location.origin` or similar cross-origin properties from within Safe's iframe.

**❌ Code That Breaks Safe Apps:**
```tsx
// NEVER DO THIS - causes SecurityError that breaks entire app
console.log('Parent origin:', window.parent?.location?.origin)

// Also breaks:
const parentUrl = window.parent.location.href
const parentHost = window.parent.location.host
```

**✅ Safe Cross-Origin Diagnostics:**
```tsx
// Safe environment detection without SecurityError
console.log('🔗 Safe environment check:', {
  currentOrigin: window.location.origin,          // ✅ Safe
  inIframe: window !== window.parent,             // ✅ Safe  
  userAgent: navigator.userAgent.includes('Safe'), // ✅ Safe
  hasPostMessage: typeof window.postMessage === 'function', // ✅ Safe
  hasParentPostMessage: typeof window.parent?.postMessage === 'function' // ✅ Safe
})

// Safe message handling with try-catch
window.addEventListener('message', (event) => {
  try {
    console.log('📨 Message from parent:', {
      origin: event.origin,  // ✅ Safe - from event object
      data: event.data,
      source: event.source === window.parent ? 'parent' : 'other'
    })
  } catch (error) {
    console.log('⚠️ Message handling error (safe to ignore):', 
                error instanceof Error ? error.message : String(error))
  }
})
```

**Key Rules:**
- ❌ **Never access** `window.parent.location.*` properties
- ❌ **Never access** `window.parent.document.*` properties  
- ✅ **Always use** `event.origin` from message events instead
- ✅ **Always wrap** risky operations in try-catch blocks
- ✅ **Use** `window !== window.parent` to detect iframe context

### SecurityError Prevention Patterns

**❌ Dangerous:**
```tsx
// These ALL cause SecurityError in Safe iframes:
window.parent.location.origin
window.parent.location.href
window.parent.document.title
window.parent.history.length
```

**✅ Safe alternatives:**
```tsx
// Get parent info from message events:
window.addEventListener('message', (event) => {
  const parentOrigin = event.origin  // ✅ Safe
  const parentData = event.data      // ✅ Safe
})

// Detect iframe context safely:
const inIframe = window !== window.parent  // ✅ Safe
const hasParent = window.parent !== null   // ✅ Safe
```

## 🚨 Common Pitfalls

### 1. "The app doesn't support Safe App functionality"
**Causes:**
- Using React.StrictMode (infinite re-render loops)
- Wrong Safe SDK setup
- Missing SafeProvider wrapper
- Incorrect iframe headers

**Fix:**
- Remove React.StrictMode
- Use SafeProvider properly
- Check deployment headers

### 2. App Hangs During Loading
**Causes:**
- useEffect with SDK dependencies causing loops
- Complex initialization logic
- StrictMode double-invocation issues

**Fix:**
- Remove problematic useEffect hooks
- Simplify component initialization
- Remove StrictMode

### 3. Vercel 401 Authentication Issues
**Causes:**
- Account-level authentication enabled
- New deployments getting auth protection
- Wrong deployment settings

**Fix:**
- Use working deployment URL
- Check account settings
- Deploy to different service if needed

### 4. CORS/Iframe Embedding Blocked
**Causes:**
- Missing iframe headers
- Wrong X-Frame-Options settings
- Missing CORS headers

**Fix:**
- Add proper vercel.json configuration
- Use CSP instead of X-Frame-Options
- Enable CORS properly

## 🛠️ Development Workflow

### Local Development
```bash
cd safe-app
npm run dev  # Starts Vite dev server on :5173
```

### Building
```bash
cd safe-app
npm run build  # Creates dist/ folder
```

### Deployment
```bash
cd safe-app
npm run build
vercel --prod  # Deploy to Vercel
```

### Testing in Safe
1. Go to https://app.safe.global
2. Apps tab → Add custom app
3. Enter your deployment URL
4. App should load without errors

## 📋 Troubleshooting Checklist

When Safe App fails to load:

1. **Check for SecurityError first** - most common cause of white screen
   - Look for `SecurityError: Failed to read a named property` in console
   - Remove any `window.parent.location.*` access attempts
   - Wrap diagnostics in try-catch blocks

2. **Check browser console** for specific errors
3. **Verify deployment headers** with `curl -I <your-url>`
4. **Test iframe embedding** by checking `window.parent === window`
5. **Check Safe SDK logs** for connection status
6. **Verify manifest.json** is accessible at `/manifest.json`

### Common Error Messages

**SecurityError: Failed to read a named property 'origin' from 'Location'**
- **Symptom:** White screen, app won't load in Safe
- **Fix:** Remove all `window.parent.location.*` access attempts
- **Fix:** Wrap cross-origin operations in try-catch blocks
- **Fix:** Use `event.origin` from message events instead

**"The app doesn't support Safe App functionality"**
- Remove React.StrictMode
- Check SafeProvider setup
- Verify deployment headers

**"Access to fetch blocked by CORS policy"**
- Add CORS headers to vercel.json
- Check deployment authentication

**App hangs on loading**
- Remove useEffect with SDK dependencies
- Simplify initialization logic

**HTTP 401 Unauthorized**
- Deployment has authentication enabled
- Use working deployment URL
- Check Vercel account settings

## 🎯 Safe Message Signing Implementation

### EIP-712 Message Hash
```typescript
export function safeMessageHash(safeAddress: string, message: string, chainId: string): string {
  const domain = {
    chainId: parseInt(chainId),
    verifyingContract: safeAddress
  };

  const types = {
    SafeMessage: [
      { name: 'message', type: 'bytes' }
    ]
  };

  const value = {
    message: ethers.toUtf8Bytes(message)
  };

  return ethers.TypedDataEncoder.hash(domain, types, value);
}
```

### Safe Transaction for Message Signing
```typescript
const signMessage = async () => {
  const messageHash = safeMessageHash(safe.safeAddress, message, safe.chainId.toString());
  
  const txs = [{
    to: safe.safeAddress,
    value: '0',
    data: '0x' // Empty data for message signing
  }];

  const { safeTxHash } = await sdk.txs.send({ txs });
};
```

## 📦 Dependencies

### Core Dependencies
```json
{
  "@safe-global/safe-apps-react-sdk": "^4.7.0",
  "@safe-global/safe-apps-sdk": "^8.1.0",
  "ethers": "^6.8.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### Build Tools
```json
{
  "@vitejs/plugin-react": "^4.5.2",
  "typescript": "~5.8.3",
  "vite": "^7.0.0"
}
```

## 🔄 Known Working URLs

- **Production:** https://safe-message-cli-git-main-zscoles-projects.vercel.app (confirmed working)
- **Alternative:** https://safe-app-xi.vercel.app (confirmed working)
- **CLI tools:** Available in `cli/` directory

## 📖 Additional Resources

- [Safe Apps SDK Documentation](https://docs.safe.global/sdk/safe-apps)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1271 Standard](https://eips.ethereum.org/EIPS/eip-1271)

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repo>
   cd safe-message-cli/safe-app
   npm install
   ```

2. **Development:**
   ```bash
   npm run dev
   ```

3. **Production deployment:**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Add to Safe:**
   - Go to https://app.safe.global
   - Apps → Add custom app
   - Enter your deployment URL

## ⚠️ Critical Rules

1. **Never access window.parent.location properties** - causes SecurityError and white screen
2. **Never use React.StrictMode** with Safe Apps SDK
3. **Always wrap cross-origin operations in try-catch** to prevent app crashes
4. **Always check deployment headers** before adding to Safe
5. **Test locally first** before deploying
6. **Use working URL as reference** for troubleshooting
7. **Keep Safe SDK setup minimal** to avoid initialization issues

---

*This reference was created after 8+ hours of troubleshooting Safe Apps SDK, React.StrictMode, deployment issues, and SecurityError debugging. Follow these guidelines to avoid the same issues.* 