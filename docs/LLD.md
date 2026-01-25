# SocialTweebs - Low-Level Design (LLD)

## 1. Module Structure

### 1.1 Backend Module Organization

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators
│   ├── guards/               # Auth guards
│   ├── enums/                # Shared enums
│   ├── filters/              # Exception filters
│   └── interceptors/         # Request/Response interceptors
├── config/                    # Configuration
│   └── database.config.ts    # DB configuration
└── modules/
    ├── auth/                 # Authentication module
    ├── profile/              # User profile module
    ├── discovery/            # Influencer discovery module
    ├── credits/              # Credit management module
    └── team/                 # Team management module
```

### 1.2 Frontend Structure

```
frontend/src/
├── main.tsx                  # Application entry
├── App.tsx                   # Root component
├── index.css                 # Global styles
├── vite-env.d.ts            # Vite types
├── components/              # Reusable components
│   ├── layout/              # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── ui/                  # UI components
├── context/                 # React contexts
│   └── AuthContext.tsx      # Auth state management
├── pages/                   # Page components
│   ├── auth/                # Auth pages
│   ├── discovery/           # Discovery pages
│   ├── insights/            # Insights pages
│   └── team/                # Team pages
├── services/                # API services
│   └── api.ts               # Axios API client
├── types/                   # TypeScript types
│   └── index.ts             # Type definitions
└── utils/                   # Utility functions
```

## 2. Database Schema Details

### 2.1 Core Tables

#### users
```sql
CREATE TABLE zorbitads.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    business_name VARCHAR(255),
    country VARCHAR(100),
    role zorbitads.user_role NOT NULL DEFAULT 'SUB_USER',
    internal_role_type zorbitads.internal_role_type,
    status zorbitads.user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID REFERENCES zorbitads.users(id),
    parent_user_id UUID REFERENCES zorbitads.users(id)
);

-- Indexes
CREATE INDEX idx_users_email ON zorbitads.users(email);
CREATE INDEX idx_users_role ON zorbitads.users(role);
CREATE INDEX idx_users_status ON zorbitads.users(status);
CREATE INDEX idx_users_parent ON zorbitads.users(parent_user_id);
```

#### credit_accounts
```sql
CREATE TABLE zorbitads.credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES zorbitads.users(id) ON DELETE CASCADE,
    unified_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    validity_start TIMESTAMP NOT NULL,
    validity_end TIMESTAMP NOT NULL,
    validity_notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_credit_accounts_user ON zorbitads.credit_accounts(user_id);
CREATE INDEX idx_credit_accounts_validity ON zorbitads.credit_accounts(validity_end);
```

#### credit_transactions
```sql
CREATE TABLE zorbitads.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_account_id UUID NOT NULL REFERENCES zorbitads.credit_accounts(id),
    amount DECIMAL(12,2) NOT NULL,
    transaction_type zorbitads.credit_transaction_type NOT NULL,
    module_type zorbitads.module_type,
    reference_id VARCHAR(255),
    comment TEXT,
    performed_by_id UUID REFERENCES zorbitads.users(id),
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_credit_tx_account ON zorbitads.credit_transactions(credit_account_id);
CREATE INDEX idx_credit_tx_type ON zorbitads.credit_transactions(transaction_type);
CREATE INDEX idx_credit_tx_created ON zorbitads.credit_transactions(created_at);
```

#### cached_influencer_profiles
```sql
CREATE TABLE zorbitads.cached_influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform zorbitads.social_platform NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_picture_url TEXT,
    biography TEXT,
    follower_count BIGINT,
    following_count BIGINT,
    post_count INTEGER,
    engagement_rate DECIMAL(8,4),
    avg_likes BIGINT,
    avg_comments BIGINT,
    avg_views BIGINT,
    avg_reels_plays BIGINT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_business_account BOOLEAN,
    account_type zorbitads.account_type,
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    language VARCHAR(50),
    category zorbitads.influencer_category,
    audience_credibility DECIMAL(5,4),
    followers_growth_rate DECIMAL(8,4),
    has_sponsored_posts BOOLEAN,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url TEXT,
    last_post_date TIMESTAMP,
    data_fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modash_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, platform_user_id)
);

-- Indexes for search optimization
CREATE INDEX idx_profiles_platform ON zorbitads.cached_influencer_profiles(platform);
CREATE INDEX idx_profiles_followers ON zorbitads.cached_influencer_profiles(follower_count);
CREATE INDEX idx_profiles_engagement ON zorbitads.cached_influencer_profiles(engagement_rate);
CREATE INDEX idx_profiles_country ON zorbitads.cached_influencer_profiles(location_country);
CREATE INDEX idx_profiles_category ON zorbitads.cached_influencer_profiles(category);
CREATE INDEX idx_profiles_verified ON zorbitads.cached_influencer_profiles(is_verified);
CREATE INDEX idx_profiles_username ON zorbitads.cached_influencer_profiles(username);
CREATE INDEX idx_profiles_fullname ON zorbitads.cached_influencer_profiles(full_name);
CREATE INDEX idx_profiles_composite ON zorbitads.cached_influencer_profiles(platform, location_country, category);
```

#### unlocked_influencer_profiles
```sql
CREATE TABLE zorbitads.unlocked_influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    profile_id UUID NOT NULL REFERENCES zorbitads.cached_influencer_profiles(id),
    platform zorbitads.social_platform NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    credits_used DECIMAL(10,2) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform, platform_user_id)
);

-- Indexes
CREATE INDEX idx_unlocked_user ON zorbitads.unlocked_influencer_profiles(user_id);
CREATE INDEX idx_unlocked_platform ON zorbitads.unlocked_influencer_profiles(platform);
```

### 2.2 Enums

```sql
-- User roles
CREATE TYPE zorbitads.user_role AS ENUM (
    'SUPER_ADMIN',
    'ADMIN', 
    'SUB_USER'
);

-- User status
CREATE TYPE zorbitads.user_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'LOCKED',
    'SUSPENDED',
    'EXPIRED'
);

-- Social platforms
CREATE TYPE zorbitads.social_platform AS ENUM (
    'INSTAGRAM',
    'YOUTUBE',
    'TIKTOK',
    'LINKEDIN'
);

-- Account types
CREATE TYPE zorbitads.account_type AS ENUM (
    'REGULAR',
    'BUSINESS',
    'CREATOR'
);

-- Influencer categories
CREATE TYPE zorbitads.influencer_category AS ENUM (
    'FASHION',
    'BEAUTY',
    'LIFESTYLE',
    'TRAVEL',
    'FOOD',
    'FITNESS',
    'TECH',
    'GAMING',
    'ENTERTAINMENT',
    'EDUCATION',
    'BUSINESS',
    'OTHER'
);

-- Credit transaction types
CREATE TYPE zorbitads.credit_transaction_type AS ENUM (
    'CREDIT',
    'DEBIT'
);

-- Module types
CREATE TYPE zorbitads.module_type AS ENUM (
    'DISCOVERY',
    'INSIGHTS',
    'CAMPAIGN',
    'EXPORT'
);

-- Feature names
CREATE TYPE zorbitads.feature_name AS ENUM (
    'INFLUENCER_DISCOVERY',
    'INFLUENCER_INSIGHTS',
    'PAID_COLLABORATION',
    'AUDIENCE_OVERLAP',
    'INFLUENCER_TIE_BREAKER',
    'PAID_COMPARISON',
    'CUSTOM_ER_CALCULATOR',
    'SOCIAL_SENTIMENTS',
    'INFLUENCER_COLLAB_CHECK',
    'MENTION_TRACKING',
    'CAMPAIGN_TRACKING',
    'INFLUENCERS_GROUP',
    'COMPETITION_ANALYSIS'
);
```

## 3. API Specifications

### 3.1 Authentication APIs

#### POST /api/v1/auth/login
```typescript
// Request
interface LoginDto {
  email: string;      // Required, valid email
  password: string;   // Required, min 8 chars
}

// Response (200 OK)
interface LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    status: UserStatus;
  };
  creditBalance: number;
  accountExpiresAt: string;
  daysRemaining: number;
}

// Errors
// 401 - Invalid credentials
// 403 - Account locked/suspended
```

#### POST /api/v1/auth/signup
```typescript
// Request
interface SignupDto {
  fullName: string;           // Required
  email: string;              // Required, valid email
  phoneNumber: string;        // Required, 10-15 digits
  businessName: string;       // Required
  campaignFrequency: '10-100' | '100-1000' | '1000+';  // Required
  message?: string;           // Optional
  password: string;           // Required, min 8 chars
  confirmPassword: string;    // Required, must match password
}

// Response (201 Created)
interface SignupResponseDto {
  success: boolean;
  message: string;
}
```

### 3.2 Discovery APIs

#### POST /api/v1/discovery/search
```typescript
// Request
interface SearchInfluencersDto {
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'LINKEDIN';
  influencer?: {
    followers?: { min?: number; max?: number };
    engagementRate?: number;  // Minimum value (e.g., 0.02 for 2%)
    engagements?: { min?: number; max?: number };
    reelsPlays?: { min?: number; max?: number };
    location?: number[];      // Array of location IDs
    language?: string;        // Language code
    gender?: 'MALE' | 'FEMALE' | 'KNOWN' | 'UNKNOWN';
    age?: { min?: number; max?: number };
    lastposted?: number;      // Days since last post
    bio?: string;             // Bio search term
    keywords?: string;        // Caption keywords
    textTags?: Array<{ type: 'hashtag' | 'mention'; value: string }>;
    relevance?: string[];     // Lookalike topics/users
    isVerified?: boolean;
    accountTypes?: number[];  // 1=Regular, 2=Business, 3=Creator
    hasSponsoredPosts?: boolean;
    hasContactDetails?: Array<{ contactType: string; filterAction?: 'must' | 'should' | 'not' }>;
    brands?: number[];
    interests?: number[];
    followersGrowthRate?: {
      interval: 'i1month' | 'i2months' | 'i3months' | 'i4months' | 'i5months' | 'i6months';
      value: number;
      operator: 'gte' | 'gt' | 'lt' | 'lte';
    };
    username?: string;
    categories?: string[];
  };
  audience?: {
    location?: Array<{ id: number; weight?: number }>;
    gender?: { id: 'MALE' | 'FEMALE'; weight?: number };
    age?: Array<{ id: '13-17' | '18-24' | '25-34' | '35-44' | '45-64' | '65-'; weight?: number }>;
    interests?: Array<{ id: number; weight?: number }>;
    language?: { id: string; weight?: number };
    credibility?: number;
  };
  sort?: {
    field: 'followers' | 'engagements' | 'engagementRate' | 'relevance' | 'followersGrowth' | 'reelsPlays';
    direction: 'asc' | 'desc';
    value?: number;
  };
  page?: number;
  calculationMethod?: 'median' | 'average';
}

// Response (200 OK)
interface SearchResponseDto {
  totalAvailable: number;
  page: number;
  results: InfluencerProfileDto[];
  creditsUsed: number;
  remainingBalance: number;
  isExactMatch?: boolean;
}

interface InfluencerProfileDto {
  id: string;
  platform: string;
  platformUserId: string;
  username: string;
  fullName?: string;
  profilePictureUrl?: string;
  biography?: string;
  followerCount: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  avgReelsPlays?: number;
  isVerified: boolean;
  locationCountry?: string;
  category?: string;
  followersGrowthRate?: number;
  hasSponsoredPosts?: boolean;
  isBlurred: boolean;
  rankPosition: number;
  match?: {
    influencer?: any;
    audience?: any;
  };
}
```

#### POST /api/v1/discovery/unblur
```typescript
// Request
interface UnblurInfluencersDto {
  profileIds: string[];       // UUIDs of profiles to unblur
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'LINKEDIN';
}

// Response (200 OK)
interface UnblurResponseDto {
  success: boolean;
  unblurredCount: number;
  creditsUsed: number;
  remainingBalance: number;
  profiles: InfluencerProfileDto[];
}
```

### 3.3 Credits APIs

#### GET /api/v1/credits/balance
```typescript
// Response (200 OK)
interface GetBalanceResponseDto {
  unifiedBalance: number;
  validityStart: string;
  validityEnd: string;
  daysRemaining: number;
  isExpired: boolean;
}
```

#### GET /api/v1/credits/transactions
```typescript
// Query Parameters
interface GetTransactionsQueryDto {
  page?: number;      // Default: 1
  limit?: number;     // Default: 20, Max: 100
  type?: 'CREDIT' | 'DEBIT';
  moduleType?: 'DISCOVERY' | 'INSIGHTS' | 'CAMPAIGN' | 'EXPORT';
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
}

