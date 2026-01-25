# Social Tweebs - Database Design & Schema

## Overview

This document provides a comprehensive overview of the database design for the Social Tweebs platform. The database uses **PostgreSQL** with **TypeORM** as the ORM layer. All tables are created under the `zorbitads` schema.

---

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Core Entities](#core-entities)
3. [Authentication & Sessions](#authentication--sessions)
4. [Team Management](#team-management)
5. [Credits System](#credits-system)
6. [Discovery & Insights](#discovery--insights)
7. [Campaigns](#campaigns)
8. [Report Modules](#report-modules)
9. [Content Management](#content-management)
10. [Enums Reference](#enums-reference)
11. [Complete Table List](#complete-table-list)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CORE ENTITIES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐         ┌──────────────────────┐                          │
│  │     users        │◄───────►│   credit_accounts    │                          │
│  │  (zorbitads)     │  1:1    │    (zorbitads)       │                          │
│  ├──────────────────┤         ├──────────────────────┤                          │
│  │ id (PK)          │         │ id (PK)              │                          │
│  │ email            │         │ user_id (FK, UNIQUE) │                          │
│  │ password_hash    │         │ unified_balance      │                          │
│  │ name             │         │ validity_start       │                          │
│  │ phone            │         │ validity_end         │                          │
│  │ business_name    │         │ is_locked            │                          │
│  │ role (enum)      │         └─────────┬────────────┘                          │
│  │ status (enum)    │                   │                                        │
│  │ parent_id (FK)───┼───┐         1:N   │                                        │
│  └──────────────────┘   │               ▼                                        │
│         │  ▲            │    ┌──────────────────────┐                            │
│    1:1  │  │ Self-ref   │    │ credit_transactions  │                            │
│         ▼  │ (parent)   │    ├──────────────────────┤                            │
│  ┌──────────────────┐   │    │ id (PK)              │                            │
│  │ user_preferences │   │    │ account_id (FK)      │                            │
│  ├──────────────────┤   │    │ transaction_type     │                            │
│  │ user_id (FK)     │   │    │ amount               │                            │
│  │ notify_*         │   │    │ module_type          │                            │
│  └──────────────────┘   │    │ action_type          │                            │
│                         │    │ balance_before/after │                            │
│                         │    └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            TEAM MANAGEMENT                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  users ─┬─────────────────► team_member_profiles (1:1)                          │
│         │                   ├── internal_role_type, country, validity_*         │
│         │                                                                        │
│         ├─────────────────► feature_access (1:N)                                │
│         │                   ├── feature_name, is_enabled, granted_by            │
│         │                                                                        │
│         ├─────────────────► action_permissions (1:N)                            │
│         │                   ├── action_name, is_enabled, granted_by             │
│         │                                                                        │
│         └─────────────────► impersonation_logs (1:N)                            │
│                             ├── impersonator_id, target_user_id, session_token  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CAMPAIGNS                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  users ──────────────────────► campaigns (1:N)                                  │
│                                │                                                 │
│                                ├──► campaign_influencers (1:N)                  │
│                                │    ├── influencer_name, status                 │
│                                │    ├── budget_allocated, payment_status        │
│                                │    │                                            │
│                                │    └──► campaign_metrics (1:N)                 │
│                                │         ├── impressions, reach, likes          │
│                                │                                                 │
│                                ├──► campaign_deliverables (1:N)                 │
│                                │    ├── deliverable_type, status                │
│                                │    ├── content_url, published_at               │
│                                │                                                 │
│                                └──► campaign_shares (1:N)                       │
│                                     ├── shared_with_user_id, permission_level   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                     REPORT MODULES (Common Pattern)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  *_reports ─────┬──────────► *_influencers (1:N)                                │
│   ├── status    │            ├── influencer_name, metrics                       │
│   ├── owner_id  │                                                                │
│   ├── metrics   ├──────────► *_posts (1:N)                                      │
│   └── is_public │            ├── post_type, engagement_metrics                  │
│                 │                                                                │
│                 └──────────► *_shares (1:N)                                     │
│                              ├── shared_with_user_id, permission_level          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Entities

### 1. Users (`users`)

The central entity representing all platform users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `phone` | VARCHAR(20) | NULLABLE | Phone number |
| `business_name` | VARCHAR(255) | NULLABLE | Company/business name |
| `role` | ENUM | NOT NULL | `SUPER_ADMIN`, `ADMIN`, `SUB_USER` |
| `status` | ENUM | NOT NULL | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `LOCKED`, `EXPIRED` |
| `parent_id` | UUID | FK → users.id | Parent user (for sub-users) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Relationships:**
- Self-referential: `parent` → `users` (Admin-SubUser hierarchy)
- 1:1 → `credit_accounts`
- 1:1 → `user_preferences`
- 1:N → `user_sessions`, `login_history`, etc.

---

### 2. User Preferences (`user_preferences`)

Stores user notification and display preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK, UNIQUE | Reference to users |
| `notify_credits_expiry` | BOOLEAN | DEFAULT true | Credits expiry notifications |
| `notify_credits_low` | BOOLEAN | DEFAULT true | Low credits notifications |
| `notify_report_ready` | BOOLEAN | DEFAULT true | Report completion notifications |
| `notify_team_updates` | BOOLEAN | DEFAULT true | Team activity notifications |
| `notify_application_received` | BOOLEAN | DEFAULT true | CRM application notifications |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

---

## Authentication & Sessions

### 3. User Sessions (`user_sessions`)

Active user sessions for JWT refresh token management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | Session owner |
| `refresh_token_hash` | VARCHAR(255) | NOT NULL | Hashed refresh token |
| `ip_address` | VARCHAR(50) | NULLABLE | Client IP |
| `user_agent` | TEXT | NULLABLE | Browser/client info |
| `is_active` | BOOLEAN | DEFAULT true | Session active status |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Token expiration |
| `created_at` | TIMESTAMPTZ | NOT NULL | Session creation |
| `last_used_at` | TIMESTAMPTZ | NULLABLE | Last activity |

---

### 4. Login History (`login_history`)

Audit log of all login attempts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | User attempting login |
| `success` | BOOLEAN | NOT NULL | Login success/failure |
| `failure_reason` | VARCHAR(100) | NULLABLE | Reason for failure |
| `ip_address` | VARCHAR(50) | NULLABLE | Client IP |
| `user_agent` | TEXT | NULLABLE | Browser/client info |
| `login_at` | TIMESTAMPTZ | NOT NULL | Attempt timestamp |

---

### 5. Password Reset Tokens (`password_reset_tokens`)

Tokens for password reset flow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | Token owner |
| `token_hash` | VARCHAR(255) | NOT NULL | Hashed reset token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Token expiration |
| `is_used` | BOOLEAN | DEFAULT false | Token usage status |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |

---

### 6. Signup Requests (`signup_requests`)

Pre-approval signup requests before user creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Applicant email |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `phone` | VARCHAR(20) | NULLABLE | Phone number |
| `business_name` | VARCHAR(255) | NULLABLE | Company name |
| `campaign_frequency` | ENUM | NOT NULL | Campaign frequency |
| `message` | TEXT | NULLABLE | Optional message |
| `status` | ENUM | DEFAULT 'PENDING' | `PENDING`, `APPROVED`, `REJECTED` |
| `reviewed_by` | UUID | FK → users.id | Reviewer user |
| `reviewed_at` | TIMESTAMPTZ | NULLABLE | Review timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL | Request timestamp |

---

## Team Management

### 7. Team Member Profiles (`team_member_profiles`)

Extended profile for team members (sub-users).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK, UNIQUE | Reference to users |
| `internal_role_type` | ENUM | NOT NULL | Internal role type |
| `country` | VARCHAR(100) | NULLABLE | Country |
| `validity_start` | TIMESTAMPTZ | NOT NULL | Access validity start |
| `validity_end` | TIMESTAMPTZ | NOT NULL | Access validity end |
| `validity_notification_enabled` | BOOLEAN | DEFAULT true | Expiry notifications |
| `created_by` | UUID | FK → users.id | Creator (admin) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

---

### 8. Feature Access (`feature_access`)

Granular feature-level permissions for sub-users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | User granted access |
| `feature_name` | ENUM | NOT NULL | Feature identifier |
| `is_enabled` | BOOLEAN | DEFAULT true | Access enabled |
| `granted_by` | UUID | FK → users.id | Admin who granted |
| `granted_at` | TIMESTAMPTZ | NOT NULL | Grant timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

**Available Features:**
- `INFLUENCER_DISCOVERY`
- `INFLUENCER_INSIGHTS`
- `COMPETITION_ANALYSIS`
- `AUDIENCE_OVERLAP`
- `CUSTOM_ER`
- `SOCIAL_SENTIMENTS`
- `INFLUENCER_COLLAB_CHECK`
- `INFLUENCER_TIE_BREAKER`
- `PAID_COLLABORATION`
- `INFLUENCER_GROUP`
- `MENTION_TRACKING`
- `CAMPAIGNS`
- `GENERATED_REPORTS`

---

### 9. Action Permissions (`action_permissions`)

Specific action permissions within features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | User with permission |
| `action_name` | ENUM | NOT NULL | Action identifier |
| `is_enabled` | BOOLEAN | DEFAULT true | Permission enabled |
| `granted_by` | UUID | FK → users.id | Admin who granted |
| `granted_at` | TIMESTAMPTZ | NOT NULL | Grant timestamp |

**Available Actions:**
- `EXCEL_REPORT_DOWNLOAD`
- `CRM_INVITE_FORM`

---

### 10. Impersonation Logs (`impersonation_logs`)

Audit trail for admin impersonation of sub-users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `impersonator_id` | UUID | FK → users.id | Admin performing impersonation |
| `target_user_id` | UUID | FK → users.id | User being impersonated |
| `session_token` | VARCHAR(255) | NOT NULL | Impersonation session token |
| `started_at` | TIMESTAMPTZ | NOT NULL | Session start |
| `ended_at` | TIMESTAMPTZ | NULLABLE | Session end |
| `ip_address` | VARCHAR(50) | NULLABLE | Client IP |

---

## Credits System

### 11. Credit Accounts (`credit_accounts`)

Main credit wallet for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK, UNIQUE | Account owner |
| `unified_balance` | DECIMAL(12,2) | DEFAULT 0 | Total available credits |
| `validity_start` | TIMESTAMPTZ | NOT NULL | Credits validity start |
| `validity_end` | TIMESTAMPTZ | NOT NULL | Credits validity end |
| `is_locked` | BOOLEAN | DEFAULT false | Account lock status |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

---

### 12. Module Balances (`module_balances`)

Module-specific credit allocations (optional granular tracking).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `account_id` | UUID | FK → credit_accounts.id | Parent account |
| `module_type` | ENUM | NOT NULL | Module identifier |
| `balance` | DECIMAL(12,2) | DEFAULT 0 | Module balance |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

---

### 13. Credit Transactions (`credit_transactions`)

Complete audit trail of all credit movements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `account_id` | UUID | FK → credit_accounts.id | Affected account |
| `transaction_type` | ENUM | NOT NULL | `CREDIT`, `DEBIT`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT` |
| `amount` | DECIMAL(12,2) | NOT NULL | Transaction amount |
| `module_type` | ENUM | NOT NULL | Module context |
| `action_type` | ENUM | NOT NULL | Action performed |
| `source_user_id` | UUID | FK → users.id | Initiating user (for transfers) |
| `resource_id` | VARCHAR(255) | NULLABLE | Related resource ID |
| `resource_type` | VARCHAR(100) | NULLABLE | Resource type |
| `comment` | TEXT | NULLABLE | Transaction note |
| `metadata` | JSONB | NULLABLE | Additional data |
| `balance_before` | DECIMAL(12,2) | NULLABLE | Balance before transaction |
| `balance_after` | DECIMAL(12,2) | NULLABLE | Balance after transaction |
| `created_at` | TIMESTAMPTZ | NOT NULL | Transaction timestamp |

---

### 14. Unlocked Influencers (`unlocked_influencers`)

Tracks which influencers have been unlocked by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | User who unlocked |
| `influencer_id` | VARCHAR(255) | NOT NULL | Platform-specific ID |
| `platform` | ENUM | NOT NULL | Social platform |
| `unlock_type` | VARCHAR(50) | NOT NULL | `FULL`, `PARTIAL` |
| `credits_used` | DECIMAL(10,2) | NOT NULL | Credits consumed |
| `unlocked_at` | TIMESTAMPTZ | NOT NULL | Unlock timestamp |
| `expires_at` | TIMESTAMPTZ | NULLABLE | Access expiration |

**Unique Constraint:** `(user_id, influencer_id, platform)`

---

## Discovery & Insights

### 15. Cached Influencer Profiles (`cached_influencer_profiles`)

Cached influencer data from Modash API.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `platform` | ENUM | NOT NULL | Social platform |
| `platform_user_id` | VARCHAR(255) | NOT NULL | Platform-specific ID |
| `username` | VARCHAR(255) | NULLABLE | Handle/username |
| `full_name` | VARCHAR(255) | NULLABLE | Display name |
| `profile_picture_url` | TEXT | NULLABLE | Avatar URL |
| `biography` | TEXT | NULLABLE | Bio text |
| `follower_count` | BIGINT | DEFAULT 0 | Followers |
| `following_count` | BIGINT | DEFAULT 0 | Following |
| `post_count` | INT | DEFAULT 0 | Total posts |
| `engagement_rate` | DECIMAL(8,4) | NULLABLE | ER percentage |
| `avg_likes` | BIGINT | DEFAULT 0 | Average likes |
| `avg_comments` | BIGINT | DEFAULT 0 | Average comments |
| `avg_views` | BIGINT | DEFAULT 0 | Average views |
| `is_verified` | BOOLEAN | DEFAULT false | Verification status |
| `is_business_account` | BOOLEAN | DEFAULT false | Business account |
| `location_country` | VARCHAR(100) | NULLABLE | Country |
| `location_city` | VARCHAR(100) | NULLABLE | City |
| `category` | VARCHAR(100) | NULLABLE | Content category |
| `audience_credibility` | DECIMAL(5,2) | NULLABLE | Credibility score |
| `contact_email` | VARCHAR(255) | NULLABLE | Contact email |
| `contact_phone` | VARCHAR(50) | NULLABLE | Contact phone |
| `website_url` | TEXT | NULLABLE | Website |
| `raw_modash_data` | JSONB | NULLABLE | Full API response |
| `modash_fetched_at` | TIMESTAMPTZ | NULLABLE | Last API fetch |
| `data_ttl_expires_at` | TIMESTAMPTZ | NULLABLE | Cache expiration |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `last_updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

**Unique Index:** `(platform, platform_user_id)`

---

### 16. Audience Data (`audience_data`)

Detailed audience demographics for influencer profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `profile_id` | UUID | FK → cached_influencer_profiles.id | Parent profile |
| `data_type` | VARCHAR(50) | NOT NULL | `GENDER`, `AGE`, `COUNTRY`, `CITY`, `LANGUAGE` |
| `data_json` | JSONB | NOT NULL | Demographic breakdown |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |

---

### 17. Discovery Searches (`discovery_searches`)

User search history in influencer discovery.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | Searching user |
| `platform` | ENUM | NOT NULL | Target platform |
| `filters_json` | JSONB | NOT NULL | Applied filters |
| `sort_by` | VARCHAR(50) | NULLABLE | Sort field |
| `sort_order` | VARCHAR(10) | NULLABLE | ASC/DESC |
| `result_count` | INT | DEFAULT 0 | Results returned |
| `search_name` | VARCHAR(255) | NULLABLE | Saved search name |
| `is_saved` | BOOLEAN | DEFAULT false | Saved status |
| `created_at` | TIMESTAMPTZ | NOT NULL | Search timestamp |

---

### 18. Search Results (`search_results`)

Individual results from discovery searches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `search_id` | UUID | FK → discovery_searches.id | Parent search |
| `profile_id` | UUID | FK → cached_influencer_profiles.id | Matched profile |
| `rank_position` | INT | NOT NULL | Result rank |
| `relevance_score` | DECIMAL(5,4) | NULLABLE | Match score |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |

---

### 19. Influencer Insights (`influencer_insights`)

Detailed unlocked insights per user-influencer pair.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `user_id` | UUID | FK → users.id | User who unlocked |
| `profile_id` | UUID | FK | Reference to cached profile |
| `platform` | ENUM | NOT NULL | Social platform |
| `platform_user_id` | VARCHAR(255) | NOT NULL | Platform ID |
| `username` | VARCHAR(255) | NOT NULL | Handle |
| `full_name` | VARCHAR(255) | NULLABLE | Display name |
| `profile_picture_url` | TEXT | NULLABLE | Avatar |
| `bio` | TEXT | NULLABLE | Biography |
| `follower_count` | BIGINT | NULLABLE | Followers |
| `following_count` | BIGINT | NULLABLE | Following |
| `post_count` | INT | NULLABLE | Posts |
| `engagement_rate` | DECIMAL(8,4) | NULLABLE | ER |
| `avg_likes` | BIGINT | NULLABLE | Avg likes |
| `avg_comments` | BIGINT | NULLABLE | Avg comments |
| `avg_views` | BIGINT | NULLABLE | Avg views |
| `avg_reel_views` | BIGINT | NULLABLE | Avg reel views |
| `location_country` | VARCHAR(100) | NULLABLE | Country |
| `location_city` | VARCHAR(100) | NULLABLE | City |
| `is_verified` | BOOLEAN | DEFAULT false | Verified |
| `audience_credibility` | DECIMAL(5,4) | NULLABLE | Credibility |
| `audience_data` | JSONB | NULLABLE | Demographics |
| `engagement_data` | JSONB | NULLABLE | Engagement stats |
| `growth_data` | JSONB | NULLABLE | Growth trends |
| `lookalikes_data` | JSONB | NULLABLE | Similar profiles |
| `brand_affinity_data` | JSONB | NULLABLE | Brand mentions |
| `interests_data` | JSONB | NULLABLE | Interest topics |
| `hashtags_data` | JSONB | NULLABLE | Top hashtags |
| `recent_posts` | JSONB | NULLABLE | Recent posts |
| `recent_reels` | JSONB | NULLABLE | Recent reels |
| `popular_posts` | JSONB | NULLABLE | Top posts |
| `sponsored_posts` | JSONB | NULLABLE | Sponsored content |
| `word_cloud_data` | JSONB | NULLABLE | Caption analysis |
| `credits_used` | DECIMAL(10,2) | DEFAULT 1 | Credits consumed |
| `unlocked_at` | TIMESTAMP | NOT NULL | Unlock time |
| `last_refreshed_at` | TIMESTAMP | NOT NULL | Last refresh |
| `modash_fetched_at` | TIMESTAMP | NULLABLE | API fetch time |
| `created_at` | TIMESTAMP | NOT NULL | Creation |
| `updated_at` | TIMESTAMP | NOT NULL | Last update |

**Unique Constraint:** `(user_id, platform, platform_user_id)`

---

### 20. Modash API Logs (`modash_api_logs`)

API call logging for Modash integration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `endpoint` | VARCHAR(255) | NOT NULL | API endpoint |
| `method` | VARCHAR(10) | NOT NULL | HTTP method |
| `request_params` | JSONB | NULLABLE | Request parameters |
| `response_status` | INT | NULLABLE | HTTP status |
| `response_time_ms` | INT | NULLABLE | Response time |
| `error_message` | TEXT | NULLABLE | Error if any |
| `user_id` | UUID | FK → users.id | Requesting user |
| `created_at` | TIMESTAMPTZ | NOT NULL | Request timestamp |

---

## Campaigns

### 21. Campaigns (`campaigns`)

Main campaign entity for influencer campaign tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `name` | VARCHAR(255) | NOT NULL | Campaign name |
| `description` | TEXT | NULLABLE | Description |
| `platform` | VARCHAR(50) | NOT NULL | Target platform |
| `status` | ENUM | DEFAULT 'DRAFT' | `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED` |
| `objective` | ENUM | NULLABLE | Campaign objective |
| `start_date` | DATE | NULLABLE | Campaign start |
| `end_date` | DATE | NULLABLE | Campaign end |
| `budget` | DECIMAL(12,2) | NULLABLE | Total budget |
| `currency` | VARCHAR(10) | DEFAULT 'INR' | Currency code |
| `hashtags` | TEXT[] | NULLABLE | Campaign hashtags |
| `mentions` | TEXT[] | NULLABLE | Required mentions |
| `target_audience` | JSONB | NULLABLE | Target demographics |
| `owner_id` | UUID | FK → users.id | Campaign owner |
| `created_by` | UUID | FK → users.id | Creator |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update |

---

### 22. Campaign Influencers (`campaign_influencers`)

Influencers assigned to campaigns.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `campaign_id` | UUID | FK → campaigns.id | Parent campaign |
| `influencer_profile_id` | UUID | NULLABLE | Linked profile |
| `influencer_name` | VARCHAR(255) | NOT NULL | Name |
| `influencer_username` | VARCHAR(255) | NULLABLE | Handle |
| `platform` | VARCHAR(50) | NOT NULL | Platform |
| `follower_count` | INT | NULLABLE | Followers |
| `status` | ENUM | DEFAULT 'INVITED' | `INVITED`, `CONFIRMED`, `DECLINED`, `ACTIVE`, `COMPLETED` |
| `budget_allocated` | DECIMAL(10,2) | NULLABLE | Allocated budget |
| `payment_status` | ENUM | DEFAULT 'PENDING' | `PENDING`, `PARTIAL`, `PAID` |
| `payment_amount` | DECIMAL(10,2) | NULLABLE | Payment amount |
| `contract_status` | ENUM | DEFAULT 'PENDING' | `PENDING`, `SENT`, `SIGNED`, `REJECTED` |
| `notes` | TEXT | NULLABLE | Notes |
| `added_at` | TIMESTAMP | NOT NULL | Addition timestamp |
| `confirmed_at` | TIMESTAMP | NULLABLE | Confirmation time |
| `completed_at` | TIMESTAMP | NULLABLE | Completion time |

---

### 23. Campaign Deliverables (`campaign_deliverables`)

Content deliverables for campaigns.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `campaign_id` | UUID | FK → campaigns.id | Parent campaign |
| `campaign_influencer_id` | UUID | FK | Assigned influencer |
| `deliverable_type` | ENUM | NOT NULL | `POST`, `STORY`, `REEL`, `VIDEO`, `CAROUSEL`, `TWEET`, `THREAD` |
| `title` | VARCHAR(255) | NULLABLE | Deliverable title |
| `description` | TEXT | NULLABLE | Requirements |
| `due_date` | DATE | NULLABLE | Due date |
| `status` | ENUM | DEFAULT 'PENDING' | `PENDING`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PUBLISHED` |
| `content_url` | TEXT | NULLABLE | Published URL |
| `post_id` | VARCHAR(255) | NULLABLE | Platform post ID |
| `submitted_at` | TIMESTAMP | NULLABLE | Submission time |
| `approved_at` | TIMESTAMP | NULLABLE | Approval time |
| `published_at` | TIMESTAMP | NULLABLE | Publish time |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |

---

### 24. Campaign Metrics (`campaign_metrics`)

Performance metrics for campaign content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `campaign_id` | UUID | FK → campaigns.id | Parent campaign |
| `deliverable_id` | UUID | FK | Related deliverable |
| `campaign_influencer_id` | UUID | FK | Related influencer |
| `recorded_at` | TIMESTAMP | NOT NULL | Metric timestamp |
| `impressions` | INT | DEFAULT 0 | Impressions |
| `reach` | INT | DEFAULT 0 | Reach |
| `likes` | INT | DEFAULT 0 | Likes |
| `comments` | INT | DEFAULT 0 | Comments |
| `shares` | INT | DEFAULT 0 | Shares |
| `saves` | INT | DEFAULT 0 | Saves |
| `views` | INT | DEFAULT 0 | Views |
| `clicks` | INT | DEFAULT 0 | Link clicks |
| `engagement_rate` | DECIMAL(5,2) | NULLABLE | ER percentage |
| `cost_per_engagement` | DECIMAL(10,4) | NULLABLE | CPE |
| `cost_per_click` | DECIMAL(10,4) | NULLABLE | CPC |
| `cost_per_impression` | DECIMAL(10,6) | NULLABLE | CPM |

---

### 25. Campaign Shares (`campaign_shares`)

Campaign sharing with team members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `campaign_id` | UUID | FK → campaigns.id | Shared campaign |
| `shared_with_user_id` | UUID | FK → users.id | Recipient user |
| `shared_by_user_id` | UUID | FK → users.id | Sharing user |
| `permission_level` | ENUM | DEFAULT 'VIEW' | `VIEW`, `EDIT`, `ADMIN` |
| `shared_at` | TIMESTAMP | NOT NULL | Share timestamp |

---

## Report Modules

All report modules follow a similar pattern with these common elements:

### Common Report Entity Pattern

```typescript
// Base fields for all report types
{
  id: UUID (PK)
  title: VARCHAR(255)
  platform: VARCHAR(50)
  status: ENUM (PENDING, IN_PROCESS, COMPLETED, FAILED)
  owner_id: UUID (FK → users)
  created_by: UUID (FK → users)
  is_public: BOOLEAN
  share_url_token: VARCHAR(100) UNIQUE
  error_message: TEXT
  retry_count: INT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
  completed_at: TIMESTAMPTZ
}
```

### Report Modules Summary

| Module | Main Table | Related Tables |
|--------|------------|----------------|
| **Competition Analysis** | `competition_analysis_reports` | `competition_brands`, `competition_influencers`, `competition_posts`, `competition_shares` |
| **Audience Overlap** | `audience_overlap_reports` | `audience_overlap_influencers`, `audience_overlap_shares` |
| **Paid Collaboration** | `paid_collaboration_reports` | `paid_collaboration_posts`, `paid_collaboration_influencers`, `paid_collaboration_shares` |
| **Mention Tracking** | `mention_tracking_reports` | `mention_tracking_posts`, `mention_tracking_influencers`, `mention_tracking_shares` |
| **Collab Check** | `collab_check_reports` | `collab_check_influencers`, `collab_check_posts`, `collab_check_shares` |
| **Custom ER** | `custom_er_reports` | `custom_er_posts`, `custom_er_shares` |
| **Social Sentiments** | `sentiment_reports` | `sentiment_comments`, `sentiment_shares` |
| **Tie Breaker** | `tie_breaker_comparisons` | `tie_breaker_influencers`, `tie_breaker_shares` |

---

## Influencer Groups

### 26. Influencer Groups (`influencer_groups`)

Groups/lists of influencers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `name` | VARCHAR(255) | NOT NULL | Group name |
| `description` | TEXT | NULLABLE | Description |
| `platforms` | TEXT[] | DEFAULT '{}' | Target platforms |
| `influencer_count` | INT | DEFAULT 0 | Member count |
| `unapproved_count` | INT | DEFAULT 0 | Pending applications |
| `owner_id` | UUID | FK → users.id | Group owner |
| `created_by` | UUID | FK → users.id | Creator |
| `is_public` | BOOLEAN | DEFAULT false | Public visibility |
| `share_url_token` | VARCHAR(100) | UNIQUE | Public share token |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update |

---

### 27. Influencer Group Members (`influencer_group_members`)

Members of influencer groups.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `group_id` | UUID | FK → influencer_groups.id | Parent group |
| `influencer_profile_id` | UUID | NULLABLE | Linked profile |
| `platform_user_id` | VARCHAR(255) | NULLABLE | Platform ID |
| `influencer_name` | VARCHAR(255) | NOT NULL | Name |
| `influencer_username` | VARCHAR(255) | NULLABLE | Handle |
| `platform` | VARCHAR(50) | NOT NULL | Platform |
| `profile_picture_url` | TEXT | NULLABLE | Avatar |
| `follower_count` | BIGINT | DEFAULT 0 | Followers |
| `audience_credibility` | DECIMAL(5,2) | NULLABLE | Credibility |
| `engagement_rate` | DECIMAL(8,4) | NULLABLE | ER |
| `avg_likes` | BIGINT | NULLABLE | Avg likes |
| `avg_views` | BIGINT | NULLABLE | Avg views |
| `added_by` | UUID | FK → users.id | Added by user |
| `source` | VARCHAR(50) | DEFAULT 'MANUAL' | `MANUAL`, `XLSX_IMPORT`, `GROUP_IMPORT`, `APPLICATION` |
| `source_group_id` | UUID | NULLABLE | Source group if copied |
| `application_id` | UUID | NULLABLE | Related application |
| `added_at` | TIMESTAMP | NOT NULL | Addition timestamp |

---

### 28. Group Invitations (`group_invitations`)

CRM invitation forms for groups.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `group_id` | UUID | FK → influencer_groups.id | Parent group |
| `invitation_name` | VARCHAR(255) | NOT NULL | Invitation name |
| `invitation_type` | ENUM | NOT NULL | `LANDING_PAGE`, `FORM_ONLY` |
| `url_slug` | VARCHAR(100) | UNIQUE | Public URL slug |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `landing_header` | TEXT | NULLABLE | Landing page header |
| `landing_content` | TEXT | NULLABLE | Landing page content |
| `landing_button_text` | VARCHAR(100) | NULLABLE | CTA button text |
| `landing_images` | TEXT[] | NULLABLE | Banner images |
| `landing_video_url` | TEXT | NULLABLE | Video URL |
| `form_header` | TEXT | NULLABLE | Form header |
| `form_content` | TEXT | NULLABLE | Form description |
| `form_platforms` | TEXT[] | DEFAULT '{}' | Allowed platforms |
| `collect_phone` | BOOLEAN | DEFAULT false | Collect phone |
| `collect_email` | BOOLEAN | DEFAULT false | Collect email |
| `collect_address` | BOOLEAN | DEFAULT false | Collect address |
| `pricing_options` | TEXT[] | NULLABLE | Pricing fields |
| `pricing_currency` | ENUM | NULLABLE | Currency |
| `logo_url` | TEXT | NULLABLE | Brand logo |
| `background_color` | VARCHAR(20) | DEFAULT '#ffffff' | BG color |
| `title_color` | VARCHAR(20) | DEFAULT '#000000' | Title color |
| `text_color` | VARCHAR(20) | DEFAULT '#333333' | Text color |
| `button_bg_color` | VARCHAR(20) | DEFAULT '#6366f1' | Button BG |
| `button_text_color` | VARCHAR(20) | DEFAULT '#ffffff' | Button text |
| `notify_on_submission` | BOOLEAN | DEFAULT true | Email notifications |
| `created_by` | UUID | FK → users.id | Creator |
| `applications_count` | INT | DEFAULT 0 | Total applications |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update |

---

### 29. Group Invitation Applications (`group_invitation_applications`)

Influencer applications via invitation forms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `invitation_id` | UUID | FK → group_invitations.id | Parent invitation |
| `group_id` | UUID | NOT NULL | Target group |
| `influencer_name` | VARCHAR(255) | NULLABLE | Applicant name |
| `platform` | VARCHAR(50) | NOT NULL | Platform |
| `platform_username` | VARCHAR(255) | NOT NULL | Handle |
| `platform_url` | TEXT | NULLABLE | Profile URL |
| `follower_count` | BIGINT | DEFAULT 0 | Followers |
| `profile_picture_url` | TEXT | NULLABLE | Avatar |
| `phone_number` | VARCHAR(50) | NULLABLE | Phone |
| `email` | VARCHAR(255) | NULLABLE | Email |
| `address` | TEXT | NULLABLE | Address |
| `photo_price` | DECIMAL(12,2) | NULLABLE | Photo rate |
| `video_price` | DECIMAL(12,2) | NULLABLE | Video rate |
| `story_price` | DECIMAL(12,2) | NULLABLE | Story rate |
| `carousel_price` | DECIMAL(12,2) | NULLABLE | Carousel rate |
| `pricing_currency` | ENUM | NULLABLE | Currency |
| `status` | ENUM | DEFAULT 'PENDING' | `PENDING`, `APPROVED`, `REJECTED` |
| `approved_by` | UUID | FK → users.id | Approver |
| `approved_at` | TIMESTAMP | NULLABLE | Approval time |
| `rejection_reason` | TEXT | NULLABLE | Rejection reason |
| `additional_data` | JSONB | NULLABLE | Custom fields |
| `ip_address` | VARCHAR(50) | NULLABLE | Client IP |
| `user_agent` | TEXT | NULLABLE | Browser info |
| `submitted_at` | TIMESTAMP | NOT NULL | Submission time |

---

## Content Management

### 30. FAQs (`faqs`)

Frequently asked questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `category_id` | UUID | FK → faq_categories.id | Parent category |
| `question` | TEXT | NOT NULL | Question text |
| `answer` | TEXT | NOT NULL | Answer text |
| `display_order` | INT | DEFAULT 0 | Sort order |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update |

---

## Enums Reference

### User Enums

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SUB_USER = 'SUB_USER',
}

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
  EXPIRED = 'EXPIRED',
}
```

### Platform Enums

```typescript
enum PlatformType {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN',
}
```

### Credit Enums

```typescript
enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

enum ModuleType {
  UNIFIED_BALANCE = 'UNIFIED_BALANCE',
  INFLUENCER_DISCOVERY = 'INFLUENCER_DISCOVERY',
  INFLUENCER_INSIGHTS = 'INFLUENCER_INSIGHTS',
  COMPETITION_ANALYSIS = 'COMPETITION_ANALYSIS',
  AUDIENCE_OVERLAP = 'AUDIENCE_OVERLAP',
  CUSTOM_ER = 'CUSTOM_ER',
  SOCIAL_SENTIMENTS = 'SOCIAL_SENTIMENTS',
  INFLUENCER_COLLAB_CHECK = 'INFLUENCER_COLLAB_CHECK',
  INFLUENCER_TIE_BREAKER = 'INFLUENCER_TIE_BREAKER',
  PAID_COLLABORATION = 'PAID_COLLABORATION',
  INFLUENCER_GROUP = 'INFLUENCER_GROUP',
  MENTION_TRACKING = 'MENTION_TRACKING',
  CAMPAIGNS = 'CAMPAIGNS',
}

enum ActionType {
  INFLUENCER_SEARCH = 'INFLUENCER_SEARCH',
  INFLUENCER_UNBLUR = 'INFLUENCER_UNBLUR',
  INFLUENCER_INSIGHT = 'INFLUENCER_INSIGHT',
  INFLUENCER_REFRESH = 'INFLUENCER_REFRESH',
  REPORT_GENERATE = 'REPORT_GENERATE',
  REPORT_EXPORT = 'REPORT_EXPORT',
  ADMIN_ALLOCATION = 'ADMIN_ALLOCATION',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  CREDIT_TRANSFER = 'CREDIT_TRANSFER',
}
```

### Report Status Enums

```typescript
enum ReportStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  AGGREGATING = 'AGGREGATING',
}
```

### Influencer Category

```typescript
enum InfluencerCategory {
  NANO = 'NANO',       // < 10K followers
  MICRO = 'MICRO',     // 10K - 100K followers
  MACRO = 'MACRO',     // 100K - 500K followers
  MEGA = 'MEGA',       // > 500K followers
}
```

### Share Permission

```typescript
enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN',
}
```

---

## Complete Table List

| # | Table Name | Module | Description |
|---|------------|--------|-------------|
| 1 | `users` | Core | User accounts |
| 2 | `user_preferences` | Core | User settings |
| 3 | `credit_accounts` | Credits | Credit wallets |
| 4 | `module_balances` | Credits | Module allocations |
| 5 | `credit_transactions` | Credits | Transaction history |
| 6 | `unlocked_influencers` | Credits | Unlock records |
| 7 | `user_sessions` | Auth | Active sessions |
| 8 | `login_history` | Auth | Login audit |
| 9 | `password_reset_tokens` | Auth | Reset tokens |
| 10 | `signup_requests` | Auth | Signup queue |
| 11 | `team_member_profiles` | Team | Member profiles |
| 12 | `feature_access` | Team | Feature permissions |
| 13 | `action_permissions` | Team | Action permissions |
| 14 | `impersonation_logs` | Team | Impersonation audit |
| 15 | `cached_influencer_profiles` | Discovery | Cached profiles |
| 16 | `audience_data` | Discovery | Demographics |
| 17 | `discovery_searches` | Discovery | Search history |
| 18 | `search_results` | Discovery | Search results |
| 19 | `modash_api_logs` | Discovery | API logs |
| 20 | `insights_access` | Discovery | Access logs |
| 21 | `influencer_insights` | Insights | Unlocked insights |
| 22 | `insight_access_logs` | Insights | View logs |
| 23 | `system_configs` | Insights | System settings |
| 24 | `campaigns` | Campaigns | Campaign data |
| 25 | `campaign_influencers` | Campaigns | Assigned influencers |
| 26 | `campaign_deliverables` | Campaigns | Deliverables |
| 27 | `campaign_metrics` | Campaigns | Performance |
| 28 | `campaign_shares` | Campaigns | Sharing |
| 29 | `competition_analysis_reports` | Competition | Reports |
| 30 | `competition_brands` | Competition | Brands |
| 31 | `competition_influencers` | Competition | Influencers |
| 32 | `competition_posts` | Competition | Posts |
| 33 | `competition_shares` | Competition | Sharing |
| 34 | `audience_overlap_reports` | Overlap | Reports |
| 35 | `audience_overlap_influencers` | Overlap | Influencers |
| 36 | `audience_overlap_shares` | Overlap | Sharing |
| 37 | `influencer_groups` | Groups | Groups |
| 38 | `influencer_group_members` | Groups | Members |
| 39 | `influencer_group_shares` | Groups | Sharing |
| 40 | `group_invitations` | Groups | CRM invitations |
| 41 | `group_invitation_applications` | Groups | Applications |
| 42+ | `*_reports`, `*_shares`, etc. | Reports | Other report modules |

---

## Indexes

Key indexes for performance optimization:

```sql
-- Users
CREATE INDEX idx_users_email ON zorbitads.users(email);
CREATE INDEX idx_users_parent_id ON zorbitads.users(parent_id);
CREATE INDEX idx_users_status ON zorbitads.users(status);

-- Credit Transactions
CREATE INDEX idx_credit_transactions_account_id ON zorbitads.credit_transactions(account_id);
CREATE INDEX idx_credit_transactions_created_at ON zorbitads.credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_module_type ON zorbitads.credit_transactions(module_type);

-- Influencer Profiles
CREATE UNIQUE INDEX idx_influencer_profiles_platform_user ON zorbitads.cached_influencer_profiles(platform, platform_user_id);

-- Discovery Searches
CREATE INDEX idx_discovery_searches_user_id ON zorbitads.discovery_searches(user_id);

-- Reports (common pattern)
CREATE INDEX idx_*_reports_owner_id ON zorbitads.*_reports(owner_id);
CREATE INDEX idx_*_reports_status ON zorbitads.*_reports(status);
CREATE INDEX idx_*_reports_created_at ON zorbitads.*_reports(created_at);
```

---

## Notes

1. **Schema**: All tables use the `zorbitads` schema
2. **Primary Keys**: All tables use UUID primary keys
3. **Timestamps**: All tables include `created_at` and `updated_at` (timestamptz)
4. **Soft Deletes**: Not implemented globally; consider adding `deleted_at` for audit requirements
5. **Cascading**: Foreign keys use `ON DELETE CASCADE` for child records in report modules
6. **JSONB**: Used extensively for flexible data storage (audience data, filters, metadata)

---

*Last Updated: January 2026*
