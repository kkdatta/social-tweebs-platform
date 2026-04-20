# Modash API Integration Details

## API Products

Modash provides two separate API products with different billing:

### 1. Discovery API (Credit-based)

Credits are decimal numbers deducted per request.

| Endpoint | Method | Cost | Description |
|----------|--------|------|-------------|
| `/{platform}/search` | POST | 0.01/result (~0.15/page) | Search influencers with filters |
| `/{platform}/profile/{id}/report` | GET | 1 credit | Full influencer report with audience data |
| `/collaborations/posts` | POST | 0.2 credit | Get collaboration posts between brands/influencers |
| `/collaborations/summary` | POST | 0.2 credit | Aggregated collaboration performance data |
| `/{platform}/reports/audience/overlap` | POST | 1 credit | Audience overlap between influencers |
| `/email-search` | POST | 0.02/matched email | Find social accounts by email |
| `/ai/text-search` | POST | 0.025/result | AI-powered influencer search (IG only) |
| `/{platform}/topics` | GET | 0 | Topic dictionary |
| `/{platform}/hashtags` | GET | 0 | Hashtag dictionary |
| `/{platform}/interests` | GET | 0 | Interest dictionary |
| `/{platform}/locations` | GET | 0 | Location dictionary |
| `/{platform}/languages` | GET | 0 | Language dictionary |
| `/{platform}/brands` | GET | 0 | Brand dictionary |
| `/user/info` | GET | 0 | Check account credits and rate limits |

### 2. Raw API (Monthly request quota)

Each successful request consumes 1 from the monthly request limit. 404 also counts.

#### Instagram Raw
| Endpoint | Description |
|----------|-------------|
| `/raw/ig/search` | Search users and hashtags |
| `/raw/ig/user-info` | Profile details |
| `/raw/ig/user-feed` | User's media feed (12 posts/page) |
| `/raw/ig/user-reels` | User's reels |
| `/raw/ig/user-tags-feed` | Posts the user is tagged in |
| `/raw/ig/hashtag-feed` | Posts with a specific hashtag |
| `/raw/ig/media-info` | Single post details |
| `/raw/ig/media-comments` | Post comments |
| `/raw/ig/media-comment-replies` | Comment replies |
| `/raw/ig/audio-info` | Audio/music info |

#### YouTube Raw
| Endpoint | Description |
|----------|-------------|
| `/raw/youtube/channel-info` | Channel details |
| `/raw/youtube/uploaded-videos` | Recent videos (30/page) |
| `/raw/youtube/uploaded-shorts` | Recent shorts (30/page) |
| `/raw/youtube/uploaded-lives` | Recent livestreams (30/page) |
| `/raw/youtube/playlist-videos` | Playlist videos (100/page) |
| `/raw/youtube/video-info` | Single video details |
| `/raw/youtube/video-subtitles` | Video captions/transcript |
| `/raw/youtube/short-info` | Single short details |
| `/raw/youtube/video-comments` | Video comments (20/page) |
| `/raw/youtube/video-comment-replies` | Comment replies (20/page) |

#### TikTok Raw
| Endpoint | Description |
|----------|-------------|
| `/raw/tiktok/user-info` | User profile details |
| `/raw/tiktok/user-feed` | User's video feed |
| `/raw/tiktok/challenge-feed` | Hashtag challenge feed |
| `/raw/tiktok/challenge-info` | Challenge/hashtag info |
| `/raw/tiktok/comments` | Video comments |
| `/raw/tiktok/comments-replies` | Comment replies |
| `/raw/tiktok/music-info` | Music/sound info |
| `/raw/tiktok/music-feed` | Videos using a sound (30/page) |
| `/raw/tiktok/search-users` | Search users by keyword |
| `/raw/tiktok/media-info` | Single video details |
| `/raw/tiktok/media-download` | Download video file |

## Authentication

All Modash endpoints use Bearer token authentication:

```
Authorization: Bearer <MODASH_API_KEY>
```

## Rate Limits

- Discovery API: 500 requests/second
- Raw API: 500 requests/second
- AI Search: Fixed 1 request/second

## Billing Counters

Two separate counters checked via `GET /user/info`:

```json
{
  "billing": {
    "credits": 450.25,
    "rawRequests": 4500
  },
  "rateLimits": {
    "discoveryRatelimit": 500,
    "rawRatelimit": 500
  }
}
```