// Response (200 OK)
interface TransactionsResponseDto {
  data: CreditTransactionDto[];
  total: number;
  page: number;
  limit: number;
}

interface CreditTransactionDto {
  id: string;
  amount: number;
  transactionType: 'CREDIT' | 'DEBIT';
  moduleType?: string;
  comment?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}
```

### 3.4 Team APIs

#### POST /api/v1/team/members
```typescript
// Request
interface CreateTeamMemberDto {
  name: string;
  email: string;
  password: string;
  roleType: 'CLIENT' | 'BUSINESS_TEAM' | 'FINANCE_TEAM' | 'SALES_TEAM' | 'SUPPORT_TEAM' | 'TECHNICAL_TEAM';
  validityStart: string;    // ISO date
  validityEnd: string;      // ISO date
  phone?: string;
  country?: string;
  enabledFeatures?: string[];
  enabledActions?: string[];
  initialCredits?: number;
  creditComment?: string;
  validityNotificationEnabled?: boolean;
}

// Response (201 Created)
interface TeamMemberResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  role: string;
  internalRoleType: string;
  status: string;
  creditBalance: number;
  validityStart: string;
  validityEnd: string;
  daysUntilExpiry: number;
  lastActiveAt: string;
  createdAt: string;
  enabledFeatures: string[];
  enabledActions: string[];
}
```

## 4. Service Layer Details

### 4.1 AuthService

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: Repository<User>,
    private creditsService: CreditsService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    // 1. Find user by email
    // 2. Verify password with bcrypt
    // 3. Check user status (active, not locked/suspended)
    // 4. Generate JWT token
    // 5. Update last_login_at
    // 6. Get credit balance
    // 7. Return response with token and user data
  }

  async signup(dto: SignupDto): Promise<SignupResponseDto> {
    // 1. Check if email already exists
    // 2. Hash password with bcrypt (cost 12)
    // 3. Create user with PENDING_VERIFICATION status
    // 4. Create credit account with 0 balance
    // 5. Send verification email (future)
    // 6. Return success message
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    // 1. Find user by ID from JWT payload
    // 2. Verify user is active
    // 3. Return user or throw UnauthorizedException
  }
}
```

### 4.2 DiscoveryService

```typescript
@Injectable()
export class DiscoveryService {
  constructor(
    private profilesRepository: Repository<InfluencerProfile>,
    private searchesRepository: Repository<DiscoverySearch>,
    private creditsService: CreditsService,
    private modashService: ModashService,
  ) {}

  async searchInfluencers(
    userId: string,
    dto: SearchInfluencersDto
  ): Promise<SearchResponseDto> {
    // 1. Build query from filters
    // 2. Search local database first
    // 3. If insufficient results, query Modash API
    // 4. Merge and deduplicate results
    // 5. Apply blurring for unlocked profiles
    // 6. Calculate and deduct credits
    // 7. Log search in history
    // 8. Return paginated results
  }

  async unblurProfiles(
    userId: string,
    dto: UnblurInfluencersDto
  ): Promise<UnblurResponseDto> {
    // 1. Find profiles by IDs
    // 2. Filter out already unlocked profiles
    // 3. Calculate credits needed
    // 4. Check user has sufficient credits
    // 5. Deduct credits
    // 6. Create unlocked_profiles records
    // 7. Return full profile data
  }

  private buildQueryFromFilters(
    queryBuilder: SelectQueryBuilder<InfluencerProfile>,
    filters: InfluencerFiltersDto
  ): void {
    // Apply each filter conditionally
    if (filters.followers?.min) {
      queryBuilder.andWhere('profile.followerCount >= :minFollowers', {
        minFollowers: filters.followers.min,
      });
    }
    // ... more filters
  }
}
```

### 4.3 CreditsService

```typescript
@Injectable()
export class CreditsService {
  constructor(
    private accountsRepository: Repository<CreditAccount>,
    private transactionsRepository: Repository<CreditTransaction>,
  ) {}

  async getBalance(userId: string): Promise<GetBalanceResponseDto> {
    // 1. Find credit account for user
    // 2. Calculate days remaining
    // 3. Check if expired
    // 4. Return balance info
  }

  async deductCredits(
    userId: string,
    amount: number,
    moduleType: ModuleType,
    referenceId?: string
  ): Promise<DeductCreditsResponseDto> {
    // 1. Get credit account
    // 2. Check sufficient balance
    // 3. Check account not expired
    // 4. Create transaction record
    // 5. Update account balance
    // 6. Return new balance
  }

  async allocateCredits(
    targetUserId: string,
    amount: number,
    performedById: string,
    comment?: string
  ): Promise<void> {
    // 1. Verify performer has permission
    // 2. Get target user's credit account
    // 3. Create CREDIT transaction
    // 4. Update balance
  }
}
```

## 5. Frontend Component Details

### 5.1 AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user and token from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { accessToken, user: userData, creditBalance } = response;
    
    const userWithCredits = { ...userData, credits: creditBalance || 0 };
    
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userWithCredits));
    
    setToken(accessToken);
    setUser(userWithCredits);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 5.2 API Service Structure

```typescript
// Axios instance with interceptors
const api = axios.create({
  baseURL: '',  // Relative URL for Vite proxy
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API modules
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/api/v1/auth/login', { email, password }).then(r => r.data),
  signup: (data: SignupDto) => 
    api.post('/api/v1/auth/signup', data).then(r => r.data),
};

export const discoveryApi = {
  search: (filters: SearchFilters) => 
    api.post('/api/v1/discovery/search', filters).then(r => ({
      total: r.data.totalAvailable || 0,
      page: r.data.page || 0,
      influencers: r.data.results || [],
      creditsUsed: r.data.creditsUsed || 0,
    })),
  unblur: (profileIds: string[], platform: string) =>
    api.post('/api/v1/discovery/unblur', { profileIds, platform }).then(r => r.data),
};
```

## 6. Security Implementation

### 6.1 JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.authService.validateUser(payload);
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
```

### 6.2 Role Guard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage in controller
@Post('allocate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
async allocateCredits(@Body() dto: AllocateCreditsDto) {
  // Only SUPER_ADMIN and ADMIN can allocate credits
}
```

## 7. Error Handling

### 7.1 Backend Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### 7.2 Frontend Error Handling

```typescript
// In API service
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    
    // Show toast notification (if using a toast library)
    // toast.error(message);
    
    // Handle specific status codes
    switch (error.response?.status) {
      case 401:
        // Redirect to login
        break;
      case 403:
        // Show access denied message
        break;
      case 429:
        // Rate limit exceeded
        break;
    }
    
    return Promise.reject(error);
  }
);
```

## 8. Caching Strategy

### 8.1 Influencer Profile Caching

```typescript
// Cache TTL: 24 hours for profile data
const PROFILE_CACHE_TTL = 24 * 60 * 60 * 1000;

async function getCachedProfile(profileId: string): Promise<InfluencerProfile | null> {
  // 1. Check local database cache
  const cached = await profilesRepository.findOne({
    where: { id: profileId },
    select: ['id', 'dataFetchedAt', /* other fields */]
  });
  
  if (cached) {
    const age = Date.now() - new Date(cached.dataFetchedAt).getTime();
    if (age < PROFILE_CACHE_TTL) {
      return cached;
    }
  }
  
  // 2. Cache miss or stale - fetch from Modash
  const fresh = await modashService.getProfile(profileId);
  
  // 3. Update cache
  await profilesRepository.upsert(fresh, ['platform', 'platformUserId']);
  
  return fresh;
}
```

## 9. Credit Pricing Model

```typescript
const CREDIT_COSTS = {
  DISCOVERY: {
    SEARCH: 0.01,           // Per search query
    UNBLUR: 0.04,           // Per profile unblurred
  },
  INSIGHTS: {
    BASIC: 0.10,            // Basic insights
    FULL_REPORT: 0.50,      // Full PDF report
    REFRESH: 0.25,          // Refresh stale data
  },
  EXPORT: {
    CSV: 0.02,              // Per profile exported
    XLSX: 0.02,
  },
};

function calculateSearchCredits(resultsCount: number): number {
  return CREDIT_COSTS.DISCOVERY.SEARCH;
}

function calculateUnblurCredits(profileCount: number): number {
  return profileCount * CREDIT_COSTS.DISCOVERY.UNBLUR;
}
```

## 10. Testing Strategy

### 10.1 Unit Tests
```typescript
describe('CreditsService', () => {
  let service: CreditsService;
  let accountsRepo: MockRepository<CreditAccount>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: getRepositoryToken(CreditAccount), useClass: MockRepository },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
  });

  it('should deduct credits successfully', async () => {
    const account = { id: '1', unifiedBalance: 100 };
    accountsRepo.findOne.mockResolvedValue(account);
    
    const result = await service.deductCredits('user1', 10, ModuleType.DISCOVERY);
    
    expect(result.remainingBalance).toBe(90);
  });

  it('should throw error on insufficient credits', async () => {
    const account = { id: '1', unifiedBalance: 5 };
    accountsRepo.findOne.mockResolvedValue(account);
    
    await expect(
      service.deductCredits('user1', 10, ModuleType.DISCOVERY)
    ).rejects.toThrow(BadRequestException);
  });
});
```

### 10.2 E2E Tests
```typescript
describe('Discovery (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    authToken = loginResponse.body.accessToken;
  });

  it('/api/v1/discovery/search (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/discovery/search')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ platform: 'INSTAGRAM', influencer: { followers: { min: 10000 } } })
      .expect(200)
      .expect((res) => {
        expect(res.body.results).toBeDefined();
        expect(Array.isArray(res.body.results)).toBe(true);
      });
  });
});
```

---

## 11. Influencer Insights Module

### 11.1 Database Schema

#### system_config
```sql
CREATE TABLE zorbitads.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default cache TTL
INSERT INTO zorbitads.system_config (config_key, config_value, data_type, description)
VALUES ('INSIGHT_CACHE_TTL_DAYS', '7', 'number', 'Days before insight data needs refresh from Modash');
```

#### influencer_insights
```sql
CREATE TABLE zorbitads.influencer_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    profile_id UUID REFERENCES zorbitads.cached_influencer_profiles(id),
    platform zorbitads.social_platform NOT NULL,
    platform_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    profile_picture_url TEXT,
    bio TEXT,
    
    -- Basic Stats
    follower_count BIGINT,
    following_count BIGINT,
    post_count INTEGER,
    engagement_rate DECIMAL(8,4),
    avg_likes BIGINT,
    avg_comments BIGINT,
    avg_views BIGINT,
    avg_reel_views BIGINT,
    avg_reel_likes BIGINT,
    avg_reel_comments BIGINT,
    brand_post_er DECIMAL(8,4),
    
    -- Location & Verification
    location_country VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Credibility
    audience_credibility DECIMAL(5,4),
    notable_followers_pct DECIMAL(5,2),
    
    -- JSONB for complex data
    audience_data JSONB,
    engagement_data JSONB,
    growth_data JSONB,
    lookalikes_data JSONB,
    brand_affinity_data JSONB,
    interests_data JSONB,
    recent_posts JSONB,
    recent_reels JSONB,
    
    -- Timestamps
    credits_used DECIMAL(10,2) DEFAULT 1,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modash_fetched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, platform, platform_user_id)
);

CREATE INDEX idx_insights_user ON zorbitads.influencer_insights(user_id);
CREATE INDEX idx_insights_platform ON zorbitads.influencer_insights(platform);
CREATE INDEX idx_insights_refreshed ON zorbitads.influencer_insights(last_refreshed_at);
```

### 11.2 API Endpoints

#### GET /api/v1/insights
```typescript
// Query: platform?, search?, page?, limit?
// Response
{
  "data": [{
    "id": "uuid",
    "platform": "INSTAGRAM",
    "username": "handle",
    "fullName": "Name",
    "followerCount": 1500000,
    "unlockedAt": "2026-01-15T10:00:00Z"
  }],
  "total": 50,
  "page": 1
}
```

