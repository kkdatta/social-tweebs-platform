 **Zorbit x Modash x Client**

**API Raw+ Discovery Analysis**

| DISCOVERY | REPORTS | CAMPAIGN | ADMIN / ZERO COST |
| :---: | :---: | :---: | :---: |

| Key Rule: Modash charges on EVERY API call, even for the same data. The platform MUST act as a smart cache layer — one Modash call serves all users under a client account, forever within the defined TTL.  |
| :---- |

| GLOBAL RULE: Client-Level Data Unlocks |
| :---- |
| **Applies to:** Discovery Unblur, Influencer Insights, Collab Check, Audience Overlap, Paid Collaboration — every feature where a user 'unlocks' data. **Rule:** All unlocks(except overlap) are shared across ALL users under the same client account. If any one user unlocks a piece of data, every other user under that client pays 0 credits to access the same data. Example: SocialTweebs is a client with 6 user logins. User 1 unlocks Influencer X's Insights (1 credit deducted). Users 2–6 can now open Influencer X's Insights at 0 credits — no new Modash call. **DB implementation:** Store unlocked state against client\_id (not user\_id). On any data access request, check: client\_id \+ resource\_id already unlocked? → Serve from DB, 0 credits. ( can be discussed) |

| 1\.  Discovery — Search Influencers   \[ DISCOVERY \] |  |
| :---- | :---- |
| **Trigger** | User submits search filters on the Discovery page (platform, follower range, niche, location, etc.) |
| **Modash endpoint** | POST /{platform}/search |
| **API type** | Discovery |
| **Modash cost (you pay)** | **\~0.15 credits / page (15 results)**  Zorbit pays this to Modash on every cache-miss call |
| **Platform cost (user pays)** | **0 credits  (INFLUENCER\_SEARCH \= 0\)**  Search is always free to the end user |
| **Margin** | −0.15 credits (platform absorbs search cost) |
| **Platform section served** | Discovery search results (blurred profile cards, 10 shown by default, 3 pre-unblurred) |
| **Cache key** | SHA-256 hash of (platform \+ filter object). TTL \= 30 days. |
| **Cache rule** | **SAME query within 30 days → serve from DB, 0 Modash call. Query treated as same even if submitted by a different user or different account (ADX vs SocialTweebs).** |
| **Multi-account rule** | Results stored in shared DB. ADX and SocialTweebs share the same cache. If one account searches, the other gets results free. |
| **When skipped (no API call)** |  |
| **When skipped (no API call)** | Same query within 30 days (any user, any account) Pagination / scroll on existing result set APP\_MODE \= development → queries local DB |
| **Business logic notes** | 1 Modash call returns 25 profiles. Store all 25, show 10\. 3 profiles auto-unblurred (platform cost). Remainder blurred — user pays 0.04 credits each to unblur. b) Those unblurred data will always be unblurred (only the follower count & engagement rate will change forever) |

| 2\.  Discovery — Unblur / Unlock Influencer   \[ DISCOVERY \] |  |
| :---- | :---- |
| **Trigger** | User selects blurred influencer(s) and confirms credit spend to unblur |
| **Modash endpoint** | None — reads from local DB cache |
| **API type** | Local DB only — NO Modash call |
| **Modash cost (you pay)** | **0 credits** |
| **Platform cost (user pays)** | **0.04 credits per profile  (INFLUENCER\_UNBLUR \= 0.04)**  1 credit \= 25 profiles |
| **Margin** | \+0.04 credits per unblur (pure margin — no Modash cost) |
| **Platform section served** | Unblurred profile cards in Discovery results (name, handle, avatar, follower count revealed) |
| **Unlock model** | **CLIENT-LEVEL. Once any user under a client account unblurs a profile, all other users under that same client see the unblurred profile at 0 credits. Store unblur state against client\_id, not user\_id.** |
| **Monthly  reset** | System scheduled job 30 days once, resets blur state for all profiles. 0 credits charged to any account. (engagement and follower count to be updated forever) |
|  |  |
| **When skipped (no API call)** | Page load / scroll Profile already unblurred within this account domain Development mode |

