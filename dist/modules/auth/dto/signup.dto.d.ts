import { CampaignFrequency } from '../../../common/enums';
export declare class SignupDto {
    fullName: string;
    email: string;
    phoneNumber: string;
    businessName: string;
    campaignFrequency: CampaignFrequency;
    message?: string;
    password: string;
    confirmPassword: string;
    captchaToken: string;
    agreeToTerms: boolean;
}
export declare class SignupResponseDto {
    success: boolean;
    message: string;
}