#### POST /api/v1/insights/search
```typescript
// Request
{ "platform": "INSTAGRAM", "username": "influencer_handle" }

// Response (new insight)
{
  "success": true,
  "isNew": true,
  "creditsUsed": 1,
  "remainingBalance": 99.0,
  "insight": { /* full insight object */ }
}

// Response (cached - fresh)
{
  "success": true,
  "isNew": false,
  "creditsUsed": 0,
  "insight": { /* cached insight */ }
}
```

#### POST /api/v1/insights/:id/refresh
```typescript
// Forces refresh from Modash, costs 1 credit
// Response
{
  "success": true,
  "creditsUsed": 1,
  "insight": { /* refreshed data */ }
}
```

### 11.3 InsightsService Implementation

```typescript
@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(InfluencerInsight)
    private insightsRepo: Repository<InfluencerInsight>,
    @InjectRepository(SystemConfig)
    private configRepo: Repository<SystemConfig>,
    private creditsService: CreditsService,
    private modashService: ModashService,
  ) {}

  async searchAndUnlock(userId: string, dto: SearchInsightDto) {
    // 1. Check existing insight
    const existing = await this.findExisting(userId, dto.platform, dto.username);

    if (existing) {
      const isFresh = await this.isDataFresh(existing.lastRefreshedAt);
      
      if (isFresh) {
        return { isNew: false, creditsUsed: 0, insight: existing };
      }
      
      // Auto-refresh stale data (free for already unlocked)
      const refreshed = await this.refreshFromModash(existing);
      return { isNew: false, creditsUsed: 0, insight: refreshed };
    }

    // 2. New insight - verify credits
    await this.creditsService.verifyAndDeduct(userId, 1, ModuleType.INSIGHTS);

    // 3. Fetch from Modash
    const modashData = await this.modashService.getProfileReport(dto.platform, dto.username);

    // 4. Store and return
    const insight = await this.createFromModash(userId, dto.platform, modashData);
    return { isNew: true, creditsUsed: 1, insight };
  }

  private async isDataFresh(lastRefreshedAt: Date): Promise<boolean> {
    const config = await this.configRepo.findOne({
      where: { configKey: 'INSIGHT_CACHE_TTL_DAYS', isActive: true }
    });
    
    const ttlDays = config ? parseInt(config.configValue) : 7;
    const daysSinceRefresh = this.daysBetween(lastRefreshedAt, new Date());
    
    return daysSinceRefresh <= ttlDays;
  }

  private daysBetween(d1: Date, d2: Date): number {
    return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

### 11.4 Modash API Integration

```typescript
@Injectable()
export class ModashService {
  private readonly baseUrl = 'https://api.modash.io/v1';

  async getProfileReport(platform: string, userId: string): Promise<ModashReport> {
    const url = `${this.baseUrl}/${platform.toLowerCase()}/profile/${userId}/report`;
    
    const response = await this.http.get(url, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    return response.data;
  }
}
```

### 11.5 Cache Decision Flow

```
isDataFresh(lastRefreshedAt):
  │
  ├─ Get TTL from system_config (default: 7)
  │
  ├─ Calculate daysSinceRefresh
  │
  └─ Return daysSinceRefresh <= TTL
```

### 11.6 Credit Deduction Rules

| Scenario | Credits | Logic |
|----------|---------|-------|
| New insight | 1 | No existing record |
| Cached fresh | 0 | Record exists, data < TTL |
| Cached stale | 0 | Record exists, data > TTL (auto-refresh) |
| Manual refresh | 1 | User clicks refresh button |

### 11.7 Insights Unit Tests

```typescript
describe('InsightsService', () => {
  it('should return cached insight without credit charge', async () => {
    // Setup: insight exists and is fresh (< 7 days)
    mockInsightRepo.findOne.mockResolvedValue({
      lastRefreshedAt: new Date() // Today
    });
    
    const result = await service.searchAndUnlock(userId, dto);
    
    expect(result.creditsUsed).toBe(0);
    expect(creditsService.deduct).not.toHaveBeenCalled();
  });

  it('should fetch from Modash for new insight', async () => {
    // Setup: no existing insight
    mockInsightRepo.findOne.mockResolvedValue(null);
    
    const result = await service.searchAndUnlock(userId, dto);
    
    expect(result.creditsUsed).toBe(1);
    expect(modashService.getProfileReport).toHaveBeenCalled();
  });

  it('should auto-refresh stale data without credit charge', async () => {
    // Setup: insight exists but is stale (> 7 days)
    mockInsightRepo.findOne.mockResolvedValue({
      lastRefreshedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    });
    
    const result = await service.searchAndUnlock(userId, dto);
    
    expect(result.creditsUsed).toBe(0); // Auto-refresh is free
    expect(modashService.getProfileReport).toHaveBeenCalled();
  });
});
```

---

## 12. Module: Campaign Tracking

### 12.1 Database Schema

#### campaigns
```sql
CREATE TABLE zorbitads.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL, -- INSTAGRAM, YOUTUBE, TIKTOK, MULTI
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED
    objective VARCHAR(100), -- BRAND_AWARENESS, ENGAGEMENT, CONVERSIONS, REACH, TRAFFIC, SALES
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    hashtags TEXT[], -- Array of campaign hashtags
    mentions TEXT[], -- Array of campaign mentions
    target_audience JSONB, -- Demographics, interests, locations
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_campaigns_owner ON zorbitads.campaigns(owner_id);
CREATE INDEX idx_campaigns_status ON zorbitads.campaigns(status);
CREATE INDEX idx_campaigns_platform ON zorbitads.campaigns(platform);
```

#### campaign_influencers
```sql
CREATE TABLE zorbitads.campaign_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES zorbitads.campaigns(id) ON DELETE CASCADE,
    influencer_profile_id UUID REFERENCES zorbitads.cached_influencer_profiles(id),
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    follower_count INTEGER,
    status VARCHAR(50) DEFAULT 'INVITED', -- INVITED, CONFIRMED, DECLINED, ACTIVE, COMPLETED
    budget_allocated DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID
    payment_amount DECIMAL(10, 2),
    contract_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, SIGNED, REJECTED
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_campaign_influencers_campaign ON zorbitads.campaign_influencers(campaign_id);
```

#### campaign_deliverables
```sql
CREATE TABLE zorbitads.campaign_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES zorbitads.campaigns(id) ON DELETE CASCADE,
    campaign_influencer_id UUID REFERENCES zorbitads.campaign_influencers(id) ON DELETE CASCADE,
    deliverable_type VARCHAR(50) NOT NULL, -- POST, STORY, REEL, VIDEO, CAROUSEL
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED, PUBLISHED
    content_url TEXT,
    post_id VARCHAR(255), -- Platform-specific post ID
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_deliverables_campaign ON zorbitads.campaign_deliverables(campaign_id);
```

#### campaign_metrics
```sql
CREATE TABLE zorbitads.campaign_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES zorbitads.campaigns(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES zorbitads.campaign_deliverables(id) ON DELETE CASCADE,
    campaign_influencer_id UUID REFERENCES zorbitads.campaign_influencers(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 2),
    cost_per_engagement DECIMAL(10, 4),
    cost_per_click DECIMAL(10, 4),
    cost_per_impression DECIMAL(10, 6)
);

CREATE INDEX idx_campaign_metrics_campaign ON zorbitads.campaign_metrics(campaign_id);
```

#### campaign_shares
```sql
CREATE TABLE zorbitads.campaign_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES zorbitads.campaigns(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW', -- VIEW, EDIT, ADMIN
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, shared_with_user_id)
);
```

### 12.2 Backend TypeScript Entities

#### Campaign Entity
```typescript
@Entity({ name: 'campaigns', schema: 'zorbitads' })
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: CampaignStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  objective?: CampaignObjective;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget?: number;

  @Column({ length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'text', array: true, nullable: true })
  hashtags?: string[];

  @Column({ type: 'text', array: true, nullable: true })
  mentions?: string[];

  @Column({ name: 'target_audience', type: 'jsonb', nullable: true })
  targetAudience?: Record<string, any>;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => CampaignInfluencer, (inf) => inf.campaign)
  influencers: CampaignInfluencer[];

  @OneToMany(() => CampaignDeliverable, (del) => del.campaign)
  deliverables: CampaignDeliverable[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 12.3 Service Methods

#### Create Campaign
```typescript
async createCampaign(userId: string, dto: CreateCampaignDto): Promise<Campaign> {
  // 1. Deduct credits
  await this.creditsService.deductCredits(userId, {
    actionType: ActionType.REPORT_GENERATION,
    quantity: CREDIT_PER_CAMPAIGN,
    module: ModuleType.CAMPAIGN_TRACKING,
    resourceId: 'new-campaign',
    resourceType: 'campaign_creation',
  });

  // 2. Create campaign entity
  const campaign = new Campaign();
  campaign.name = dto.name;
  campaign.platform = dto.platform;
  campaign.ownerId = userId;
  campaign.createdById = userId;
  campaign.status = CampaignStatus.DRAFT;
  // ... set other fields

  // 3. Save and return
  return this.campaignRepo.save(campaign);
}
```

#### Get Campaigns with Access Control
```typescript
async getCampaigns(userId: string, filters: CampaignFilterDto): Promise<CampaignListResponseDto> {
  const queryBuilder = this.campaignRepo.createQueryBuilder('campaign')
    .leftJoinAndSelect('campaign.owner', 'owner');

  // Tab-based filtering
  if (filters.tab === 'created_by_me') {
    queryBuilder.where('campaign.createdById = :userId', { userId });
  } else if (filters.tab === 'created_by_team') {
    const teamUserIds = await this.getTeamUserIds(userId);
    queryBuilder.where('campaign.createdById IN (:...teamUserIds)', { teamUserIds })
      .andWhere('campaign.createdById != :userId', { userId });
  } else if (filters.tab === 'shared_with_me') {
    queryBuilder.innerJoin('campaign.shares', 'share', 
      'share.sharedWithUserId = :userId', { userId });
  }

  // Apply status/platform/search filters
  // ...

  return { campaigns, total, page, hasMore };
}
```

#### Check Campaign Access
```typescript
private async checkCampaignAccess(
  userId: string, 
  campaign: Campaign, 
  level: 'view' | 'edit' | 'admin' = 'view'
): Promise<void> {
  // Owner has full access
  if (campaign.ownerId === userId || campaign.createdById === userId) return;

  // Check share permissions
  const share = await this.shareRepo.findOne({
    where: { campaignId: campaign.id, sharedWithUserId: userId },
  });

  if (!share) {
    // Check team hierarchy
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const owner = await this.userRepo.findOne({ where: { id: campaign.ownerId } });
    
    if (user?.parentId === owner?.id || owner?.parentId === user?.id) {
      if (level !== 'view') throw new ForbiddenException('Edit access required');
      return;
    }
    throw new ForbiddenException('No access to this campaign');
  }

  // Check permission level
  if (level === 'admin' && share.permissionLevel !== SharePermission.ADMIN) {
    throw new ForbiddenException('Admin access required');
  }
  if (level === 'edit' && share.permissionLevel === SharePermission.VIEW) {
    throw new ForbiddenException('Edit access required');
  }
}
```

### 12.4 Controller Endpoints

```typescript
@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  async createCampaign(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
  ) { ... }

  @Get()
  @ApiOperation({ summary: 'Get campaigns list with filters' })
  @ApiQuery({ name: 'tab', enum: ['created_by_me', 'created_by_team', 'shared_with_me'] })
  async getCampaigns(
    @CurrentUser('id') userId: string,
    @Query() filters: CampaignFilterDto,
  ) { ... }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get campaign dashboard statistics' })
  async getDashboardStats(@CurrentUser('id') userId: string) { ... }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  async getCampaignById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) { ... }

  // ... more endpoints for influencers, deliverables, metrics, sharing
}
```

### 12.5 Frontend Components

#### CampaignsListPage
- Dashboard stats cards (campaigns, influencers, deliverables, budget)
- Tab navigation (Created by Me, Created by Team, Shared with Me)
- Filter controls (status, platform, search)
- Campaign table with actions (view, edit, delete)
- Pagination

#### CampaignDetailPage
- Campaign header with status badge and actions
- Section tabs (Overview, Influencers, Deliverables, Metrics)
- Metrics cards (impressions, reach, likes, engagement)
- Influencer list with status management
- Deliverable list with workflow status
- Budget utilization progress bar

#### CampaignFormPage
- Campaign name and description
- Platform and objective selection
- Date range picker
- Budget and currency input
- Hashtags and mentions input
- Create/Update button with credit confirmation

### 12.6 Metrics Calculation

```typescript
async getCampaignMetrics(campaignId: string): Promise<CampaignMetricsSummary> {
  const metrics = await this.metricRepo.find({ where: { campaignId } });
  const influencers = await this.influencerRepo.find({ where: { campaignId } });
  const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });

  const totalSpent = influencers.reduce((sum, inf) => 
    sum + (Number(inf.paymentAmount) || 0), 0);

  return {
    totalImpressions: metrics.reduce((sum, m) => sum + (m.impressions || 0), 0),
    totalReach: metrics.reduce((sum, m) => sum + (m.reach || 0), 0),
    totalLikes: metrics.reduce((sum, m) => sum + (m.likes || 0), 0),
    totalComments: metrics.reduce((sum, m) => sum + (m.comments || 0), 0),
    totalShares: metrics.reduce((sum, m) => sum + (m.shares || 0), 0),
    totalViews: metrics.reduce((sum, m) => sum + (m.views || 0), 0),
    totalClicks: metrics.reduce((sum, m) => sum + (m.clicks || 0), 0),
    avgEngagementRate: metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + (Number(m.engagementRate) || 0), 0) / metrics.length 
      : 0,
    totalSpent,
    budgetUtilization: campaign?.budget > 0 
      ? (totalSpent / Number(campaign.budget)) * 100 
      : 0,
  };
}
```

### 12.7 API Integration (Frontend)

```typescript
export const campaignsApi = {
  list: async (params?: CampaignFilters): Promise<CampaignListResponse> => {
    const { data } = await api.get('/api/v1/campaigns', { params });
    return data;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/api/v1/campaigns/dashboard');
    return data;
  },

  getById: async (id: string): Promise<CampaignDetail> => {
    const { data } = await api.get(`/api/v1/campaigns/${id}`);
    return data;
  },

  create: async (campaignData: CreateCampaignDto): Promise<CreateCampaignResponse> => {
    const { data } = await api.post('/api/v1/campaigns', campaignData);
    return data;
  },

  update: async (id: string, updateData: UpdateCampaignDto): Promise<UpdateResponse> => {
    const { data } = await api.patch(`/api/v1/campaigns/${id}`, updateData);
    return data;
  },

  // ... more API methods
};
```

---

## 13. Module: FAQs & Static Content

### 13.1 Database Schema

#### faq_categories
```sql
CREATE TABLE zorbitads.faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### faqs
```sql
CREATE TABLE zorbitads.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES zorbitads.faq_categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### static_content
```sql
CREATE TABLE zorbitads.static_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 13.2 Backend Module Structure

```
src/modules/content/
├── content.module.ts
├── content.controller.ts
├── content.service.ts
├── dto/
│   ├── content.dto.ts
│   └── index.ts
└── entities/
    ├── faq.entity.ts
    └── index.ts
```

### 13.3 Service Methods

```typescript
@Injectable()
export class ContentService {
  // Get all FAQs grouped by category
  async getAllFaqs(): Promise<FaqListResponseDto>
  
  // Get FAQ categories with counts
  async getFaqCategories(): Promise<FaqCategoryWithCountDto[]>
  
  // Get FAQs by category slug
  async getFaqsByCategory(slug: string): Promise<FaqCategory>
  
  // Search FAQs by keyword
  async searchFaqs(query: string): Promise<Faq[]>
  
  // Get Privacy Policy
  async getPrivacyPolicy(): Promise<StaticContentDto>
  
  // Get Terms & Conditions
  async getTermsConditions(): Promise<StaticContentDto>
}
```

### 13.4 Frontend Components

#### FaqPage
- Category tabs for navigation
- Search bar with real-time search
- Expandable FAQ accordion
- Contact support section

#### PrivacyPolicyPage
- Section-based content display
- Last updated date
- Table of contents (auto-generated from sections)

#### TermsConditionsPage
- Section-based content display
- Last updated date
- Agreement notice

### 13.5 API Client (Frontend)

```typescript
export const contentApi = {
  getAllFaqs: async () => api.get('/api/v1/content/faqs'),
  getFaqCategories: async () => api.get('/api/v1/content/faqs/categories'),
  getFaqsByCategory: async (slug) => api.get(`/api/v1/content/faqs/category/${slug}`),
  searchFaqs: async (query) => api.get('/api/v1/content/faqs/search', { params: { q: query } }),
  getPrivacyPolicy: async () => api.get('/api/v1/content/privacy-policy'),
  getTermsConditions: async () => api.get('/api/v1/content/terms-conditions'),
};
```

### 13.6 FAQ Data Summary

| Category | Questions |
|----------|-----------|
| General | 5 |
| Influencer Discovery | 14 |
| Influencer Insights | 23 |
| **Total** | **42** |

---

## 14. Module: Audience Overlap

### 14.1 Database Schema

```sql
-- Audience Overlap Reports
CREATE TABLE zorbitads.audience_overlap_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled',
    platform VARCHAR(50) NOT NULL, -- INSTAGRAM, YOUTUBE
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    
    -- Calculated metrics
    total_followers INTEGER DEFAULT 0,
    unique_followers INTEGER DEFAULT 0,
    overlapping_followers INTEGER DEFAULT 0,
    overlap_percentage DECIMAL(5, 2),
    unique_percentage DECIMAL(5, 2),
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Processing
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Report Influencers
CREATE TABLE zorbitads.audience_overlap_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES zorbitads.audience_overlap_reports(id) ON DELETE CASCADE,
    influencer_profile_id UUID,
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    profile_picture_url TEXT,
    follower_count INTEGER DEFAULT 0,
    
    -- Individual metrics
    unique_followers INTEGER DEFAULT 0,
    unique_percentage DECIMAL(5, 2),
    overlapping_followers INTEGER DEFAULT 0,
    overlapping_percentage DECIMAL(5, 2),
    
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Shares
CREATE TABLE zorbitads.audience_overlap_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES zorbitads.audience_overlap_reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, shared_with_user_id)
);
```

### 14.2 TypeORM Entities

```typescript
// OverlapReportStatus Enum
export enum OverlapReportStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// AudienceOverlapReport Entity
@Entity({ name: 'audience_overlap_reports', schema: 'zorbitads' })
export class AudienceOverlapReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ type: 'varchar', length: 50, default: OverlapReportStatus.PENDING })
  status: OverlapReportStatus;

  @Column({ name: 'total_followers', type: 'int', default: 0 })
  totalFollowers: number;

  @Column({ name: 'unique_followers', type: 'int', default: 0 })
  uniqueFollowers: number;

  @Column({ name: 'overlapping_followers', type: 'int', default: 0 })
  overlappingFollowers: number;

  @Column({ name: 'overlap_percentage', type: 'decimal', nullable: true })
  overlapPercentage?: number;

  @Column({ name: 'unique_percentage', type: 'decimal', nullable: true })
  uniquePercentage?: number;

  // ... relationships and timestamps
}
```

### 14.3 Service Methods

```typescript
@Injectable()
export class AudienceOverlapService {
  // Create new overlap report
  async createReport(userId: string, dto: CreateOverlapReportDto): Promise<Report>
  
