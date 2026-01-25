# SocialTweebs - High-Level Design (HLD)

## 1. Executive Summary

SocialTweebs is a B2B SaaS platform for influencer discovery and analytics. It enables brands and agencies to discover influencers across social media platforms, analyze their audience demographics, and manage influencer marketing campaigns.

## 2. System Overview

### 2.1 Core Features
- **Influencer Discovery**: Search 100M+ influencer profiles across Instagram, YouTube, TikTok, and LinkedIn
- **Influencer Insights**: Deep analytics including audience demographics, engagement metrics, and growth trends
- **Team Management**: Multi-user access with role-based permissions
- **Credit System**: Pay-per-use model for searches and profile unlocks
- **Campaign Tracking**: Monitor influencer campaign performance

### 2.2 Target Users
- Marketing Agencies
- Brand Marketing Teams
- PR Firms
- Influencer Marketing Platforms

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Web Browser   │  │   Mobile App    │  │   API Clients   │             │
│  │   (React SPA)   │  │    (Future)     │  │   (Future)      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY / CDN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Cloudflare / AWS CloudFront                       │   │
│  │  • SSL Termination  • DDoS Protection  • Caching  • Rate Limiting   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      NestJS Backend API                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   Auth   │ │Discovery │ │ Credits  │ │   Team   │ │ Profile  │  │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   PostgreSQL    │  │     Redis       │  │   File Storage  │             │
│  │  (Primary DB)   │  │    (Cache)      │  │   (S3/GCS)      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Modash API    │  │  Email Service  │  │ Payment Gateway │             │
│  │ (Influencer DB) │  │  (SendGrid)     │  │   (Stripe)      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. Component Architecture

### 4.1 Frontend (React + TypeScript)

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    App Shell (Layout)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   Header    │  │   Sidebar   │  │   Footer    │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Page Components                     │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │   │
│  │  │   Login   │ │ Discovery │ │  Insights │ │  Team   │ │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   State Management                       │   │
│  │  ┌───────────────┐  ┌───────────────┐                   │   │
│  │  │  AuthContext  │  │  React Query  │                   │   │
│  │  │  (User/Auth)  │  │ (Server State)│                   │   │
│  │  └───────────────┘  └───────────────┘                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Services Layer                        │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │              Axios API Client                      │  │   │
│  │  │  • Auth interceptors  • Error handling  • Retry   │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Backend (NestJS + TypeScript)

```
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Layer (Controllers)               │   │
│  │  ┌─────────┐ ┌───────────┐ ┌─────────┐ ┌─────────────┐ │   │
│  │  │  Auth   │ │ Discovery │ │ Credits │ │    Team     │ │   │
│  │  └─────────┘ └───────────┘ └─────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Business Logic (Services)               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
│  │  │ AuthService │ │DiscoveryS. │ │ CreditsS.   │       │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │   │
│  │  ┌─────────────┐ ┌─────────────┐                        │   │
│  │  │ TeamService │ │ ModashS.   │                        │   │
│  │  └─────────────┘ └─────────────┘                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Data Access (Repositories)              │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │                  TypeORM Entities                │    │   │
│  │  │  User | CreditAccount | InfluencerProfile | ... │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Data Flow Diagrams

### 5.1 User Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │   API    │      │  Auth    │      │ Database │
│ (React)  │      │ Gateway  │      │ Service  │      │(Postgres)│
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                  │                 │                 │
     │  POST /login     │                 │                 │
     │─────────────────>│                 │                 │
     │                  │  Validate       │                 │
     │                  │─────────────────>                 │
     │                  │                 │  Find User      │
     │                  │                 │────────────────>│
     │                  │                 │                 │
     │                  │                 │  User Data      │
     │                  │                 │<────────────────│
     │                  │                 │                 │
     │                  │  Generate JWT   │                 │
     │                  │<─────────────────                 │
     │                  │                 │                 │
     │  JWT Token       │                 │                 │
     │<─────────────────│                 │                 │
     │                  │                 │                 │
```

### 5.2 Influencer Search Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │    │   API    │    │Discovery │    │  Local   │    │  Modash  │
│ (React)  │    │ Gateway  │    │ Service  │    │   DB     │    │   API    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ POST /search  │               │               │               │
     │──────────────>│               │               │               │
     │               │ Authenticate  │               │               │
     │               │──────────────>│               │               │
     │               │               │               │               │
     │               │               │ Query Local   │               │
     │               │               │──────────────>│               │
     │               │               │               │               │
     │               │               │ Results       │               │
     │               │               │<──────────────│               │
     │               │               │               │               │
     │               │               │ [If no local results]         │
     │               │               │──────────────────────────────>│
     │               │               │               │               │
     │               │               │               │  API Results  │
     │               │               │<──────────────────────────────│
     │               │               │               │               │
     │               │ Deduct Credits│               │               │
     │               │<──────────────│               │               │
     │               │               │               │               │
     │  Results      │               │               │               │
     │<──────────────│               │               │               │
```

## 6. Technology Stack

### 6.1 Frontend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 18 | UI Library |
| Language | TypeScript | Type Safety |
| Styling | Tailwind CSS | Utility-first CSS |
| State | React Context + React Query | State Management |
| Routing | React Router v6 | Client-side Routing |
| HTTP | Axios | API Communication |
| Build | Vite | Fast Dev/Build Tool |
| Icons | Lucide React | Icon Library |
| Charts | Recharts | Data Visualization |

### 6.2 Backend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | NestJS | Backend Framework |
| Language | TypeScript | Type Safety |
| ORM | TypeORM | Database Abstraction |
| Database | PostgreSQL | Primary Data Store |
| Auth | JWT + Passport | Authentication |
| Validation | class-validator | DTO Validation |
| Docs | Swagger/OpenAPI | API Documentation |
| Cache | Redis (planned) | Caching Layer |

### 6.3 Infrastructure
| Component | Technology | Purpose |
|-----------|------------|---------|
| Hosting | AWS/GCP | Cloud Infrastructure |
| CDN | Cloudflare | Content Delivery |
| CI/CD | GitHub Actions | Deployment Pipeline |
| Monitoring | (TBD) | Application Monitoring |
| Logging | (TBD) | Centralized Logging |

## 7. Database Schema Overview

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │ credit_accounts │       │credit_transactions│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │◄──────│ user_id         │       │ id              │
│ email           │       │ unified_balance │       │ credit_account_id│
│ password_hash   │       │ validity_start  │       │ amount          │
│ full_name       │       │ validity_end    │       │ transaction_type│
│ role            │       └─────────────────┘       │ module_type     │
│ status          │                                  │ created_at      │
└─────────────────┘                                  └─────────────────┘
        │
        │
        ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ user_features   │       │ user_actions    │       │discovery_searches│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ user_id         │       │ user_id         │       │ user_id         │
│ feature_name    │       │ action_name     │       │ platform        │
│ is_enabled      │       │ is_enabled      │       │ filters         │
└─────────────────┘       └─────────────────┘       │ results_count   │
                                                     └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│cached_influencer│       │unlocked_profiles│
│    _profiles    │       ├─────────────────┤
├─────────────────┤       │ id              │
│ id              │◄──────│ profile_id      │
│ platform        │       │ user_id         │
│ username        │       │ unlocked_at     │
│ follower_count  │       └─────────────────┘
│ engagement_rate │
│ location_country│
└─────────────────┘
```

## 8. Security Architecture

### 8.1 Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Feature-level permissions
- Session management with token refresh

### 8.2 Data Security
- Passwords hashed with bcrypt (cost factor 12)
- HTTPS/TLS for all communications
- Database encryption at rest
- PII data handling compliance

### 8.3 API Security
- Rate limiting per user/IP
- Request validation and sanitization
- CORS configuration
- SQL injection prevention via ORM

## 9. Scalability Considerations

### 9.1 Horizontal Scaling
- Stateless API design enables multiple instances
- Database connection pooling
- Load balancer distribution

