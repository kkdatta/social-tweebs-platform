# API Flow Diagrams

Every API call on the ZorbitAds platform and its data flow.

## Core Pattern

All Modash-integrated modules follow this pattern:

```
User Request
    │
    ▼
Controller (validates, auth)
    │
    ▼
Service Layer
    │
    ├── APP_MODE = development?
    │   └── Use existing simulated/dummy logic
    │       └── Return dummy data from dev DB (postgres)
    │
    └── APP_MODE = production?
        └── Check local cache (zorbitads_production DB)
            │
            ├── Cache hit + fresh? → Return cached data (0 credits)
            │
            └── Cache miss or stale?
                └── Call Modash API (costs credits)
                    └── Store response in production DB
                        └── Return fresh data
```

---

## 1. Discovery -- Search Influencers

**Endpoint:** `POST /api/v1/discovery/search`

```
User submits search filters (platform, followers, location, audience, etc.)
    │
    ▼
DiscoveryController.search()
    │
    ▼
DiscoveryService.searchInfluencers()
    │
    ├── [development] Query cached_influencer_profiles with SQL WHERE
    │   └── Store in discovery_searches + discovery_search_results
    │       └── Return blurred results
    │
    └── [production] POST Modash /{platform}/search (0.15 credits/page)
        │
        ▼
    For each result:
        └── Find or create cached_influencer_profiles (platform, platformUserId)
            └── Set rawModashData, modashFetchedAt
                └── Create discovery_search_results (rank, isBlurred)
                    └── Return blurred results
```

**Tables written:** `discovery_searches`, `cached_influencer_profiles`, `discovery_search_results`
**Modash cost:** ~0.15 credits per page (15 results)

---

## 2. Discovery -- Unblur / Unlock Influencer

**Endpoint:** `POST /api/v1/discovery/unblur`

```
User selects influencers to unblur
    │
    ▼
DiscoveryService.unblurInfluencers()
    │
    ▼
Check already unlocked (unlocked_influencers)
    │
    ▼
Deduct credits via CreditsService
    │
    ▼
Record in unlocked_influencers + credit_transactions
    │
    ▼
Return unblurred profile data from cached_influencer_profiles
```

**Tables written:** `unlocked_influencers`, `credit_transactions`, `credit_accounts`
**Modash cost:** 0 (purely local)

---

## 3. Discovery -- View Insights

**Endpoint:** `GET /api/v1/discovery/insights/:profileId`

```
User clicks "View Insights" on an influencer
    │
    ▼
DiscoveryService.viewInsights()
    │
    ▼
Load cached_influencer_profiles
    │
    ├── [development] Map existing profile to insights DTO
    │   └── Return from cache (0 credits)
    │
    └── [production]
        │
        ├── First access? Charge 1 credit (INFLUENCER_INSIGHT)
        │
        ▼
    GET Modash /{platform}/profile/{id}/report (1 credit)
        │
        ▼
    Update cached_influencer_profiles (rawModashData, modashFetchedAt)
    Delete + re-insert influencer_audience_data
    Ensure influencer_insights record
        │
        ▼
    Return full insights (audience, stats, posts)
```

**Tables written:** `cached_influencer_profiles`, `influencer_audience_data`, `influencer_insights`, `influencer_insights_access`
**Modash cost:** 1 credit (first access or refresh)

---

## 4. Insights -- Refresh

**Endpoint:** `POST /api/v1/insights/:id/refresh`

```
User clicks "Refresh" on an insight
    │
    ▼
InsightsService.forceRefresh()
    │
    ├── [development] Return existing insight (0 credits)
    │
    └── [production]
        ▼
    Deduct 1 credit (REPORT_REFRESH)
        │
        ▼
    GET Modash /{platform}/profile/{id}/report (1 credit)
        │
        ▼
    Update influencer_insights with fresh Modash data
    Log in insight_access_log (REFRESH)
        │
        ▼
    Return updated insight
```

**Modash cost:** 1 credit per refresh

---

## 5. Collab Check -- Create Report

**Endpoint:** `POST /api/v1/collab-check`

```
User creates collab check (platform, keywords, influencer handles)
    │
    ▼
Deduct credits (1 per influencer)
    │
    ├── [development] Generate random posts + metrics
    │
    └── [production] For each influencer:
        │
        ├── POST Modash /collaborations/posts (0.2 credits)
        │   └── Get real sponsored posts with brand labels
        │
        └── POST Modash /collaborations/summary (0.2 credits)
            └── Get aggregated performance stats
        │
        ▼
    Store in collab_check_influencers + collab_check_posts
    Aggregate report-level metrics
    Update collab_check_reports status → COMPLETED
```

**Modash cost:** ~0.4 credits per influencer

---

## 6. Paid Collaboration -- Create Report

**Endpoint:** `POST /api/v1/paid-collaboration`

```
User creates report (platform, hashtags, mentions, date range)
    │
    ▼
Deduct 1 credit
    │
    ├── [development] Generate random influencers + posts
    │
    └── [production]
        │
        ▼
    POST Modash /{platform}/search with textTags filter (0.15 credits/page)
        └── Discover influencers matching hashtags/mentions
        │
        ▼
    For each discovered influencer:
        └── POST Modash /collaborations/posts with date filter (0.2 credits)
            └── Get sponsored posts in date range
        │
        ▼
    Categorize (nano/micro/macro/mega) from real follower counts
    Store in paid_collab_influencers + paid_collab_posts + paid_collab_categorizations
    Update paid_collab_reports status → COMPLETED
```

**Modash cost:** ~0.15/page search + 0.2/influencer collaboration lookup

---

## 7. Audience Overlap -- Create Report

**Endpoint:** `POST /api/v1/audience-overlap`