  // Get reports with filters
  async getReports(userId: string, filters: OverlapReportFilterDto): Promise<ReportList>
  
  // Get report by ID
  async getReportById(userId: string, reportId: string): Promise<ReportDetail>
  
  // Update report (title, visibility)
  async updateReport(userId: string, reportId: string, dto: UpdateDto): Promise<Report>
  
  // Delete report
  async deleteReport(userId: string, reportId: string): Promise<void>
  
  // Retry failed report
  async retryReport(userId: string, reportId: string): Promise<Report>
  
  // Share report
  async shareReport(userId: string, reportId: string, dto: ShareDto): Promise<ShareUrl>
  
  // Get dashboard statistics
  async getDashboardStats(userId: string): Promise<DashboardStats>
  
  // Process report (background job simulation)
  private async processReport(reportId: string): Promise<void>
}
```

### 14.4 API Controller Endpoints

```typescript
@Controller('audience-overlap')
export class AudienceOverlapController {
  // POST /audience-overlap - Create report
  @Post() createReport()
  
  // GET /audience-overlap - List reports
  @Get() getReports()
  
  // GET /audience-overlap/dashboard - Dashboard stats
  @Get('dashboard') getDashboardStats()
  
  // GET /audience-overlap/:id - Report detail
  @Get(':id') getReportById()
  
  // PATCH /audience-overlap/:id - Update report
  @Patch(':id') updateReport()
  
  // DELETE /audience-overlap/:id - Delete report
  @Delete(':id') deleteReport()
  
  // POST /audience-overlap/:id/retry - Retry report
  @Post(':id/retry') retryReport()
  
  // POST /audience-overlap/:id/share - Share report
  @Post(':id/share') shareReport()
  
  // GET /audience-overlap/shared/:token - Public access
  @Get('shared/:token') getSharedReport()
}
```

### 14.5 Frontend Components

#### AudienceOverlapListPage
- Dashboard statistics cards
- Filter controls (platform, status, created by, search)
- Reports table with pagination
- Actions: View, Retry, Delete

#### AudienceOverlapDetailPage
- Report header with title editing
- Status badge with actions
- Summary cards (Total, Unique, Overlap followers)
- Overlap visualization (Venn diagram)
- Influencer comparison table
- Share functionality

#### AudienceOverlapCreatePage
- Platform selection (Instagram/YouTube)
- Influencer search and selection (2-10)
- Selected influencers list
- Credit cost confirmation

### 14.6 Frontend API Client

```typescript
export const audienceOverlapApi = {
  list: async (params) => api.get('/api/v1/audience-overlap', { params }),
  getDashboard: async () => api.get('/api/v1/audience-overlap/dashboard'),
  getById: async (id) => api.get(`/api/v1/audience-overlap/${id}`),
  create: async (data) => api.post('/api/v1/audience-overlap', data),
  update: async (id, data) => api.patch(`/api/v1/audience-overlap/${id}`, data),
  delete: async (id) => api.delete(`/api/v1/audience-overlap/${id}`),
  retry: async (id) => api.post(`/api/v1/audience-overlap/${id}/retry`),
  share: async (id, data) => api.post(`/api/v1/audience-overlap/${id}/share`, data),
};
```

### 14.7 Sample Data

| Report | Platform | Status | Overlap % | Influencers |
|--------|----------|--------|-----------|-------------|
| Fashion Influencers Q1 Analysis | INSTAGRAM | COMPLETED | 26.00% | 3 |
| Travel Bloggers Audience Analysis | INSTAGRAM | COMPLETED | 28.89% | 3 |
| Fitness Gurus Overlap Study | INSTAGRAM | COMPLETED | 22.58% | 3 |
| Tech Reviewers Analysis | YOUTUBE | IN_PROCESS | - | 2 |
| Untitled | INSTAGRAM | PENDING | - | 2 |
| Gaming Streamers Overlap | YOUTUBE | FAILED | - | 2 |
| Beauty Influencers Q1 2026 | INSTAGRAM | COMPLETED | 23.68% | 3 |

---

## 15. Module: Custom ER Calculator

### 15.1 Database Schema

```sql
-- Custom ER Reports
CREATE TABLE zorbitads.custom_er_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Influencer info
    influencer_profile_id UUID,
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    influencer_avatar_url TEXT,
    follower_count INTEGER DEFAULT 0,
    platform VARCHAR(50) NOT NULL,
    
    -- Report parameters
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    
    -- All Posts Metrics
    all_posts_count INTEGER DEFAULT 0,
    all_likes_count BIGINT DEFAULT 0,
    all_views_count BIGINT DEFAULT 0,
    all_comments_count BIGINT DEFAULT 0,
    all_shares_count BIGINT DEFAULT 0,
    all_avg_engagement_rate DECIMAL(8, 4),
    all_engagement_views_rate DECIMAL(8, 4),
    
    -- Sponsored Posts Metrics
    sponsored_posts_count INTEGER DEFAULT 0,
    sponsored_likes_count BIGINT DEFAULT 0,
    sponsored_views_count BIGINT DEFAULT 0,
    sponsored_comments_count BIGINT DEFAULT 0,
    sponsored_shares_count BIGINT DEFAULT 0,
    sponsored_avg_engagement_rate DECIMAL(8, 4),
    sponsored_engagement_views_rate DECIMAL(8, 4),
    has_sponsored_posts BOOLEAN DEFAULT FALSE,
    
    -- Ownership & Sharing
    owner_id UUID NOT NULL,
    created_by UUID NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Custom ER Report Posts