### 9.2 Caching Strategy
- Redis for session/frequently accessed data
- Local cache for influencer profiles
- CDN caching for static assets

### 9.3 Database Optimization
- Indexed queries for search operations
- Read replicas for analytics queries
- Partitioning for large tables

## 10. Integration Points

### 10.1 Modash API
- Primary source for influencer data
- Rate-limited API calls
- Response caching to minimize costs

### 10.2 Email Service
- Transactional emails (signup, password reset)
- Notification emails (credit alerts, expiry)

### 10.3 Payment Gateway (Future)
- Subscription management
- Credit top-ups
- Invoice generation

## 11. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response Time | < 500ms (95th percentile) |
| Availability | 99.9% uptime |
| Concurrent Users | 1000+ |
| Data Retention | 2 years |
| Backup Frequency | Daily |
| Recovery Time | < 4 hours |

## 12. Future Roadmap

### Phase 1 (Current)
- Core discovery and insights
- Team management
- Credit system

### Phase 2
- Campaign tracking
- Advanced analytics
- Mobile app

### Phase 3
- AI-powered recommendations
- Competitor analysis
- API marketplace

---

## 13. Module: Influencer Insights

### 13.1 Overview

The Influencer Insights module provides deep analytics for influencers including audience demographics, engagement metrics, growth trends, and content analysis.

**Key Feature**: Smart caching system that stores insights locally and only fetches from Modash API if data is older than configurable threshold (default: 7 days).

### 13.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSIGHTS MODULE FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Request ──► Check Local Cache ──► Cache Hit?              │
│                                              │                   │
│                    ┌─────────────────────────┼──────────────┐   │
│                    │                         │              │   │
│                    ▼                         ▼              │   │
│              Data < 7 days            Data > 7 days         │   │
│                    │                    or Not Exists       │   │
│                    ▼                         │              │   │
│              Return Cached              Call Modash API     │   │
│              (0 credits)                     │              │   │
│                                              ▼              │   │
│                                        Store in DB          │   │
│                                              │              │   │
│                                              ▼              │   │
│                                        Deduct Credit        │   │
│                                        (1 credit)           │   │
│                                              │              │   │
│                                              ▼              │   │
│                                        Return Fresh Data    │   │
│                                                             │   │
└─────────────────────────────────────────────────────────────────┘
```

### 13.3 Tabs Structure

| Tab | Content |
|-----|---------|
| **Overview** | Stats, Growth Chart, Word Cloud, Lookalikes, Brand Affinity |
| **Engagement** | ER Distribution, Likes/Comments Spread, Top Hashtags |
| **Audience** | Followers + Engagers: Credibility, Demographics, Interests |
| **Posts** | Recent, Popular, Sponsored posts grid |
| **Reels** | Recent, Popular, Sponsored reels grid |

### 13.4 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| New Insight | 1 | First time viewing influencer |
| View Cached | 0 | Data exists and < TTL |
| Auto-Refresh | 0 | Stale data for unlocked influencer |
| Manual Refresh | 1 | User-requested refresh |
| Export PDF | 0.5 | Per export |

### 13.5 Caching Configuration

- **Config Key**: `INSIGHT_CACHE_TTL_DAYS`
- **Default Value**: 7 days
- **Configurable By**: Super Admin via System Settings
- **Storage**: `system_config` table

### 13.6 External API

**Modash Profile Report API**
```
GET /v1/{platform}/profile/{userId}/report
```

Returns:
- Basic profile info
- Audience demographics (gender, age, location)
- Engagement metrics
- Growth history
- Brand affinity
- Content analysis

---

## 14. Module: Campaign Tracking

### 14.1 Overview

The Campaign Tracking module enables users to create, manage, and track influencer marketing campaigns. It provides comprehensive campaign management including influencer assignments, deliverable tracking, performance metrics, and budget management.

**Key Features:**
- Campaign creation with objectives, budgets, and timelines
- Influencer assignment and management
- Deliverable tracking with status workflow
- Real-time performance metrics
- Budget utilization monitoring
- Team collaboration with sharing permissions

### 14.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAMPAIGN TRACKING MODULE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Campaigns Layer                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Campaign │  │Influencer│  │Deliverable│ │ Metrics │ │   │
│  │  │  CRUD    │  │Assignment│  │ Tracking │  │Tracking │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Data Aggregation                       │   │
│  │  • Performance metrics calculation                       │   │
│  │  • Budget utilization tracking                          │   │
│  │  • Deliverable status monitoring                        │   │
│  │  • Team visibility rules                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  campaigns | campaign_influencers | campaign_deliverables│   │
│  │  campaign_metrics | campaign_shares                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 14.3 Campaign Workflow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  DRAFT   │────►│  ACTIVE  │────►│ COMPLETED│     │ CANCELLED│
│          │     │          │     │          │     │          │
└──────────┘     └────┬─────┘     └──────────┘     └──────────┘
                      │
                      ▼
                ┌──────────┐
                │  PAUSED  │
                │          │
                └──────────┘
```

### 14.4 Tabs Structure (Frontend)

| Tab | Description | Content |
|-----|-------------|---------|
| **Created by Me** | User's own campaigns | Full edit/delete access |
| **Created by Team** | Team members' campaigns | View access, may have edit |
| **Shared with Me** | Campaigns shared by others | View/Edit based on permission |

### 14.5 Entity Relationships

```
                              ┌─────────────────┐
                              │    campaigns    │
                              ├─────────────────┤
                              │ id              │
                              │ name            │
                              │ platform        │
                              │ status          │
                              │ objective       │
                              │ budget          │
                              │ owner_id ───────┼──► users
                              └────────┬────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│campaign_influencers│       │campaign_deliverables│     │ campaign_shares │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ campaign_id     │         │ campaign_id     │         │ campaign_id     │
│ influencer_name │         │ deliverable_type│         │ shared_with_id  │
│ status          │         │ status          │         │ permission_level│
│ budget_allocated│         │ due_date        │         └─────────────────┘
│ payment_status  │         │ content_url     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ campaign_metrics │
           ├─────────────────┤
           │ impressions     │
           │ reach           │
           │ likes           │
           │ engagement_rate │
           └─────────────────┘
```

### 14.6 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Campaign | 1 | Per campaign creation |
| Add Influencer | 0 | Free to assign |
| Add Deliverable | 0 | Free to track |
| Record Metrics | 0 | Free to log |
| Share Campaign | 0 | Free collaboration |

### 14.7 Status Workflows

**Campaign Status:**
- `DRAFT` → Initial creation state
- `ACTIVE` → Campaign is running
- `PAUSED` → Temporarily halted
- `COMPLETED` → Campaign finished
- `CANCELLED` → Campaign abandoned

**Influencer Status:**
- `INVITED` → Sent invitation
- `CONFIRMED` → Accepted invitation
- `DECLINED` → Rejected invitation
- `ACTIVE` → Working on campaign
- `COMPLETED` → Finished deliverables

**Deliverable Status:**
- `PENDING` → Not started
- `IN_PROGRESS` → Being created
- `SUBMITTED` → Sent for review
- `APPROVED` → Approved by brand
- `REJECTED` → Needs revision
- `PUBLISHED` → Live on platform

### 14.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns` | List campaigns |
| GET | `/campaigns/dashboard` | Dashboard stats |
| GET | `/campaigns/:id` | Campaign details |
| PATCH | `/campaigns/:id` | Update campaign |
| DELETE | `/campaigns/:id` | Delete campaign |
| POST | `/campaigns/:id/influencers` | Add influencer |
| GET | `/campaigns/:id/influencers` | List influencers |
| PATCH | `/campaigns/:id/influencers/:iid` | Update influencer |
| DELETE | `/campaigns/:id/influencers/:iid` | Remove influencer |
| POST | `/campaigns/:id/deliverables` | Add deliverable |
| GET | `/campaigns/:id/deliverables` | List deliverables |
| PATCH | `/campaigns/:id/deliverables/:did` | Update deliverable |
| DELETE | `/campaigns/:id/deliverables/:did` | Delete deliverable |
| POST | `/campaigns/:id/metrics` | Record metrics |
| GET | `/campaigns/:id/metrics` | Get metrics summary |
| POST | `/campaigns/:id/share` | Share campaign |
| DELETE | `/campaigns/:id/share/:sid` | Remove share |