| 3\.  Discovery / Insights — View Insights (First Access)   \[ DISCOVERY \] |  |
| :---- | :---- |
| **Trigger** | User clicks 'View Insights' on an influencer for the first time on their account |
| **Modash endpoint** | GET /{platform}/profile/{id}/report |
| **API type** | Discovery |
| **Modash cost (you pay)** | **1.0 credit**  Charged by Modash to Zorbit on every new/stale fetch |
| **Platform cost (user pays)** | **1 credit  (INFLUENCER\_INSIGHT \= 1\)**  Charged once per account; free on all return visits within TTL |
| **Margin** | 0 credits (1:1 pass-through on first call; all return visits are pure margin) |
| **Platform section served** | Full Insights page: Overview, Audience demographics, Engagement stats, Top Posts, Reels, Brand Affinities |
| **Cache TTL** | **7 days from the date of the Modash fetch If another account ask for an access (fetched\_at timestamp in DB).** |
| **Cache rule** | If DB record exists AND fetched\_at \< 7 days ago → serve from DB, 0 Modash call, 0 user credits. This applies to ALL users within the same client account. |
| **Unlock model** | **CLIENT-LEVEL. Once any user under the client unlocks an influencer insight, every other user in that client account accesses it at 0 credits — forever (subject to 7-day freshness for Modash cost, not for credit charge). Store unlocked\_by\_client\_id in DB.** |
| **When skipped (no API call)** | User reopens same influencer (any session, any tab) Different user in same account opens same influencer ADX opens same influencer within 7 days of SocialTweebs fetch Switching tabs (Overview / Audience / Engagement / Posts / Reels) Exporting insight (PDF, JSON, Excel) APP\_MODE \= development |
| **Stale data behavior** | If record exists but is \>= 7 days old: still serve DB data with a 'Last updated X days ago' notice. Do NOT auto-refresh. User must click Refresh to trigger a new Modash call. |
| **Unlock persistence** | Once unlocked by a user: listed permanently in their Influencer Insights menu. Never charged 1 credit again for revisit, regardless of TTL state. |
|  |  |

| 4\.  Discovery / Insights — Refresh Insight   \[ DISCOVERY \] |  |
| :---- | :---- |
| **Trigger** | User explicitly clicks the 'Refresh' button on an influencer insight page |
| **Modash endpoint** | GET /{platform}/profile/{id}/report |
| **API type** | Discovery |
| **Modash cost (you pay)** | **1.0 credit** |
| **Platform cost (user pays)** | **1 credit  (REPORT\_REFRESH \= 1\)** |
| **Margin** | 0 credits (1:1 pass-through) |
| **Platform section served** | Same Insights panel, fully updated with latest Modash data. Reset fetched\_at in DB. |
| **Cache rule** | **After a successful refresh, new fetched\_at is set for the entire account. ADX and SocialTweebs both see refreshed data from this point — 7-day TTL restarts.** |
| **Guard** | Refresh button must be disabled on click until response is returned (prevent duplicate calls). If Modash fails: do NOT deduct credit, do NOT update fetched\_at. Show error, allow one manual retry. |
| **Business logic** | **Whenever a user requests a data refresh, the system will first check the database. If the latest data is already available(updated within 7 days), the same data will be returned. If not, the system will call the Modash API to fetch the most recent data. In either case, 1 credit will be charged to the user for the refresh request.** |