CREATE TABLE zorbitads.custom_er_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES zorbitads.custom_er_reports(id) ON DELETE CASCADE,
    
    post_id VARCHAR(255),
    post_url TEXT,
    post_type VARCHAR(50), -- IMAGE, VIDEO, REEL, CAROUSEL
    thumbnail_url TEXT,
    description TEXT,
    hashtags TEXT[],
    mentions TEXT[],
    
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8, 4),
    
    is_sponsored BOOLEAN DEFAULT FALSE,
    post_date DATE NOT NULL
);
```

### 15.2 TypeORM Entities

```typescript
enum CustomErReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

enum PostType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  REEL = 'REEL',
  CAROUSEL = 'CAROUSEL',
}
```

### 15.3 Service Methods

```typescript
@Injectable()
export class CustomErService {
  // Create new ER report (FREE)
  async createReport(userId: string, dto: CreateCustomErReportDto)
  
  // Get reports with filters
  async getReports(userId: string, filters: FilterDto)
  
  // Get report by ID
  async getReportById(userId: string, reportId: string)
  
  // Get posts for a report
  async getReportPosts(userId: string, reportId: string, sponsoredOnly: boolean)
  
  // Update report visibility
  async updateReport(userId: string, reportId: string, dto: UpdateDto)
  
  // Delete report
  async deleteReport(userId: string, reportId: string)
  
  // Share report
  async shareReport(userId: string, reportId: string, dto: ShareDto)
  
  // Process report (background)
  private async processReport(reportId: string)
}
```

### 15.4 API Controller

```typescript
@Controller('custom-er')
export class CustomErController {
  POST / - Create report
  GET / - List reports
  GET /dashboard - Stats
  GET /:id - Report detail
  GET /:id/posts - Report posts
  PATCH /:id - Update
  DELETE /:id - Delete
  POST /:id/share - Share
  GET /shared/:token - Public access
}
```

### 15.5 Frontend Components

#### CustomErListPage
- Dashboard stats (6 cards)
- Filters (platform, status, createdBy, search)
- Reports table with pagination
- Actions: View, Delete

#### CustomErDetailPage
- Header with influencer info
- Date range display
- All Posts metrics section
- Sponsored Posts metrics section (conditional)
- Toggle for sponsored only
- Post cards grid

#### CustomErCreatePage
- Platform selection
- Influencer search
- Date range picker (max 1 year)
- Free badge display

### 15.6 Sample Data

| Report | Influencer | Date Range | Posts | Status |
|--------|------------|------------|-------|--------|
| 1 | Liam Smith | Dec 2025 | 45 | COMPLETED |
| 2 | Olivia Smith | Nov-Dec 2025 | 32 | COMPLETED |
| 3 | Ava Smith | Jan 2026 | 28 | COMPLETED |
| 4 | Sophia Smith | Dec-Jan | 0 | PROCESSING |
| 5 | James Smith | Oct-Dec 2025 | 0 | PENDING |
| 6 | Isabella Smith | Sep-Nov 2025 | 0 | FAILED |

---

## 16. Module: Social Sentiments

### 16.1 Database Schema

```sql
-- Sentiment Reports
CREATE TABLE zorbitads.sentiment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled',
    report_type VARCHAR(50) NOT NULL, -- POST, PROFILE
    platform VARCHAR(50) NOT NULL, -- INSTAGRAM, TIKTOK
    target_url TEXT NOT NULL,
    influencer_name VARCHAR(255),
    influencer_username VARCHAR(255),
    influencer_avatar_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    overall_sentiment_score DECIMAL(5, 2),
    positive_percentage DECIMAL(5, 2),
    neutral_percentage DECIMAL(5, 2),
    negative_percentage DECIMAL(5, 2),
    deep_brand_analysis BOOLEAN DEFAULT FALSE,
    brand_name VARCHAR(255),
    brand_username VARCHAR(255),
    product_name VARCHAR(255),
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Sentiment Posts
CREATE TABLE zorbitads.sentiment_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.sentiment_reports(id) ON DELETE CASCADE,
    post_id VARCHAR(255),
    post_url TEXT,
    thumbnail_url TEXT,
    description TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8, 4),
    sentiment_score DECIMAL(5, 2),
    positive_percentage DECIMAL(5, 2),
    neutral_percentage DECIMAL(5, 2),
    negative_percentage DECIMAL(5, 2),
    comments_analyzed INTEGER DEFAULT 0,
    post_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sentiment Emotions
CREATE TABLE zorbitads.sentiment_emotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.sentiment_reports(id) ON DELETE CASCADE,
    post_id UUID REFERENCES zorbitads.sentiment_posts(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    count INTEGER DEFAULT 0
);

-- Sentiment Word Cloud
CREATE TABLE zorbitads.sentiment_wordcloud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.sentiment_reports(id) ON DELETE CASCADE,
    post_id UUID REFERENCES zorbitads.sentiment_posts(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    frequency INTEGER NOT NULL,
    sentiment VARCHAR(20)
);

-- Sentiment Shares
CREATE TABLE zorbitads.sentiment_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.sentiment_reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, shared_with_user_id)
);
```

### 16.2 TypeORM Entities

```typescript
export enum SentimentReportStatus {
  PENDING = 'PENDING',
  AGGREGATING = 'AGGREGATING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ReportType {
  POST = 'POST',
  PROFILE = 'PROFILE',
}

@Entity({ name: 'sentiment_reports', schema: 'zorbitads' })
export class SentimentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled' })
  title: string;

  @Column({ name: 'report_type', type: 'varchar', length: 50 })
  reportType: ReportType;

  @OneToMany(() => SentimentPost, (post) => post.report)
  posts: SentimentPost[];

  @OneToMany(() => SentimentEmotion, (emotion) => emotion.report)
  emotions: SentimentEmotion[];

  @OneToMany(() => SentimentWordCloud, (word) => word.report)
  wordCloud: SentimentWordCloud[];
}
```

### 16.3 API Controller

```typescript
@Controller('sentiments')
export class SentimentsController {
  POST / - Create report(s), 1 credit per URL
  GET / - List reports with filters
  GET /dashboard - Dashboard statistics
  GET /:id - Report details
  PATCH /:id - Update title/visibility
  DELETE /:id - Delete report
  POST /bulk-delete - Bulk delete
  POST /:id/share - Share report
  GET /shared/:token - Public access
}
```

### 16.4 Frontend Components

#### SentimentsListPage
- Dashboard stats cards (7 metrics)
- Filters (platform, reportType, status, createdBy, search)
- Reports table with checkbox selection
- Bulk delete functionality
- Pagination

#### SentimentsCreatePage
- Platform selection (Instagram/TikTok)
- Report type selection (Post/Profile)
- Multiple URLs toggle
- URL input fields (up to 10)
- Deep brand analysis toggle
- Credit cost confirmation

#### SentimentsDetailPage
- Report header with title editing
- Sentiment score cards
- Sentiment distribution chart
- Emotions distribution chart
- Word cloud visualization
- Posts list with metrics
- Share functionality

### 16.5 Sample Data

| Report | Influencer | Type | Platform | Status | Score |
|--------|------------|------|----------|--------|-------|
| Fashion Post | fashion_star | POST | INSTAGRAM | COMPLETED | 78.5% |
| Travel Profile | travel_star_2 | PROFILE | INSTAGRAM | COMPLETED | 85.2% |
| Product Launch | tech_reviewer | POST | INSTAGRAM | COMPLETED | 42.3% |
| Beauty Campaign | beauty_guru | POST | INSTAGRAM | IN_PROCESS | - |
| Fitness Profile | fitness_pro | PROFILE | INSTAGRAM | AGGREGATING | - |
| Food Blog | food_blogger | POST | INSTAGRAM | PENDING | - |

---

## 17. Module: Influencer Collab Check

### 17.1 Database Schema

```sql
-- Collab Check Reports
CREATE TABLE zorbitads.collab_check_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled',
    platform VARCHAR(50) NOT NULL, -- INSTAGRAM, TIKTOK
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    time_period VARCHAR(50) NOT NULL, -- 1_MONTH, 3_MONTHS, 6_MONTHS, 1_YEAR
    queries TEXT[], -- Array of search keywords/hashtags/mentions
    
    -- Aggregated metrics
    total_posts INTEGER DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_shares BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8, 4),
    total_followers BIGINT DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    credits_used INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Collab Check Influencers
CREATE TABLE zorbitads.collab_check_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.collab_check_reports(id) ON DELETE CASCADE,
    
    influencer_profile_id UUID,
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    profile_picture_url TEXT,
    follower_count INTEGER DEFAULT 0,
    
    -- Individual metrics
    posts_count INTEGER DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8, 4),
    
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collab Check Posts
CREATE TABLE zorbitads.collab_check_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.collab_check_reports(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES zorbitads.collab_check_influencers(id) ON DELETE CASCADE,
    
    post_id VARCHAR(255),
    post_url TEXT,
    post_type VARCHAR(50), -- IMAGE, VIDEO, REEL, CAROUSEL
    thumbnail_url TEXT,
    description TEXT,
    matched_keywords TEXT[], -- Keywords that matched in this post
    
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8, 4),
    
    post_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collab Check Shares
CREATE TABLE zorbitads.collab_check_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.collab_check_reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, shared_with_user_id)
);

-- Indexes
CREATE INDEX idx_collab_reports_owner ON zorbitads.collab_check_reports(owner_id);
CREATE INDEX idx_collab_reports_status ON zorbitads.collab_check_reports(status);
CREATE INDEX idx_collab_reports_platform ON zorbitads.collab_check_reports(platform);
CREATE INDEX idx_collab_influencers_report ON zorbitads.collab_check_influencers(report_id);
CREATE INDEX idx_collab_posts_report ON zorbitads.collab_check_posts(report_id);
CREATE INDEX idx_collab_posts_date ON zorbitads.collab_check_posts(post_date);
```

### 17.2 TypeORM Entities

```typescript
export enum CollabReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TimePeriod {
  ONE_MONTH = '1_MONTH',
  THREE_MONTHS = '3_MONTHS',
  SIX_MONTHS = '6_MONTHS',
  ONE_YEAR = '1_YEAR',
}

@Entity({ name: 'collab_check_reports', schema: 'zorbitads' })
export class CollabCheckReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ type: 'varchar', length: 50, default: CollabReportStatus.PENDING })
  status: CollabReportStatus;

  @Column({ name: 'time_period', type: 'varchar', length: 50 })
  timePeriod: TimePeriod;

  @Column({ type: 'text', array: true, nullable: true })
  queries: string[];

  // ... metrics and relationships
}
```

### 17.3 Service Methods

```typescript
@Injectable()
export class CollabCheckService {
  // Create new report
  async createReport(userId: string, dto: CreateCollabCheckReportDto)
  
  // Get reports with filters
  async getReports(userId: string, filters: FilterDto)
  
  // Get report by ID
  async getReportById(userId: string, reportId: string)
  
  // Update report (title, visibility)
  async updateReport(userId: string, reportId: string, dto: UpdateDto)
  
  // Delete report
  async deleteReport(userId: string, reportId: string)
  
  // Retry failed report
  async retryReport(userId: string, reportId: string)
  
  // Share report
  async shareReport(userId: string, reportId: string, dto: ShareDto)
  