### 14.9 Dashboard Metrics

The dashboard provides aggregated statistics:
- **Campaign Stats**: Total, by status
- **Influencer Stats**: Total, by status
- **Deliverable Stats**: Total, by status
- **Budget Stats**: Total budget, spent, utilization %

---

## 15. Module: FAQs & Static Content

### 15.1 Overview

The FAQs and Static Content module provides users with access to frequently asked questions, privacy policy, and terms & conditions. FAQs are organized by categories to help users find answers quickly.

### 15.2 FAQ Categories

| Category | Description | FAQ Count |
|----------|-------------|-----------|
| General | General questions about SocialTweebs platform | 5 |
| Influencer Discovery | Questions about finding and discovering influencers | 14 |
| Influencer Insights | Questions about influencer analytics and insights | 23 |

### 15.3 Features

- **Categorized FAQs**: Questions organized by topic for easy navigation
- **Search Functionality**: Search across all FAQs by keyword
- **Expandable Answers**: Click to expand/collapse FAQ answers
- **Privacy Policy**: Full privacy policy with section navigation
- **Terms & Conditions**: Complete terms of service

### 15.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content/faqs` | Get all FAQs grouped by category |
| GET | `/content/faqs/categories` | Get FAQ categories with counts |
| GET | `/content/faqs/search?q=` | Search FAQs by keyword |
| GET | `/content/faqs/category/:slug` | Get FAQs by category slug |
| GET | `/content/faqs/:id` | Get single FAQ |
| GET | `/content/privacy-policy` | Get Privacy Policy |
| GET | `/content/terms-conditions` | Get Terms & Conditions |
| GET | `/content/page/:slug` | Get static page by slug |

### 15.5 Database Tables

- **faq_categories**: FAQ category definitions (name, slug, description)
- **faqs**: Individual FAQ questions and answers
- **static_content**: Privacy Policy, Terms & Conditions content

---

## 16. Module: Audience Overlap

### 16.1 Overview

The Audience Overlap module allows users to compare the audience overlap between multiple influencers. This helps brands understand how much unique reach they can achieve by working with different influencers versus overlapping audiences.

### 16.2 Key Features

- **Report Creation**: Create reports with 2-10 influencers per platform
- **Platform Support**: Instagram and YouTube
- **Status Tracking**: PENDING → IN_PROCESS → COMPLETED/FAILED
- **Metrics Calculation**: Total followers, unique followers, overlapping followers, percentages
- **Visualization**: Venn diagram style overlap visualization
- **Sharing**: Public URL sharing and team sharing

### 16.3 Report Workflow

```
User Creates Report (1 credit)
         │
         ▼
    ┌─────────┐    Another report in process?
    │ PENDING │◄───────── YES
    └────┬────┘
         │ NO
         ▼
  ┌────────────┐
  │ IN_PROCESS │ Analyzing audience data...
  └──────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
                  │
                  ▼
              Retry (1 credit)
```

### 16.4 Dashboard Statistics

- Total Reports
- Completed Reports
- In Process Reports
- Pending Reports
- Failed Reports
- Reports This Month
- Remaining Quota

### 16.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/audience-overlap` | Create new report |
| GET | `/audience-overlap` | List reports |
| GET | `/audience-overlap/dashboard` | Dashboard stats |
| GET | `/audience-overlap/:id` | Report details |
| PATCH | `/audience-overlap/:id` | Update report |
| DELETE | `/audience-overlap/:id` | Delete report |
| POST | `/audience-overlap/:id/retry` | Retry failed report |
| POST | `/audience-overlap/:id/share` | Share report |
| GET | `/audience-overlap/shared/:token` | Public shared report |

### 16.6 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 | Per report creation |
| Retry Report | 1 | Per retry attempt |
| View Report | 0 | Free |
| Share Report | 0 | Free |

### 16.7 Report Output

- **Summary Cards**: Total, Unique, Overlapping followers
- **Overlap Percentage**: Overall overlap rate
- **Unique Rate**: Percentage of unique audience
- **Influencer Table**: Individual metrics per influencer
- **Visualization**: Overlap bubble/Venn diagram

---

## 17. Module: Custom ER Calculator

### 17.1 Overview

The Custom ER Calculator allows users to calculate the engagement rate for a specific influencer over a custom date range. This module is **FREE** - no credits are deducted. It analyzes posts within the specified period and provides detailed engagement metrics.

### 17.2 Key Features

- **Single Influencer Analysis**: Analyze one influencer per report
- **Custom Date Range**: Select any period up to 1 year
- **All Posts Analysis**: Total posts, likes, views, comments, shares
- **Sponsored Posts Detection**: Separate metrics for sponsored content
- **Post-Level Details**: View individual posts with metrics
- **Charts & Visualization**: Posts over time comparison
- **Free Service**: No credits required

### 17.3 Report Workflow

```
User Creates Report (FREE)
         │
         ▼
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
         ▼
  ┌────────────┐
  │ PROCESSING │ Fetching posts...
  └──────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
```

### 17.4 Engagement Metrics

**All Posts Section:**
- Total Posts Count
- Total Likes Count
- Total Views Count
- Total Comments Count
- Total Shares Count
- Average Engagement Rate (%)
- Engagements/Views Rate (%)

**Sponsored Posts Section** (if detected):
- Same metrics as All Posts
- Only shown if influencer has sponsored content

### 17.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/custom-er` | Create new report (FREE) |
| GET | `/custom-er` | List reports |
| GET | `/custom-er/dashboard` | Dashboard stats |
| GET | `/custom-er/:id` | Report details |
| GET | `/custom-er/:id/posts` | Get posts (filter sponsored) |
| PATCH | `/custom-er/:id` | Update visibility |
| DELETE | `/custom-er/:id` | Delete report |
| POST | `/custom-er/:id/share` | Share report |

### 17.6 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | **0** | FREE |
| View Report | 0 | Free |
| Share Report | 0 | Free |

### 17.7 Post Card Display

Each post shows:
- Thumbnail image
- Post description (with hashtags and mentions)
- Likes count
- Comments count
- Views count
- Sponsored badge (if applicable)
- Link to original post

---

## 18. Module: Social Sentiments

### 18.1 Overview

The Social Sentiments module enables users to perform sentiment analysis on Instagram and TikTok posts or profiles. It analyzes comments and interactions to provide insights into audience sentiment, emotions distribution, and popular keywords.

**Key Features:**
- Analyze sentiment from individual posts or entire profiles
- Support for Instagram and TikTok platforms
- Deep brand analysis for sponsored content
- Emotions distribution chart
- Word cloud visualization
- Team collaboration and sharing

### 18.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  SOCIAL SENTIMENTS MODULE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Reports Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Report   │  │  Post    │  │ Emotion  │  │  Word   │ │   │
│  │  │   CRUD   │  │ Analysis │  │ Analysis │  │  Cloud  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Analysis Engine                        │   │
│  │  • Comment sentiment classification                      │   │
│  │  • Emotion detection (love, joy, anger, etc.)           │   │
│  │  • Word frequency analysis                              │   │
│  │  • Brand mention tracking                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  sentiment_reports | sentiment_posts | sentiment_emotions│   │
│  │  sentiment_wordcloud | sentiment_shares                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 18.3 Report Workflow

```
User Creates Report (1 credit per URL)
         │
         ▼
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
         ▼
  ┌─────────────┐
  │ AGGREGATING │ Fetching comments...
  └──────┬──────┘
         │
         ▼
  ┌────────────┐
  │ IN_PROCESS │ Analyzing sentiment...
  └──────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
```

### 18.4 Report Types

