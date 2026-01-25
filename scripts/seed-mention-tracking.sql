-- Seed script for Mention Tracking module
-- Run this after the application has created the tables (via TypeORM synchronize)
-- Make sure you have a valid user_id from your zorbitads.users table

-- First, let's create a variable for the user ID (replace with actual user ID)
-- You can get a valid user ID by running: SELECT id FROM zorbitads.users LIMIT 1;

-- Create sample Mention Tracking Reports
DO $$
DECLARE
    user_id UUID;
    report_id_1 UUID;
    report_id_2 UUID;
    report_id_3 UUID;
    influencer_id_1 UUID;
    influencer_id_2 UUID;
    influencer_id_3 UUID;
    influencer_id_4 UUID;
    influencer_id_5 UUID;
BEGIN
    -- Get a valid user ID from the users table
    SELECT id INTO user_id FROM zorbitads.users LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create a user first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using user_id: %', user_id;

    -- Report 1: Completed Instagram Campaign Report
    report_id_1 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_reports (
        id, title, platforms, status, date_range_start, date_range_end,
        hashtags, usernames, keywords, sponsored_only, auto_refresh_enabled,
        total_influencers, total_posts, total_likes, total_views, total_comments, total_shares,
        avg_engagement_rate, engagement_views_rate, total_followers,
        owner_id, created_by, is_public, share_url_token, credits_used, completed_at
    ) VALUES (
        report_id_1,
        'Summer Fashion Campaign 2026',
        ARRAY['INSTAGRAM'],
        'COMPLETED',
        '2026-01-01',
        '2026-01-25',
        ARRAY['#summerfashion', '#ootd', '#fashionista'],
        ARRAY['@brandxyz'],
        NULL,
        false,
        false,
        25,
        150,
        125000,
        850000,
        8500,
        3200,
        4.25,
        15.75,
        2500000,
        user_id,
        user_id,
        true,
        'share_' || substr(md5(random()::text), 0, 16),
        1,
        NOW()
    );

    -- Report 2: Completed Multi-platform Report
    report_id_2 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_reports (
        id, title, platforms, status, date_range_start, date_range_end,
        hashtags, usernames, keywords, sponsored_only, auto_refresh_enabled,
        total_influencers, total_posts, total_likes, total_views, total_comments, total_shares,
        avg_engagement_rate, engagement_views_rate, total_followers,
        owner_id, created_by, is_public, share_url_token, credits_used, completed_at
    ) VALUES (
        report_id_2,
        'Tech Product Launch - Instagram & TikTok',
        ARRAY['INSTAGRAM', 'TIKTOK'],
        'COMPLETED',
        '2025-12-15',
        '2026-01-15',
        ARRAY['#techlaunch', '#gadgets', '#newtech'],
        ARRAY['@techbrand', '@gadgetreview'],
        NULL,
        true,
        true,
        45,
        280,
        450000,
        2500000,
        25000,
        15000,
        3.85,
        19.00,
        5000000,
        user_id,
        user_id,
        false,
        'share_' || substr(md5(random()::text), 0, 16),
        1,
        NOW()
    );

    -- Report 3: Processing YouTube Report
    report_id_3 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_reports (
        id, title, platforms, status, date_range_start, date_range_end,
        hashtags, usernames, keywords, sponsored_only, auto_refresh_enabled,
        total_influencers, total_posts, total_likes, total_views, total_comments, total_shares,
        owner_id, created_by, is_public, credits_used
    ) VALUES (
        report_id_3,
        'YouTube Brand Mentions Q1 2026',
        ARRAY['YOUTUBE'],
        'PROCESSING',
        '2026-01-01',
        '2026-03-31',
        NULL,
        NULL,
        ARRAY['brand name', 'product review', 'unboxing'],
        false,
        true,
        0,
        0,
        0,
        0,
        0,
        0,
        user_id,
        user_id,
        false,
        1
    );

    -- Insert Influencers for Report 1
    -- Mega Influencer
    influencer_id_1 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_influencers (
        id, report_id, influencer_name, influencer_username, platform,
        profile_picture_url, follower_count, category, audience_credibility,
        posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate
    ) VALUES (
        influencer_id_1,
        report_id_1,
        'Fashion Queen',
        'fashionqueen',
        'INSTAGRAM',
        'https://picsum.photos/200?random=1',
        1500000,
        'MEGA',
        92.5,
        12,
        45000,
        320000,
        3500,
        1200,
        3.23
    );

    -- Macro Influencer
    influencer_id_2 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_influencers (
        id, report_id, influencer_name, influencer_username, platform,
        profile_picture_url, follower_count, category, audience_credibility,
        posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate
    ) VALUES (
        influencer_id_2,
        report_id_1,
        'Style Guru',
        'styleguru_official',
        'INSTAGRAM',
        'https://picsum.photos/200?random=2',
        350000,
        'MACRO',
        88.0,
        18,
        28000,
        180000,
        2200,
        800,
        4.58
    );

    -- Micro Influencer
    influencer_id_3 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_influencers (
        id, report_id, influencer_name, influencer_username, platform,
        profile_picture_url, follower_count, category, audience_credibility,
        posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate
    ) VALUES (
        influencer_id_3,
        report_id_1,
        'Daily Fashion Tips',
        'dailyfashiontips',
        'INSTAGRAM',
        'https://picsum.photos/200?random=3',
        75000,
        'MICRO',
        95.2,
        25,
        18500,
        95000,
        1500,
        450,
        5.87
    );

    -- Nano Influencers
    influencer_id_4 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_influencers (
        id, report_id, influencer_name, influencer_username, platform,
        profile_picture_url, follower_count, category, audience_credibility,
        posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate
    ) VALUES (
        influencer_id_4,
        report_id_1,
        'Fashion Lover',
        'fashion_lover_123',
        'INSTAGRAM',
        'https://picsum.photos/200?random=4',
        8500,
        'NANO',
        97.8,
        35,
        8200,
        42000,
        650,
        280,
        8.15
    );

    influencer_id_5 := gen_random_uuid();
    INSERT INTO zorbitads.mention_tracking_influencers (
        id, report_id, influencer_name, influencer_username, platform,
        profile_picture_url, follower_count, category, audience_credibility,
        posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate
    ) VALUES (
        influencer_id_5,
        report_id_1,
        'Trendy Sarah',
        'trendysarah',
        'INSTAGRAM',
        'https://picsum.photos/200?random=5',
        5200,
        'NANO',
        96.5,
        40,
        6800,
        28000,
        520,
        180,
        9.25
    );

    -- Insert Posts for Report 1
    INSERT INTO zorbitads.mention_tracking_posts (
        report_id, influencer_id, platform, post_id, post_url, post_type,
        thumbnail_url, description, matched_hashtags, matched_usernames,
        likes_count, comments_count, views_count, shares_count, engagement_rate,
        is_sponsored, post_date
    ) VALUES 
    (
        report_id_1, influencer_id_1, 'INSTAGRAM', 'post_001',
        'https://instagram.com/p/abc123', 'IMAGE',
        'https://picsum.photos/400/400?random=101',
        'Loving this summer collection! Perfect for beach days 🏖️ #summerfashion #ootd',
        ARRAY['#summerfashion', '#ootd'],
        ARRAY['@brandxyz'],
        12500, 850, 95000, 420, 4.12, true, '2026-01-20'
    ),
    (
        report_id_1, influencer_id_1, 'INSTAGRAM', 'post_002',
        'https://instagram.com/p/def456', 'REEL',
        'https://picsum.photos/400/400?random=102',
        'Summer outfit ideas you need to try! #fashionista #summerfashion',
        ARRAY['#fashionista', '#summerfashion'],
        NULL,
        8500, 620, 78000, 280, 3.45, false, '2026-01-18'
    ),
    (
        report_id_1, influencer_id_2, 'INSTAGRAM', 'post_003',
        'https://instagram.com/p/ghi789', 'IMAGE',
        'https://picsum.photos/400/400?random=103',
        'My go-to summer look courtesy of @brandxyz! #ootd #summerfashion',
        ARRAY['#ootd', '#summerfashion'],
        ARRAY['@brandxyz'],
        6200, 380, 42000, 150, 4.85, true, '2026-01-15'
    ),
    (
        report_id_1, influencer_id_3, 'INSTAGRAM', 'post_004',
        'https://instagram.com/p/jkl012', 'CAROUSEL',
        'https://picsum.photos/400/400?random=104',
        '5 summer outfits that will turn heads! Swipe for more 👉 #summerfashion #fashionista',
        ARRAY['#summerfashion', '#fashionista'],
        NULL,
        4800, 290, 28000, 95, 5.42, false, '2026-01-12'
    ),
    (
        report_id_1, influencer_id_4, 'INSTAGRAM', 'post_005',
        'https://instagram.com/p/mno345', 'IMAGE',
        'https://picsum.photos/400/400?random=105',
        'Casual summer vibes with @brandxyz 🌞 #summerfashion #ootd',
        ARRAY['#summerfashion', '#ootd'],
        ARRAY['@brandxyz'],
        2100, 185, 12000, 45, 7.85, true, '2026-01-10'
    ),
    (
        report_id_1, influencer_id_5, 'INSTAGRAM', 'post_006',
        'https://instagram.com/p/pqr678', 'REEL',
        'https://picsum.photos/400/400?random=106',
        'Summer is here and so is my new wardrobe! #fashionista #summerfashion',
        ARRAY['#fashionista', '#summerfashion'],
        NULL,
        1850, 142, 9500, 38, 8.92, false, '2026-01-08'
    );

    -- Insert more influencers for Report 2 (Multi-platform)
    INSERT INTO zorbitads.mention_tracking_influencers (
        report_id, influencer_name, influencer_username, platform,
        profile_picture_url, follower_count, category, audience_credibility,
        posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate
    ) VALUES 
    (
        report_id_2, 'Tech Reviewer Pro', 'techreviewerpro', 'INSTAGRAM',
        'https://picsum.photos/200?random=10', 850000, 'MEGA', 91.0,
        15, 65000, 420000, 4500, 2800, 3.85
    ),
    (
        report_id_2, 'Gadget Master', 'gadgetmaster', 'TIKTOK',
        'https://picsum.photos/200?random=11', 1200000, 'MEGA', 89.5,
        22, 185000, 1500000, 12000, 8500, 3.42
    ),
    (
        report_id_2, 'Tech Daily', 'techdaily', 'INSTAGRAM',
        'https://picsum.photos/200?random=12', 280000, 'MACRO', 93.2,
        28, 42000, 180000, 3200, 1500, 5.12
    ),
    (
        report_id_2, 'Unbox Everything', 'unboxeverything', 'TIKTOK',
        'https://picsum.photos/200?random=13', 95000, 'MICRO', 94.8,
        35, 28000, 150000, 2800, 950, 6.25
    );

    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Report 1 ID: %', report_id_1;
    RAISE NOTICE 'Report 2 ID: %', report_id_2;
    RAISE NOTICE 'Report 3 ID: %', report_id_3;
END $$;

-- Show inserted data
SELECT 'mention_tracking_reports' as table_name, COUNT(*) as count FROM zorbitads.mention_tracking_reports
UNION ALL
SELECT 'mention_tracking_influencers', COUNT(*) FROM zorbitads.mention_tracking_influencers
UNION ALL
SELECT 'mention_tracking_posts', COUNT(*) FROM zorbitads.mention_tracking_posts;