| 6\.  Collab Check — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates a new Collab Check report for one or more influencers |
| **Modash endpoint** | POST /collaborations/posts per influencer  (limit: 30 posts per influencer) |
| **API type** | Discovery |
| **Modash cost (you pay)** | **\~0.2 credits per influencer**  Zorbit absorbs this per influencer |
| **Platform cost (user pays)** | **1 credit per influencer  (REPORT\_GENERATION \= 1 × quantity)** |
| **Margin** | \+0.8 credits per influencer |
| **Platform section served** | Collab Check report: sponsored posts, brand partnerships, post performance metrics per influencer |
| **Unlock model** | **CLIENT-LEVEL. Once any user in the client account creates a Collab Check for an influencer, all other users in that account can view the same report at 0 credits. Data persists indefinitely — updates ONLY on explicit Refresh.** |
| **When skipped (no API call)** | Any user in the client account views or downloads an existing Collab Check report Same influencer already checked by this client account (no refresh requested) |

| 7\.  Collab Check — Refresh Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User clicks Refresh on an existing Collab Check report |
| **Modash endpoint** | POST /collaborations/posts per influencer  (same as create flow) |
| **Modash cost (you pay)** | **\~0.2 credits per influencer (variable)** |
| **Platform cost (user pays)** | **1 credit  (REPORT\_REFRESH \= 1\)** |
| **Margin** | \+0.8 credits |
| **Guard** | Same guard as Insight Refresh: disable button on click, no credit deduct on failure, one manual retry allowed. |
| **When skipped (no API call)** | User views, downloads, or filters inside the report without clicking Refresh |

| 8\.  Paid Collaboration — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates a Paid Collab report using hashtags / mentions \+ date range, selecting one or more influencers |
| **Modash endpoint** | POST /collaborations/posts per search term  (limit: 20 posts per term, with date filter) |
| **API type** | Discovery |
| **Modash cost (you pay)** | **\~0.2 credits per search term**  Zorbit pays this per search term to Modash |
| **Platform cost (user pays)** | **1 credit per influencer  (REPORT\_GENERATION \= 1 × influencer count)**  e.g., report covering 3 influencers \= 3 credits |
| **Margin** | \+0.8 credits per influencer  (1 revenue − \~0.2 Modash cost) |
| **Platform section served** | Paid Collab report: discovered influencers, sponsored posts, nano/micro/macro/mega categorization |
| **Unlock model** | **CLIENT-LEVEL — unlock once, view forever. Once any user under the client account generates a Paid Collab report, every other user in that account can view it at 0 credits. Data does NOT auto-refresh.** |
| **Cache rule** | Report stored permanently at client level (client\_id) after first creation. On revisit by any user in the same client: serve from DB, 0 credits, 0 Modash call. Refresh \= 1 credit (REPORT\_REFRESH \= 1), updates data for all users in the client. |
| **When skipped (no API call)** | Any user in the client account reopens, views, downloads, or filters an already-generated report (view forever at 0 credits) Any tab switch or scroll inside the report |

| 9\.  Audience Overlap — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates an audience overlap report with 2+ influencers |
| **Modash endpoint** | POST /{platform}/reports/audience/overlap |
| **API type** | Discovery |
| **Modash cost (you pay)** | **1 credit total per query  (regardless of influencer count)**   |
| **Business Logic** | This rule applies at the **user level** (not the client level). If a user unlocks overlap data for 3 influencers, **3 credits** will be charged (**1 creator \= 1 credit**). If, on the same day, the same user or a different user unlocks the same influencers again, the client/user will still be charged accordingly. no new call will be made to the Modash API, as the data will be served from the existing database/cache  |
| **Platform cost (user pays)** | **1 credit per query**  Track query\_count per client\_id in DB |
|  |  |
| **Platform section served** | Overlap report: total/unique followers, per-influencer overlap percentage, audience intersection bubble chart |
| **Unlock model** | Client-level. Once a report is generated by any user under the client account, all other users can view the same report at 0 credits. |
| **Counter logic** | **DB field: audience\_overlap\_query\_count per client\_id. Increment on each new unique query. Free quota \= LIFETIME — counter never resets. Once a client has used 10 queries, all subsequent queries are charged at 1 credit each, permanently.** |
| **Cache rule** | Each unique influencer combination \= one report stored permanently. Revisit by any user in same client account \= 0 credits, 0 Modash call. Fresh data \= user creates a new report. |
| **When skipped (no API call)** | User reopens, views, retries, edits, or downloads an existing report (client-level, view forever at 0 credits)If any reason, same day \- same/different user unlocks the same influencers then we are charging client/user. But we are not calling modash api |