| Type | Description | Use Case |
|------|-------------|----------|
| **POST** | Analyze a single post | Campaign performance, viral content analysis |
| **PROFILE** | Analyze all posts from a profile | Overall influencer sentiment health |

### 18.5 Dashboard Statistics

- Total Reports
- Completed Reports
- Processing Reports
- Pending Reports
- Failed Reports
- Reports This Month
- Average Sentiment Score

### 18.6 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sentiments` | Create new report |
| GET | `/sentiments` | List reports with filters |
| GET | `/sentiments/dashboard` | Dashboard stats |
| GET | `/sentiments/:id` | Report details |
| PATCH | `/sentiments/:id` | Update report (title, visibility) |
| DELETE | `/sentiments/:id` | Delete report |
| POST | `/sentiments/bulk-delete` | Bulk delete reports |
| POST | `/sentiments/:id/share` | Share report |
| GET | `/sentiments/shared/:token` | Public shared report |

### 18.7 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 per URL | Each URL analyzed costs 1 credit |
| View Report | 0 | Free |
| Share Report | 0 | Free |
| Delete Report | 0 | Free |

### 18.8 Sentiment Analytics

**Sentiment Distribution:**
- Positive percentage
- Neutral percentage
- Negative percentage
- Overall sentiment score

**Emotions Distribution:**
- Love
- Joy
- Admiration
- Neutral
- Disappointment
- Anger

**Word Cloud:**
- Most used words in comments
- Color-coded by sentiment (positive/neutral/negative)
- Font size based on frequency

### 18.9 Deep Brand Analysis

When enabled for POST reports:
- Brand Name tracking
- Brand Username mentions
- Product Name analysis
- Brand-specific sentiment breakdown

### 18.10 Filtering Options

| Filter | Options |
|--------|---------|
| Platform | All, Instagram, TikTok |
| Report Type | All, Post, Profile |
| Status | All, Pending, Aggregating, In Process, Completed, Failed |
| Created By | All, Me, Team |
| Search | By title or influencer name |

---

## 19. Module: Influencer Collab Check

### 19.1 Overview

The Influencer Collab Check module allows users to analyze influencer collaboration reports with brands. Users can search for posts containing specific keywords, hashtags, or mentions across selected influencers over a customizable time period.

**Key Features:**
- Analyze brand collaborations by searching posts with specific keywords/hashtags/mentions
- Support for single or multiple influencers (up to 10)
- Time period options: 1 month, 3 months, 6 months, 1 year
- Status tracking: PENDING → PROCESSING → COMPLETED/FAILED
- Comprehensive metrics: posts, likes, views, comments, shares, engagement rate
- Posts visualization with matched keywords highlighted
- Chart visualization of posts over time
- Team collaboration and sharing

### 19.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 INFLUENCER COLLAB CHECK MODULE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Reports Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Report   │  │Influencer│  │   Post   │  │  Chart  │ │   │
│  │  │   CRUD   │  │ Analysis │  │ Analysis │  │  Data   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Analysis Engine                        │   │
│  │  • Keyword/hashtag/mention matching                     │   │
│  │  • Post metrics aggregation                             │   │
│  │  • Engagement rate calculation                          │   │
│  │  • Time-based filtering                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  collab_check_reports | collab_check_influencers        │   │
│  │  collab_check_posts | collab_check_shares               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 19.3 Report Workflow

```
User Creates Report (1 credit per influencer)
         │
         ▼
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
         ▼
  ┌────────────┐
  │ PROCESSING │ Fetching & analyzing posts...
  └──────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
                  │
                  ▼
              Retry (1 credit per influencer)
```

### 19.4 Dashboard Statistics

- Total Reports
- Completed Reports
- Processing Reports
- Pending Reports
- Failed Reports
- Reports This Month
- Total Posts Analyzed
- Average Engagement Rate

### 19.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/collab-check` | Create new report |
| GET | `/collab-check` | List reports with filters |
| GET | `/collab-check/dashboard` | Dashboard stats |
| GET | `/collab-check/search/influencers` | Search influencers |
| GET | `/collab-check/:id` | Report details |
| GET | `/collab-check/:id/chart-data` | Chart data |
| PATCH | `/collab-check/:id` | Update report |
| DELETE | `/collab-check/:id` | Delete report |
| POST | `/collab-check/:id/retry` | Retry failed report |
| POST | `/collab-check/:id/share` | Share report |
| GET | `/collab-check/shared/:token` | Public shared report |

### 19.6 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 per influencer | Each influencer analyzed costs 1 credit |
| Retry Report | 1 per influencer | Same cost as creation |
| View Report | 0 | Free |
| Share Report | 0 | Free |

### 19.7 Time Period Options

| Period | Description |
|--------|-------------|
| 1_MONTH | Last 30 days |
| 3_MONTHS | Last 90 days |
| 6_MONTHS | Last 180 days |
| 1_YEAR | Last 365 days |

### 19.8 Report Output

**Summary Cards:**
- Posts Count
- Likes Count
- Views Count
- Comments Count
- Shares Count
- Average Engagement Rate (%)

**Chart Visualization:**
- Posts vs Date chart showing posting activity
- X-axis: Dates within selected period
- Y-axis: Post counts, likes, views

**Posts Grid:**
- Post thumbnail
- Post description (with matched keywords highlighted)
- Likes, Comments, Views, Shares
- Engagement Rate
- View Post button (links to original)

### 19.9 Filtering Options

| Filter | Options |
|--------|---------|
| Platform | All, Instagram, TikTok |
| Status | All, Pending, Processing, Completed, Failed |
| Created By | All, Me, Team |
| Search | By title or keyword |

---

## 20. Module: Influencer Tie Breaker

### 20.1 Overview

The Influencer Tie Breaker module allows users to compare up to 3 influencers side-by-side. This tool helps brands and agencies make informed decisions when choosing between similar influencers by providing comprehensive analytics comparison across multiple data points.

**Key Features:**
- Compare 2-3 influencers from the same platform
- Side-by-side analytics comparison
- Followers' and Engagers' audience demographics
- Top posts comparison with engagement metrics
- PDF download for sharing
- Credit-based unlock system

### 20.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 INFLUENCER TIE BREAKER MODULE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Comparison Layer                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Search   │  │Selection │  │Comparison│  │Download │ │   │
│  │  │Influencer│  │  (2-3)   │  │  Result  │  │   PDF   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Data Aggregation                       │   │
│  │  • Overview metrics (followers, likes, views, ER)       │   │
│  │  • Followers' audience demographics                     │   │
│  │  • Engagers' audience demographics                      │   │
│  │  • Top 10 posts (organic + sponsored)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  tie_breaker_comparisons | tie_breaker_influencers      │   │
│  │  tie_breaker_shares                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 20.3 Comparison Workflow

```
User Searches Influencers
         │
         ▼
    ┌─────────┐
    │ SELECT  │ (Choose 2-3 influencers)
    │ PLATFORM│ (Same platform only)
    └────┬────┘
         │
         ▼
  ┌──────────────┐    Unlocked?
  │CHECK UNBLUR  │◄──── YES ──► Free
  │   STATUS     │
  └──────┬───────┘
         │ NO
         ▼
  ┌─────────────┐
  │DEDUCT CREDIT│ (1 credit per unblurred)
  │   UNLOCK    │
  └──────┬──────┘
         │
         ▼
  ┌────────────┐
  │ PROCESSING │ Fetching audience data...
  └──────┬─────┘
         │
         ▼
  ┌───────────┐
  │ COMPLETED │ Show comparison results
  └───────────┘
```

### 20.4 Comparison Data Points

#### Instagram Platform:
| Category | Data Points |
|----------|-------------|
| **Overview** | Followers, Avg Likes, Avg Views, Avg Reel Views, Engagement Rate |
| **Followers' Audience** | Quality %, Notable %, Gender, Age, Countries, Cities, Interests |
| **Engagers' Audience** | Quality %, Notable %, Gender, Age, Countries, Cities, Interests |
| **Top Posts** | 10 posts with likes, comments, views, ER, sponsored indicator |

