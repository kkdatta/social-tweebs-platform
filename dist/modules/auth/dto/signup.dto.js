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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupResponseDto = exports.SignupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../common/enums");
class SignupDto {
}
exports.SignupDto = SignupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', description: 'Full name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required' }),
    __metadata("design:type", String)
], SignupDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@business.com', description: 'Business email' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Please provide a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
    __metadata("design:type", String)
], SignupDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234567890', description: 'Phone number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone number is required' }),
    (0, class_validator_1.Matches)(/^[0-9]{10,15}$/, { message: 'Please provide a valid phone number' }),
    __metadata("design:type", String)
], SignupDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Acme Corp', description: 'Business name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Business name is required' }),
    __metadata("design:type", String)
], SignupDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: enums_1.CampaignFrequency,
        example: enums_1.CampaignFrequency.MEDIUM,
        description: 'Campaign frequency',
    }),
    (0, class_validator_1.IsEnum)(enums_1.CampaignFrequency, { message: 'Please select a valid campaign frequency' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Campaign frequency is required' }),
    __metadata("design:type", String)
], SignupDto.prototype, "campaignFrequency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Looking forward to using the platform', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SignupDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass123!', description: 'Password' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters' }),
    __metadata("design:type", String)
], SignupDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass123!', description: 'Confirm password' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Confirm password is required' }),
    __metadata("design:type", String)
], SignupDto.prototype, "confirmPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'abc123xyz', description: 'Captcha response token' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Captcha verification is required' }),
    __metadata("design:type", String)
], SignupDto.prototype, "captchaToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Accept Terms & Conditions' }),
    (0, class_validator_1.IsBoolean)({ message: 'You must accept the Terms & Conditions' }),
    (0, class_validator_1.Equals)(true, { message: 'You must accept the Terms & Conditions' }),
    __metadata("design:type", Boolean)
], SignupDto.prototype, "agreeToTerms", void 0);
class SignupResponseDto {
}
exports.SignupResponseDto = SignupResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SignupResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SignupResponseDto.prototype, "message", void 0);
//# sourceMappingURL=signup.dto.js.map