| 10\.  Competition Analysis — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates a competitive analysis for 2–5 brands |
| **Modash endpoints** | Per brand: POST /collaborations/posts  \+  POST /collaborations/summary |
| **API type** | Discovery |
| **Modash cost (you pay)** | **\~0.4 credits per brand  (2 endpoints × 0.2)** |
| **Platform cost (user pays)** | **1 credit  (REPORT\_GENERATION \= 1\)** |
| **Margin** | \+0.6 credits per report (for single brand); margin grows with more brands since platform cost stays flat |
| **Platform section served** | Competition report: per-brand influencer rosters, post performance, cross-brand side-by-side comparison |
| **Cache rule** | **Report stored on creation. Same brand combination: serve from DB. New report \= new Modash call.** |
| **When skipped (no API call)** | Reopen, view, filter, sort, or download an existing report |

| 11\.  Mention Tracking — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates a mention tracking report (brand handle, hashtag, or keyword) |
| **Raw API endpoints by platform** | Instagram:  GET /raw/ig/hashtag-feed  \+  GET /raw/ig/user-tags-feed TikTok:     GET /raw/tiktok/challenge-feed  \+  GET /raw/tiktok/user-feed YouTube:    GET /raw/youtube/uploaded-videos  \+  GET /raw/youtube/video-subtitles |
| **API type** | Raw API only — NO Discovery credits consumed. Confirmed across Instagram, TikTok, and YouTube. |
| **Modash cost (you pay)** | **0 Discovery credits  /  4–12 Raw API requests per report (2 endpoints per platform)**  Monthly raw request quota — not Discovery credits |
| **Platform cost (user pays)** | **1 credit  (REPORT\_GENERATION \= 1\)** |
| **Margin** | High — monthly raw quota cost is small vs. 1-credit charge to user |
| **Platform section served** | Mention tracking report: posts mentioning the brand, influencer extraction, engagement timeline |
| **404 guard** | **Modash counts 404 responses as consumed requests. Validate all handles/hashtags exist before calling Raw API to avoid burning quota on missing content.** |
| **Pagination note** | user-feed and hashtag-feed return paginated results. Each page \= 1 raw request from monthly quota. Budget accordingly for high-volume hashtags. |
| **Cache rule** | **Report stored on creation. Immutable — no TTL. Fresh data \= new report.** |
| **When skipped (no API call)** | Reopen, view, or download existing mention tracking report |

| 12\.  Social Sentiments — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates a sentiment analysis report from one or more social media post URLs |
| **Raw API endpoints by platform** | Instagram:  GET /raw/ig/media-info  (+ hidden comments endpoint) TikTok:     GET /raw/tiktok/comments  \+  GET /raw/tiktok/comments-replies YouTube:    GET /raw/youtube/video-info  (+ subtitles/comments endpoints) |
| **API type** | Raw API only — NO Discovery credits consumed. Same monthly quota model across all platforms. |
| **Modash cost (you pay)** | **0 Discovery credits  /  2–6 Raw API requests per URL (comment threads may paginate across multiple calls)**  Monthly raw request quota |
| **Platform cost (user pays)** | **1 credit per URL  (REPORT\_GENERATION \= 1 × number of URLs)** |
| **Margin** | High — monthly raw quota cost is small vs. per-URL credit charge |
| **Platform section served** | Sentiment report: emotion breakdown, word cloud, positive/neutral/negative sentiment scores |
| **404 guard** | **Modash counts 404 as a consumed request. Validate post URLs are accessible before calling Raw API. Private posts or deleted content will 404 and still consume quota.** |
| **Cache rule** | **Each unique URL \= one immutable report entry. Stored indefinitely. Fresh data \= new report.** |
| **When skipped (no API call)** | Reopen, view, filter, or download existing sentiment report |