  // Get dashboard statistics
  async getDashboardStats(userId: string)
  
  // Get chart data
  async getChartData(userId: string, reportId: string)
  
  // Search influencers
  async searchInfluencers(platform: string, query: string, limit: number)
  
  // Process report (background)
  private async processReport(reportId: string)
}
```

### 17.4 API Controller

```typescript
@Controller('collab-check')
export class CollabCheckController {
  POST / - Create report
  GET / - List reports with filters
  GET /dashboard - Stats
  GET /search/influencers - Search influencers
  GET /:id - Report detail
  GET /:id/chart-data - Chart data
  PATCH /:id - Update
  DELETE /:id - Delete
  POST /:id/retry - Retry failed report
  POST /:id/share - Share
  GET /shared/:token - Public access
}
```

### 17.5 Frontend Components

#### CollabCheckListPage
- Dashboard stats cards (8 metrics)
- Filters (platform, status, createdBy, search)
- Reports table with pagination
- Actions: View, Edit, Delete, Retry

#### CollabCheckCreatePage
- Platform selection (Instagram/TikTok)
- Time period selection
- Search queries input (hashtags, mentions, keywords)
- Influencer search and selection (1-10)
- Multiple influencers toggle
- Credit cost confirmation

#### CollabCheckDetailPage
- Report header with title editing
- Status badge with actions (retry, share, delete)
- Summary cards (Posts, Likes, Views, Comments, Shares, ER)
- Posts vs Date chart
- Posts grid with matched keywords highlighted
- Share functionality

### 17.6 Frontend API Client

```typescript
export const collabCheckApi = {
  list: async (params) => api.get('/api/v1/collab-check', { params }),
  getDashboard: async () => api.get('/api/v1/collab-check/dashboard'),
  getById: async (id) => api.get(`/api/v1/collab-check/${id}`),
  getChartData: async (id) => api.get(`/api/v1/collab-check/${id}/chart-data`),
  create: async (data) => api.post('/api/v1/collab-check', data),
  update: async (id, data) => api.patch(`/api/v1/collab-check/${id}`, data),
  delete: async (id) => api.delete(`/api/v1/collab-check/${id}`),
  retry: async (id) => api.post(`/api/v1/collab-check/${id}/retry`),
  share: async (id, data) => api.post(`/api/v1/collab-check/${id}/share`, data),
  searchInfluencers: async (platform, query, limit) => 
    api.get('/api/v1/collab-check/search/influencers', { params: { platform, q: query, limit } }),
};
```

### 17.7 Sample Data

| Report | Platform | Influencers | Queries | Posts | Status |
|--------|----------|-------------|---------|-------|--------|
| Nike Campaign Q1 | INSTAGRAM | 3 | #nike, @nike | 45 | COMPLETED |
| Adidas Collab | INSTAGRAM | 2 | #adidas, sponsored | 28 | COMPLETED |
| Tech Review | INSTAGRAM | 1 | #techreview | 15 | COMPLETED |
| Fashion Week | INSTAGRAM | 3 | #fashionweek | 0 | PROCESSING |
| Untitled | INSTAGRAM | 2 | #beauty | 0 | PENDING |
| Summer Collection | INSTAGRAM | 2 | #summer | 0 | FAILED |

---

## 18. Module: Influencer Tie Breaker

### 18.1 Database Schema

#### tie_breaker_comparisons
```sql
CREATE TABLE zorbitads.tie_breaker_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Influencer Comparison',
    platform VARCHAR(50) NOT NULL, -- INSTAGRAM, YOUTUBE, TIKTOK
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    search_query TEXT,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    
    -- Credits
    credits_used DECIMAL(10, 2) DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_tie_breaker_comparisons_owner ON zorbitads.tie_breaker_comparisons(owner_id);
CREATE INDEX idx_tie_breaker_comparisons_status ON zorbitads.tie_breaker_comparisons(status);
CREATE INDEX idx_tie_breaker_comparisons_platform ON zorbitads.tie_breaker_comparisons(platform);
```

#### tie_breaker_influencers
```sql
CREATE TABLE zorbitads.tie_breaker_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID NOT NULL REFERENCES zorbitads.tie_breaker_comparisons(id) ON DELETE CASCADE,
    
    -- Influencer identity
    influencer_profile_id UUID,
    platform_user_id VARCHAR(255),
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    profile_picture_url TEXT,
    
    -- Overview metrics
    follower_count BIGINT DEFAULT 0,
    following_count BIGINT DEFAULT 0,
    avg_likes BIGINT DEFAULT 0,
    avg_views BIGINT DEFAULT 0,
    avg_comments BIGINT DEFAULT 0,
    avg_reel_views BIGINT DEFAULT 0,
    engagement_rate DECIMAL(8, 4) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Followers' audience (JSONB)
    audience_quality DECIMAL(5, 2),
    notable_followers_pct DECIMAL(5, 2),
    followers_gender_data JSONB,  -- {male: number, female: number}
    followers_age_data JSONB,     -- [{ageRange, male, female}]
    followers_countries JSONB,     -- [{country, percentage}]
    followers_cities JSONB,        -- [{city, percentage}]
    followers_interests JSONB,     -- [{interest, percentage}]
    
    -- Engagers' audience (JSONB)
    engagers_quality DECIMAL(5, 2),
    notable_engagers_pct DECIMAL(5, 2),
    engagers_gender_data JSONB,
    engagers_age_data JSONB,
    engagers_countries JSONB,
    engagers_cities JSONB,
    engagers_interests JSONB,
    
    -- Top posts (JSONB array)
    top_posts JSONB, -- [{postId, postUrl, thumbnailUrl, caption, likes, comments, views, engagementRate, isSponsored, postDate}]
    
    -- Metadata
    display_order INTEGER DEFAULT 0,
    was_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tie_breaker_influencers_comparison ON zorbitads.tie_breaker_influencers(comparison_id);
```

#### tie_breaker_shares
```sql
CREATE TABLE zorbitads.tie_breaker_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID NOT NULL REFERENCES zorbitads.tie_breaker_comparisons(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW', -- VIEW, EDIT
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comparison_id, shared_with_user_id)
);
```

### 18.2 TypeORM Entities

```typescript
// TieBreakerStatus Enum
export enum TieBreakerStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// TieBreakerPlatform Enum
export enum TieBreakerPlatform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
}

// TieBreakerComparison Entity
@Entity({ name: 'tie_breaker_comparisons', schema: 'zorbitads' })
export class TieBreakerComparison {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Influencer Comparison' })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  platform: TieBreakerPlatform;

  @Column({ type: 'varchar', length: 50, default: TieBreakerStatus.PENDING })
  status: TieBreakerStatus;

  @Column({ name: 'search_query', type: 'text', nullable: true })
  searchQuery?: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'credits_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditsUsed: number;

  @OneToMany(() => TieBreakerInfluencer, (inf) => inf.comparison)
  influencers: TieBreakerInfluencer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}
```

### 18.3 Service Methods

```typescript
@Injectable()
export class TieBreakerService {
  // Create new comparison
  async createComparison(userId: string, dto: CreateTieBreakerComparisonDto): Promise<{
    success: boolean;
    comparison: TieBreakerComparison;
    creditsUsed: number;
    unlockedCount: number;
  }>;
  
  // Get comparisons with filters
  async getComparisons(userId: string, filters: TieBreakerFilterDto): Promise<TieBreakerListResponseDto>;
  
  // Get comparison by ID
  async getComparisonById(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto>;
  
  // Update comparison (title, visibility)
  async updateComparison(userId: string, comparisonId: string, dto: UpdateTieBreakerComparisonDto): Promise<Result>;
  
  // Delete comparison
  async deleteComparison(userId: string, comparisonId: string): Promise<Result>;
  
  // Share comparison
  async shareComparison(userId: string, comparisonId: string, dto: ShareTieBreakerComparisonDto): Promise<ShareResult>;
  
  // Get dashboard statistics
  async getDashboardStats(userId: string): Promise<TieBreakerDashboardStatsDto>;
  
  // Search influencers for comparison
  async searchInfluencers(userId: string, platform: string, query: string, limit: number): Promise<SearchInfluencerResultDto[]>;
  
  // Process comparison (background job)
  private async processComparison(comparisonId: string): Promise<void>;
  
  // Populate influencer audience data
  private async populateInfluencerAudienceData(influencer: TieBreakerInfluencer): Promise<void>;
}
```

### 18.4 API Controller

```typescript
@Controller('tie-breaker')
export class TieBreakerController {
  POST / - Create comparison (2-3 influencers)
  GET / - List comparisons with filters
  GET /dashboard - Dashboard statistics
  GET /search/influencers - Search influencers
  GET /:id - Comparison details
  GET /:id/download - Download data for PDF
  PATCH /:id - Update title/visibility
  DELETE /:id - Delete comparison
  POST /:id/share - Share comparison
  GET /shared/:token - Public shared comparison
}
```

### 18.5 Frontend Components

#### TieBreakerListPage
- Dashboard stats cards (8 metrics)
- Filters (platform, status, createdBy, search)
- Comparisons table with pagination
- Actions: View, Delete

#### TieBreakerCreatePage
- Platform selection (Instagram/YouTube/TikTok)
- Influencer search with unlock status
- Selected influencers display (2-3)
- Credit cost display for unblurred influencers
- Compare Now button

#### TieBreakerDetailPage
- Comparison header with title editing
- Status badge
- Tab navigation (Overview, Followers' Audience, Engagers' Audience, Top Posts)
- Side-by-side comparison columns for each influencer
- Share and Download PDF buttons
- Best value highlighting (winner badges)

### 18.6 Frontend API Client

```typescript
export const tieBreakerApi = {
  list: async (params) => api.get('/api/v1/tie-breaker', { params }),
  getDashboard: async () => api.get('/api/v1/tie-breaker/dashboard'),
  getById: async (id) => api.get(`/api/v1/tie-breaker/${id}`),
  create: async (data) => api.post('/api/v1/tie-breaker', data),
  update: async (id, data) => api.patch(`/api/v1/tie-breaker/${id}`, data),
  delete: async (id) => api.delete(`/api/v1/tie-breaker/${id}`),
  share: async (id, data) => api.post(`/api/v1/tie-breaker/${id}/share`, data),
  searchInfluencers: async (platform, query, limit) => 
    api.get('/api/v1/tie-breaker/search/influencers', { params: { platform, q: query, limit } }),
};
```

### 18.7 Credit Integration

```typescript
// Credit deduction logic in createComparison
async createComparison(userId: string, dto: CreateTieBreakerComparisonDto) {
  // 1. Check which influencers are already unlocked
  const unlockedInfluencers = await this.unlockedRepo.find({
    where: { userId, profileId: In(dto.influencerIds) }
  });
  
  const unlockedProfileIds = new Set(unlockedInfluencers.map(u => u.profileId));
  const influencersToUnlock = dto.influencerIds.filter(id => !unlockedProfileIds.has(id));
  const creditsRequired = influencersToUnlock.length * CREDIT_PER_UNBLUR; // 1 credit each
  
  // 2. Deduct credits for new unlocks
  if (creditsRequired > 0) {
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.PROFILE_UNLOCK,
      quantity: creditsRequired,
      module: ModuleType.TIE_BREAKER,
      resourceId: 'tie-breaker-comparison',
      resourceType: 'influencer_comparison_unlock',
    });
  }
  
  // 3. Create comparison and unlock influencers
  // ...
}
```

### 18.8 Sample Data

| Comparison | Platform | Influencers | Status | Credits Used |
|------------|----------|-------------|--------|--------------|
| Fashion Influencers Q1 | INSTAGRAM | @fashionista vs @styleicon vs @trendyy | COMPLETED | 2 |
| Tech Reviewers Face-off | YOUTUBE | TechGuru vs GadgetGeek | COMPLETED | 1 |
| Beauty Bloggers | INSTAGRAM | @beautyboss vs @makeupqueen | COMPLETED | 0 |
| Fitness Stars Showdown | INSTAGRAM | @fitlife vs @gymrat vs @wellnesswarrior | PROCESSING | 3 |
| Gaming Streamers | YOUTUBE | ProGamer vs EsportsStar | PENDING | 0 |

---

## 19. Module: Generated Reports

### 18.1 Database Schema

#### discovery_exports
```sql
CREATE TABLE zorbitads.discovery_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'Discovery Export',
    
    -- Export details
    platform VARCHAR(50) NOT NULL,
    export_format VARCHAR(20) NOT NULL DEFAULT 'CSV', -- CSV, XLSX, JSON
    profile_count INTEGER DEFAULT 0,
    file_url TEXT,
    file_size_bytes BIGINT,
    
    -- Filters used (for re-generation if needed)
    search_filters JSONB,
    exported_profile_ids TEXT[], -- Array of profile IDs that were exported
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- PENDING, PROCESSING, COMPLETED, FAILED
    error_message TEXT,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    
    -- Credits
    credits_used DECIMAL(10, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_discovery_exports_owner ON zorbitads.discovery_exports(owner_id);
CREATE INDEX idx_discovery_exports_created_by ON zorbitads.discovery_exports(created_by);
CREATE INDEX idx_discovery_exports_created_at ON zorbitads.discovery_exports(created_at);
CREATE INDEX idx_discovery_exports_platform ON zorbitads.discovery_exports(platform);
CREATE INDEX idx_discovery_exports_status ON zorbitads.discovery_exports(status);
```

#### paid_collaboration_reports
```sql
CREATE TABLE zorbitads.paid_collaboration_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'Paid Collaboration Report',
    
    -- Report details
    platform VARCHAR(50) NOT NULL,
    report_type VARCHAR(50) NOT NULL DEFAULT 'COLLABORATION', -- COLLABORATION, COMPARISON, ANALYSIS
    export_format VARCHAR(20) NOT NULL DEFAULT 'PDF', -- PDF, XLSX
    
    -- Influencer details
    influencer_count INTEGER DEFAULT 0,
    influencer_ids TEXT[], -- Array of influencer profile IDs
    influencer_data JSONB, -- Cached influencer data at time of report
    
    -- Report content
    report_content JSONB, -- Full report data
    file_url TEXT,
    file_size_bytes BIGINT,
    
    -- Date range (if applicable)
    date_range_start DATE,
    date_range_end DATE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    error_message TEXT,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    
    -- Credits
    credits_used DECIMAL(10, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_paid_collab_reports_owner ON zorbitads.paid_collaboration_reports(owner_id);
CREATE INDEX idx_paid_collab_reports_created_by ON zorbitads.paid_collaboration_reports(created_by);
CREATE INDEX idx_paid_collab_reports_created_at ON zorbitads.paid_collaboration_reports(created_at);
CREATE INDEX idx_paid_collab_reports_platform ON zorbitads.paid_collaboration_reports(platform);
CREATE INDEX idx_paid_collab_reports_status ON zorbitads.paid_collaboration_reports(status);
```

### 18.2 TypeORM Entities

```typescript
// DiscoveryExport Entity
export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
  JSON = 'JSON',
}

export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'discovery_exports', schema: 'zorbitads' })
export class DiscoveryExport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Discovery Export' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'export_format', type: 'varchar', length: 20 })
  exportFormat: ExportFormat;

  @Column({ name: 'profile_count', type: 'int', default: 0 })
  profileCount: number;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'downloaded_at', type: 'timestamp', nullable: true })
  downloadedAt?: Date;
}
```

### 18.3 Service Methods

```typescript
@Injectable()
export class GeneratedReportsService {
  // Get reports list with filters
  async getReports(userId: string, userRole: string, filters: FilterDto): Promise<ListResponse>
  
