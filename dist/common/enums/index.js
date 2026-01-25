"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailStatus = exports.PlatformType = exports.ActionType = exports.ModuleType = exports.TransactionType = exports.SignupRequestStatus = exports.CampaignFrequency = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUB_USER"] = "SUB_USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["LOCKED"] = "LOCKED";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["EXPIRED"] = "EXPIRED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var CampaignFrequency;
(function (CampaignFrequency) {
    CampaignFrequency["LOW"] = "10-100";
    CampaignFrequency["MEDIUM"] = "100-1000";
    CampaignFrequency["HIGH"] = "1000+";
})(CampaignFrequency || (exports.CampaignFrequency = CampaignFrequency = {}));
var SignupRequestStatus;
(function (SignupRequestStatus) {
    SignupRequestStatus["PENDING"] = "PENDING";
    SignupRequestStatus["APPROVED"] = "APPROVED";
    SignupRequestStatus["REJECTED"] = "REJECTED";
})(SignupRequestStatus || (exports.SignupRequestStatus = SignupRequestStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "CREDIT";
    TransactionType["DEBIT"] = "DEBIT";
    TransactionType["TRANSFER_IN"] = "TRANSFER_IN";
    TransactionType["TRANSFER_OUT"] = "TRANSFER_OUT";
    TransactionType["REVERSAL"] = "REVERSAL";
    TransactionType["LOCK"] = "LOCK";
    TransactionType["UNLOCK"] = "UNLOCK";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var ModuleType;
(function (ModuleType) {
    ModuleType["UNIFIED_BALANCE"] = "UNIFIED_BALANCE";
    ModuleType["DISCOVERY"] = "DISCOVERY";
    ModuleType["INSIGHTS"] = "INSIGHTS";
    ModuleType["AUDIENCE_OVERLAP"] = "AUDIENCE_OVERLAP";
    ModuleType["TIE_BREAKER"] = "TIE_BREAKER";
    ModuleType["SOCIAL_SENTIMENTS"] = "SOCIAL_SENTIMENTS";
    ModuleType["INFLUENCER_COLLAB_CHECK"] = "INFLUENCER_COLLAB_CHECK";
    ModuleType["PAID_COLLABORATION"] = "PAID_COLLABORATION";
    ModuleType["CAMPAIGN_TRACKING"] = "CAMPAIGN_TRACKING";
    ModuleType["MENTION_TRACKING"] = "MENTION_TRACKING";
    ModuleType["COMPETITION_ANALYSIS"] = "COMPETITION_ANALYSIS";
    ModuleType["INFLUENCER_GROUP"] = "INFLUENCER_GROUP";
    ModuleType["EXPORT"] = "EXPORT";
})(ModuleType || (exports.ModuleType = ModuleType = {}));
var ActionType;
(function (ActionType) {
    ActionType["MANUAL_ALLOCATION"] = "MANUAL_ALLOCATION";
    ActionType["INFLUENCER_SEARCH"] = "INFLUENCER_SEARCH";
    ActionType["INFLUENCER_UNBLUR"] = "INFLUENCER_UNBLUR";
    ActionType["INFLUENCER_INSIGHT"] = "INFLUENCER_INSIGHT";
    ActionType["INFLUENCER_EXPORT"] = "INFLUENCER_EXPORT";
    ActionType["PROFILE_UNLOCK"] = "PROFILE_UNLOCK";
    ActionType["REPORT_GENERATION"] = "REPORT_GENERATION";
    ActionType["REPORT_REFRESH"] = "REPORT_REFRESH";
    ActionType["ACCOUNT_EXPIRY"] = "ACCOUNT_EXPIRY";
    ActionType["ADMIN_ADJUSTMENT"] = "ADMIN_ADJUSTMENT";
    ActionType["INSIGHT_UNLOCK"] = "INSIGHT_UNLOCK";
    ActionType["INSIGHT_REFRESH"] = "INSIGHT_REFRESH";
})(ActionType || (exports.ActionType = ActionType = {}));
var PlatformType;
(function (PlatformType) {
    PlatformType["INSTAGRAM"] = "INSTAGRAM";
    PlatformType["YOUTUBE"] = "YOUTUBE";
    PlatformType["TIKTOK"] = "TIKTOK";
    PlatformType["LINKEDIN"] = "LINKEDIN";
})(PlatformType || (exports.PlatformType = PlatformType = {}));
var EmailStatus;
(function (EmailStatus) {
    EmailStatus["PENDING"] = "PENDING";
    EmailStatus["SENT"] = "SENT";
    EmailStatus["FAILED"] = "FAILED";
    EmailStatus["BOUNCED"] = "BOUNCED";
})(EmailStatus || (exports.EmailStatus = EmailStatus = {}));
__exportStar(require("./team.enums"), exports);
//# sourceMappingURL=index.js.map