| 13\.  Custom ER — Create Report   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User creates a custom engagement rate report for an influencer |
| **Raw API endpoints by platform** | Instagram:  GET /raw/ig/user-feed  (12 posts/page, paginated) TikTok:     GET /raw/tiktok/user-feed YouTube:    GET /raw/youtube/uploaded-videos  \+  GET /raw/youtube/uploaded-shorts |
| **Discovery endpoint (optional)** | GET /{platform}/profile/{id}/report — only if profile not already in DB cache (7-day TTL check first) |
| **API type** | Raw API  \+  optional Discovery (cache-dependent) |
| **Modash cost (you pay)** | **0–1 Discovery credit  \+  1–5 Raw API requests (Instagram user-feed \= 12 posts/page; 30-post analysis \= 3 raw calls minimum)**  Monthly raw quota \+ optional Discovery credit |
| **Platform cost (user pays)** | **0 credits  (explicitly no deduction — CustomErService)**  Free feature — Zorbit absorbs cost |
| **Margin** | Negative — platform absorbs cost. Treat as a value-add retention feature. |
| **Platform section served** | Custom ER report: real engagement rate per post, organic vs. sponsored breakdown |
| **Pagination note** | **Instagram user-feed: 12 posts per page. To analyse 60 posts \= 5 raw API calls. Set a sensible post-count cap (e.g. 30 posts max) to control raw quota spend.** |
| **Cache rule** | Check Discovery profile DB first (7-day TTL). If cached: 0 Discovery credit. Raw feed always freshly fetched — no cache applied to feed data. |

| 14\.  Tie Breaker — Create Comparison   \[ DISCOVERY \] |  |
| :---- | :---- |
| **Trigger** | User selects 2–3 influencers for side-by-side comparison |
| **Modash endpoint** | GET /{platform}/profile/{id}/report  per influencer not already unlocked |
| **API type** | Discovery |
| **Modash cost (you pay)** | **0–1 credit per influencer  (0 if already cached within 7 days)** |
| **Platform cost (user pays)** | **1 credit per influencer not already unlocked  (PROFILE\_UNLOCK \= 1\)** |
| **Margin** | 0 credits per new influencer (1:1 pass-through); \+1 credit per already-cached influencer (pure margin) |
| **Platform section served** | Side-by-side comparison: audience demographics, content stats, engagement rate, follower quality |
| **Cache rule** | **If an influencer's Insights profile is in DB and \< 7 days old → use cached data, 0 Modash call, 0 user credit. Only call Modash for influencers not in cache.** |
| **Cross-platform restriction** | Cannot compare influencers across different platforms (e.g., Instagram vs TikTok). Enforce at UI level before API call. |
| **When skipped (no API call)** | All influencers in comparison are already cached within 7-day TTL User revisits an existing comparison report |

| 15\.  Campaign Tracking — Create & View Report   \[ CAMPAIGN \] |  |
| :---- | :---- |
| **Trigger** | User creates a new campaign OR views an active campaign report |
| **Modash endpoints** | Per influencer in campaign: GET /{platform}/profile/{id}/report  \+  raw post feed endpoints |
| **API type** | Discovery \+ Raw API |
| **Modash cost (you pay)** | **Variable — per influencer, per campaign fetch  (Zorbit absorbs all campaign API costs within the free quota)** |
| **Pricing model** | **FREEMIUM — First 10 campaigns per client account: 0 credits to user (Zorbit absorbs Modash cost). Campaign 11 onwards: 1 credit per campaign creation  (REPORT\_GENERATION \= 1).** |
| **Platform cost (user pays)** | **Campaigns 1–10: 0 credits  |  Campaign 11+: 1 credit per campaign**  Track campaign\_count per client\_id in DB |
| **Margin** | Campaigns 1–10: Negative (Zorbit absorbs Modash cost). Campaign 11+: 0 credits margin (1:1 pass-through). Monitor Modash cost per campaign closely. |
| **Platform section served** | Campaign Report: Campaign Summary, Influencer Performance Table, Posts Section, Stories, Analytics |
| **View window** | **User can view campaign data from creation until the campaign end date set at creation. After the end date, report is archived — viewable as a snapshot but no new Modash calls are made.** |
| **Data freshness during campaign** | While the campaign is active (before end date): fetch latest data from Modash on each view. After end date: serve frozen DB snapshot, 0 Modash calls. |
| **Counter logic** | DB field: campaign\_count per client\_id. Increment on campaign creation. Free quota \= LIFETIME — counter never resets. Check count BEFORE allowing creation: if count \>= 10 and balance \< 1 credit, block creation and show upgrade prompt. Once past 10, every new campaign costs 1 credit permanently. |
| **Creation guard** | Minimum account balance of 5 credits required at time of creation (system check). Also enforce campaign\_count check for freemium quota. |
| **When skipped (no API call)** | Downloading a campaign report (uses last fetched data) Editing campaign metadata (name, dates, notes) Viewing an archived campaign after its end date (serves DB snapshot) |

