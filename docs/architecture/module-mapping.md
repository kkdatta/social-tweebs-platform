# Module-to-Modash Endpoint Mapping

Complete mapping of every ZorbitAds module to its Modash API endpoints.

## Legend

- **Discovery API** -- Credit-based billing (decimal credits per call)
- **Raw API** -- Monthly request quota (1 request per call from quota)
- **Local DB** -- No Modash call, uses `cached_influencer_profiles` or module tables
- **N/A** -- Module does not use Modash

## Mapping Table

| Module | Feature | Modash Endpoint | API Type | Cost |
|--------|---------|-----------------|----------|------|
| **Discovery** | Search influencers | `POST /{platform}/search` | Discovery | 0.01/result |
| **Discovery** | View insights | `GET /{platform}/profile/{id}/report` | Discovery | 1 credit |
| **Discovery** | Refresh insights | `GET /{platform}/profile/{id}/report` | Discovery | 1 credit |
| **Discovery** | Unblur/unlock | -- | Local DB | 0 |
| **Discovery** | Locations dict | `GET /{platform}/locations` | Discovery | 0 |
| **Discovery** | Interests dict | `GET /{platform}/interests` | Discovery | 0 |
| **Discovery** | Languages dict | `GET /{platform}/languages` | Discovery | 0 |
| **Discovery** | Brands dict | `GET /{platform}/brands` | Discovery | 0 |
| **Insights** | Search & unlock | `GET /{platform}/profile/{id}/report` | Discovery | 1 credit |
| **Insights** | Get insight | -- | Local DB | 0 |
| **Insights** | Force refresh | `GET /{platform}/profile/{id}/report` | Discovery | 1 credit |
| **Collab Check** | Create report | `POST /collaborations/posts` | Discovery | 0.2 credit |
| **Collab Check** | Create report | `POST /collaborations/summary` | Discovery | 0.2 credit |
| **Collab Check** | Search influencers | -- | Local DB | 0 |
| **Paid Collab** | Create report (search) | `POST /{platform}/search` | Discovery | 0.15/page |
| **Paid Collab** | Create report (posts) | `POST /collaborations/posts` | Discovery | 0.2 credit |
| **Audience Overlap** | Create report | `POST /{platform}/reports/audience/overlap` | Discovery | 1 credit |
| **Audience Overlap** | Search influencers | -- | Local DB | 0 |
| **Competition** | Per-brand analysis | `POST /collaborations/posts` | Discovery | 0.2 credit |
| **Competition** | Per-brand summary | `POST /collaborations/summary` | Discovery | 0.2 credit |
| **Mention Tracking** | IG hashtag feed | `GET /raw/ig/hashtag-feed` | Raw | 1 request |
| **Mention Tracking** | IG tags feed | `GET /raw/ig/user-tags-feed` | Raw | 1 request |
| **Mention Tracking** | TikTok challenge | `GET /raw/tiktok/challenge-feed` | Raw | 1 request |
| **Mention Tracking** | YT videos | `GET /raw/youtube/uploaded-videos` | Raw | 1 request |
| **Mention Tracking** | YT subtitles | `GET /raw/youtube/video-subtitles` | Raw | 1 request |
| **Sentiments** | IG comments | `GET /raw/ig/media-comments` | Raw | 1 request |
| **Sentiments** | TikTok comments | `GET /raw/tiktok/comments` | Raw | 1 request |
| **Sentiments** | YT comments | `GET /raw/youtube/video-comments` | Raw | 1 request |
| **Custom ER** | Profile data | `GET /{platform}/profile/{id}/report` | Discovery | 1 credit |
| **Custom ER** | IG feed | `GET /raw/ig/user-feed` | Raw | 1 request |
| **Custom ER** | TikTok feed | `GET /raw/tiktok/user-feed` | Raw | 1 request |
| **Custom ER** | YT videos | `GET /raw/youtube/uploaded-videos` | Raw | 1 request |
| **Custom ER** | Sponsored check | `POST /collaborations/posts` | Discovery | 0.2 credit |
| **Tie Breaker** | Profile comparison | `GET /{platform}/profile/{id}/report` | Discovery | 1 credit |
| **Auth** | All | -- | N/A | -- |
| **Profile** | All | -- | N/A | -- |
| **Credits** | All | -- | N/A | -- |
| **Team** | All | -- | N/A | -- |
| **Campaigns** | All | -- | N/A | -- |
| **Influencer Groups** | All | -- | N/A | -- |
| **Content** | All | -- | N/A | -- |
| **Generated Reports** | All | -- | N/A | -- |

## ModashService Method Mapping

Methods in `ModashService` (Discovery API):

| Method | Modash Endpoint | Used By |
|--------|-----------------|---------|
| `searchInfluencers()` | `POST /{platform}/search` | Discovery, Paid Collaboration |
| `getInfluencerReport()` | `GET /{platform}/profile/{id}/report` | Discovery, Insights, Custom ER, Tie Breaker |
| `getCollaborationPosts()` | `POST /collaborations/posts` | Collab Check, Paid Collab, Competition, Custom ER |
| `getCollaborationSummary()` | `POST /collaborations/summary` | Collab Check, Competition |
| `getAudienceOverlap()` | `POST /{platform}/reports/audience/overlap` | Audience Overlap |
| `searchByEmail()` | `POST /email-search` | (future use) |
| `getAccountInfo()` | `GET /user/info` | Credit monitoring |
| `getLocations()` | `GET /{platform}/locations` | Discovery |
| `getInterests()` | `GET /{platform}/interests` | Discovery |
| `getLanguages()` | `GET /{platform}/languages` | Discovery |
| `getBrands()` | `GET /{platform}/brands` | Discovery |

Methods in `ModashRawService` (Raw API):

| Method | Modash Endpoint | Used By |
|--------|-----------------|---------|
| `getIgHashtagFeed()` | `GET /raw/ig/hashtag-feed` | Mention Tracking |
| `getIgUserFeed()` | `GET /raw/ig/user-feed` | Custom ER |
| `getIgUserTagsFeed()` | `GET /raw/ig/user-tags-feed` | Mention Tracking |
| `getIgMediaComments()` | `GET /raw/ig/media-comments` | Sentiments |
| `getIgMediaInfo()` | `GET /raw/ig/media-info` | Mention Tracking |
| `getTiktokUserFeed()` | `GET /raw/tiktok/user-feed` | Custom ER |
| `getTiktokChallengeFeed()` | `GET /raw/tiktok/challenge-feed` | Mention Tracking |
| `getTiktokComments()` | `GET /raw/tiktok/comments` | Sentiments |
| `getTiktokMediaInfo()` | `GET /raw/tiktok/media-info` | Mention Tracking |
| `getYoutubeUploadedVideos()` | `GET /raw/youtube/uploaded-videos` | Custom ER, Mention Tracking |
| `getYoutubeVideoComments()` | `GET /raw/youtube/video-comments` | Sentiments |
| `getYoutubeVideoSubtitles()` | `GET /raw/youtube/video-subtitles` | Mention Tracking |
| `getYoutubeChannelInfo()` | `GET /raw/youtube/channel-info` | Custom ER |
