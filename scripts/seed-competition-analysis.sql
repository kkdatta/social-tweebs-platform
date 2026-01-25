-- =========================================================
-- Competition Analysis Module - Database Schema & Seed Data
-- =========================================================

-- Create Competition Analysis Reports Table
CREATE TABLE IF NOT EXISTS zorbitads.competition_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) DEFAULT 'Untitled Competition Report',
    platforms TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'PENDING',
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    auto_refresh_enabled BOOLEAN DEFAULT FALSE,
    next_refresh_date DATE,
    total_brands INT DEFAULT 0,
    total_influencers INT DEFAULT 0,
    total_posts INT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_shares BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8,4),
    total_followers BIGINT DEFAULT 0,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    owner_id UUID NOT NULL REFERENCES zorbitads.users(id),
    created_by UUID NOT NULL REFERENCES zorbitads.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    share_url_token VARCHAR(100) UNIQUE,
    credits_used INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for competition_analysis_reports
CREATE INDEX IF NOT EXISTS idx_competition_reports_owner ON zorbitads.competition_analysis_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_competition_reports_created_by ON zorbitads.competition_analysis_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_competition_reports_status ON zorbitads.competition_analysis_reports(status);
CREATE INDEX IF NOT EXISTS idx_competition_reports_share_token ON zorbitads.competition_analysis_reports(share_url_token);
CREATE INDEX IF NOT EXISTS idx_competition_reports_created_at ON zorbitads.competition_analysis_reports(created_at);

-- Create Competition Brands Table
CREATE TABLE IF NOT EXISTS zorbitads.competition_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.competition_analysis_reports(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    hashtags TEXT[],
    username VARCHAR(255),
    keywords TEXT[],
    display_color VARCHAR(20),
    influencer_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_shares BIGINT DEFAULT 0,
    total_followers BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8,4),
    photo_count INT DEFAULT 0,
    video_count INT DEFAULT 0,
    carousel_count INT DEFAULT 0,
    reel_count INT DEFAULT 0,
    nano_count INT DEFAULT 0,
    micro_count INT DEFAULT 0,
    macro_count INT DEFAULT 0,
    mega_count INT DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for competition_brands
CREATE INDEX IF NOT EXISTS idx_competition_brands_report ON zorbitads.competition_brands(report_id);