| 16\.  All Refreshes — Any Module   \[ REPORTS \] |  |
| :---- | :---- |
| **Trigger** | User explicitly clicks the 'Refresh' button on any existing report or insight |
| **Modash endpoint** | Same as the Create flow for that module |
| **Modash cost (you pay)** | **Same as create cost for that module (variable)** |
| **Platform cost (user pays)** | **1 credit  (REPORT\_REFRESH \= 1\)  — flat rate regardless of module** |
| **Universal guard** | **MUST apply to ALL refresh actions: (1) Disable button immediately on click. (2) If Modash succeeds → deduct 1 credit, update DB record (fetched\_at). (3) If Modash fails → do NOT deduct credit, do NOT update fetched\_at, show error. (4) Allow one manual retry. No auto-retry loops.** |
| **When skipped (no API call)** | Auto page load / route navigation — NEVER auto-refresh Tab switch within the same report Scroll or sort within report data |

| 17\.  Dictionary & Admin Endpoints — Zero Cost Both Sides   \[ ADMIN / ZERO COST \] |  |
| :---- | :---- |
| **Purpose** | These endpoints populate filter dropdowns and admin monitoring dashboards. They are free to call and should be cached aggressively. |
| **Cache rule** | **All dictionary endpoints: cache in DB with 24-hour TTL. Never call Modash on every page load — check DB first.** |
| **Endpoints & sections served** |  |
| **Endpoints & sections served** | GET /{platform}/locations       →  Discovery: Location filter dropdown GET /{platform}/interests       →  Discovery: Interest/niche filter dropdown GET /{platform}/languages       →  Discovery: Language filter dropdown GET /{platform}/brands          →  Discovery: Brand affinity filter dropdown GET /user/info                  →  Admin: Credit balance monitoring, account info |
| **Modash cost (you pay)** | **0 credits  (dictionary endpoints are free)** |
| **Platform cost (user pays)** | **0 credits** |

**Quick Reference: Credit Rules from Code**

**credits.service.ts  — CREDIT\_RULES (Lines 40–51)**

| const CREDIT\_RULES: Partial\<Record\<ActionType, number\>\> \= {   \[ActionType.INFLUENCER\_SEARCH\]:   0,   \[ActionType.INFLUENCER\_UNBLUR\]:   0.04,   \[ActionType.INFLUENCER\_INSIGHT\]:  1,   \[ActionType.INFLUENCER\_EXPORT\]:   0.04,   \[ActionType.PROFILE\_UNLOCK\]:      1,   \[ActionType.REPORT\_GENERATION\]:   1,   \[ActionType.REPORT\_REFRESH\]:      1,   \[ActionType.MANUAL\_ALLOCATION\]:   0,   \[ActionType.ACCOUNT\_EXPIRY\]:      0,   \[ActionType.ADMIN\_ADJUSTMENT\]:    0, }; |
| :---- |

