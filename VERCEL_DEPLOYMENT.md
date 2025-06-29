# Safe App Deployment on Vercel

Complete guide for deploying Safe Apps on Vercel while avoiding common authentication pitfalls.

## ⚠️ Critical Issue: Vercel Authentication Protection

**Problem:** New Vercel deployments sometimes automatically enable authentication protection, which breaks Safe Apps by showing a login page instead of the app.

**Symptoms:**
- App shows "Authentication Required" page instead of Safe App content
- Safe interface rejects the app with authentication errors
- URL redirects to `vercel.com/sso-api` instead of loading the app

## 🔧 Solution Strategies

### Strategy 1: Use Existing Working Deployments (Recommended)

If you already have a working Vercel deployment URL:

1. **Always deploy to the same project** instead of creating new ones
2. **Use `--prod` flag** to update the existing production deployment
3. **Keep the same domain** to preserve authentication settings

```bash
# Deploy to existing project (recommended)
cd safe-app
npm run build
npx vercel --prod --yes
```

### Strategy 2: Configure New Deployments Properly

For new Vercel projects, ensure proper configuration:

#### Step 1: Vercel Project Settings
1. Go to your Vercel dashboard
2. Navigate to Project Settings → General
3. **Disable "Password Protection"** if enabled
4. **Disable "Vercel Authentication"** if enabled
5. Set **"Framework Preset"** to "Vite" (for our setup)

#### Step 2: Required Headers Configuration

Ensure your `vercel.json` includes these headers:

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
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Critical:** Do NOT use `X-Frame-Options` - it conflicts with iframe embedding.

#### Step 3: Deploy with Specific Settings

```bash
# For new projects, be explicit about settings
npx vercel --prod --confirm --public
```

## 📋 Deployment Checklist

Before deploying a Safe App to Vercel:

- [ ] Check Vercel project settings for authentication
- [ ] Verify `vercel.json` has correct iframe headers
- [ ] Test manifest.json is accessible at `/manifest.json`
- [ ] Ensure no `X-Frame-Options` headers
- [ ] Build passes without errors (`npm run build`)
- [ ] Safe App works locally in iframe context

## 🧪 Testing Your Deployment

### 1. Basic Accessibility Test
```bash
curl -I https://your-app.vercel.app
```

**Good response:**
```
HTTP/2 200
content-type: text/html
```

**Bad response (auth issue):**
```
HTTP/2 302
location: https://vercel.com/sso-api?url=...
```

### 2. Manifest Test
```bash
curl https://your-app.vercel.app/manifest.json
```

Should return JSON, not an HTML login page.

### 3. Safe Integration Test
1. Go to https://app.safe.global
2. Navigate to "Apps" → "Add custom app"
3. Enter your Vercel URL
4. App should load without authentication prompts

## 🚨 Troubleshooting Guide

### Issue: "Authentication Required" Page

**Symptoms:**
- Vercel shows spinning auth page
- URL redirects to vercel.com/sso-api
- Safe rejects the app

**Solutions:**
1. **Check project settings** in Vercel dashboard
2. **Disable password protection** and authentication
3. **Deploy to existing working project** instead of creating new one
4. **Contact Vercel support** if auth persists on new projects

### Issue: "App doesn't support Safe App functionality"

**Symptoms:**
- Safe shows this error when adding the app
- App loads fine outside of Safe

**Solutions:**
1. **Check iframe headers** in vercel.json
2. **Remove X-Frame-Options** if present
3. **Verify CSP frame-ancestors** includes Safe domains
4. **Test with browser dev tools** iframe embedding

### Issue: CORS Errors

**Symptoms:**
- Console shows "blocked by CORS policy"
- App fails to load resources

**Solutions:**
1. **Add CORS headers** to vercel.json
2. **Set Access-Control-Allow-Origin** to "*"
3. **Check for conflicting headers**

## 🔄 Alternative Deployment Options

If Vercel authentication issues persist:

### Option 1: Netlify
```bash
# Deploy to Netlify instead
npm run build
npx netlify deploy --prod --dir=dist
```

Netlify configuration (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "frame-ancestors 'self' https://app.safe.global https://*.safe.global;"
    Access-Control-Allow-Origin = "*"
```

### Option 2: GitHub Pages
```bash
# Deploy to GitHub Pages
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

### Option 3: Railway
```bash
# Deploy to Railway
npm install -g @railway/cli
railway login
railway init
railway up
```

## ✅ Working Example

**Our successful deployment:**
- **URL:** https://safe-message-cli-git-main-zscoles-projects.vercel.app
- **Status:** Working without authentication issues
- **Strategy:** Deployed to existing project, not new deployment
- **Working Commit:** `b2a69d80dfc83b038312fdde56eb8a7daee9a63d` (final clean version)

## 📝 Best Practices

1. **Always test locally first** with iframe embedding
2. **Use existing Vercel projects** when possible
3. **Monitor for auth changes** in Vercel settings
4. **Keep backup deployment** on different platform
5. **Document working URLs** for future reference
6. **Test in actual Safe interface** before going live

## 🔗 Useful Commands

```bash
# Local development
npm run dev

# Build and test
npm run build
cd dist && python -m http.server 3000

# Deploy to existing Vercel project
npx vercel --prod --yes

# Check deployment status
curl -I https://your-app.vercel.app

# Test iframe embedding locally
echo '<iframe src="http://localhost:3000"></iframe>' > test.html
```

## 📚 Additional Resources

- [Safe Apps Documentation](https://docs.safe.global/sdk/safe-apps)
- [Vercel Headers Configuration](https://vercel.com/docs/concepts/projects/project-configuration#headers)
- [CSP frame-ancestors Directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)

---

*This guide was created after resolving Vercel authentication issues during Safe App deployment. Follow these steps to avoid similar problems.* 