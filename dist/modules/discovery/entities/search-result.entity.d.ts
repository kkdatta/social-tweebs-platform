import { DiscoverySearch } from './discovery-search.entity';
import { InfluencerProfile } from './influencer-profile.entity';
export declare class SearchResult {
    id: string;
    searchId: string;
    search: DiscoverySearch;
    influencerProfileId: string;
    influencerProfile: InfluencerProfile;
    rankPosition: number;
    relevanceScore: number;
    isBlurred: boolean;
    createdAt: Date;
    lastUpdatedAt: Date;
}