#### YouTube/TikTok Platform:
| Category | Data Points |
|----------|-------------|
| **Overview** | Subscribers, Avg Likes, Avg Views, Avg Comments, Engagement Rate |
| **Followers' Audience** | Notable %, Gender, Age, Countries |
| **Commenters' Audience** | Gender, Age, Countries |
| **Top Posts** | 10 videos with likes, comments, views, ER, sponsored indicator |

### 20.5 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Compare (unlocked influencer) | 0 | Already unlocked by user |
| Compare (new influencer) | 1 per influencer | Unlocks globally for user |
| View Comparison | 0 | Free |
| Download PDF | 0 | Free |
| Share Comparison | 0 | Free |

### 20.6 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tie-breaker` | Create comparison (2-3 influencers) |
| GET | `/tie-breaker` | List comparisons |
| GET | `/tie-breaker/dashboard` | Dashboard stats |
| GET | `/tie-breaker/search/influencers` | Search influencers |
| GET | `/tie-breaker/:id` | Comparison details |
| GET | `/tie-breaker/:id/download` | Download data for PDF |
| PATCH | `/tie-breaker/:id` | Update title/visibility |
| DELETE | `/tie-breaker/:id` | Delete comparison |
| POST | `/tie-breaker/:id/share` | Share comparison |
| GET | `/tie-breaker/shared/:token` | Public shared comparison |

### 20.7 Dashboard Metrics

- Total Comparisons
- Completed Comparisons
- Processing Comparisons
- Pending Comparisons
- Failed Comparisons
- Comparisons This Month
- Total Influencers Compared
- Total Credits Used

---

## 21. Module: Generated Reports

### 20.1 Overview

The Generated Reports module provides a centralized location for users to view, manage, and re-download reports generated from other modules. It consolidates exported data from Influencer Discovery and Paid Collaboration features.

**Key Features:**
- Two tabs: Influencer Discovery exports & Paid Collaboration reports
- Report listing with search and filters
- Re-download reports (CSV, XLSX, PDF based on type)
- Rename reports
- Delete individual or bulk reports
- Role-based access control

### 20.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   GENERATED REPORTS MODULE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                       Tabs View                          │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   │   │
│  │  │   Influencer    │  │      Paid Collaboration     │   │   │
│  │  │   Discovery     │  │          Reports            │   │   │
│  │  └─────────────────┘  └─────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Report Actions                        │   │
│  │  • Re-download  • Rename  • Delete  • Bulk Delete       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  discovery_exports | paid_collaboration_reports          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 20.3 Tabs Structure

| Tab | Description | Content |
|-----|-------------|---------|
| **Influencer Discovery** | Exported influencer profiles | CSV/XLSX/JSON exports from discovery searches |
| **Paid Collaboration** | Generated collaboration reports | PDF/XLSX reports from paid collaboration analysis |

### 20.4 Report Listing Columns

| Column | Description |
|--------|-------------|
| Checkbox | For multi-select/bulk operations |
| Platform | Instagram, YouTube, TikTok icon |
| Report Title | Editable report name |
| Format | CSV, XLSX, JSON, PDF badge |
| Profiles/Influencers | Count of exported/analyzed items |
| Created | Date of report generation |
| Actions | Re-download, Rename, Delete |

### 20.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/generated-reports` | List reports with filters |
| GET | `/generated-reports/dashboard` | Dashboard statistics |
| GET | `/generated-reports/:tab/:id` | Get report details |
| PATCH | `/generated-reports/:tab/:id/rename` | Rename report |
| DELETE | `/generated-reports/:tab/:id` | Delete report |
| POST | `/generated-reports/bulk-delete` | Bulk delete reports |
| POST | `/generated-reports/:tab/:id/download` | Re-download report |

### 20.6 Access Control

| Role | View Own | View Team | Edit Own | Delete Own | Edit Team |
|------|----------|-----------|----------|------------|-----------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| SUB_USER | ✓ | - | ✓ | ✓ | - |

### 20.7 Notifications

Toast messages displayed for user actions:
- "Report renamed successfully."
- "Report deleted successfully."
- "Your report has been downloaded."

### 20.8 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| View Reports | 0 | Free |
| Re-download | 0 | Free |
| Rename | 0 | Free |
| Delete | 0 | Free |

Note: Credits are deducted at the time of original export/report generation, not when accessing the Generated Reports module.

---

## 22. Module: Paid Collaboration

### 22.1 Overview

The Paid Collaboration module allows users to discover and analyze sponsored/collaboration posts made by influencers based on specific hashtags and/or mentions. Users can generate comprehensive reports showing influencer collaborations with brands over a customizable date range (up to 3 months).

**Key Features:**
- Search posts by hashtags and/or mentions
- Support for Instagram and TikTok platforms
- Date range filtering (up to 3 months)
- Influencer categorization by follower count (Nano, Micro, Macro, Mega)
- Comprehensive metrics and visualizations
- Team collaboration and sharing
- Sponsored posts filtering
- Export to PDF/XLSX

### 22.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PAID COLLABORATION MODULE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Reports Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Report   │  │ Hashtag  │  │ Mention  │  │  Chart  │ │   │
│  │  │   CRUD   │  │ Analysis │  │ Analysis │  │  Data   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Analysis Engine                        │   │
│  │  • Hashtag/mention matching                             │   │
│  │  • Influencer categorization (Nano/Micro/Macro/Mega)   │   │
│  │  • Engagement rate calculation                         │   │
│  │  • Sponsored post detection                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  paid_collab_reports | paid_collab_influencers          │   │
│  │  paid_collab_posts | paid_collab_categorizations        │   │
│  │  paid_collab_shares                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 22.3 Report Workflow

```
User Creates Report (1 credit)
         │
         ▼
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
         ▼
  ┌─────────────┐
  │ IN_PROGRESS │ Analyzing posts...
  └──────┬──────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
                  │
                  ▼
              Retry (1 credit)
```

### 22.4 Tabs Structure (Frontend)

| Tab | Description | Content |
|-----|-------------|---------|
| **Created by Me** | User's own reports | Full edit/delete access |
| **Created by Team** | Team members' reports | View access |
| **Shared with Me** | Reports shared by others | View/Edit based on permission |

### 22.5 Influencer Categorization

| Category | Follower Range | Description |
|----------|---------------|-------------|
| **Nano** | < 10K | Nano influencers |
| **Micro** | 10K - 100K | Micro influencers |
| **Macro** | 100K - 500K | Macro influencers |
| **Mega** | > 500K | Mega influencers |

### 22.6 Dashboard Statistics

- Total Reports
- Completed Reports
- In Progress Reports
- Pending Reports
- Failed Reports
- Reports This Month
- Total Influencers Analyzed
- Total Posts Analyzed
- Average Engagement Rate

### 22.7 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/paid-collaboration` | Create new report |
| GET | `/paid-collaboration` | List reports with filters |
| GET | `/paid-collaboration/dashboard` | Dashboard stats |
| GET | `/paid-collaboration/:id` | Report details |
| GET | `/paid-collaboration/:id/chart-data` | Chart data |
| GET | `/paid-collaboration/:id/posts` | Get posts with filters |
| GET | `/paid-collaboration/:id/influencers` | Get influencers with filters |
| PATCH | `/paid-collaboration/:id` | Update report |
| DELETE | `/paid-collaboration/:id` | Delete report |
| POST | `/paid-collaboration/:id/retry` | Retry failed report |
| POST | `/paid-collaboration/:id/share` | Share report |
| GET | `/paid-collaboration/shared/:token` | Public shared report |

### 22.8 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 | Per report creation |
| Retry Report | 1 | Per retry attempt |
| View Report | 0 | Free |
| Share Report | 0 | Free |
| Download Report | 0 | Free |

### 22.9 Report Detail Components

**Summary Cards:**
- Total Influencers Count
- Total Posts Count
- Total Likes
- Total Views
- Total Comments
- Total Shares
- Average Engagement Rate (%)
- Engagement/Views Rate (%)