```
User creates overlap report (platform, influencer handles)
    │
    ▼
Deduct 1 credit
    │
    ├── [development] Generate random overlap percentages
    │
    └── [production]
        │
        ▼
    POST Modash /{platform}/reports/audience/overlap (1 credit)
    Input: { influencers: ["handle1", "handle2", ...] }
        │
        ▼
    Response:
        totalFollowers → audience_overlap_reports
        totalUniqueFollowers → audience_overlap_reports
        per-influencer uniquePercentage → audience_overlap_influencers
        per-influencer overlappingPercentage → audience_overlap_influencers
        │
        ▼
    Enrich with cached_influencer_profiles for names/pictures
    Update audience_overlap_reports status → COMPLETED
```

**Modash cost:** 1 credit (fixed, regardless of influencer count)

---

## 8. Competition Analysis -- Create Report

**Endpoint:** `POST /api/v1/competition-analysis`

```
User creates report (2-5 brands with hashtags, platform, date range)
    │
    ▼
Deduct 1 credit
    │
    ├── [development] Generate random per-brand data
    │
    └── [production] For each brand:
        │
        ├── POST Modash /collaborations/posts using brand username (0.2 credits)
        │   └── Find influencers the brand works with
        │
        └── POST Modash /collaborations/summary (0.2 credits)
            └── Get brand-level performance aggregates
        │
        ▼
    Store in competition_brands + competition_influencers + competition_posts
    Cross-brand comparison aggregates
    Update competition_analysis_reports status → COMPLETED
```

**Modash cost:** ~0.4 credits per brand (0.8-2.0 per report)

---

## 9. Mention Tracking -- Create Report

**Endpoint:** `POST /api/v1/mention-tracking`

```
User creates report (platforms, hashtags, usernames, keywords, date range)
    │
    ▼
Deduct 1 credit
    │
    ├── [development] Generate random posts + influencers
    │
    └── [production] Per platform:
        │
        ├── Instagram:
        │   ├── GET /raw/ig/hashtag-feed (per hashtag)
        │   └── GET /raw/ig/user-tags-feed (per username)
        │
        ├── TikTok:
        │   └── GET /raw/tiktok/challenge-feed (per hashtag)
        │
        └── YouTube:
            ├── GET /raw/youtube/uploaded-videos (per channel)
            └── GET /raw/youtube/video-subtitles (keyword search)
        │
        ▼
    Filter posts by date range
    Extract influencer info from posts
    Store in mention_tracking_influencers + mention_tracking_posts
    Update mention_tracking_reports status → COMPLETED
```

**Modash cost:** 0 credits (Raw API monthly quota only)

---

## 10. Sentiments -- Create Report

**Endpoint:** `POST /api/v1/sentiments`

```
User creates report (social media URLs)
    │
    ▼
Deduct 1 credit per URL
    │
    ├── [development] Generate random sentiment scores
    │
    └── [production] For each URL:
        │
        ├── Parse post ID from URL
        │
        ├── Instagram: GET /raw/ig/media-comments
        ├── TikTok: GET /raw/tiktok/comments
        └── YouTube: GET /raw/youtube/video-comments
        │
        ▼
    Run local sentiment analysis (NLP) on real comments
        │
        ▼
    Store in sentiment_posts + sentiment_emotions + sentiment_wordcloud
    Update sentiment_reports status → COMPLETED
```

**Modash cost:** 0 credits (Raw API monthly quota only)

---

## 11. Custom ER -- Create Report

**Endpoint:** `POST /api/v1/custom-er`

```
User creates report (influencer, platform, date range)
    │
    ▼
    │
    ├── [development] Generate random posts + metrics
    │
    └── [production]
        │
        ├── Get real profile: cached_influencer_profiles or
        │   Modash GET /{platform}/profile/{id}/report (1 credit if uncached)
        │
        ├── Get real posts via Raw API:
        │   ├── IG: GET /raw/ig/user-feed (paginate within date range)
        │   ├── TikTok: GET /raw/tiktok/user-feed
        │   └── YouTube: GET /raw/youtube/uploaded-videos
        │
        └── Optional: POST /collaborations/posts (0.2 credits)
            └── Identify sponsored vs organic posts
        │
        ▼
    Calculate real ER: (likes + comments) / followers per post
    Store in custom_er_posts, update custom_er_reports
    Status → COMPLETED
```

**Modash cost:** 0-1 credits + Raw API quota

---

## 12. Tie Breaker -- Create Comparison

**Endpoint:** `POST /api/v1/tie-breaker`

```
User creates comparison (2-3 influencer profile IDs)
    │
    ▼
Charge 1 credit per uncached profile
    │
    ├── [development] Generate random audience data
    │
    └── [production] For each influencer:
        │
        ├── Check influencer_insights / cached_influencer_profiles
        │   ├── Cached + fresh → Use cached data (0 credits)
        │   └── Missing → GET Modash /{platform}/profile/{id}/report (1 credit)
        │
        ▼
    Populate real audience data (gender/age/geo/interests)
    Populate real content stats (statsByContentType)
    Store in tie_breaker_influencers
    Status → COMPLETED
```

**Modash cost:** 0-1 credits per uncached profile

---

## 13-18. Local-Only Modules (No Modash)

These modules have identical flows in both development and production modes:

- **Auth** -- Login/signup/JWT/password -- pure local
- **Profile** -- User profile management -- pure local
- **Credits** -- Internal credit ledger -- pure local
- **Team** -- Team management + impersonation -- pure local
- **Campaigns** -- Campaign tracking/deliverables/metrics -- user-entered data
- **Influencer Groups** -- List management/invitations -- organizational
- **Content** -- FAQs/static pages -- CMS
- **Generated Reports** -- Cross-module report aggregation -- reads only
