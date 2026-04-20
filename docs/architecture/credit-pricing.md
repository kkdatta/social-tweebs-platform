# Credit Pricing -- Modash API Costs Per User Action

## Two Billing Counters

Modash has two separate billing systems:

1. **Discovery Credits** -- Decimal number, deducted per API call
2. **Raw API Requests** -- Monthly integer quota, 1 per call

Check balance: `GET /user/info` → `billing.credits` + `billing.rawRequests`

## Cost Per User Action on ZorbitAds

### Discovery & Insights

| User Action | Modash Calls | Discovery Credits | Raw Requests |
|-------------|-------------|-------------------|--------------|
| Search influencers (1 page, 15 results) | 1x `/{platform}/search` | 0.15 | 0 |
| Search influencers (5 pages) | 5x `/{platform}/search` | 0.75 | 0 |
| Unblur / unlock influencer | None | 0 | 0 |
| View insights (first time) | 1x `/{platform}/profile/{id}/report` | 1.0 | 0 |
| View insights (cached, fresh) | None | 0 | 0 |
| View insights (cached, stale -- no refresh) | None | 0 | 0 |
| Refresh insights | 1x `/{platform}/profile/{id}/report` | 1.0 | 0 |

### Report Modules

| User Action | Modash Calls | Discovery Credits | Raw Requests |
|-------------|-------------|-------------------|--------------|
| Collab check (per influencer) | posts + summary | 0.4 | 0 |
| Collab check (5 influencers) | 10 calls | 2.0 | 0 |
| Paid collab report (1 page search + 5 influencers) | search + 5x posts | 1.15 | 0 |
| Audience overlap (any count) | 1x overlap | 1.0 | 0 |
| Competition analysis (3 brands) | 6x collab calls | 1.2 | 0 |
| Competition analysis (5 brands) | 10x collab calls | 2.0 | 0 |
| Mention tracking report | Raw feeds only | 0 | 5-20 |
| Sentiment report (1 URL) | Raw comments only | 0 | 3-10 |
| Sentiment report (3 URLs) | Raw comments only | 0 | 9-30 |
| Custom ER report (cached profile) | Raw feed only | 0 | 3-10 |
| Custom ER report (uncached profile) | report + Raw feed | 1.0 | 3-10 |
| Tie breaker (all cached) | None | 0 | 0 |
| Tie breaker (1 uncached of 3) | 1x report | 1.0 | 0 |

### Dictionary / Admin (0 credits)

| Action | Modash Call | Cost |
|--------|-----------|------|
| Get locations dictionary | `GET /{platform}/locations` | 0 |
| Get interests dictionary | `GET /{platform}/interests` | 0 |
| Get languages dictionary | `GET /{platform}/languages` | 0 |
| Get brands dictionary | `GET /{platform}/brands` | 0 |
| Check Modash balance | `GET /user/info` | 0 |

## Monthly Cost Estimation

Assumptions for a typical agency with 10 active users:

| Activity | Volume/month | Credits | Raw Requests |
|----------|-------------|---------|--------------|
| Discovery searches | 500 pages | 75 | 0 |
| Profile reports (new) | 200 | 200 | 0 |
| Profile refreshes | 50 | 50 | 0 |
| Collab checks | 30 reports x 3 influencers | 36 | 0 |
| Paid collab reports | 20 | 23 | 0 |
| Audience overlap | 15 | 15 | 0 |
| Competition analysis | 10 x 3 brands | 12 | 0 |
| Mention tracking | 20 reports | 0 | 200 |
| Sentiment reports | 30 x 2 URLs | 0 | 180 |
| Custom ER reports | 40 | 10 | 200 |
| Tie breaker | 25 | 5 | 0 |
| **TOTAL** | | **~426 credits** | **~580 requests** |

## Cost Optimization Tips

1. **Cache aggressively** -- Insights with 7-day TTL avoid repeat report fetches
2. **Use new Collaborations endpoints** -- 0.2 credits vs deprecated 1 credit endpoints
3. **Raw API for monitoring** -- Mention tracking and sentiments use monthly quota, not credits
4. **Pre-warm dictionaries** -- Cache locally, refresh daily (0 credits)
5. **Batch overlap** -- 1 credit regardless of 2 or 10 influencers
