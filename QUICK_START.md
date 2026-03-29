# 🚀 SocialTweebs Quick Start Guide

Get your SocialTweebs development environment up and running in minutes!

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ Node.js (v18 or higher)
- ✅ PostgreSQL (running locally or accessible)
- ✅ Git

## 🎯 Three Ways to Start

### Option 1: Local Development Only (Recommended for Development)

Perfect for day-to-day development work. Everything runs locally on your machine.

```bash
./start-dev.sh
```

**What it does:**
- ✅ Starts backend on `http://localhost:3000`
- ✅ Starts frontend on `http://localhost:5173`
- ✅ Frontend automatically connects to local backend
- ✅ No internet required for API calls

**Access your app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/docs

---

### Option 2: With Public URLs (For Sharing & Testing)

Start everything with Cloudflare tunnels for public access. **Best for demos, testing, and sharing.**

```bash
./start-dev-with-tunnel.sh
```

**What it does:**
- ✅ Starts backend locally
- ✅ Creates public tunnel for backend
- ✅ Automatically updates frontend config to use public backend
- ✅ Starts frontend locally
- ✅ Creates public tunnel for frontend
- ✅ Everything is configured automatically!

**You'll get:**
```
🌐 PUBLIC ACCESS (share these URLs):
   Frontend:  https://your-random-url.trycloudflare.com
   Backend:   https://another-random-url.trycloudflare.com
```

**Perfect for:**
- 🎬 Demoing to clients
- 📱 Testing on mobile devices
- 🔗 Webhook integrations
- 👥 Sharing with team members
- 🌍 Accessing from anywhere

**Important:**
- URLs change on each restart (see Cloudflare Guide for persistent URLs)
- When you stop (Ctrl+C), config automatically resets to localhost
- Frontend automatically uses the public backend

---

### Option 3: Add Tunnels to Running Servers

If your servers are already running and you just want to add public URLs:

```bash
./tunnel-only.sh
```

**What it does:**
- ✅ Creates public tunnels for existing servers
- ✅ Shows you the URLs
- ✅ Provides instructions to update frontend config

**Manual configuration needed:**
After running this, you'll need to manually update `frontend/.env` with the backend tunnel URL and restart the frontend.

---

## 📦 First Time Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=socialtweebs

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRES_IN=30d

# App
PORT=3000
NODE_ENV=development
```

### 3. Set Up Database

```bash
# Create the database
createdb socialtweebs

# Run migrations (if any)
npm run typeorm migration:run
```

### 4. Start Development

Choose your preferred option from above:

```bash
# Local only
./start-dev.sh

# Or with public URLs
./start-dev-with-tunnel.sh
```

---

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Start Local Dev** | `./start-dev.sh` | Start backend + frontend locally |
| **Start with Tunnels** | `./start-dev-with-tunnel.sh` | Start everything with public URLs |
| **Add Tunnels Only** | `./tunnel-only.sh` | Add tunnels to running servers |
| **Backend Only** | `npm run start:dev` | Start backend only |
| **Frontend Only** | `npm run frontend:dev` | Start frontend only |
| **Build Backend** | `npm run build` | Build backend for production |
| **Build Frontend** | `npm run frontend:build` | Build frontend for production |

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (backend)
lsof -ti :3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti :5173 | xargs kill -9

# Then restart
./start-dev.sh
```

### Frontend Can't Connect to Backend

**Local Development:**
Check `frontend/.env` - it should be:
```env
VITE_API_URL=http://localhost:3000
```

**With Tunnels:**
Use `./start-dev-with-tunnel.sh` - it configures everything automatically!

### Tunnel URLs Not Working

1. **Install cloudflared:**
   ```bash
   brew install cloudflared  # macOS
   ```

2. **Check tunnel status:**
   ```bash
   ps aux | grep cloudflared
   ```

3. **Use the automatic script:**
   ```bash
   ./start-dev-with-tunnel.sh
   ```

### Database Connection Error

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify credentials in `.env`

3. Ensure database exists:
   ```bash
   createdb socialtweebs
   ```

---

## 📚 Additional Resources

- [Cloudflare Tunnel Guide](./CLOUDFLARE_TUNNEL_GUIDE.md) - Detailed tunnel setup
- [Database Design](./DATABASE_DESIGN.md) - Schema documentation
- [API Documentation](http://localhost:3000/docs) - Swagger docs (when backend is running)

---

## 💡 Pro Tips

### 1. Use Local for Daily Development
```bash
./start-dev.sh  # Faster, no internet needed
```

### 2. Use Tunnels for Demos
```bash
./start-dev-with-tunnel.sh  # Get public URLs automatically
```

### 3. Keep Multiple Terminals
- Terminal 1: Backend logs
- Terminal 2: Frontend logs  
- Terminal 3: Commands and testing

### 4. Watch for Hot Reload
Both backend and frontend support hot reload:
- Edit backend code → auto-restarts
- Edit frontend code → instant updates

### 5. Persistent Tunnel URLs
See [CLOUDFLARE_TUNNEL_GUIDE.md](./CLOUDFLARE_TUNNEL_GUIDE.md) for setting up named tunnels with persistent URLs.

---

## 🎉 You're Ready!

Now you can start developing:

```bash
# For local development
./start-dev.sh

# For sharing and demos
./start-dev-with-tunnel.sh
```

Happy coding! 🚀