  // Get report by ID
  async getReportById(userId: string, userRole: string, reportId: string, tab: ReportTab): Promise<Report>
  
  // Rename report
  async renameReport(userId: string, userRole: string, reportId: string, tab: ReportTab, dto: RenameDto): Promise<Result>
  
  // Delete report
  async deleteReport(userId: string, userRole: string, reportId: string, tab: ReportTab): Promise<Result>
  
  // Bulk delete reports
  async bulkDeleteReports(userId: string, userRole: string, dto: BulkDeleteDto): Promise<Result>
  
  // Re-download report
  async downloadReport(userId: string, userRole: string, reportId: string, tab: ReportTab): Promise<DownloadResult>
  
  // Get dashboard stats
  async getDashboardStats(userId: string, userRole: string): Promise<DashboardStats>
  
  // Create discovery export (called from Discovery module)
  async createDiscoveryExport(userId: string, data: ExportData): Promise<DiscoveryExport>
  
  // Create paid collaboration report (called from relevant modules)
  async createPaidCollaborationReport(userId: string, data: ReportData): Promise<PaidCollaborationReport>
}
```

### 18.4 API Controller

```typescript
@Controller('generated-reports')
export class GeneratedReportsController {
  GET / - List reports with filters (tab, platform, createdBy, search)
  GET /dashboard - Dashboard statistics
  GET /:tab/:id - Get report by ID
  PATCH /:tab/:id/rename - Rename report
  DELETE /:tab/:id - Delete report
  POST /bulk-delete - Bulk delete reports
  POST /:tab/:id/download - Re-download report
}
```

### 18.5 Frontend Components

#### GeneratedReportsListPage
- Dashboard stats cards (Total, Discovery, Paid Collab, This Month)
- Tab navigation (Influencer Discovery, Paid Collaboration)
- Filter controls (platform, createdBy, search)
- Reports table with checkboxes for bulk operations
- Inline rename functionality
- Action buttons (Re-download, Rename, Delete)
- Bulk delete button (appears when items selected)
- Toast notifications for actions
- Pagination

### 18.6 Frontend API Client

```typescript
export const generatedReportsApi = {
  list: async (params) => api.get('/api/v1/generated-reports', { params }),
  getDashboard: async () => api.get('/api/v1/generated-reports/dashboard'),
  getById: async (tab, id) => api.get(\`/api/v1/generated-reports/\${tab}/\${id}\`),
  rename: async (tab, id, title) => api.patch(\`/api/v1/generated-reports/\${tab}/\${id}/rename\`, { title }),
  delete: async (tab, id) => api.delete(\`/api/v1/generated-reports/\${tab}/\${id}\`),
  bulkDelete: async (tab, reportIds) => api.post('/api/v1/generated-reports/bulk-delete', { tab, reportIds }),
  download: async (tab, id) => api.post(\`/api/v1/generated-reports/\${tab}/\${id}/download\`),
};
```

### 18.7 Sample Data

| Report | Tab | Platform | Format | Profiles | Created |
|--------|-----|----------|--------|----------|---------|
| Fashion Influencers Export | Discovery | INSTAGRAM | CSV | 25 | 2026-01-15 |
| Tech YouTubers Export | Discovery | YOUTUBE | XLSX | 50 | 2026-01-12 |
| Beauty Collab Q1 2026 | Paid Collab | INSTAGRAM | PDF | 3 | 2026-01-10 |
| Gaming Comparison Report | Paid Collab | YOUTUBE | PDF | 5 | 2026-01-08 |
| Lifestyle Export January | Discovery | INSTAGRAM | JSON | 100 | 2026-01-05 |
| Fitness Brand Collab | Paid Collab | INSTAGRAM | XLSX | 8 | 2026-01-02 |

---

## 20. Module: Paid Collaboration

### 20.1 Database Schema

#### paid_collab_reports
```sql
CREATE TABLE zorbitads.paid_collab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Report',
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    hashtags TEXT[],
    mentions TEXT[],
    query_logic VARCHAR(10) DEFAULT 'OR',
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    total_influencers INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_shares BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8, 4),
    engagement_views_rate DECIMAL(8, 4),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

#### paid_collab_influencers
```sql
CREATE TABLE zorbitads.paid_collab_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.paid_collab_reports(id) ON DELETE CASCADE,
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    follower_count BIGINT DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    engagement_rate DECIMAL(8, 4),
    category VARCHAR(20) DEFAULT 'ALL',
    credibility_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 20.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/paid-collaboration` | Create new report |
| GET | `/paid-collaboration` | List reports |
| GET | `/paid-collaboration/dashboard` | Dashboard stats |
| GET | `/paid-collaboration/:id` | Report details |
| PATCH | `/paid-collaboration/:id` | Update report |
| DELETE | `/paid-collaboration/:id` | Delete report |
| POST | `/paid-collaboration/:id/retry` | Retry failed |
| POST | `/paid-collaboration/:id/share` | Share report |

### 20.3 Credit Rules

| Action | Credits |
|--------|---------|
| Create Report | 1 |
| Retry Report | 1 |
| View/Share | 0 |

---

## 21. Module: Influencer Groups

### 21.1 Database Schema

#### influencer_groups
```sql
CREATE TABLE zorbitads.influencer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platforms TEXT[] NOT NULL DEFAULT '{}',
    influencer_count INTEGER DEFAULT 0,
    unapproved_count INTEGER DEFAULT 0,
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### influencer_group_members
```sql
CREATE TABLE zorbitads.influencer_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES zorbitads.influencer_groups(id) ON DELETE CASCADE,
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    profile_picture_url TEXT,
    follower_count BIGINT DEFAULT 0,
    engagement_rate DECIMAL(8, 4),
    added_by UUID NOT NULL REFERENCES zorbitads.users(id),
    source VARCHAR(50) DEFAULT 'MANUAL',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### influencer_group_shares
```sql
CREATE TABLE zorbitads.influencer_group_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES zorbitads.influencer_groups(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, shared_with_user_id)
);
```

#### group_invitations
```sql
CREATE TABLE zorbitads.group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES zorbitads.influencer_groups(id) ON DELETE CASCADE,
    invitation_name VARCHAR(255) NOT NULL,
    invitation_type VARCHAR(50) NOT NULL,
    url_slug VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    landing_header TEXT,
    form_header TEXT,
    form_platforms TEXT[] DEFAULT '{}',
    collect_phone BOOLEAN DEFAULT FALSE,
    collect_email BOOLEAN DEFAULT FALSE,
    pricing_options TEXT[],
    pricing_currency VARCHAR(10),
    thankyou_header TEXT,
    thankyou_content TEXT,
    logo_url TEXT,
    background_color VARCHAR(20) DEFAULT '#ffffff',
    button_bg_color VARCHAR(20) DEFAULT '#6366f1',
    notify_on_submission BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### group_invitation_applications
```sql
CREATE TABLE zorbitads.group_invitation_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES zorbitads.group_invitations(id) ON DELETE CASCADE,
    group_id UUID NOT NULL,
    influencer_name VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    platform_username VARCHAR(255) NOT NULL,
    follower_count BIGINT DEFAULT 0,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    photo_price DECIMAL(12, 2),
    video_price DECIMAL(12, 2),
    story_price DECIMAL(12, 2),
    pricing_currency VARCHAR(10),
    status VARCHAR(50) DEFAULT 'PENDING',
    approved_by UUID REFERENCES zorbitads.users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 21.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/influencer-groups` | Create group |
| GET | `/influencer-groups` | List groups |
| GET | `/influencer-groups/dashboard` | Dashboard stats |
| GET | `/influencer-groups/:id` | Group details |
| PATCH | `/influencer-groups/:id` | Update group |
| DELETE | `/influencer-groups/:id` | Delete group |
| POST | `/influencer-groups/:id/members` | Add influencer |
| POST | `/influencer-groups/:id/members/bulk` | Bulk add |
| POST | `/influencer-groups/:id/share` | Share group |
| GET | `/influencer-groups/shared/:token` | Public shared |
| POST | `/influencer-groups/:id/invitations` | Create invitation |
| GET | `/influencer-groups/invite/:slug` | Get by slug (public) |
| POST | `/influencer-groups/invite/:slug/apply` | Submit application |
| POST | `/influencer-groups/:id/applications/:appId/approve` | Approve |
| POST | `/influencer-groups/:id/applications/bulk-approve` | Bulk approve |

### 21.3 Credit Rules

| Action | Credits |
|--------|---------|
| All Operations | **0** (FREE) |

---

## 22. Module: Report Insights & Metrics

### 22.1 Database Schema

The Report Insights & Metrics feature uses the Paid Collaboration tables:

#### paid_collab_reports (Primary)
```sql
CREATE TABLE zorbitads.paid_collab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled Report',
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    hashtags TEXT[],
    mentions TEXT[],
    query_logic VARCHAR(10) DEFAULT 'OR',
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    
    -- Aggregated Metrics for Insights
    total_influencers INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_shares BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8, 4),
    engagement_views_rate DECIMAL(8, 4),
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    
    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    
    -- Credits
    credits_used INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for Report Insights queries
CREATE INDEX idx_paid_collab_reports_status ON zorbitads.paid_collab_reports(status);
CREATE INDEX idx_paid_collab_reports_owner ON zorbitads.paid_collab_reports(owner_id);
CREATE INDEX idx_paid_collab_reports_created_by ON zorbitads.paid_collab_reports(created_by);
```

#### paid_collab_categorizations (Category Metrics)
```sql
CREATE TABLE zorbitads.paid_collab_categorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.paid_collab_reports(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL, -- ALL, NANO, MICRO, MACRO, MEGA
    accounts_count INTEGER DEFAULT 0,
    followers_count BIGINT DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    engagement_rate DECIMAL(8, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, category)
);

-- Indexes
CREATE INDEX idx_paid_collab_cat_report ON zorbitads.paid_collab_categorizations(report_id);
```

### 22.2 API Specifications

#### GET /api/v1/paid-collaboration/:id (Report with Insights)
```typescript
// Response (200 OK)
interface ReportInsightsResponse {
  id: string;
  title: string;
  platform: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  hashtags: string[];
  mentions: string[];
  queryLogic: 'AND' | 'OR';
  dateRangeStart: string;
  dateRangeEnd: string;
  
  // Summary Metrics
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
  
  // Related Data
  influencers: InfluencerDto[];
  posts: PostDto[];
  categorizations: CategorizationDto[];
  
  // Sharing
  isPublic: boolean;
  shareUrl?: string;
  
  // Meta
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}
```

#### GET /api/v1/paid-collaboration/:id/chart-data (Chart Data)
```typescript
// Response (200 OK)
interface ChartDataResponse {
  data: ChartDataPoint[];
}

interface ChartDataPoint {
  date: string;              // ISO date string
  postsCount: number;        // Posts on this date
  influencersCount: number;  // Unique influencers on this date
  likesCount: number;        // Total likes on this date
  viewsCount: number;        // Total views on this date
}
```

#### GET /api/v1/paid-collaboration/:id/influencers (Filtered Influencers)
```typescript
// Query Parameters
interface InfluencerQueryParams {
  category?: 'ALL' | 'NANO' | 'MICRO' | 'MACRO' | 'MEGA';
  sortBy?: 'recent' | 'oldest' | 'mostLiked' | 'leastLiked' | 
           'highestFollowers' | 'lowestFollowers' | 
           'highestCredibility' | 'lowestCredibility';
  page?: number;
  limit?: number;
}

// Response (200 OK)
interface InfluencersResponse {
  influencers: InfluencerDto[];
  total: number;
}

interface InfluencerDto {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate?: number;
  category: 'NANO' | 'MICRO' | 'MACRO' | 'MEGA';
  credibilityScore?: number;
}
```

#### GET /api/v1/paid-collaboration/:id/posts (Filtered Posts)
```typescript
// Query Parameters
interface PostsQueryParams {
  sponsoredOnly?: boolean;
  category?: 'ALL' | 'NANO' | 'MICRO' | 'MACRO' | 'MEGA';
  sortBy?: 'likesCount' | 'viewsCount' | 'commentsCount' | 'postDate';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// Response (200 OK)
interface PostsResponse {
  posts: PostDto[];
  total: number;
}

interface PostDto {
  id: string;
  postUrl?: string;
  postType?: string;
  thumbnailUrl?: string;
  caption?: string;
  matchedHashtags?: string[];
  matchedMentions?: string[];
  isSponsored: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  engagementRate?: number;
  postDate?: string;
  influencerName?: string;
  influencerUsername?: string;
}
```

### 22.3 Categorization DTO

```typescript
interface CategorizationDto {
  category: 'ALL' | 'NANO' | 'MICRO' | 'MACRO' | 'MEGA';
  accountsCount: number;
  followersCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate?: number;
}
```

### 22.4 Category Classification

```typescript
function getInfluencerCategory(followerCount: number): InfluencerCategory {
  if (followerCount < 10000) return 'NANO';       // < 10K
  if (followerCount < 100000) return 'MICRO';    // 10K - 100K
  if (followerCount < 500000) return 'MACRO';    // 100K - 500K
  return 'MEGA';                                   // > 500K
}
```

### 22.5 Metrics Calculation

```typescript
// Average Engagement Rate
avgEngagementRate = (totalLikes + totalComments) / 
                   (totalPosts * (totalFollowers / totalInfluencers)) * 100;

// Engagement/Views Rate
engagementViewsRate = (totalLikes + totalComments) / totalViews * 100;

// Per-Category Engagement Rate
categoryEngagementRate = (categoryLikes + categoryComments) /
                        (categoryPosts * (categoryFollowers / categoryAccounts)) * 100;
```

### 22.6 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| View Report Insights | 0 | Free - included with report |
| Get Chart Data | 0 | Free |
| Filter Influencers | 0 | Free |
| Filter Posts | 0 | Free |
| Download PDF | 0 | Free |
| Download XLSX | 0 | Free |

Note: 1 credit is deducted at report creation time. All insights viewing is free thereafter.

---

## 23. Module: Mention Tracking - LLD

### 23.1 Database Schema

#### mention_tracking_reports
```sql
CREATE TABLE zorbitads.mention_tracking_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled',
    platforms TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    hashtags TEXT[],
    usernames TEXT[],
    keywords TEXT[],
    sponsored_only BOOLEAN DEFAULT FALSE,
    auto_refresh_enabled BOOLEAN DEFAULT FALSE,
    next_refresh_date DATE,
    total_influencers INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_shares BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8,4),
    engagement_views_rate DECIMAL(8,4),
    total_followers BIGINT DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_mention_reports_owner ON zorbitads.mention_tracking_reports(owner_id);
CREATE INDEX idx_mention_reports_status ON zorbitads.mention_tracking_reports(status);
CREATE INDEX idx_mention_reports_created ON zorbitads.mention_tracking_reports(created_at);
```

#### mention_tracking_influencers
```sql
CREATE TABLE zorbitads.mention_tracking_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.mention_tracking_reports(id) ON DELETE CASCADE,
    influencer_profile_id UUID,
    platform_user_id VARCHAR(255),
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    profile_picture_url TEXT,
    follower_count BIGINT DEFAULT 0,
    category VARCHAR(20),
    audience_credibility DECIMAL(5,2),
    posts_count INTEGER DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8,4),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_mention_influencers_report ON zorbitads.mention_tracking_influencers(report_id);
CREATE INDEX idx_mention_influencers_category ON zorbitads.mention_tracking_influencers(category);
```

#### mention_tracking_posts
```sql
CREATE TABLE zorbitads.mention_tracking_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.mention_tracking_reports(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES zorbitads.mention_tracking_influencers(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    post_id VARCHAR(255),
    post_url TEXT,
    post_type VARCHAR(50),
    thumbnail_url TEXT,
    description TEXT,
    matched_hashtags TEXT[],
    matched_usernames TEXT[],
    matched_keywords TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8,4),
    is_sponsored BOOLEAN DEFAULT FALSE,
    post_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_mention_posts_report ON zorbitads.mention_tracking_posts(report_id);
CREATE INDEX idx_mention_posts_influencer ON zorbitads.mention_tracking_posts(influencer_id);
CREATE INDEX idx_mention_posts_date ON zorbitads.mention_tracking_posts(post_date);
CREATE INDEX idx_mention_posts_sponsored ON zorbitads.mention_tracking_posts(is_sponsored);
```

#### mention_tracking_shares
```sql
CREATE TABLE zorbitads.mention_tracking_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.mention_tracking_reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_mention_shares_report ON zorbitads.mention_tracking_shares(report_id);
CREATE INDEX idx_mention_shares_with ON zorbitads.mention_tracking_shares(shared_with_user_id);
```

### 23.2 API Specifications

#### POST /api/v1/mention-tracking
```typescript
// Request
interface CreateMentionTrackingReportDto {
  title?: string;
  platforms: ('INSTAGRAM' | 'TIKTOK' | 'YOUTUBE')[];  // 1-2 platforms, YouTube alone
  dateRangeStart: string;  // ISO date
  dateRangeEnd: string;    // ISO date
  hashtags?: string[];     // Not for YouTube
  usernames?: string[];    // Not for YouTube
  keywords?: string[];     // Not for TikTok
  sponsoredOnly?: boolean;
  autoRefreshEnabled?: boolean;
}

// Response (201 Created)
interface CreateReportResponse {
  success: boolean;
  report: MentionTrackingReport;
  creditsUsed: number;
}

// Errors
// 400 - Invalid platform combination (YouTube with others)
// 400 - Invalid search criteria for platform
// 400 - No search criteria provided
// 402 - Insufficient credits
```

#### GET /api/v1/mention-tracking
```typescript
// Query Parameters
interface MentionTrackingReportFilterDto {
  platform?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdBy?: 'ALL' | 'ME' | 'TEAM' | 'SHARED' | 'PUBLIC';
  search?: string;
  page?: number;
  limit?: number;
}

// Response (200 OK)
interface MentionTrackingReportListResponse {
  reports: MentionTrackingReportSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

#### GET /api/v1/mention-tracking/:id
```typescript
// Response (200 OK)
interface MentionTrackingReportDetail {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  errorMessage?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  hashtags: string[];
  usernames: string[];
  keywords: string[];
  sponsoredOnly: boolean;
  autoRefreshEnabled: boolean;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
  totalFollowers: number;
  influencers: MentionTrackingInfluencer[];
  posts: MentionTrackingPost[];
  categorization: CategoryStats[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}
```

### 23.3 Service Layer

```typescript
@Injectable()
export class MentionTrackingService {
  // Platform validation rules
  private validatePlatformRules(dto: CreateMentionTrackingReportDto): void {
    if (dto.platforms.includes('YOUTUBE')) {
      if (dto.platforms.length > 1) {
        throw new BadRequestException('YouTube cannot be combined with other platforms');
      }
      if (dto.hashtags?.length || dto.usernames?.length) {
        throw new BadRequestException('YouTube only supports keyword search');
      }
    }
    if (dto.platforms.includes('TIKTOK') && dto.keywords?.length) {
      throw new BadRequestException('TikTok does not support keyword search');
    }
  }

  // Influencer categorization
  private categorizeInfluencer(followers: number): InfluencerCategory {
    if (followers < 10000) return InfluencerCategory.NANO;
    if (followers < 100000) return InfluencerCategory.MICRO;
    if (followers < 500000) return InfluencerCategory.MACRO;
    return InfluencerCategory.MEGA;
  }

  // Metrics calculation
  private calculateMetrics(report: MentionTrackingReport): void {
    report.avgEngagementRate = report.totalPosts > 0 
      ? ((report.totalLikes + report.totalComments) / 
         (report.totalPosts * (report.totalFollowers / report.totalInfluencers))) * 100 
      : 0;
    
    report.engagementViewsRate = report.totalViews > 0 
      ? ((report.totalLikes + report.totalComments) / report.totalViews) * 100 
      : 0;
  }
}
```

### 23.4 Category Classification

```typescript
enum InfluencerCategory {
  NANO = 'NANO',     // < 10K followers
  MICRO = 'MICRO',   // 10K - 100K followers
  MACRO = 'MACRO',   // 100K - 500K followers
  MEGA = 'MEGA',     // > 500K followers
}

interface CategoryStats {
  category: string;
  label: string;
  accountsCount: number;
  followersCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate: number;
}
```

### 23.5 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 | Per report creation |
| Retry Failed Report | 1 | Per retry attempt |
| View Report | 0 | Free |
| Filter/Sort | 0 | Free |
| Share Report | 0 | Free |
| Download PDF/XLSX | 0 | Free |
| Auto-Refresh Updates | 0 | Free (daily updates) |

### 23.6 Access Control

| Role | View Own | View Team | Edit Own | Delete Own | Edit Team |
|------|----------|-----------|----------|------------|-----------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| SUB_USER | ✓ | ✓ | ✓ | ✓ | - |
