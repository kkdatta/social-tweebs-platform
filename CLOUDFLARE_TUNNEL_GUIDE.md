# Cloudflare Tunnel Setup Guide

This guide explains how to expose your local SocialTweebs development environment to the public internet using Cloudflare Tunnel.

## What is Cloudflare Tunnel?

Cloudflare Tunnel (formerly Argo Tunnel) creates a secure connection between your local development server and Cloudflare's edge network, allowing you to:

- ✅ Share your local app with anyone on the internet
- ✅ Test webhooks and integrations that require public URLs
- ✅ Demo your app to clients or team members
- ✅ Access your local dev environment from anywhere
- ✅ Get automatic HTTPS without certificates
- 🆓 Completely free (no Cloudflare account required)

## Installation

### macOS
```bash
brew install cloudflared
```

### Linux (Ubuntu/Debian)
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Windows
Download the latest release from:
https://github.com/cloudflare/cloudflared/releases/latest

## Usage

### Option 1: Start Everything with Tunnels (Recommended)

This starts both backend and frontend servers along with Cloudflare tunnels:

```bash
npm run dev:tunnel
```

or

```bash
./start-dev-with-tunnel.sh
```

**Output example:**
```
[backend] [Nest] Application is running on: http://localhost:3000
[frontend] ➜  Local:   http://localhost:5173/
[tunnel-api] https://random-word-1234.trycloudflare.com
[tunnel-web] https://random-word-5678.trycloudflare.com
```

### Option 2: Add Tunnels to Running Servers

If your servers are already running, you can add tunnels:

```bash
npm run tunnel
```

or

```bash
./tunnel-only.sh
```

### Option 3: Tunnel Specific Services

Backend API only:
```bash
npm run tunnel:backend
```

Frontend only:
```bash
npm run tunnel:frontend
```

## Configuration

### Step 1: Get Your Tunnel URLs

After starting the tunnel, you'll see output like:

```
[tunnel-api] 2026-01-25 16:30:22 | https://abc-xyz-1234.trycloudflare.com |
[tunnel-web] 2026-01-25 16:30:23 | https://def-uvw-5678.trycloudflare.com |
```

- `https://abc-xyz-1234.trycloudflare.com` → Backend API
- `https://def-uvw-5678.trycloudflare.com` → Frontend

### Step 2: Configure Frontend to Use Public API

Update `frontend/.env`:

```env
# Change from local URL
VITE_API_URL=http://localhost:3000

# To your tunnel URL (WITHOUT /api/v1)
VITE_API_URL=https://abc-xyz-1234.trycloudflare.com
```

### Step 3: Restart Frontend

```bash
# Stop the frontend (Ctrl+C) and restart:
cd frontend
npm run dev
```

Or if using the combined script, restart everything:

```bash
# Stop all (Ctrl+C) and restart:
npm run dev:tunnel
```

## Access Your Application

Now you can access your app from anywhere:

1. **Local Access:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

2. **Public Access:**
   - Frontend: https://def-uvw-5678.trycloudflare.com
   - Backend API: https://abc-xyz-1234.trycloudflare.com

Share the frontend URL with anyone to let them access your app!

## Important Notes

### URL Persistence

⚠️ **URLs change on every restart** - Cloudflare Tunnel generates new random URLs each time you start it.

If you need persistent URLs:
1. Create a free Cloudflare account
2. Run: `cloudflared tunnel login`
3. Create a named tunnel: `cloudflared tunnel create my-app`
4. Configure persistent domains in your Cloudflare dashboard

### Security Considerations

- 🔒 Your app is publicly accessible - anyone with the URL can access it
- 🔒 Ensure proper authentication is implemented
- 🔒 Don't expose sensitive data or admin panels
- 🔒 URLs are random and hard to guess, but not secret
- 🔒 Consider using environment-specific configs for development

### CORS Configuration

If you encounter CORS issues when accessing via tunnel:

1. Update `src/main.ts` to allow your tunnel domain:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://*.trycloudflare.com', // Allow all Cloudflare tunnels
  ],
  credentials: true,
});
```

## Use Cases

### 1. Testing with External Services

```bash
# Start tunnel
npm run dev:tunnel

# Use the backend tunnel URL as webhook endpoint
# Example: https://abc-xyz-1234.trycloudflare.com/api/v1/webhooks
```

### 2. Client Demos

```bash
# Start tunnel
npm run dev:tunnel

# Share frontend URL with client
# They can access it from anywhere
```

### 3. Mobile Testing

```bash
# Start tunnel
npm run dev:tunnel

# Open frontend URL on your phone
# Test responsive design and mobile features
```

### 4. Remote Development

```bash
# On your work computer:
npm run dev:tunnel

# Access from home using the tunnel URLs
```

## Troubleshooting

### Tunnel Connection Failed

```bash
# Check if cloudflared is installed
cloudflared --version

# Test basic tunnel
cloudflared tunnel --url http://localhost:3000
```

### API Calls Failing

1. Check that `VITE_API_URL` in `frontend/.env` matches your backend tunnel URL
2. Restart the frontend after changing `.env`
3. Check browser console for CORS errors
4. Verify backend is running on port 3000

### Tunnel URLs Not Showing

- Wait a few seconds after starting - tunnel establishment takes time
- Check terminal output for errors
- Ensure ports 3000 and 5173 are not blocked

### Performance Issues

- Cloudflare Tunnel adds ~100-200ms latency
- Best for testing/demos, not for development
- Use local URLs for day-to-day development

## Advanced Configuration

### Named Tunnels (Persistent URLs)

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create named tunnel
cloudflared tunnel create socialtweebs

# Run with named tunnel
cloudflared tunnel --config ~/.cloudflared/config.yml run socialtweebs
```

### Load Balancing

You can create multiple tunnels for the same service:

```bash
cloudflared tunnel --url http://localhost:3000 &
cloudflared tunnel --url http://localhost:3000 &
```

Cloudflare will automatically load balance between them.

## Support

For more information:
- Cloudflare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- GitHub Issues: https://github.com/cloudflare/cloudflared/issues

## Quick Reference

```bash
# Installation
brew install cloudflared                    # macOS

# Start everything with tunnels
npm run dev:tunnel                          # All services + tunnels
./start-dev-with-tunnel.sh                  # Alternative method

# Start tunnels for running servers
npm run tunnel                              # Both tunnels
npm run tunnel:backend                      # Backend only
npm run tunnel:frontend                     # Frontend only
./tunnel-only.sh                            # Alternative method

# Manual tunnel
cloudflared tunnel --url http://localhost:3000
cloudflared tunnel --url http://localhost:5173
```