**Chart Visualization:**
- Posts/Influencers vs Date growth chart
- X-axis: Dates within selected period
- Y-axis: Post counts, Influencer counts

**Influencer Categorization Table:**
| Column | Description |
|--------|-------------|
| Category | All, Nano, Micro, Macro, Mega |
| Accounts Count | Total influencers in category |
| Followers Count | Total followers |
| Posts | Total posts |
| Likes | Total likes |
| Views | Total views |
| Comments | Total comments |
| Shares | Total shares |
| Engagement Rate | Average ER for category |

### 22.10 Sorting Options

**Influencer List:**
- Recent / Oldest
- Least Liked / Most Liked (Default)
- Least Commented / Most Commented
- Lowest Credibility / Highest Credibility
- Lowest Followers / Highest Followers

**Posts List:**
- Same sorting options as influencer list
- Filter by Sponsored Only toggle
- Filter by Influencer Category

### 22.11 Filtering Options

| Filter | Options |
|--------|---------|
| Platform | All, Instagram, TikTok |
| Status | All, Pending, In Progress, Completed, Failed |
| Created By | Me, Team, Shared |
| Search | By title, hashtag, or mention |
| Sponsored Only | Toggle for posts list |
| Category | All, Nano, Micro, Macro, Mega |

---

## 23. Module: Influencer Groups

### 23.1 Overview

The Influencer Groups module enables users to create, manage, and organize influencer groups for campaign management. This module provides comprehensive features for group creation, influencer management, invitation workflows, and application processing.

**Key Features:**
- Create and manage influencer groups across platforms (Instagram, YouTube, TikTok)
- Add influencers manually, via XLSX import, or by importing from existing groups
- Bulk actions: copy to group, add to campaign, compute sentiments/overlap, remove
- Create customizable invitation forms with landing pages
- Manage influencer applications (approve/reject/bulk actions)
- Share groups with team members or via public URL
- Dashboard statistics and metrics

### 23.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  INFLUENCER GROUPS MODULE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Groups Layer                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Group    │  │Influencer│  │Invitation│  │Application│ │   │
│  │  │   CRUD   │  │Management│  │Management│  │Management │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Data Aggregation                       │   │
│  │  • Group membership tracking                            │   │
│  │  • Application status monitoring                        │   │
│  │  • Team visibility rules                                │   │
│  │  • Public share URL generation                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  influencer_groups | influencer_group_members            │   │
│  │  influencer_group_shares | group_invitations             │   │
│  │  group_invitation_applications                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 23.3 Tabs Structure (Frontend)

| Tab | Description | Content |
|-----|-------------|---------|
| **Created by Me** | User's own groups | Full edit/delete access |
| **Created by Team** | Team members' groups | View access |
| **Shared with Me** | Groups shared by others | View/Edit based on permission |

### 23.4 Entity Relationships

```
                              ┌─────────────────┐
                              │influencer_groups│
                              ├─────────────────┤
                              │ id              │
                              │ name            │
                              │ platforms       │
                              │ influencer_count│
                              │ unapproved_count│
                              │ owner_id ───────┼──► users
                              │ created_by ─────┼──► users
                              │ is_public       │
                              │ share_url_token │
                              └────────┬────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│influencer_group_    │   │influencer_group_    │   │ group_invitations   │
│     members         │   │     shares          │   │                     │
├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
│ group_id            │   │ group_id            │   │ group_id            │
│ influencer_name     │   │ shared_with_user_id │   │ invitation_name     │
│ platform            │   │ shared_by_user_id   │   │ invitation_type     │
│ follower_count      │   │ permission_level    │   │ url_slug            │
│ source              │   └─────────────────────┘   │ applications_count  │
│ added_by            │                             └──────────┬──────────┘
└─────────────────────┘                                        │
                                                               ▼
                                                  ┌─────────────────────┐
                                                  │group_invitation_    │
                                                  │   applications      │
                                                  ├─────────────────────┤
                                                  │ invitation_id       │
                                                  │ platform_username   │
                                                  │ status              │
                                                  │ approved_by         │
                                                  └─────────────────────┘
```

### 23.5 Invitation Types

| Type | Description | Workflow |
|------|-------------|----------|
| **LANDING_PAGE** | Full landing page with form | Landing Page → Application Form → Thank You |
| **FORM_ONLY** | Direct application form | Application Form → Thank You |

### 23.6 Application Status Workflow

```
   ┌─────────┐
   │ PENDING │ (New submission)
   └────┬────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
┌──────────┐ ┌──────────┐
│ APPROVED │ │ REJECTED │
└──────────┘ └──────────┘
```

### 23.7 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/influencer-groups` | Create group |
| GET | `/influencer-groups` | List groups |
| GET | `/influencer-groups/dashboard` | Dashboard stats |
| GET | `/influencer-groups/:id` | Group details |
| PATCH | `/influencer-groups/:id` | Update group |
| DELETE | `/influencer-groups/:id` | Delete group |
| POST | `/influencer-groups/:id/members` | Add influencer |
| POST | `/influencer-groups/:id/members/bulk` | Bulk add (XLSX) |
| POST | `/influencer-groups/:id/members/import` | Import from group |
| POST | `/influencer-groups/:id/members/copy` | Copy to another group |
| DELETE | `/influencer-groups/:id/members` | Remove influencers |
| GET | `/influencer-groups/:id/members` | List members |
| POST | `/influencer-groups/:id/share` | Share group |
| GET | `/influencer-groups/shared/:token` | Public shared group |
| POST | `/influencer-groups/:id/invitations` | Create invitation |
| GET | `/influencer-groups/invite/:slug` | Get invitation (public) |
| POST | `/influencer-groups/invite/:slug/apply` | Submit application (public) |
| POST | `/influencer-groups/:id/applications/:appId/approve` | Approve application |
| POST | `/influencer-groups/:id/applications/bulk-approve` | Bulk approve |

### 23.8 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Group | 0 | Free |
| Add Influencer | 0 | Free |
| Create Invitation | 0 | Free |
| All Operations | **0** | **Module is FREE** |

### 23.9 Dashboard Metrics

- Total Groups
- Total Influencers
- Pending Applications
- Groups by Platform
- Recent Groups

### 23.10 Share Permission Levels

| Permission | Capabilities |
|------------|--------------|
| **VIEW** | Can view group details and members |
| **EDIT** | Can add/remove members, create invitations |

---

## 24. Module: Report Insights & Metrics

### 24.1 Overview

The Report Insights & Metrics feature provides comprehensive analytics visualization and reporting capabilities for Paid Collaboration reports. It offers detailed metrics, interactive charts, influencer categorization, and advanced filtering options to help users understand campaign performance.

**Key Features:**
- Summary cards with key performance indicators (KPIs)
- Interactive chart visualization (Posts/Influencers vs Date Growth)
- Influencer categorization by follower count (Nano/Micro/Macro/Mega)
- Detailed influencer and posts lists with sorting/filtering
- Sponsored posts detection and filtering
- Export capabilities (PDF/XLSX)
- Team collaboration and sharing

### 24.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   REPORT INSIGHTS & METRICS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Metrics Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Summary  │  │  Chart   │  │ Category │  │  List   │ │   │
│  │  │  Cards   │  │   Data   │  │  Stats   │  │  Views  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Aggregation Engine                     │   │
│  │  • Total metrics calculation                            │   │
│  │  • Engagement rate computation                          │   │
│  │  • Category-wise aggregation (Nano/Micro/Macro/Mega)   │   │
│  │  • Time-series data preparation                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Data Sources                            │   │
│  │  paid_collab_reports | paid_collab_influencers          │   │
│  │  paid_collab_posts | paid_collab_categorizations        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 24.3 Summary Cards

The summary cards provide at-a-glance metrics for the report:

| Card | Description | Calculation |
|------|-------------|-------------|
| **Total Influencers** | Number of unique influencers | Count of distinct influencers |
| **Total Posts** | Total posts analyzed | Count of all posts |
| **Total Likes** | Combined likes across posts | Sum of all post likes |
| **Total Views** | Combined views across posts | Sum of all post views |
| **Total Comments** | Combined comments across posts | Sum of all post comments |
| **Total Shares** | Combined shares across posts | Sum of all post shares |
| **Avg Engagement Rate** | Average engagement percentage | (Likes + Comments) / (Posts × Avg Followers) × 100 |
| **Engagement/Views Rate** | Engagement to views ratio | (Likes + Comments) / Total Views × 100 |

### 24.4 Chart Visualization

**Posts & Influencers Over Time Chart:**
- X-axis: Date within the report's date range
- Y-axis (primary): Number of posts
- Y-axis (secondary): Number of influencers
- Additional series: Likes and views trends

```
Chart Data Structure:
{
  date: string,
  postsCount: number,
  influencersCount: number,
  likesCount: number,
  viewsCount: number
}
```

### 24.5 Influencer Categorization Table

Categories based on follower count:

| Category | Follower Range | Color Code |
|----------|---------------|------------|
| **ALL** | All influencers | Gray |
| **NANO** | < 10,000 | Green |
| **MICRO** | 10,000 - 100,000 | Blue |
| **MACRO** | 100,000 - 500,000 | Purple |
| **MEGA** | > 500,000 | Orange |

Table columns:
- Category badge
- Accounts count
- Followers count (total)
- Posts count
- Likes count
- Views count
- Comments count
- Shares count
- Engagement Rate (%)

### 24.6 Tabs Structure

| Tab | Description | Features |
|-----|-------------|----------|
| **Overview** | Summary and charts | Chart visualization, categorization table |
| **Influencers** | Influencer list | Sortable, filterable by category |
| **Posts** | Posts grid | Sortable, filterable, sponsored toggle |

### 24.7 Filtering & Sorting Options

**Influencer List Sorting:**
- Most/Least Liked
- Most/Least Followers
- Highest/Lowest ER
- Highest/Lowest Credibility
- Recent/Oldest

**Posts List Sorting:**
- Most/Least Liked
- Most/Least Viewed
- Newest/Oldest

**Filter Options:**
- Category: ALL, NANO, MICRO, MACRO, MEGA
- Sponsored Only toggle (for posts)
- Search by name/keyword

### 24.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/paid-collaboration/:id` | Get report with insights |
| GET | `/paid-collaboration/:id/chart-data` | Get chart time-series data |
| GET | `/paid-collaboration/:id/posts` | Get posts with filters |
| GET | `/paid-collaboration/:id/influencers` | Get influencers with filters |

### 24.9 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| View Insights | 0 | Free - included in report |
| Download PDF | 0 | Free |
| Download XLSX | 0 | Free |

Note: Credits are deducted at report creation time (1 credit), insights viewing is free.

### 24.10 Export Options

**PDF Export includes:**
- Report header with title and date range
- Summary cards
- Chart visualization
- Categorization table
- Top influencers list

**XLSX Export includes:**
- Summary sheet with metrics
- Influencers sheet with all columns
- Posts sheet with all data
- Categorization sheet

---

## 25. Module: Mention Tracking

### 25.1 Overview

The Mention Tracking module allows users to track and analyze posts that mention specific hashtags, usernames (@mentions), or keywords across social media platforms. This tool helps brands monitor their mentions and track influencer content related to their campaigns.

**Key Features:**
- Track posts by hashtags, @mentions, and keywords
- Support for Instagram, TikTok (hashtags/mentions only), and YouTube (keywords only)
- Custom date range analysis (up to 3 months)
- Influencer categorization (Nano, Micro, Macro, Mega)
- Comprehensive metrics and engagement analysis
- Sponsored posts filtering
- Auto-refresh capability
- Team collaboration and sharing
- Public report sharing

### 25.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MENTION TRACKING MODULE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Reports Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Report   │  │Influencer│  │   Post   │  │  Chart  │ │   │
│  │  │   CRUD   │  │ Analysis │  │ Analysis │  │  Data   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Analysis Engine                        │   │
│  │  • Hashtag/mention/keyword matching                     │   │
│  │  • Influencer categorization (Nano/Micro/Macro/Mega)   │   │
│  │  • Engagement rate calculation                         │   │
│  │  • Sponsored post detection                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  mention_tracking_reports | mention_tracking_influencers │   │
│  │  mention_tracking_posts | mention_tracking_shares        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 25.3 Report Workflow

```
User Creates Report (1 credit)
         │
         ▼
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
         ▼
  ┌────────────┐
  │ PROCESSING │ Analyzing posts by hashtags/mentions/keywords...
  └──────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
                  │
                  ▼
              Retry (1 credit)
```

### 25.4 Tabs Structure (Frontend)

| Tab | Description | Content |
|-----|-------------|---------|
| **Created by Me** | User's own reports | Full edit/delete access |
| **Created by Team** | Team members' reports | View access |
| **Shared with Me** | Reports shared by others | View/Edit based on permission |
| **Public Reports** | Reports marked as public | View access |

### 25.5 Platform Rules

| Platform | Hashtags | Usernames | Keywords |
|----------|----------|-----------|----------|
| **Instagram** | ✓ | ✓ | ✓ |
| **TikTok** | ✓ | ✓ | ✗ |
| **YouTube** | ✗ | ✗ | ✓ |

**Combination Rules:**
- Instagram + TikTok can be combined
- YouTube must be used alone (cannot combine with other platforms)
- Hashtags and Keywords are mutually exclusive (cannot use both)

### 25.6 Dashboard Statistics

- Total Reports
- Completed Reports
- Processing Reports
- Pending Reports
- Failed Reports
- Reports This Month
- Total Influencers Analyzed
- Total Posts Analyzed
- Average Engagement Rate

### 25.7 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mention-tracking` | Create new report |
| GET | `/mention-tracking` | List reports with filters |
| GET | `/mention-tracking/dashboard` | Dashboard stats |
| GET | `/mention-tracking/:id` | Report details |
| GET | `/mention-tracking/:id/chart-data` | Chart data |
| GET | `/mention-tracking/:id/posts` | Get posts with filters |
| GET | `/mention-tracking/:id/influencers` | Get influencers with filters |
| PATCH | `/mention-tracking/:id` | Update report |
| DELETE | `/mention-tracking/:id` | Delete report |
| POST | `/mention-tracking/bulk-delete` | Bulk delete reports |
| POST | `/mention-tracking/:id/retry` | Retry failed report |
| POST | `/mention-tracking/:id/share` | Share report |
| GET | `/mention-tracking/shared/:token` | Public shared report |

### 25.8 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 | Per report creation |
| Retry Report | 1 | Per retry attempt |
| View Report | 0 | Free |
| Share Report | 0 | Free |
| Download Report | 0 | Free |

### 25.9 Report Output

**Summary Cards:**
- Total Influencers Count
- Total Posts Count
- Total Likes
- Total Views
- Total Comments
- Total Shares
- Average Engagement Rate (%)
- Engagement/Views Rate (%)

**Chart Visualization:**
- Posts/Influencers vs Date growth chart
- X-axis: Dates within selected period
- Y-axis: Post counts, Influencer counts

**Influencer Categorization Table:**
| Category | Follower Range | Description |
|----------|---------------|-------------|
| **Nano** | < 10K | Nano influencers |
| **Micro** | 10K - 100K | Micro influencers |
| **Macro** | 100K - 500K | Macro influencers |
| **Mega** | > 500K | Mega influencers |

### 25.10 Filtering Options

| Filter | Options |
|--------|---------|
| Platform | All, Instagram, TikTok, YouTube |
| Status | All, Pending, Processing, Completed, Failed |
| Created By | Me, Team, Shared, Public |
| Category | All, Nano, Micro, Macro, Mega |
| Sponsored Only | Toggle for posts list |
| Search | By title, hashtag, username, or keyword |

### 25.11 Sorting Options

