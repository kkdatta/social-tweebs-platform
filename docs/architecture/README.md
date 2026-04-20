# ZorbitAds Architecture -- Modash Integration

## Overview

ZorbitAds is a social influencer analytics platform that integrates with the **Modash API** for real-time influencer discovery, analytics, and collaboration tracking across Instagram, TikTok, and YouTube.

## Environment Modes

The platform operates in two modes controlled by `APP_MODE`:

| Config | `APP_MODE=development` | `APP_MODE=production` |
|--------|------------------------|----------------------|
| Database | `postgres` (dummy data) | `zorbitads_production` (real data) |
| Modash API | Disabled (simulated) | Enabled (live API) |
| Report processing | Random/dummy data | Real Modash data |
| Credit consumption | No Modash credits | Real credit deduction |

### How the switch works

```
.env: APP_MODE=development | production
         |
         v
  database.config.ts ─── selects DB_NAME
  modash.config.ts  ─── enables/disables Modash API
  app.config.ts     ─── exposes app.isProduction flag
         |
         v
  Each service checks isModashEnabled():
    true  → call Modash API, cache in DB, return real data
    false → use existing dummy/simulated logic
```

## Documentation Index

| Document | Description |
|----------|-------------|
| [modash-integration.md](./modash-integration.md) | Modash API products, endpoints, and credit pricing |
| [api-flows.md](./api-flows.md) | Flow diagrams for every API call on the platform |
| [module-mapping.md](./module-mapping.md) | How each platform module maps to Modash endpoints |
| [credit-pricing.md](./credit-pricing.md) | Credit cost per user action |
| [credit-usage.md](./credit-usage.md) | Modash (vendor) vs platform (user) credits — how both layers work |

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (React)                      │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP API
┌──────────────────────────▼───────────────────────────────┐
│                NestJS Backend (api/v1)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Controllers  │  │   Services   │  │  ModashService │  │
│  │ (18 modules) │─▶│ (business    │─▶│ (API client)   │  │
│  │              │  │  logic)      │  │                │  │
│  └─────────────┘  └──────┬───────┘  └───────┬────────┘  │
│                          │                   │           │
│                    ┌─────▼─────┐       ┌─────▼─────┐    │
│                    │ PostgreSQL │       │ Modash API │    │
│                    │ (cache DB) │       │ (live)     │    │
│                    └───────────┘       └───────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Modules

### Modash-integrated modules (production mode)
- **Discovery** -- Search influencers, cache profiles
- **Insights** -- Deep influencer reports with audience data
- **Collab Check** -- Brand collaboration detection
- **Paid Collaboration** -- Sponsored post tracking
- **Audience Overlap** -- Follower overlap analysis
- **Competition Analysis** -- Cross-brand comparison
- **Mention Tracking** -- Hashtag/mention monitoring (Raw API)
- **Sentiments** -- Comment sentiment analysis (Raw API)
- **Custom ER** -- Real engagement rate calculation (Raw API)
- **Tie Breaker** -- Side-by-side influencer comparison

### Local-only modules (no Modash)
- Auth, Profile, Credits, Team, Campaigns, Influencer Groups, Content, Generated Reports
