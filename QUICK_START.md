# SocialTweebs - Quick Start Guide

## 🚀 Local Development

Start both frontend and backend servers on your local machine:

```bash
npm run dev
```

Access your app:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/docs

## 🌐 Public Access (Cloudflare Tunnel)

Share your local app with the world:

### 1. Install Cloudflare Tunnel (one-time)

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### 2. Start with Tunnel

```bash
npm run dev:tunnel
```

You'll see public URLs like:
```
[tunnel-api] https://abc-xyz-1234.trycloudflare.com  ← Backend
[tunnel-web] https://def-uvw-5678.trycloudflare.com  ← Frontend
```

### 3. Configure Frontend

Edit `frontend/.env`:
```env
VITE_API_URL=https://abc-xyz-1234.trycloudflare.com
```
(Use YOUR backend tunnel URL from step 2)

### 4. Restart Frontend

```bash
# Press Ctrl+C to stop, then:
npm run dev:tunnel
```

### 5. Share Your App 🎉

Share the frontend URL (e.g., `https://def-uvw-5678.trycloudflare.com`) with anyone!

They can access your local app from anywhere in the world.

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development (recommended) |
| `npm run dev:tunnel` | Local + public URLs via tunnel |
| `npm run tunnel` | Add tunnels to running servers |
| `npm run tunnel:backend` | Tunnel backend API only |
| `npm run tunnel:frontend` | Tunnel frontend only |
| `./start-dev.sh` | Alternative: start local servers |
| `./start-dev-with-tunnel.sh` | Alternative: start with tunnels |

## 🔧 Environment Setup

### Backend (.env in root)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
DB_SCHEMA=zorbitads
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (frontend/.env)
```env
# For local development
VITE_API_URL=http://localhost:3000

# For public access (use your tunnel URL)
VITE_API_URL=https://your-tunnel-url.trycloudflare.com
```

## 📚 Documentation

- **[README.md](./README.md)** - Full project documentation
- **[CLOUDFLARE_TUNNEL_GUIDE.md](./CLOUDFLARE_TUNNEL_GUIDE.md)** - Detailed tunnel setup and troubleshooting
- **[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)** - Database schema and design
- **[docs/HLD.md](./docs/HLD.md)** - High-level design
- **[docs/LLD.md](./docs/LLD.md)** - Low-level design

## 🆘 Troubleshooting

### Servers not starting?
```bash
# Check if ports are in use
lsof -i:3000  # Backend
lsof -i:5173  # Frontend

# Kill processes if needed
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Tunnel not working?
```bash
# Verify cloudflared is installed
cloudflared --version

# Test manual tunnel
cloudflared tunnel --url http://localhost:3000
```

### Frontend can't reach backend via tunnel?
1. Check `frontend/.env` has correct tunnel URL
2. Ensure URL doesn't end with `/api/v1` (just the base URL)
3. Restart frontend after changing `.env`
4. Check browser console for errors

### Database connection issues?
1. Ensure PostgreSQL is running
2. Check credentials in root `.env`
3. Verify `zorbitads` schema exists
4. Check network/firewall settings

## 💡 Tips

- **Development**: Use `npm run dev` for faster local development
- **Demos**: Use `npm run dev:tunnel` when sharing with others
- **URLs Change**: Tunnel URLs are temporary and change on restart
- **HTTPS**: Tunnel URLs automatically get HTTPS
- **No Account Needed**: Cloudflare Tunnel is free, no signup required

## 🔗 Quick Links

- API Documentation: http://localhost:3000/docs (when running)
- Cloudflare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- GitHub: [Your Repository URL]

---

**Need help?** Check the detailed guides or create an issue on GitHub.