**Action Type → Platform Credit Cost → Typical Use**

| Action Type | Platform Cost / unit | Typical Use |
| :---- | :---: | :---- |
| INFLUENCER\_SEARCH | **0** | Search is free to end user. Platform absorbs \~0.15 credit Modash cost. |
| INFLUENCER\_UNBLUR | **0.04  (25 profiles \= 1 cr)** | Revealing blurred profile cards in Discovery. |
| INFLUENCER\_INSIGHT | **1** | First-time View Insights on an influencer. Free on all revisits within 7-day TTL. |
| INFLUENCER\_EXPORT | **0.04  (25 profiles \= 1 cr)** | Exporting influencer list to CSV/Excel. Never calls Modash. |
| PROFILE\_UNLOCK | **1** | Tie Breaker: unlock per influencer not already in cache. |
| REPORT\_GENERATION | **1** | Any new report creation (Overlap, Sentiment, Collab, Competition, Mention Tracking). |
| REPORT\_REFRESH | **1** | Any report or insight refresh, user-triggered only. |
| MANUAL\_ALLOCATION | **0** | Admin credit top-up — no API call. |
| ACCOUNT\_EXPIRY | **0** | System action — no API call. |
| ADMIN\_ADJUSTMENT | **0** | Admin override — no API call. |

**Cache TTL Reference**

| Feature | Cache TTL | Rule on Stale Data |
| :---- | ----- | :---- |
| **Discovery Search** | **30 days** | Serve from DB. No auto-refresh. New Modash call only on cache miss. |
| **Influencer Insights** | **7 days** | Serve stale DB data with 'Last updated X days ago'. Refresh \= user-triggered. |
| **Reports (all types)** | **No TTL** | Immutable. User creates a new report for fresh data. |
| **Campaign Tracking** | **No TTL (live)** | Always fetch latest from Modash on view. Zorbit absorbs cost. |
| **Dictionary Endpoints** | **24 hours** | Cache in DB. Check DB before every dropdown load. |
| **Unblur State** | **Monthly reset** | System resets on 1st of month. Users re-unblur manually. |

**Margin Analysis — Zorbit Cost vs. Platform Revenue**

| Feature | Modash Cost | Platform Revenue | Margin | Watch Out For |
| :---- | :---: | :---: | :---: | :---- |
| Discovery Search (cache miss) | **\~0.15 cr** | **0 cr (free)** | **−0.15** | High-volume unique searches burn credits fast |
| Influencer Insight (new) | **1.0 cr** | **1 cr** | **0** | 1:1 — ensure cache is hit on all revisits |
| Influencer Insight (revisit) | **0 cr** | **0 cr** | **0** | Pure platform cost if TTL is hit |
| Unblur / Export | **0 cr** | **0.04 cr each** | **\+0.04** | Pure margin — no Modash cost |
| Collab Check (new) | **\~0.2 cr** | **1 cr** | **\+0.8** | Good margin — protect with cache |
| Audience Overlap (1–10 free) | **1 cr** | **1 cr** | **−1 cr** | Modash charges 1 Cr per query but we charge per influencer |
| Competition Analysis | **\~0.4 cr** | **1 cr** | **\+0.6** |  |
| Paid Collaboration (new report) | **\~0.2 cr** | **1 cr × creators** | **\+0.8** | Unlock once, view forever |
| Custom ER (absorbed) | **\~0.5 cr** | **0 cr** | **−0.5** | Platform loss — value-add feature |
| Campaign Tracking (1–10 free) | **Variable** | **0 cr** | **Negative** | Zorbit absorbs — monitor per-campaign Modash cost |
| Campaign Tracking (11+ charged) | **Variable** | **1 cr / campaign** | **\~0** | 1:1 pass-through; still monitor volume |
| Mention Tracking | **Raw API** | **1 cr** | **High** | Raw API cost minimal vs. credit revenue |
| Social Sentiments | **Raw API** | **1 cr / URL** | **High** | Raw API cost minimal vs. credit revenue |

