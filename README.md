# SocialTweebs API

Social Influencer Analytics Platform API built with NestJS, TypeScript, and PostgreSQL.

📖 **[Quick Start Guide](./QUICK_START.md)** | 🌐 **[Cloudflare Tunnel Setup](./CLOUDFLARE_TUNNEL_GUIDE.md)**

## Features

- **Authentication**: Login, Signup, Password Reset, JWT tokens
- **Credit System**: Balance management, transactions, influencer unlocking
- **Profile Management**: User profile, preferences, account expiry
- **Role-based Access Control**: Super Admin, Admin, Sub-user hierarchy

## Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator & class-transformer

## Project Structure

```
src/
├── common/
│   ├── decorators/       # Custom decorators (@CurrentUser, @Roles)
│   ├── enums/            # Enums (UserRole, UserStatus, etc.)
│   └── guards/           # Auth guards (JwtAuthGuard, RolesGuard)
├── config/               # Configuration files
├── modules/
│   ├── auth/             # Authentication module
│   │   ├── dto/          # Login, Signup, Password Reset DTOs
│   │   ├── entities/     # Session, LoginHistory, etc.
│   │   ├── strategies/   # JWT strategy
│   │   └── auth.service.ts
│   ├── credits/          # Credit management module
│   │   ├── dto/          # Credit DTOs
│   │   ├── entities/     # CreditAccount, Transaction, etc.
│   │   └── credits.service.ts
│   ├── profile/          # User profile module
│   │   ├── dto/          # Profile DTOs
│   │   └── profile.service.ts
│   └── users/            # Users module
│       └── entities/     # User, UserPreferences
├── app.module.ts
└── main.ts
```

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd /path/to/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   API_PREFIX=api/v1

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=postgres
   DB_SCHEMA=zorbitads
   DB_SYNCHRONIZE=false
   DB_LOGGING=true

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d

   # Throttling
   THROTTLE_TTL=60000
   THROTTLE_LIMIT=100

   # Frontend URL
   FRONTEND_URL=http://localhost:3001
   ```

4. **Ensure database schema exists**
   
   The API expects the `zorbitads` schema with all tables already created.

## Running the Application

### Start Both Frontend and Backend Together

**Option 1: Using npm script (recommended)**
```bash
npm run dev
```

**Option 2: Using shell script**
```bash
./start-dev.sh
```

This will start:
- Backend API on `http://localhost:3000`
- Frontend on `http://localhost:5173`

### Start Backend Only

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Start Frontend Only

```bash
cd frontend
npm run dev
```

### Access via Public Internet (Cloudflare Tunnel)

You can expose your local development servers to the public internet using Cloudflare Tunnel for testing or sharing with others.

#### Prerequisites

Install `cloudflared` (Cloudflare Tunnel client):

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
Download from [GitHub Releases](https://github.com/cloudflare/cloudflared/releases/latest)

#### Usage Options

**Option 1: Start everything with tunnels (recommended)**
```bash
npm run dev:tunnel
```
or
```bash
./start-dev-with-tunnel.sh
```

**Option 2: Add tunnels to already running servers**
```bash
npm run tunnel
```
or
```bash
./tunnel-only.sh
```

**Option 3: Tunnel specific service**
```bash
npm run tunnel:backend   # Only backend API
npm run tunnel:frontend  # Only frontend
```

#### What You'll Get

After starting the tunnel, you'll see public URLs like:
```
https://random-word-1234.trycloudflare.com  → Backend API
https://random-word-5678.trycloudflare.com  → Frontend
```

These URLs are:
- ✅ Publicly accessible from anywhere
- ✅ HTTPS enabled by default
- ✅ Free (no account required)
- ⚠️ Temporary (URLs change each time)

**Important:** When accessing via public URL, update `frontend/.env`:
```env
VITE_API_URL=https://your-backend-tunnel-url.trycloudflare.com
```
Then restart the frontend.

📖 **For detailed setup and troubleshooting, see [CLOUDFLARE_TUNNEL_GUIDE.md](./CLOUDFLARE_TUNNEL_GUIDE.md)**

## API Documentation

Once the application is running, access Swagger documentation at:
```
http://localhost:3000/docs
```

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | User login | No |
| POST | `/signup` | Register new user | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/refresh-token` | Refresh access token | No |
| POST | `/logout` | Logout user | Yes |

### Profile (`/api/v1/profile`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user profile | Yes |
| PUT | `/` | Update profile | Yes |
| PUT | `/password` | Change password | Yes |
| GET | `/preferences` | Get notification preferences | Yes |
| PUT | `/preferences` | Update preferences | Yes |
| GET | `/account-expiry` | Get account expiry info | Yes |

### Credits (`/api/v1/credits`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/balance` | Get credit balance | Yes |
| POST | `/allocate` | Allocate credits (Admin) | Yes (Admin) |
| POST | `/deduct` | Deduct credits | Yes |
| POST | `/influencer/unblur` | Unblur influencers | Yes |
| GET | `/influencer/check/:id` | Check if unlocked | Yes |
| GET | `/transactions` | Get transaction history | Yes |
| GET | `/usage-chart` | Get usage chart data | Yes |

## Credit System Rules

| Action | Credit Cost |
|--------|-------------|
| Influencer Unblur | 0.04 credits per profile |
| Influencer Insight | 1 credit per profile |
| Influencer Export | 0.04 credits per profile |
| Report Generation | 1 credit per report |
| Report Refresh | 1 credit per refresh |

## User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Platform owner, full access |
| ADMIN | Client/Entity, can manage sub-users |
| SUB_USER | Team member with limited access |

## Database Schema

The application uses the `zorbitads` schema with the following tables:

- `users` - User accounts
- `credit_accounts` - Credit balances and validity
- `module_balances` - Module-specific credits
- `credit_transactions` - Transaction history
- `unlocked_influencers` - Tracked unlocked profiles
- `signup_requests` - Pending registrations
- `password_reset_tokens` - Password reset tokens
- `user_preferences` - Notification preferences
- `login_history` - Login attempts
- `user_sessions` - Active sessions

## Scripts

```bash
# Development (Local)
npm run dev           # Start both frontend and backend (recommended)
npm run start:dev     # Start backend only in development mode
npm run frontend:dev  # Start frontend only

# Development (Public Access via Cloudflare Tunnel)
npm run dev:tunnel    # Start both servers + create public URLs
npm run tunnel        # Create tunnels for already running servers
npm run tunnel:backend  # Tunnel backend only
npm run tunnel:frontend # Tunnel frontend only

# Build
npm run build         # Build backend for production
npm run frontend:build # Build frontend for production

# Production
npm run start:prod    # Start backend in production mode

# Code Quality
npm run lint          # Lint code
npm run test          # Run tests
npm run test:cov      # Run tests with coverage
```

## License

MIT