-- Create Competition Influencers Table
CREATE TABLE IF NOT EXISTS zorbitads.competition_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.competition_analysis_reports(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES zorbitads.competition_brands(id) ON DELETE CASCADE,
    influencer_profile_id UUID,
    platform_user_id VARCHAR(255),
    influencer_name VARCHAR(255) NOT NULL,
    influencer_username VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    profile_picture_url TEXT,
    follower_count BIGINT DEFAULT 0,
    category VARCHAR(20),
    audience_credibility DECIMAL(5,2),
    posts_count INT DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    avg_engagement_rate DECIMAL(8,4),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for competition_influencers
CREATE INDEX IF NOT EXISTS idx_competition_influencers_report ON zorbitads.competition_influencers(report_id);
CREATE INDEX IF NOT EXISTS idx_competition_influencers_brand ON zorbitads.competition_influencers(brand_id);
CREATE INDEX IF NOT EXISTS idx_competition_influencers_category ON zorbitads.competition_influencers(category);

-- Create Competition Posts Table
CREATE TABLE IF NOT EXISTS zorbitads.competition_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.competition_analysis_reports(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES zorbitads.competition_brands(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES zorbitads.competition_influencers(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    post_id VARCHAR(255),
    post_url TEXT,
    post_type VARCHAR(50),
    thumbnail_url TEXT,
    description TEXT,
    matched_hashtags TEXT[],
    matched_username VARCHAR(255),
    matched_keywords TEXT[],
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    engagement_rate DECIMAL(8,4),
    is_sponsored BOOLEAN DEFAULT FALSE,
    post_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for competition_posts
CREATE INDEX IF NOT EXISTS idx_competition_posts_report ON zorbitads.competition_posts(report_id);
CREATE INDEX IF NOT EXISTS idx_competition_posts_brand ON zorbitads.competition_posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_competition_posts_influencer ON zorbitads.competition_posts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_competition_posts_date ON zorbitads.competition_posts(post_date);

-- Create Competition Shares Table
CREATE TABLE IF NOT EXISTS zorbitads.competition_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES zorbitads.competition_analysis_reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES zorbitads.users(id),
    shared_by_user_id UUID NOT NULL REFERENCES zorbitads.users(id),
    permission_level VARCHAR(50) DEFAULT 'VIEW',
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for competition_shares
CREATE INDEX IF NOT EXISTS idx_competition_shares_report ON zorbitads.competition_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_competition_shares_shared_with ON zorbitads.competition_shares(shared_with_user_id);

-- =========================================================
-- SEED DATA - Sample Competition Analysis Reports
-- =========================================================

-- Insert sample competition analysis report (Nike vs Adidas)
INSERT INTO zorbitads.competition_analysis_reports (
    id, title, platforms, status, date_range_start, date_range_end,
    auto_refresh_enabled, total_brands, total_influencers, total_posts,
    total_likes, total_views, total_comments, total_shares,
    avg_engagement_rate, total_followers, owner_id, created_by,
    is_public, share_url_token, credits_used, completed_at
)
SELECT 
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'Nike vs Adidas vs Puma Q4 2023',
    ARRAY['INSTAGRAM', 'TIKTOK'],
    'COMPLETED',
    '2023-10-01'::date,
    '2023-12-31'::date,
    false,
    3,
    45,
    180,
    2500000,
    15000000,
    125000,
    45000,
    3.85,
    8500000,
    u.id,
    u.id,
    false,
    'comp_nike_adidas_01',
    1,
    CURRENT_TIMESTAMP
FROM zorbitads.users u 
WHERE u.role = 'SUPER_ADMIN' 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert brands for the report
INSERT INTO zorbitads.competition_brands (
    id, report_id, brand_name, hashtags, username, keywords, display_color,
    influencer_count, posts_count, total_likes, total_views, total_comments, total_shares,
    total_followers, avg_engagement_rate, photo_count, video_count, carousel_count, reel_count,
    nano_count, micro_count, macro_count, mega_count, display_order
)
VALUES 
    ('b1000000-0000-0000-0000-000000000001'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 
     'Nike', ARRAY['#nike', '#justdoit', '#nikesportswear'], '@nike', ARRAY['nike shoes', 'air jordan'],
     '#4F46E5', 18, 72, 1200000, 7500000, 65000, 22000, 3200000, 4.12,
     25, 20, 12, 15, 5, 8, 3, 2, 0),
    ('b1000000-0000-0000-0000-000000000002'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'Adidas', ARRAY['#adidas', '#adidasoriginals', '#3stripes'], '@adidas', ARRAY['adidas shoes'],
     '#10B981', 15, 60, 850000, 5000000, 40000, 15000, 2800000, 3.45,
     22, 18, 8, 12, 4, 6, 3, 2, 1),
    ('b1000000-0000-0000-0000-000000000003'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'Puma', ARRAY['#puma', '#foreverfast'], '@puma', ARRAY['puma sneakers'],
     '#F59E0B', 12, 48, 450000, 2500000, 20000, 8000, 2500000, 3.28,
     18, 15, 8, 7, 3, 5, 3, 1, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample influencers for Nike
INSERT INTO zorbitads.competition_influencers (
    id, report_id, brand_id, influencer_name, influencer_username, platform,
    profile_picture_url, follower_count, category, audience_credibility,
    posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate, display_order
)
VALUES 
    ('i1000000-0000-0000-0000-000000000001'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000001'::uuid, 'Jordan Taylor', 'jordantaylor_fit', 'INSTAGRAM',
     'https://ui-avatars.com/api/?name=Jordan+Taylor&background=random', 250000, 'MACRO', 85.5,
     8, 180000, 950000, 12000, 3500, 4.8, 0),
    ('i1000000-0000-0000-0000-000000000002'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000001'::uuid, 'Alex Sports', 'alexsports_official', 'INSTAGRAM',
     'https://ui-avatars.com/api/?name=Alex+Sports&background=random', 85000, 'MICRO', 82.3,
     6, 95000, 420000, 8500, 2200, 4.1, 1),
    ('i1000000-0000-0000-0000-000000000003'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000001'::uuid, 'Fitness Quinn', 'fitnessquinn', 'TIKTOK',
     'https://ui-avatars.com/api/?name=Fitness+Quinn&background=random', 620000, 'MEGA', 88.2,
     10, 420000, 2800000, 25000, 8500, 5.2, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample influencers for Adidas
INSERT INTO zorbitads.competition_influencers (
    id, report_id, brand_id, influencer_name, influencer_username, platform,
    profile_picture_url, follower_count, category, audience_credibility,
    posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate, display_order
)
VALUES 
    ('i1000000-0000-0000-0000-000000000004'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000002'::uuid, 'Morgan Athletics', 'morganathletics', 'INSTAGRAM',
     'https://ui-avatars.com/api/?name=Morgan+Athletics&background=random', 180000, 'MACRO', 79.8,
     7, 125000, 680000, 9500, 2800, 3.9, 0),
    ('i1000000-0000-0000-0000-000000000005'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000002'::uuid, 'Riley Runner', 'rileyrunner', 'TIKTOK',
     'https://ui-avatars.com/api/?name=Riley+Runner&background=random', 45000, 'MICRO', 86.1,
     5, 62000, 320000, 4800, 1500, 3.6, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sample influencers for Puma
INSERT INTO zorbitads.competition_influencers (
    id, report_id, brand_id, influencer_name, influencer_username, platform,
    profile_picture_url, follower_count, category, audience_credibility,
    posts_count, likes_count, views_count, comments_count, shares_count, avg_engagement_rate, display_order
)
VALUES 
    ('i1000000-0000-0000-0000-000000000006'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000003'::uuid, 'Casey Speed', 'caseyspeed', 'INSTAGRAM',
     'https://ui-avatars.com/api/?name=Casey+Speed&background=random', 92000, 'MICRO', 81.4,
     6, 78000, 380000, 5200, 1800, 3.4, 0),
    ('i1000000-0000-0000-0000-000000000007'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000003'::uuid, 'Peyton Fast', 'peytonfast_official', 'TIKTOK',
     'https://ui-avatars.com/api/?name=Peyton+Fast&background=random', 350000, 'MACRO', 84.7,
     8, 245000, 1450000, 12000, 4500, 3.8, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts for Nike influencers
INSERT INTO zorbitads.competition_posts (
    id, report_id, brand_id, influencer_id, platform, post_id, post_url, post_type,
    thumbnail_url, description, matched_hashtags, matched_username, matched_keywords,
    likes_count, comments_count, views_count, shares_count, engagement_rate, is_sponsored, post_date
)
VALUES 
    ('p1000000-0000-0000-0000-000000000001'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000001'::uuid, 'i1000000-0000-0000-0000-000000000001'::uuid,
     'INSTAGRAM', 'post_nike_001', 'https://instagram.com/p/nike001', 'VIDEO',
     'https://picsum.photos/400/400?random=1', 'New Air Jordan collection! #nike #justdoit @nike Amazing comfort!',
     ARRAY['#nike', '#justdoit'], '@nike', ARRAY['air jordan'], 45000, 3200, 280000, 1200, 4.5, true, '2023-11-15'),
    ('p1000000-0000-0000-0000-000000000002'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000001'::uuid, 'i1000000-0000-0000-0000-000000000002'::uuid,
     'INSTAGRAM', 'post_nike_002', 'https://instagram.com/p/nike002', 'REEL',
     'https://picsum.photos/400/400?random=2', 'Morning run with my #nike gear! Best shoes ever!',
     ARRAY['#nike'], NULL, ARRAY['nike shoes'], 28000, 1800, 150000, 850, 4.1, false, '2023-10-28'),
    ('p1000000-0000-0000-0000-000000000003'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000001'::uuid, 'i1000000-0000-0000-0000-000000000003'::uuid,
     'TIKTOK', 'post_nike_003', 'https://tiktok.com/@nike003', 'VIDEO',
     'https://picsum.photos/400/400?random=3', '#nike #nikesportswear workout routine with the best gear!',
     ARRAY['#nike', '#nikesportswear'], NULL, NULL, 125000, 8500, 850000, 4500, 5.8, true, '2023-12-05')
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts for Adidas influencers
INSERT INTO zorbitads.competition_posts (
    id, report_id, brand_id, influencer_id, platform, post_id, post_url, post_type,
    thumbnail_url, description, matched_hashtags, matched_username, matched_keywords,
    likes_count, comments_count, views_count, shares_count, engagement_rate, is_sponsored, post_date
)
VALUES 
    ('p1000000-0000-0000-0000-000000000004'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000002'::uuid, 'i1000000-0000-0000-0000-000000000004'::uuid,
     'INSTAGRAM', 'post_adidas_001', 'https://instagram.com/p/adidas001', 'CAROUSEL',
     'https://picsum.photos/400/400?random=4', 'Love my new #adidas #adidasoriginals collection!',
     ARRAY['#adidas', '#adidasoriginals'], '@adidas', NULL, 38000, 2400, 220000, 980, 3.8, true, '2023-11-20'),
    ('p1000000-0000-0000-0000-000000000005'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000002'::uuid, 'i1000000-0000-0000-0000-000000000005'::uuid,
     'TIKTOK', 'post_adidas_002', 'https://tiktok.com/@adidas002', 'VIDEO',
     'https://picsum.photos/400/400?random=5', '#3stripes running challenge! adidas shoes are the best!',
     ARRAY['#3stripes'], NULL, ARRAY['adidas shoes'], 18000, 1200, 95000, 520, 3.5, false, '2023-10-15')
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts for Puma influencers
INSERT INTO zorbitads.competition_posts (
    id, report_id, brand_id, influencer_id, platform, post_id, post_url, post_type,
    thumbnail_url, description, matched_hashtags, matched_username, matched_keywords,
    likes_count, comments_count, views_count, shares_count, engagement_rate, is_sponsored, post_date
)
VALUES 
    ('p1000000-0000-0000-0000-000000000006'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000003'::uuid, 'i1000000-0000-0000-0000-000000000006'::uuid,
     'INSTAGRAM', 'post_puma_001', 'https://instagram.com/p/puma001', 'PHOTO',
     'https://picsum.photos/400/400?random=6', 'Training day with #puma! #foreverfast lifestyle',
     ARRAY['#puma', '#foreverfast'], '@puma', NULL, 22000, 1500, 110000, 650, 3.2, false, '2023-11-08'),
    ('p1000000-0000-0000-0000-000000000007'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid,
     'b1000000-0000-0000-0000-000000000003'::uuid, 'i1000000-0000-0000-0000-000000000007'::uuid,
     'TIKTOK', 'post_puma_002', 'https://tiktok.com/@puma002', 'REEL',
     'https://picsum.photos/400/400?random=7', 'puma sneakers unboxing! Best for running!',
     NULL, NULL, ARRAY['puma sneakers'], 85000, 5200, 520000, 2800, 4.2, true, '2023-12-12')
ON CONFLICT (id) DO NOTHING;

-- Insert another sample report (in progress)
INSERT INTO zorbitads.competition_analysis_reports (
    id, title, platforms, status, date_range_start, date_range_end,
    auto_refresh_enabled, total_brands, total_influencers, total_posts,
    owner_id, created_by, is_public, share_url_token, credits_used
)
SELECT 
    'c1000000-0000-0000-0000-000000000002'::uuid,
    'Samsung vs Apple vs Google Q1 2024',
    ARRAY['INSTAGRAM'],
    'IN_PROGRESS',
    '2024-01-01'::date,
    '2024-03-31'::date,
    true,
    3,
    0,
    0,
    u.id,
    u.id,
    false,
    'comp_tech_01',
    1
FROM zorbitads.users u 
WHERE u.role = 'SUPER_ADMIN' 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert brands for tech report
INSERT INTO zorbitads.competition_brands (
    id, report_id, brand_name, hashtags, username, keywords, display_color, display_order
)
VALUES 
    ('b1000000-0000-0000-0000-000000000004'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 
     'Samsung', ARRAY['#samsung', '#galaxys24'], '@samsung', ARRAY['samsung galaxy'],
     '#4F46E5', 0),
    ('b1000000-0000-0000-0000-000000000005'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid,
     'Apple', ARRAY['#apple', '#iphone15'], '@apple', ARRAY['iphone pro'],
     '#10B981', 1),
    ('b1000000-0000-0000-0000-000000000006'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid,
     'Google', ARRAY['#google', '#pixel8'], '@google', ARRAY['google pixel'],
     '#F59E0B', 2)
ON CONFLICT (id) DO NOTHING;

-- Verify data
SELECT 'Competition Analysis Reports' AS table_name, COUNT(*) AS count FROM zorbitads.competition_analysis_reports
UNION ALL
SELECT 'Competition Brands', COUNT(*) FROM zorbitads.competition_brands
UNION ALL
SELECT 'Competition Influencers', COUNT(*) FROM zorbitads.competition_influencers
UNION ALL
SELECT 'Competition Posts', COUNT(*) FROM zorbitads.competition_posts;
