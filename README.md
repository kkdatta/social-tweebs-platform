# SocialTweebs API

Social Influencer Analytics Platform API built with NestJS, TypeScript, and PostgreSQL.

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

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

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
npm run start:dev     # Start in development mode
npm run build         # Build for production
npm run start:prod    # Start in production mode
npm run lint          # Lint code
npm run test          # Run tests
npm run test:cov      # Run tests with coverage
```

## License

MIT
