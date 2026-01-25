import { InfluencerProfile } from './influencer-profile.entity';
export declare enum AudienceDataType {
    GENDER = "GENDER",
    AGE = "AGE",
    LOCATION_COUNTRY = "LOCATION_COUNTRY",
    LOCATION_CITY = "LOCATION_CITY",
    INTEREST = "INTEREST",
    BRAND_AFFINITY = "BRAND_AFFINITY",
    LANGUAGE = "LANGUAGE",
    REACHABILITY = "REACHABILITY",
    CREDIBILITY = "CREDIBILITY"
}
export declare class AudienceData {
    id: string;
    profileId: string;
    profile: InfluencerProfile;
    dataType: AudienceDataType;
    categoryKey: string;
    percentage: number;
    affinityScore: number;
    rawData: Record<string, any>;
    createdAt: Date;
    lastUpdatedAt: Date;
}
