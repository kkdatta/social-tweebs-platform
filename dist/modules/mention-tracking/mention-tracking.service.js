"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MentionTrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionTrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const modash_raw_service_1 = require("../discovery/services/modash-raw.service");
const CREDIT_PER_REPORT = 1;
let MentionTrackingService = MentionTrackingService_1 = class MentionTrackingService {
    constructor(reportRepo, influencerRepo, postRepo, shareRepo, userRepo, creditsService, modashRawService) {
        this.reportRepo = reportRepo;
        this.influencerRepo = influencerRepo;
        this.postRepo = postRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
        this.modashRawService = modashRawService;
        this.logger = new common_1.Logger(MentionTrackingService_1.name);
    }
    async createReport(userId, dto) {
        if (!dto.hashtags?.length && !dto.usernames?.length && !dto.keywords?.length) {
            throw new common_1.BadRequestException('At least one of hashtags, usernames, or keywords is required');
        }
        if (dto.platforms.includes('YOUTUBE')) {
            if (dto.platforms.length > 1) {
                throw new common_1.BadRequestException('YouTube cannot be combined with other platforms');
            }
            if (dto.hashtags?.length || dto.usernames?.length) {
                throw new common_1.BadRequestException('YouTube only supports keyword search');
            }
        }
        if (dto.platforms.includes('TIKTOK') && dto.keywords?.length) {
            throw new common_1.BadRequestException('TikTok does not support keyword search');
        }
        const balance = await this.creditsService.getBalance(userId);
        if ((balance.unifiedBalance || 0) < CREDIT_PER_REPORT) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_REPORT}, Available: ${balance.unifiedBalance}`);
        }
        const report = new entities_1.MentionTrackingReport();
        report.title = dto.title || 'Untitled Mention Report';
        report.platforms = dto.platforms;
        report.dateRangeStart = new Date(dto.dateRangeStart);
        report.dateRangeEnd = new Date(dto.dateRangeEnd);
        report.hashtags = dto.hashtags || [];
        report.usernames = dto.usernames || [];
        report.keywords = dto.keywords || [];
        report.sponsoredOnly = dto.sponsoredOnly || false;
        report.autoRefreshEnabled = dto.autoRefreshEnabled || false;
        report.status = entities_1.MentionReportStatus.PENDING;
        report.ownerId = userId;
        report.createdById = userId;
        report.shareUrlToken = `mention_${(0, uuid_1.v4)().substring(0, 8)}`;
        report.creditsUsed = CREDIT_PER_REPORT;
        if (dto.autoRefreshEnabled) {
            const nextRefresh = new Date();
            nextRefresh.setDate(nextRefresh.getDate() + 1);
            report.nextRefreshDate = nextRefresh;
        }
        const savedReport = await this.reportRepo.save(report);
        setTimeout(() => this.processReport(savedReport.id), 2000);
        return { success: true, report: savedReport, creditsUsed: CREDIT_PER_REPORT };
    }
    async processReport(reportId, skipCredits = false) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report)
            return;
        try {
            report.status = entities_1.MentionReportStatus.PROCESSING;
            await this.reportRepo.save(report);
            if (this.modashRawService.isRawApiEnabled()) {
                await this.processReportWithRawApi(report);
            }
            else {
                await this.processReportSimulated(report);
            }
            const finalReport = await this.reportRepo.findOne({ where: { id: reportId } });
            if (finalReport && finalReport.status === entities_1.MentionReportStatus.COMPLETED && !skipCredits) {
                await this.creditsService.deductCredits(finalReport.ownerId, {
                    actionType: enums_1.ActionType.REPORT_GENERATION,
                    quantity: CREDIT_PER_REPORT,
                    module: enums_1.ModuleType.MENTION_TRACKING,
                    resourceId: reportId,
                    resourceType: 'mention_report_creation',
                });
                this.logger.log(`Mention tracking ${reportId}: charged ${CREDIT_PER_REPORT} credits after success`);
            }
        }
        catch (error) {
            report.status = entities_1.MentionReportStatus.FAILED;
            report.errorMessage = error.message || 'Processing failed';
            await this.reportRepo.save(report);
            this.logger.error(`Mention tracking ${reportId} failed — NO credits charged`);
        }
    }
    async processReportWithRawApi(report) {
        this.logger.log(`Processing mention tracking via Modash Raw API for report ${report.id}`);
        let totalInfluencers = 0;
        let totalPosts = 0;
        let totalLikes = 0;
        let totalViews = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalFollowers = 0;
        const allSearchTerms = [
            ...report.hashtags.map(h => h.startsWith('#') ? h : `#${h}`),
            ...report.usernames.map(u => u.startsWith('@') ? u : `@${u}`),
            ...report.keywords,
        ];
        const startMs = new Date(report.dateRangeStart).getTime();
        const endMs = new Date(report.dateRangeEnd).getTime();
        const rawPosts = [];
        const failedTerms = [];
        let totalTerms = 0;
        const configuredTerms = (report.hashtags?.length || 0) +
            (report.usernames?.length || 0) +
            (report.keywords?.length || 0);
        if (configuredTerms === 0) {
            report.status = entities_1.MentionReportStatus.FAILED;
            report.errorMessage = 'No hashtags, usernames, or keywords configured for this report';
            await this.reportRepo.save(report);
            return;
        }
        for (const platform of report.platforms) {
            const plat = platform.toUpperCase();
            for (const hashtag of report.hashtags) {
                totalTerms++;
                const tag = hashtag.replace(/^#/, '');
                try {
                    if (plat === 'INSTAGRAM') {
                        const feed = await this.modashRawService.getIgHashtagFeed(tag);
                        for (const p of (feed.data || [])) {
                            const ts = (p.taken_at || 0) * 1000;
                            if (ts >= startMs && ts <= endMs) {
                                rawPosts.push({
                                    platform, userId: p.user?.pk || '', username: p.user?.username || '',
                                    postId: p.id || p.code, description: p.caption?.text || '',
                                    likes: p.like_count || 0, comments: p.comment_count || 0,
                                    views: p.play_count || 0, shares: 0, timestamp: ts,
                                    thumbnail: p.image_versions2?.candidates?.[0]?.url,
                                });
                            }
                        }
                    }
                    else if (plat === 'TIKTOK') {
                        const info = await this.modashRawService.getTiktokChallengeInfo(tag);
                        if (info?.id) {
                            const feed = await this.modashRawService.getTiktokChallengeFeed(info.id);
                            for (const p of (feed.data || [])) {
                                const ts = (p.createTime || 0) * 1000;
                                if (ts >= startMs && ts <= endMs) {
                                    rawPosts.push({
                                        platform, userId: p.author?.uniqueId || '', username: p.author?.uniqueId || '',
                                        postId: p.id, description: p.desc || '',
                                        likes: p.stats?.diggCount || 0, comments: p.stats?.commentCount || 0,
                                        views: p.stats?.playCount || 0, shares: p.stats?.shareCount || 0,
                                        timestamp: ts, thumbnail: p.video?.cover,
                                    });
                                }
                            }
                        }
                        else {
                            failedTerms.push(`#${tag} on TIKTOK (no matching challenge)`);
                            continue;
                        }
                    }
                }
                catch (err) {
                    failedTerms.push(`#${tag} on ${plat}`);
                    this.logger.warn(`Raw API error fetching hashtag "${tag}" on ${plat}: ${err.message}`);
                }
            }
            for (const username of report.usernames) {
                const handle = username.replace(/^@/, '');
                if (!handle || handle.trim().length === 0) {
                    failedTerms.push(`@${handle} — invalid handle skipped`);
                    continue;
                }
                totalTerms++;
                try {
                    if (plat === 'INSTAGRAM') {
                        const feed = await this.modashRawService.getIgUserTagsFeed(handle);
                        for (const p of (feed.data || [])) {
                            const ts = (p.taken_at || 0) * 1000;
                            if (ts >= startMs && ts <= endMs) {
                                rawPosts.push({
                                    platform, userId: p.user?.pk || '', username: p.user?.username || handle,
                                    postId: p.id || p.code, description: p.caption?.text || '',
                                    likes: p.like_count || 0, comments: p.comment_count || 0,
                                    views: p.play_count || 0, shares: 0, timestamp: ts,
                                    thumbnail: p.image_versions2?.candidates?.[0]?.url,
                                });
                            }
                        }
                    }
                    else if (plat === 'TIKTOK') {
                        const feed = await this.modashRawService.getTiktokUserFeed(handle);
                        for (const p of (feed.data || [])) {
                            const ts = (p.createTime || 0) * 1000;
                            if (ts >= startMs && ts <= endMs) {
                                rawPosts.push({
                                    platform, userId: p.author?.uniqueId || handle, username: p.author?.uniqueId || handle,
                                    postId: p.id, description: p.desc || '',
                                    likes: p.stats?.diggCount || 0, comments: p.stats?.commentCount || 0,
                                    views: p.stats?.playCount || 0, shares: p.stats?.shareCount || 0,
                                    timestamp: ts, thumbnail: p.video?.cover,
                                });
                            }
                        }
                    }
                    else if (plat === 'YOUTUBE') {
                        const feed = await this.modashRawService.getYoutubeUploadedVideos(handle);
                        for (const v of (feed.data || [])) {
                            const ts = new Date(v.publishedAt || 0).getTime();
                            if (ts >= startMs && ts <= endMs) {
                                rawPosts.push({
                                    platform, userId: handle, username: handle,
                                    postId: v.videoId, description: v.title || v.description || '',
                                    likes: v.likeCount || 0, comments: v.commentCount || 0,
                                    views: v.viewCount || 0, shares: 0, timestamp: ts,
                                    thumbnail: v.thumbnail,
                                });
                            }
                        }
                    }
                    else {
                        failedTerms.push(`@${handle} on ${plat} (platform not supported for username search)`);
                    }
                }
                catch (err) {
                    failedTerms.push(`@${handle} on ${plat}`);
                    this.logger.warn(`Raw API error fetching user "${handle}" on ${plat}: ${err.message}`);
                }
            }
            for (const keyword of report.keywords) {
                const kw = (keyword || '').trim();
                if (!kw)
                    continue;
                totalTerms++;
                try {
                    if (plat === 'INSTAGRAM') {
                        const tag = kw.replace(/^#/, '').replace(/\s+/g, '');
                        if (!tag) {
                            totalTerms--;
                            continue;
                        }
                        const feed = await this.modashRawService.getIgHashtagFeed(tag);
                        for (const p of (feed.data || [])) {
                            const ts = (p.taken_at || 0) * 1000;
                            if (ts >= startMs && ts <= endMs) {
                                rawPosts.push({
                                    platform,
                                    userId: p.user?.pk || '',
                                    username: p.user?.username || '',
                                    postId: p.id || p.code,
                                    description: p.caption?.text || '',
                                    likes: p.like_count || 0,
                                    comments: p.comment_count || 0,
                                    views: p.play_count || 0,
                                    shares: 0,
                                    timestamp: ts,
                                    thumbnail: p.image_versions2?.candidates?.[0]?.url,
                                });
                            }
                        }
                    }
                    else if (plat === 'TIKTOK') {
                        const challengeName = kw.replace(/^#/, '');
                        const info = await this.modashRawService.getTiktokChallengeInfo(challengeName);
                        if (info?.id) {
                            const feed = await this.modashRawService.getTiktokChallengeFeed(info.id);
                            for (const p of (feed.data || [])) {
                                const ts = (p.createTime || 0) * 1000;
                                if (ts >= startMs && ts <= endMs) {
                                    rawPosts.push({
                                        platform,
                                        userId: p.author?.uniqueId || '',
                                        username: p.author?.uniqueId || '',
                                        postId: p.id,
                                        description: p.desc || '',
                                        likes: p.stats?.diggCount || 0,
                                        comments: p.stats?.commentCount || 0,
                                        views: p.stats?.playCount || 0,
                                        shares: p.stats?.shareCount || 0,
                                        timestamp: ts,
                                        thumbnail: p.video?.cover,
                                    });
                                }
                            }
                        }
                        else {
                            failedTerms.push(`keyword "${kw}" on TIKTOK (no matching challenge)`);
                        }
                    }
                    else if (plat === 'YOUTUBE') {
                        const feed = await this.modashRawService.getYoutubeUploadedVideos(kw);
                        for (const v of (feed.data || [])) {
                            const ts = new Date(v.publishedAt || 0).getTime();
                            if (ts >= startMs && ts <= endMs) {
                                rawPosts.push({
                                    platform,
                                    userId: kw,
                                    username: kw,
                                    postId: v.videoId,
                                    description: v.title || v.description || '',
                                    likes: v.likeCount || 0,
                                    comments: v.commentCount || 0,
                                    views: v.viewCount || 0,
                                    shares: 0,
                                    timestamp: ts,
                                    thumbnail: v.thumbnail,
                                });
                            }
                        }
                        if (!(feed.data || []).length) {
                            this.logger.warn(`YouTube keyword "${kw}": no videos found for channel, skipping gracefully`);
                            failedTerms.push(`keyword "${kw}" on YOUTUBE (no results)`);
                        }
                    }
                    else {
                        failedTerms.push(`keyword "${kw}" on ${plat} (not supported)`);
                    }
                }
                catch (err) {
                    failedTerms.push(`keyword "${kw}" on ${plat}`);
                    this.logger.warn(`Raw API error fetching keyword "${kw}" on ${plat}: ${err.message}`);
                }
            }
        }
        if (totalTerms > 0 && failedTerms.length >= totalTerms) {
            report.status = entities_1.MentionReportStatus.FAILED;
            report.errorMessage = `All search terms failed: ${failedTerms.join(', ')}`;
            await this.reportRepo.save(report);
            return;
        }
        const influencerMap = new Map();
        for (const rp of rawPosts) {
            const key = `${rp.platform}_${rp.username}`;
            if (!influencerMap.has(key)) {
                const influencer = new entities_1.MentionTrackingInfluencer();
                influencer.reportId = report.id;
                influencer.platform = rp.platform;
                influencer.influencerUsername = rp.username;
                influencer.influencerName = rp.username;
                influencer.platformUserId = rp.userId;
                influencer.followerCount = 0;
                influencer.category = entities_1.InfluencerCategory.NANO;
                influencer.displayOrder = influencerMap.size;
                const savedInf = await this.influencerRepo.save(influencer);
                influencerMap.set(key, { inf: savedInf, likes: 0, views: 0, comments: 0, shares: 0, posts: 0 });
            }
            const entry = influencerMap.get(key);
            const existingPost = await this.postRepo.findOne({ where: { reportId: report.id, postId: rp.postId } });
            if (existingPost)
                continue;
            const post = new entities_1.MentionTrackingPost();
            post.reportId = report.id;
            post.influencerId = entry.inf.id;
            post.platform = rp.platform;
            post.postId = rp.postId;
            post.postType = 'IMAGE';
            post.thumbnailUrl = rp.thumbnail || '';
            post.description = rp.description;
            post.matchedHashtags = allSearchTerms.filter(t => t.startsWith('#') && rp.description.toLowerCase().includes(t.replace('#', '').toLowerCase()));
            post.matchedUsernames = allSearchTerms.filter(t => t.startsWith('@') && rp.description.toLowerCase().includes(t.replace('@', '').toLowerCase()));
            post.matchedKeywords = allSearchTerms.filter(t => !t.startsWith('#') && !t.startsWith('@') && rp.description.toLowerCase().includes(t.toLowerCase()));
            post.likesCount = rp.likes;
            post.commentsCount = rp.comments;
            post.viewsCount = rp.views;
            post.sharesCount = rp.shares;
            post.postDate = new Date(rp.timestamp);
            post.postUrl = '';
            await this.postRepo.save(post);
            entry.likes += rp.likes;
            entry.views += rp.views;
            entry.comments += rp.comments;
            entry.shares += rp.shares;
            entry.posts++;
            totalPosts++;
            totalLikes += rp.likes;
            totalViews += rp.views;
            totalComments += rp.comments;
            totalShares += rp.shares;
        }
        for (const [, entry] of influencerMap) {
            entry.inf.postsCount = entry.posts;
            entry.inf.likesCount = entry.likes;
            entry.inf.viewsCount = entry.views;
            entry.inf.commentsCount = entry.comments;
            entry.inf.sharesCount = entry.shares;
            const fc = Number(entry.inf.followerCount) || 0;
            const denom = entry.posts * fc;
            entry.inf.avgEngagementRate = denom > 0 ? ((entry.likes + entry.comments) / denom) * 100 : 0;
            await this.influencerRepo.save(entry.inf);
            totalFollowers += fc;
            totalInfluencers++;
        }
        report.totalInfluencers = totalInfluencers;
        report.totalPosts = totalPosts;
        report.totalLikes = totalLikes;
        report.totalViews = totalViews;
        report.totalComments = totalComments;
        report.totalShares = totalShares;
        report.totalFollowers = totalFollowers;
        const avgFollowersPerInf = totalInfluencers > 0 ? totalFollowers / totalInfluencers : 0;
        const reportEngDenom = totalPosts * avgFollowersPerInf;
        report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
        report.engagementViewsRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
        report.status = entities_1.MentionReportStatus.COMPLETED;
        report.completedAt = new Date();
        if (failedTerms.length > 0) {
            report.errorMessage = `Partial results: failed to fetch data for ${failedTerms.join(', ')}`;
        }
        await this.reportRepo.save(report);
    }
    async processReportSimulated(report) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        let totalInfluencers = 0;
        let totalPosts = 0;
        let totalLikes = 0;
        let totalViews = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalFollowers = 0;
        const influencerCount = Math.floor(Math.random() * 20) + 10;
        const allSearchTerms = [
            ...report.hashtags.map(h => h.startsWith('#') ? h : `#${h}`),
            ...report.usernames.map(u => u.startsWith('@') ? u : `@${u}`),
            ...report.keywords,
        ];
        for (let i = 0; i < influencerCount; i++) {
            const followerCount = this.generateFollowerCount();
            const category = this.categorizeInfluencer(followerCount);
            const influencer = new entities_1.MentionTrackingInfluencer();
            influencer.reportId = report.id;
            influencer.platform = report.platforms[Math.floor(Math.random() * report.platforms.length)];
            influencer.influencerName = this.generateInfluencerName();
            influencer.influencerUsername = influencer.influencerName.toLowerCase().replace(/\s/g, '_');
            influencer.platformUserId = `user_${Date.now()}_${i}`;
            influencer.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.influencerName)}&background=random`;
            influencer.followerCount = followerCount;
            influencer.category = category;
            influencer.audienceCredibility = Math.floor(Math.random() * 30) + 70;
            influencer.displayOrder = i;
            const savedInfluencer = await this.influencerRepo.save(influencer);
            const postsCount = Math.floor(Math.random() * 10) + 3;
            let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;
            for (let j = 0; j < postsCount; j++) {
                const post = new entities_1.MentionTrackingPost();
                post.reportId = report.id;
                post.influencerId = savedInfluencer.id;
                post.platform = savedInfluencer.platform;
                post.postId = `post_${Date.now()}_${i}_${j}`;
                post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)];
                post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + i + j}`;
                const matchedTerms = allSearchTerms.filter(() => Math.random() > 0.4);
                post.description = `Amazing content! ${matchedTerms.join(' ')} Check this out! #influencer #lifestyle`;
                post.matchedHashtags = matchedTerms.filter(t => t.startsWith('#'));
                post.matchedUsernames = matchedTerms.filter(t => t.startsWith('@'));
                post.matchedKeywords = matchedTerms.filter(t => !t.startsWith('#') && !t.startsWith('@'));
                post.likesCount = Math.floor(Math.random() * 15000) + 500;
                post.commentsCount = Math.floor(Math.random() * 800) + 20;
                post.viewsCount = Math.floor(Math.random() * 80000) + 2000;
                post.sharesCount = Math.floor(Math.random() * 400) + 10;
                const postFc = Number(savedInfluencer.followerCount) || 0;
                post.engagementRate = postFc > 0 ? ((post.likesCount + post.commentsCount) / postFc) * 100 : 0;
                post.isSponsored = Math.random() > 0.7;
                const startMs = new Date(report.dateRangeStart).getTime();
                const endMs = new Date(report.dateRangeEnd).getTime();
                post.postDate = new Date(startMs + Math.random() * (endMs - startMs));
                post.postUrl = `https://instagram.com/p/${post.postId}`;
                await this.postRepo.save(post);
                infLikes += Number(post.likesCount) || 0;
                infViews += Number(post.viewsCount) || 0;
                infComments += Number(post.commentsCount) || 0;
                infShares += Number(post.sharesCount) || 0;
            }
            savedInfluencer.postsCount = postsCount;
            savedInfluencer.likesCount = infLikes;
            savedInfluencer.viewsCount = infViews;
            savedInfluencer.commentsCount = infComments;
            savedInfluencer.sharesCount = infShares;
            const infFc = Number(savedInfluencer.followerCount) || 0;
            const infDenom = postsCount * infFc;
            savedInfluencer.avgEngagementRate = infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
            await this.influencerRepo.save(savedInfluencer);
            totalPosts += postsCount;
            totalLikes += infLikes;
            totalViews += infViews;
            totalComments += infComments;
            totalShares += infShares;
            totalFollowers += Number(savedInfluencer.followerCount) || 0;
            totalInfluencers++;
        }
        report.totalInfluencers = totalInfluencers;
        report.totalPosts = totalPosts;
        report.totalLikes = totalLikes;
        report.totalViews = totalViews;
        report.totalComments = totalComments;
        report.totalShares = totalShares;
        report.totalFollowers = totalFollowers;
        const avgFollowersPerInf = totalInfluencers > 0 ? totalFollowers / totalInfluencers : 0;
        const reportEngDenom = totalPosts * avgFollowersPerInf;
        report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
        report.engagementViewsRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
        report.status = entities_1.MentionReportStatus.COMPLETED;
        report.completedAt = new Date();
        await this.reportRepo.save(report);
    }
    generateFollowerCount() {
        const ranges = [
            { min: 1000, max: 10000, weight: 30 },
            { min: 10000, max: 100000, weight: 40 },
            { min: 100000, max: 500000, weight: 20 },
            { min: 500000, max: 5000000, weight: 10 },
        ];
        const random = Math.random() * 100;
        let cumulative = 0;
        for (const range of ranges) {
            cumulative += range.weight;
            if (random <= cumulative) {
                return Math.floor(Math.random() * (range.max - range.min)) + range.min;
            }
        }
        return 50000;
    }
    categorizeInfluencer(followers) {
        if (followers < 10000)
            return entities_1.InfluencerCategory.NANO;
        if (followers < 100000)
            return entities_1.InfluencerCategory.MICRO;
        if (followers < 500000)
            return entities_1.InfluencerCategory.MACRO;
        return entities_1.InfluencerCategory.MEGA;
    }
    generateInfluencerName() {
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Peyton', 'Dakota'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Anderson'];
        const suffixes = ['', 'Official', 'HQ', 'Live', 'Daily'];
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${first} ${last}${suffix ? ' ' + suffix : ''}`;
    }
    async getReports(userId, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const queryBuilder = this.reportRepo.createQueryBuilder('report');
        if (filters.createdBy === 'ME') {
            queryBuilder.where('report.createdById = :userId', { userId });
        }
        else if (filters.createdBy === 'TEAM') {
            const teamUserIds = await this.getTeamUserIds(userId);
            queryBuilder.where('report.createdById IN (:...teamUserIds) AND report.createdById != :userId', { teamUserIds, userId });
        }
        else if (filters.createdBy === 'SHARED') {
            const sharedReportIds = await this.shareRepo.find({
                where: { sharedWithUserId: userId },
                select: ['reportId'],
            });
            const reportIds = sharedReportIds.map(s => s.reportId);
            if (reportIds.length === 0) {
                return { reports: [], total: 0, page, limit, hasMore: false };
            }
            queryBuilder.where('report.id IN (:...reportIds)', { reportIds });
        }
        else if (filters.createdBy === 'PUBLIC') {
            queryBuilder.where('report.isPublic = true');
        }
        else {
            const teamUserIds = await this.getTeamUserIds(userId);
            const sharedReportIds = await this.shareRepo.find({
                where: { sharedWithUserId: userId },
                select: ['reportId'],
            });
            const reportIds = sharedReportIds.map(s => s.reportId);
            queryBuilder.where('(report.createdById = :userId OR report.createdById IN (:...teamUserIds) OR report.id IN (:...reportIds) OR report.isPublic = true)', { userId, teamUserIds, reportIds: reportIds.length > 0 ? reportIds : ['00000000-0000-0000-0000-000000000000'] });
        }
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere(':platform = ANY(report.platforms)', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('(LOWER(report.title) LIKE :search OR LOWER(array_to_string(report.hashtags, \',\')) LIKE :search OR LOWER(array_to_string(report.usernames, \',\')) LIKE :search OR LOWER(array_to_string(report.keywords, \',\')) LIKE :search)', { search: `%${filters.search.toLowerCase()}%` });
        }
        queryBuilder.orderBy('report.createdAt', 'DESC')
            .skip(skip)
            .take(limit);
        const [reports, total] = await queryBuilder.getManyAndCount();
        return {
            reports: reports.map(r => this.toSummaryDto(r)),
            total,
            page,
            limit,
            hasMore: skip + reports.length < total,
        };
    }
    async getReportById(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers', 'posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        report.posts = report.posts?.sort((a, b) => new Date(b.postDate || 0).getTime() - new Date(a.postDate || 0).getTime()) || [];
        return this.toDetailDto(report);
    }
    async getReportByShareToken(token) {
        const report = await this.reportRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['influencers', 'posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found or not publicly shared');
        }
        return this.toDetailDto(report);
    }
    async updateReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (dto.title !== undefined)
            report.title = dto.title;
        if (dto.isPublic !== undefined)
            report.isPublic = dto.isPublic;
        const savedReport = await this.reportRepo.save(report);
        return { success: true, report: savedReport };
    }
    async deleteReport(userId, reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        await this.reportRepo.remove(report);
        return { success: true };
    }
    async bulkDeleteReports(userId, reportIds) {
        let deletedCount = 0;
        for (const reportId of reportIds) {
            try {
                const report = await this.reportRepo.findOne({ where: { id: reportId } });
                if (report && (report.createdById === userId || report.ownerId === userId)) {
                    await this.reportRepo.remove(report);
                    deletedCount++;
                }
            }
            catch {
            }
        }
        return { success: true, deletedCount };
    }
    async retryReport(userId, reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (report.status !== entities_1.MentionReportStatus.FAILED) {
            throw new common_1.BadRequestException('Only failed reports can be retried');
        }
        const balance = await this.creditsService.getBalance(userId);
        if ((balance.unifiedBalance || 0) < CREDIT_PER_REPORT) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_REPORT}, Available: ${balance.unifiedBalance}`);
        }
        await this.postRepo.delete({ reportId });
        await this.influencerRepo.delete({ reportId });
        report.status = entities_1.MentionReportStatus.PENDING;
        report.errorMessage = undefined;
        report.retryCount += 1;
        report.totalInfluencers = 0;
        report.totalPosts = 0;
        report.totalLikes = 0;
        report.totalViews = 0;
        report.totalComments = 0;
        report.totalShares = 0;
        await this.reportRepo.save(report);
        setTimeout(() => this.processReport(reportId), 2000);
        return { success: true, report, creditsUsed: CREDIT_PER_REPORT };
    }
    async shareReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (dto.sharedWithUserId) {
            const existingShare = await this.shareRepo.findOne({
                where: { reportId, sharedWithUserId: dto.sharedWithUserId },
            });
            if (!existingShare) {
                const share = new entities_1.MentionTrackingShare();
                share.reportId = reportId;
                share.sharedWithUserId = dto.sharedWithUserId;
                share.sharedByUserId = userId;
                share.permissionLevel = dto.permissionLevel || entities_1.SharePermission.VIEW;
                await this.shareRepo.save(share);
            }
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `/mention-tracking/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedReports = allReports.filter(r => r.status === entities_1.MentionReportStatus.COMPLETED);
        const totalInfluencersAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalInfluencers || 0), 0);
        const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
        const avgEngagement = completedReports.length > 0
            ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
            : 0;
        return {
            totalReports: allReports.length,
            completedReports: completedReports.length,
            processingReports: allReports.filter(r => r.status === entities_1.MentionReportStatus.PROCESSING).length,
            pendingReports: allReports.filter(r => r.status === entities_1.MentionReportStatus.PENDING).length,
            failedReports: allReports.filter(r => r.status === entities_1.MentionReportStatus.FAILED).length,
            reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
            totalInfluencersAnalyzed,
            totalPostsAnalyzed,
            avgEngagementRate: Number(avgEngagement.toFixed(2)),
        };
    }
    async getChartData(userId, reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const posts = await this.postRepo.find({ where: { reportId } });
        const grouped = {};
        posts.forEach(post => {
            const dateStr = post.postDate ? new Date(post.postDate).toISOString().split('T')[0] : 'Unknown';
            if (!grouped[dateStr]) {
                grouped[dateStr] = { posts: 0, influencers: new Set(), likes: 0, views: 0 };
            }
            grouped[dateStr].posts += 1;
            if (post.influencerId)
                grouped[dateStr].influencers.add(post.influencerId);
            grouped[dateStr].likes += Number(post.likesCount) || 0;
            grouped[dateStr].views += Number(post.viewsCount) || 0;
        });
        return Object.entries(grouped)
            .map(([date, data]) => ({
            date,
            postsCount: data.posts,
            influencersCount: data.influencers.size,
            likesCount: data.likes,
            viewsCount: data.views,
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getPosts(userId, reportId, filters) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.influencer', 'influencer')
            .where('post.reportId = :reportId', { reportId });
        if (filters.sponsoredOnly) {
            queryBuilder.andWhere('post.isSponsored = true');
        }
        if (filters.category && filters.category !== 'ALL') {
            queryBuilder.andWhere('influencer.category = :category', { category: filters.category });
        }
        const sortField = filters.sortBy || 'postDate';
        const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const sortMap = {
            'recent': 'post.postDate',
            'postDate': 'post.postDate',
            'likes': 'post.likesCount',
            'views': 'post.viewsCount',
            'comments': 'post.commentsCount',
            'engagement': 'post.engagementRate',
        };
        queryBuilder.orderBy(sortMap[sortField] || 'post.postDate', sortOrder);
        const [posts, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();
        return {
            posts: posts.map(p => this.toPostDto(p)),
            total,
            page,
            limit,
        };
    }
    async getInfluencers(userId, reportId, filters) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.influencerRepo.createQueryBuilder('influencer')
            .where('influencer.reportId = :reportId', { reportId });
        if (filters.category && filters.category !== 'ALL') {
            queryBuilder.andWhere('influencer.category = :category', { category: filters.category });
        }
        const sortField = filters.sortBy || 'likesCount';
        const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const sortMap = {
            'recent': 'influencer.createdAt',
            'likes': 'influencer.likesCount',
            'followers': 'influencer.followerCount',
            'comments': 'influencer.commentsCount',
            'credibility': 'influencer.audienceCredibility',
            'engagement': 'influencer.avgEngagementRate',
        };
        queryBuilder.orderBy(sortMap[sortField] || 'influencer.likesCount', sortOrder);
        const [influencers, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();
        return {
            influencers: influencers.map(i => this.toInfluencerDto(i)),
            total,
            page,
            limit,
        };
    }
    async autoRefreshReport(reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report)
            return;
        this.logger.log(`Auto-refreshing mention tracking report ${reportId}`);
        await this.postRepo.delete({ reportId });
        await this.influencerRepo.delete({ reportId });
        report.status = entities_1.MentionReportStatus.PENDING;
        report.errorMessage = undefined;
        report.totalInfluencers = 0;
        report.totalPosts = 0;
        report.totalLikes = 0;
        report.totalViews = 0;
        report.totalComments = 0;
        report.totalShares = 0;
        const nextRefresh = new Date();
        nextRefresh.setDate(nextRefresh.getDate() + 1);
        report.nextRefreshDate = nextRefresh;
        await this.reportRepo.save(report);
        await this.processReport(reportId, true);
    }
    async getTeamUserIds(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return [userId];
        const teamMembers = await this.userRepo.find({
            where: [
                { id: user.parentId || undefined },
                { parentId: userId },
                { parentId: user.parentId || undefined },
            ],
        });
        return [userId, ...teamMembers.map(m => m.id)];
    }
    async checkReportAccess(userId, report, level = 'view') {
        if (report.ownerId === userId || report.createdById === userId)
            return;
        if (report.isPublic && level === 'view')
            return;
        const share = await this.shareRepo.findOne({
            where: { reportId: report.id, sharedWithUserId: userId },
        });
        if (share) {
            if (level === 'edit' && share.permissionLevel === entities_1.SharePermission.VIEW) {
                throw new common_1.ForbiddenException('Edit access required');
            }
            return;
        }
        const teamUserIds = await this.getTeamUserIds(userId);
        if (teamUserIds.includes(report.createdById)) {
            if (level === 'edit') {
                throw new common_1.ForbiddenException('Cannot edit team member reports');
            }
            return;
        }
        throw new common_1.ForbiddenException('No access to this report');
    }
    toSummaryDto(report) {
        return {
            id: report.id,
            title: report.title,
            platforms: report.platforms,
            status: report.status,
            dateRangeStart: report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : report.dateRangeStart,
            dateRangeEnd: report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : report.dateRangeEnd,
            hashtags: report.hashtags || [],
            usernames: report.usernames || [],
            keywords: report.keywords || [],
            totalPosts: report.totalPosts || 0,
            totalInfluencers: report.totalInfluencers || 0,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
        };
    }
    toDetailDto(report) {
        const categorization = this.calculateCategorization(report.influencers || []);
        return {
            id: report.id,
            title: report.title,
            platforms: report.platforms,
            status: report.status,
            errorMessage: report.errorMessage,
            dateRangeStart: report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : report.dateRangeStart,
            dateRangeEnd: report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : report.dateRangeEnd,
            hashtags: report.hashtags || [],
            usernames: report.usernames || [],
            keywords: report.keywords || [],
            sponsoredOnly: report.sponsoredOnly,
            autoRefreshEnabled: report.autoRefreshEnabled,
            totalInfluencers: report.totalInfluencers || 0,
            totalPosts: report.totalPosts || 0,
            totalLikes: Number(report.totalLikes) || 0,
            totalViews: Number(report.totalViews) || 0,
            totalComments: Number(report.totalComments) || 0,
            totalShares: Number(report.totalShares) || 0,
            avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
            engagementViewsRate: report.engagementViewsRate ? Number(report.engagementViewsRate) : undefined,
            totalFollowers: Number(report.totalFollowers) || 0,
            influencers: (report.influencers || []).map(i => this.toInfluencerDto(i)),
            posts: (report.posts || []).map(p => this.toPostDto(p)),
            categorization,
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/mention-tracking/shared/${report.shareUrlToken}` : undefined,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
        };
    }
    toInfluencerDto(inf) {
        return {
            id: inf.id,
            influencerName: inf.influencerName,
            influencerUsername: inf.influencerUsername,
            platform: inf.platform,
            profilePictureUrl: inf.profilePictureUrl,
            followerCount: Number(inf.followerCount) || 0,
            category: inf.category,
            audienceCredibility: inf.audienceCredibility ? Number(inf.audienceCredibility) : undefined,
            postsCount: inf.postsCount || 0,
            likesCount: Number(inf.likesCount) || 0,
            viewsCount: Number(inf.viewsCount) || 0,
            commentsCount: Number(inf.commentsCount) || 0,
            sharesCount: Number(inf.sharesCount) || 0,
            avgEngagementRate: inf.avgEngagementRate ? Number(inf.avgEngagementRate) : undefined,
        };
    }
    toPostDto(post) {
        return {
            id: post.id,
            platform: post.platform,
            postUrl: post.postUrl,
            postType: post.postType,
            thumbnailUrl: post.thumbnailUrl,
            description: post.description,
            matchedHashtags: post.matchedHashtags,
            matchedUsernames: post.matchedUsernames,
            matchedKeywords: post.matchedKeywords,
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            viewsCount: post.viewsCount || 0,
            sharesCount: post.sharesCount || 0,
            engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
            isSponsored: post.isSponsored,
            postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
            influencerName: post.influencer?.influencerName,
            influencerUsername: post.influencer?.influencerUsername,
        };
    }
    calculateCategorization(influencers) {
        const categories = {
            ALL: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            NANO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            MICRO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            MACRO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            MEGA: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
        };
        const labels = {
            ALL: 'All Influencers',
            NANO: 'Nano (<10K)',
            MICRO: 'Micro (10K-100K)',
            MACRO: 'Macro (100K-500K)',
            MEGA: 'Mega (>500K)',
        };
        for (const inf of influencers) {
            const cat = inf.category || 'NANO';
            categories[cat].count += 1;
            categories[cat].followers += Number(inf.followerCount) || 0;
            categories[cat].posts += inf.postsCount || 0;
            categories[cat].likes += Number(inf.likesCount) || 0;
            categories[cat].views += Number(inf.viewsCount) || 0;
            categories[cat].comments += Number(inf.commentsCount) || 0;
            categories[cat].shares += Number(inf.sharesCount) || 0;
            categories.ALL.count += 1;
            categories.ALL.followers += Number(inf.followerCount) || 0;
            categories.ALL.posts += inf.postsCount || 0;
            categories.ALL.likes += Number(inf.likesCount) || 0;
            categories.ALL.views += Number(inf.viewsCount) || 0;
            categories.ALL.comments += Number(inf.commentsCount) || 0;
            categories.ALL.shares += Number(inf.sharesCount) || 0;
        }
        return Object.entries(categories).map(([key, data]) => ({
            category: key,
            label: labels[key],
            accountsCount: data.count,
            followersCount: data.followers,
            postsCount: data.posts,
            likesCount: data.likes,
            viewsCount: data.views,
            commentsCount: data.comments,
            sharesCount: data.shares,
            engagementRate: data.posts > 0 && data.followers > 0 && data.count > 0
                ? ((data.likes + data.comments) / (data.posts * (data.followers / data.count))) * 100
                : 0,
        }));
    }
};
exports.MentionTrackingService = MentionTrackingService;
exports.MentionTrackingService = MentionTrackingService = MentionTrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MentionTrackingReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.MentionTrackingInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.MentionTrackingPost)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.MentionTrackingShare)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService,
        modash_raw_service_1.ModashRawService])
], MentionTrackingService);
//# sourceMappingURL=mention-tracking.service.js.map