**Influencer List:**
- Most/Least Liked
- Most/Least Followers
- Highest/Lowest ER
- Highest/Lowest Credibility
- Recent/Oldest

**Posts List:**
- Most/Least Liked
- Most/Least Viewed
- Most/Least Comments
- Newest/Oldest

### 25.12 Auto-Refresh Feature

- Users can enable auto-refresh to track mentions into the future
- When enabled, the report automatically refreshes daily
- Date range extends from current date to next 1-3 months
- No additional credits charged for auto-refresh updates

---

## 26. Module: Competition Analysis

### 26.1 Overview

The Competition Analysis module enables users to compare the influencer marketing performance of 2-5 brands over a customizable date range. It provides comprehensive brand-vs-brand comparison including influencer engagement, post metrics, category breakdown, and post type distribution.

**Key Features:**
- Compare 2-5 brands in a single report
- Track by hashtags, usernames (@mentions), and keywords per brand
- Support for Instagram and TikTok platforms
- Posts over time chart (per brand color)
- Influencer categorization (Nano, Micro, Macro, Mega) per brand
- Post type breakdown (Photo, Video, Carousel, Reel) per brand
- Auto-refresh capability for ongoing tracking
- Team collaboration and sharing
- Export to PDF/XLSX

### 26.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPETITION ANALYSIS MODULE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Reports Layer                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Report   │  │  Brand   │  │Influencer│  │  Post   │ │   │
│  │  │   CRUD   │  │ Analysis │  │ Analysis │  │Analysis │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Analysis Engine                        │   │
│  │  • Multi-brand hashtag/mention/keyword matching         │   │
│  │  • Brand-wise influencer categorization                 │   │
│  │  • Post type distribution per brand                     │   │
│  │  • Engagement rate comparison                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Database Tables                         │   │
│  │  competition_analysis_reports | competition_brands       │   │
│  │  competition_influencers | competition_posts             │   │
│  │  competition_shares                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 26.3 Report Workflow

```
User Creates Report (1 credit, 2-5 brands)
         │
         ▼
    ┌─────────┐
    │ PENDING │
    └────┬────┘
         │
         ▼
  ┌─────────────┐
  │ IN_PROGRESS │ Analyzing brands...
  └──────┬──────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────────┐ ┌────────┐
│ COMPLETED │ │ FAILED │
└───────────┘ └────────┘
                  │
                  ▼
              Retry (1 credit)
```

### 26.4 Tabs Structure (Frontend)

| Tab | Description | Content |
|-----|-------------|---------|
| **Created by Me** | User's own reports | Full edit/delete access |
| **Created by Team** | Team members' reports | View access |
| **Shared with Me** | Reports shared by others | View/Edit based on permission |

### 26.5 Entity Relationships

```
                              ┌─────────────────────────┐
                              │competition_analysis_    │
                              │       reports           │
                              ├─────────────────────────┤
                              │ id                      │
                              │ title                   │
                              │ platforms               │
                              │ status                  │
                              │ date_range_start/end    │
                              │ total_brands/posts/etc  │
                              │ owner_id ───────────────┼──► users
                              └───────────┬─────────────┘
                                          │
           ┌──────────────────────────────┼──────────────────────────────┐
           │                              │                              │
           ▼                              ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│ competition_brands  │       │competition_influencers│     │ competition_shares  │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ report_id           │       │ report_id           │       │ report_id           │
│ brand_name          │◄──────│ brand_id            │       │ shared_with_id      │
│ hashtags            │       │ influencer_name     │       │ permission_level    │
│ username            │       │ category            │       └─────────────────────┘
│ keywords            │       │ follower_count      │
│ display_color       │       │ posts_count         │
│ metrics...          │       │ metrics...          │
└─────────┬───────────┘       └─────────┬───────────┘
          │                             │
          │                             ▼
          │                   ┌─────────────────────┐
          │                   │ competition_posts   │
          └──────────────────►├─────────────────────┤
                              │ report_id           │
                              │ brand_id            │
                              │ influencer_id       │
                              │ post_type           │
                              │ matched_hashtags    │
                              │ metrics...          │
                              └─────────────────────┘
```

### 26.6 Brand Input Fields

Each brand (2-5) includes:
| Field | Description | Required |
|-------|-------------|----------|
| Brand Name | Display name for the brand | Yes |
| Hashtags | List of hashtags to track | Optional |
| Username | @mention to track | Optional |
| Keywords | Search keywords | Optional |

**Note:** At least one of hashtags, username, or keywords is required per brand.

### 26.7 Dashboard Statistics

- Total Reports
- Completed Reports
- In Progress Reports
- Pending Reports
- Failed Reports
- Reports This Month
- Total Brands Analyzed
- Total Influencers Analyzed
- Total Posts Analyzed
- Average Engagement Rate

### 26.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/competition-analysis` | Create new report (2-5 brands) |
| GET | `/competition-analysis` | List reports with filters |
| GET | `/competition-analysis/dashboard` | Dashboard stats |
| GET | `/competition-analysis/:id` | Report details |
| GET | `/competition-analysis/:id/chart-data` | Posts over time per brand |
| GET | `/competition-analysis/:id/posts` | Get posts with filters |
| GET | `/competition-analysis/:id/influencers` | Get influencers with filters |
| PATCH | `/competition-analysis/:id` | Update report |
| DELETE | `/competition-analysis/:id` | Delete report |
| POST | `/competition-analysis/bulk-delete` | Bulk delete reports |
| POST | `/competition-analysis/:id/retry` | Retry failed report |
| POST | `/competition-analysis/:id/share` | Share report |
| GET | `/competition-analysis/shared/:token` | Public shared report |

### 26.9 Credit Rules

| Action | Credits | Notes |
|--------|---------|-------|
| Create Report | 1 | Per report creation (regardless of brand count) |
| Retry Report | 1 | Per retry attempt |
| View Report | 0 | Free |
| Share Report | 0 | Free |
| Download Report | 0 | Free |

### 26.10 Report Detail Components

**Brand Overview Table:**
| Column | Description |
|--------|-------------|
| Brand | Brand name with color indicator |
| Hashtags | Tracked hashtags |
| Username | Tracked @mention |
| Keywords | Tracked keywords |
| Influencers | Count per brand |
| Posts | Count per brand |
| Likes | Total per brand |
| Views | Total per brand |
| Engagement Rate | Average per brand |

**Posts Over Time Chart:**
- X-axis: Dates in selected range
- Y-axis: Posts count
- Each brand as separate colored line
- Legend showing brand names and colors

**Influencer Category Breakdown:**
Per brand tabs showing:
- ALL: Combined stats
- NANO (<10K): Stats for nano influencers
- MICRO (10K-100K): Stats for micro influencers
- MACRO (100K-500K): Stats for macro influencers
- MEGA (>500K): Stats for mega influencers

**Post Type Breakdown:**
Per brand showing distribution of:
- Photo percentage
- Video percentage
- Carousel percentage
- Reel percentage

Visualization: Horizontal stacked bar or doughnut chart

### 26.11 Filtering Options

| Filter | Options |
|--------|---------|
| Platform | All, Instagram, TikTok |
| Status | All, Pending, In Progress, Completed, Failed |
| Created By | Me, Team, Shared |
| Search | By report title or brand name |

### 26.12 Sorting Options

**Posts List:**
- Recent (default)
- Oldest
- Most Liked / Least Liked
- Most Commented / Least Commented
- Highest / Lowest Credibility
- Highest / Lowest Followers

**Filter by:**
- Influencer Category: All, Nano, Micro, Macro, Mega
- Brand: Filter by specific brand

### 26.13 Auto-Refresh Feature

- Users can enable auto-refresh to track competition into the future
- When enabled, the report automatically refreshes daily
- Date range extends from current date to next 1-3 months
- No additional credits charged for auto-refresh updates

### 26.14 Notifications

Email/In-App notification when:
- Report status changes from IN_PROGRESS → COMPLETED
- Auto-refresh report updates are completed (if tracking enabled)
- Report is shared with user
