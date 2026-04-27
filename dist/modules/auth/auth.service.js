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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const user_entity_1 = require("../users/entities/user.entity");
const credit_account_entity_1 = require("../credits/entities/credit-account.entity");
const feature_access_entity_1 = require("../team/entities/feature-access.entity");
const password_reset_token_entity_1 = require("./entities/password-reset-token.entity");
const login_history_entity_1 = require("./entities/login-history.entity");
const signup_request_entity_1 = require("./entities/signup-request.entity");
const user_session_entity_1 = require("./entities/user-session.entity");
const enums_1 = require("../../common/enums");
const mail_service_1 = require("../../common/services/mail.service");
let AuthService = class AuthService {
    constructor(userRepository, creditAccountRepository, featureAccessRepository, resetTokenRepository, loginHistoryRepository, signupRequestRepository, sessionRepository, jwtService, configService, mailService) {
        this.userRepository = userRepository;
        this.creditAccountRepository = creditAccountRepository;
        this.featureAccessRepository = featureAccessRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.loginHistoryRepository = loginHistoryRepository;
        this.signupRequestRepository = signupRequestRepository;
        this.sessionRepository = sessionRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async login(loginDto, ipAddress, userAgent) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            await this.recordLoginAttempt(null, email, ipAddress, userAgent, false, 'User not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await this.recordLoginAttempt(user.id, email, ipAddress, userAgent, false, 'Invalid password');
            await this.checkAndLockAccount(user, email);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.canLogin()) {
            await this.recordLoginAttempt(user.id, email, ipAddress, userAgent, false, `Account ${user.status}`);
            throw new common_1.UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
        }
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId: user.id },
        });
        if (creditAccount && !creditAccount.isActive()) {
            user.status = enums_1.UserStatus.EXPIRED;
            await this.userRepository.save(user);
            throw new common_1.UnauthorizedException('Account validity has expired');
        }
        const tokens = await this.generateTokens(user);
        await this.saveSession(user.id, tokens.refreshToken, ipAddress, userAgent);
        await this.recordLoginAttempt(user.id, email, ipAddress, userAgent, true, null);
        const featureAccess = await this.getEnabledFeatureNames(user.id, user.role);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                featureAccess,
            },
            creditBalance: creditAccount ? Number(creditAccount.unifiedBalance) : 0,
            accountExpiresAt: creditAccount?.validityEnd || null,
            daysRemaining: creditAccount?.daysRemaining() || 0,
        };
    }
    async signup(signupDto) {
        const { email, password, confirmPassword } = signupDto;
        if (password !== confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const existingRequest = await this.signupRequestRepository.findOne({
            where: { email, status: enums_1.SignupRequestStatus.PENDING },
        });
        if (existingRequest) {
            throw new common_1.ConflictException('Signup request already pending for this email');
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const signupRequest = this.signupRequestRepository.create({
            email,
            name: signupDto.fullName,
            phone: signupDto.phoneNumber,
            businessName: signupDto.businessName,
            campaignFrequency: signupDto.campaignFrequency,
            message: signupDto.message,
            passwordHash,
            status: enums_1.SignupRequestStatus.PENDING,
        });
        await this.signupRequestRepository.save(signupRequest);
        await this.mailService.sendSignupConfirmation(email, signupDto.fullName);
        const superAdmins = await this.userRepository.find({ where: { role: enums_1.UserRole.SUPER_ADMIN } });
        for (const admin of superAdmins) {
            await this.mailService.sendSignupNotificationToAdmin(admin.email, signupDto.fullName, email);
        }
        return {
            success: true,
            message: 'Signup request submitted successfully. You will be contacted shortly for verification.',
        };
    }
    async forgotPassword(dto) {
        const { email } = dto;
        const user = await this.userRepository.findOne({ where: { email } });
        if (user) {
            await this.resetTokenRepository.update({ userId: user.id, isUsed: false }, { isUsed: true });
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            const resetToken = this.resetTokenRepository.create({
                userId: user.id,
                tokenHash,
                expiresAt,
            });
            await this.resetTokenRepository.save(resetToken);
            await this.mailService.sendPasswordResetEmail(email, rawToken);
        }
        return {
            success: true,
            message: 'If the email exists, a password reset link has been sent.',
        };
    }
    async approveSignup(signupRequestId) {
        const signupRequest = await this.signupRequestRepository.findOne({
            where: { id: signupRequestId },
        });
        if (!signupRequest) {
            throw new common_1.BadRequestException('Signup request not found');
        }
        if (signupRequest.status !== enums_1.SignupRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Signup request is not in pending state');
        }
        const existingUser = await this.userRepository.findOne({ where: { email: signupRequest.email } });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const user = this.userRepository.create({
            email: signupRequest.email,
            name: signupRequest.name,
            passwordHash: signupRequest.passwordHash,
            phone: signupRequest.phone,
            role: enums_1.UserRole.ADMIN,
            status: enums_1.UserStatus.ACTIVE,
        });
        await this.userRepository.save(user);
        const creditAccount = this.creditAccountRepository.create({
            userId: user.id,
            unifiedBalance: 0,
            validityStart: new Date(),
            validityEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        await this.creditAccountRepository.save(creditAccount);
        signupRequest.status = enums_1.SignupRequestStatus.APPROVED;
        await this.signupRequestRepository.save(signupRequest);
        await this.mailService.sendAccountActivation(signupRequest.email, signupRequest.name);
        return {
            success: true,
            message: 'Signup request approved and user account activated.',
        };
    }
    async getSignupRequests(status) {
        const where = {};
        if (status && Object.values(enums_1.SignupRequestStatus).includes(status)) {
            where.status = status;
        }
        const requests = await this.signupRequestRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
        return requests.map(r => ({
            id: r.id,
            email: r.email,
            name: r.name,
            phone: r.phone,
            businessName: r.businessName,
            campaignFrequency: r.campaignFrequency,
            message: r.message,
            status: r.status,
            createdAt: r.createdAt,
            processedAt: r.processedAt,
            rejectionReason: r.rejectionReason,
        }));
    }
    async rejectSignup(signupRequestId, reason) {
        const signupRequest = await this.signupRequestRepository.findOne({
            where: { id: signupRequestId },
        });
        if (!signupRequest) {
            throw new common_1.BadRequestException('Signup request not found');
        }
        if (signupRequest.status !== enums_1.SignupRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Signup request is not in pending state');
        }
        signupRequest.status = enums_1.SignupRequestStatus.REJECTED;
        signupRequest.rejectionReason = reason || 'Rejected by admin';
        signupRequest.processedAt = new Date();
        await this.signupRequestRepository.save(signupRequest);
        return { success: true, message: 'Signup request rejected.' };
    }
    async resetPassword(dto) {
        const newPassword = dto.newPassword || dto.password;
        if (!newPassword) {
            throw new common_1.BadRequestException('New password is required');
        }
        const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
        const resetToken = await this.resetTokenRepository.findOne({
            where: { tokenHash },
            relations: ['user'],
        });
        if (!resetToken) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        if (!resetToken.isValid()) {
            throw new common_1.BadRequestException('Reset token has expired or already been used');
        }
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.userRepository.update(resetToken.userId, { passwordHash });
        resetToken.isUsed = true;
        resetToken.usedAt = new Date();
        await this.resetTokenRepository.save(resetToken);
        await this.sessionRepository.update({ userId: resetToken.userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date() });
        return {
            success: true,
            message: 'Password reset successful. Please login with your new password.',
        };
    }
    async refreshToken(dto) {
        const { refreshToken } = dto;
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const session = await this.sessionRepository.findOne({
            where: { refreshTokenHash: tokenHash },
            relations: ['user'],
        });
        if (!session || !session.isValid()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = session.user;
        if (!user || !user.canLogin()) {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const tokens = await this.generateTokens(user);
        session.isRevoked = true;
        session.revokedAt = new Date();
        await this.sessionRepository.save(session);
        await this.saveSession(user.id, tokens.refreshToken, session.ipAddress, session.userAgent);
        return tokens;
    }
    async logout(userId, refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await this.sessionRepository.update({ userId, refreshTokenHash: tokenHash }, { isRevoked: true, revokedAt: new Date() });
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('jwt.accessExpiration'),
        });
        const refreshToken = crypto.randomBytes(32).toString('hex');
        return { accessToken, refreshToken };
    }
    async saveSession(userId, refreshToken, ipAddress, userAgent) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const session = this.sessionRepository.create({
            userId,
            refreshTokenHash: tokenHash,
            ipAddress,
            userAgent,
            expiresAt,
        });
        await this.sessionRepository.save(session);
    }
    async recordLoginAttempt(userId, email, ipAddress, userAgent, success, failureReason) {
        const loginHistory = new login_history_entity_1.LoginHistory();
        loginHistory.userId = userId;
        loginHistory.email = email;
        loginHistory.ipAddress = ipAddress;
        loginHistory.userAgent = userAgent;
        loginHistory.success = success;
        loginHistory.failureReason = failureReason;
        await this.loginHistoryRepository.save(loginHistory);
    }
    async checkAndLockAccount(user, email) {
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
        const recentFailures = await this.loginHistoryRepository.count({
            where: {
                email,
                success: false,
                createdAt: (0, typeorm_2.MoreThan)(fifteenMinutesAgo),
            },
        });
        if (recentFailures >= 5) {
            user.status = enums_1.UserStatus.LOCKED;
            await this.userRepository.save(user);
        }
    }
    async getEnabledFeatureNames(userId, role) {
        if (role === enums_1.UserRole.SUPER_ADMIN) {
            return Object.values(enums_1.FeatureName);
        }
        const rows = await this.featureAccessRepository.find({
            where: { userId, isEnabled: true },
            select: ['featureName'],
        });
        return rows.map((r) => r.featureName);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(credit_account_entity_1.CreditAccount)),
    __param(2, (0, typeorm_1.InjectRepository)(feature_access_entity_1.FeatureAccess)),
    __param(3, (0, typeorm_1.InjectRepository)(password_reset_token_entity_1.PasswordResetToken)),
    __param(4, (0, typeorm_1.InjectRepository)(login_history_entity_1.LoginHistory)),
    __param(5, (0, typeorm_1.InjectRepository)(signup_request_entity_1.SignupRequest)),
    __param(6, (0, typeorm_1.InjectRepository)(user_session_entity_1.UserSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map