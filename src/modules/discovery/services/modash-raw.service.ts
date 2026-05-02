import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModashApiLog } from '../entities/modash-api-log.entity';

export interface RawIgUserInfo {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  biography?: string;
  is_verified?: boolean;
  is_private?: boolean;
}

export interface RawIgPost {
  id: string;
  code: string;
  taken_at: number;
  media_type: number;
  caption?: { text: string };
  like_count: number;
  comment_count: number;
  play_count?: number;
  image_versions2?: { candidates: Array<{ url: string }> };
  user: { pk: string; username: string };
}

export interface RawIgComment {
  pk: string;
  text: string;
  created_at: number;
  user: { pk: string; username: string; profile_pic_url?: string };
  comment_like_count: number;
  child_comment_count?: number;
}

export interface RawTiktokUserInfo {
  user: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarLarger: string;
    signature?: string;
    verified?: boolean;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
  };
}

export interface RawTiktokPost {
  id: string;
  desc: string;
  createTime: number;
  stats: {
    diggCount: number;
    commentCount: number;
    shareCount: number;
    playCount: number;
    collectCount?: number;
  };
  video?: { cover: string };
  author?: { uniqueId: string; nickname: string };
}

export interface RawTiktokComment {
  cid: string;
  text: string;
  create_time: number;
  user: { uid: string; unique_id: string; nickname: string; avatar_thumb?: { url_list: string[] } };
  digg_count: number;
  reply_comment_total?: number;
}

export interface RawYoutubeChannelInfo {
  channelId: string;
  title: string;
  description?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnails?: { default?: { url: string } };
}

export interface RawYoutubeVideo {
  videoId: string;
  title: string;
  description?: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  thumbnail?: string;
  duration?: string;
}

export interface RawYoutubeComment {
  commentId: string;
  text: string;
  authorDisplayName: string;
  authorProfileImageUrl?: string;
  likeCount: number;
  publishedAt: string;
  replyCount?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  cursor?: string;
  hasMore?: boolean;
}

@Injectable()
export class ModashRawService {
  private readonly logger = new Logger(ModashRawService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ModashApiLog)
    private apiLogRepository: Repository<ModashApiLog>,
  ) {
    this.isEnabled = this.configService.get<boolean>('modash.enabled', false);
    this.baseUrl = this.configService.get<string>(
      'modash.rawApiUrl',
      'https://api.modash.io/v1',
    );
    this.apiKey = this.configService.get<string>('modash.apiKey', '');
  }

  isRawApiEnabled(): boolean {
    return this.isEnabled;
  }

  // ============ INSTAGRAM RAW ============

  async getIgUserInfo(userId: string): Promise<RawIgUserInfo> {
    return this.rawGet(`/raw/ig/user-info?url=${encodeURIComponent(userId)}`);
  }

  async getIgUserFeed(
    userId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawIgPost>> {
    const params = [`url=${encodeURIComponent(userId)}`];
    if (cursor) params.push(`after=${encodeURIComponent(cursor)}`);
    return this.rawGet(`/raw/ig/user-feed?${params.join('&')}`);
  }

  async getIgUserReels(
    userId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawIgPost>> {
    const params = [`url=${encodeURIComponent(userId)}`];
    if (cursor) params.push(`after=${encodeURIComponent(cursor)}`);
    return this.rawGet(`/raw/ig/user-reels?${params.join('&')}`);
  }

  async getIgUserTagsFeed(
    userId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawIgPost>> {
    const params = [`url=${encodeURIComponent(userId)}`];
    if (cursor) params.push(`after=${encodeURIComponent(cursor)}`);
    return this.rawGet(`/raw/ig/user-tags-feed?${params.join('&')}`);
  }

  async getIgHashtagFeed(
    hashtag: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawIgPost>> {
    const params = [`name=${encodeURIComponent(hashtag)}`];
    if (cursor) params.push(`after=${encodeURIComponent(cursor)}`);
    return this.rawGet(`/raw/ig/hashtag-feed?${params.join('&')}`);
  }

  async getIgMediaInfo(mediaId: string): Promise<any> {
    return this.rawGet(`/raw/ig/media-info?url=${encodeURIComponent(mediaId)}`);
  }

  async getIgMediaComments(
    mediaId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawIgComment>> {
    const params = [`media_id=${mediaId}`];
    if (cursor) params.push(`after=${encodeURIComponent(cursor)}`);
    return this.rawGet(`/raw/ig/media-comments?${params.join('&')}`);
  }

  async getIgMediaCommentReplies(
    commentId: string,
    mediaId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawIgComment>> {
    const params = [`comment_id=${commentId}`, `media_id=${mediaId}`];
    if (cursor) params.push(`after=${encodeURIComponent(cursor)}`);
    return this.rawGet(`/raw/ig/media-comment-replies?${params.join('&')}`);
  }

  // ============ TIKTOK RAW ============

  async getTiktokUserInfo(identifier: string): Promise<RawTiktokUserInfo> {
    return this.rawGet(
      `/raw/tiktok/user-info?username=${encodeURIComponent(identifier)}`,
    );
  }

  async getTiktokUserFeed(
    identifier: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawTiktokPost>> {
    const params = [`username=${encodeURIComponent(identifier)}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/tiktok/user-feed?${params.join('&')}`);
  }

  async getTiktokChallengeFeed(
    challengeId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawTiktokPost>> {
    const params = [`challenge_id=${challengeId}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/tiktok/challenge-feed?${params.join('&')}`);
  }

  async getTiktokChallengeInfo(
    challengeName: string,
  ): Promise<any> {
    return this.rawGet(
      `/raw/tiktok/challenge-info?challenge_name=${encodeURIComponent(challengeName)}`,
    );
  }

  async getTiktokComments(
    mediaId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawTiktokComment>> {
    const params = [`media_id=${mediaId}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/tiktok/comments?${params.join('&')}`);
  }

  async getTiktokCommentReplies(
    commentId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawTiktokComment>> {
    const params = [`comment_id=${commentId}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/tiktok/comments-replies?${params.join('&')}`);
  }

  async getTiktokMediaInfo(mediaId: string): Promise<any> {
    return this.rawGet(`/raw/tiktok/media-info?media_id=${mediaId}`);
  }

  async getTiktokSearchUsers(
    keyword: string,
    cursor?: string,
  ): Promise<PaginatedResponse<any>> {
    const params = [`keyword=${encodeURIComponent(keyword)}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/tiktok/search-users?${params.join('&')}`);
  }

  // ============ YOUTUBE RAW ============

  async getYoutubeChannelInfo(channelId: string): Promise<RawYoutubeChannelInfo> {
    return this.rawGet(`/raw/youtube/channel-info?channel_id=${channelId}`);
  }

  async getYoutubeUploadedVideos(
    channelId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawYoutubeVideo>> {
    const params = [`channel_id=${channelId}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/youtube/uploaded-videos?${params.join('&')}`);
  }

  async getYoutubeUploadedShorts(
    channelId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawYoutubeVideo>> {
    const params = [`channel_id=${channelId}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/youtube/uploaded-shorts?${params.join('&')}`);
  }

  async getYoutubeVideoInfo(videoId: string): Promise<RawYoutubeVideo> {
    return this.rawGet(`/raw/youtube/video-info?video_id=${videoId}`);
  }

  async getYoutubeVideoSubtitles(
    videoId: string,
  ): Promise<{ subtitles: string }> {
    return this.rawGet(`/raw/youtube/video-subtitles?video_id=${videoId}`);
  }

  async getYoutubeVideoComments(
    videoId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawYoutubeComment>> {
    const params = [`video_id=${videoId}`];
    if (cursor) params.push(`cursor=${cursor}`);
    return this.rawGet(`/raw/youtube/video-comments?${params.join('&')}`);
  }

  async getYoutubeVideoCommentReplies(
    commentId: string,
    cursor?: string,
  ): Promise<PaginatedResponse<RawYoutubeComment>> {
    const params = [`comment_id=${commentId}`];
    if (cursor) params.push(`replies_cursor=${cursor}`);
    return this.rawGet(
      `/raw/youtube/video-comment-replies?${params.join('&')}`,
    );
  }

  // ============ PRIVATE ============

  private async rawGet<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      this.logger.debug(`Raw API Request: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Raw API Error: ${response.status} - ${errorBody}`,
        );

        if (response.status === 429) {
          throw new HttpException(
            'Modash Raw API rate limit exceeded. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (response.status === 401) {
          throw new HttpException(
            'Modash Raw API authentication failed',
            HttpStatus.UNAUTHORIZED,
          );
        }

        throw new HttpException(
          `Modash Raw API error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      if (data && data.items && !data.data) {
        data.data = data.items;
      }
      if (data && typeof data.end_cursor === 'string') {
        data.cursor = data.cursor || data.end_cursor;
      }
      if (data && typeof data.more_available === 'boolean' && data.hasMore === undefined) {
        data.hasMore = data.more_available;
      }
      return data as T;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Raw API Request Failed: ${error.message}`);
      throw new HttpException(
        'Failed to communicate with Modash Raw API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } finally {
      await this.logRawApiCall(endpoint, Date.now() - startTime);
    }
  }

  private async logRawApiCall(
    endpoint: string,
    responseTimeMs: number,
  ): Promise<void> {
    try {
      const log = this.apiLogRepository.create({
        endpoint,
        httpMethod: 'GET',
        responseStatusCode: 200,
        responseTimeMs,
        errorMessage: null,
      });
      await this.apiLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to log Raw API call: ${error.message}`);
    }
  }
}
