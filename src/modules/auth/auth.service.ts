import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { FeatureAccess } from '../team/entities/feature-access.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginHistory } from './entities/login-history.entity';
import { SignupRequest } from './entities/signup-request.entity';
import { UserSession } from './entities/user-session.entity';
import {
  LoginDto,
  LoginResponseDto,
  SignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  TokenResponseDto,
} from './dto';
import { UserStatus, UserRole, SignupRequestStatus, FeatureName } from '../../common/enums';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CreditAccount)
    private creditAccountRepository: Repository<CreditAccount>,
    @InjectRepository(FeatureAccess)
    private featureAccessRepository: Repository<FeatureAccess>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(LoginHistory)
    private loginHistoryRepository: Repository<LoginHistory>,
    @InjectRepository(SignupRequest)
    private signupRequestRepository: Repository<SignupRequest>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      await this.recordLoginAttempt(null, email, ipAddress, userAgent, false, 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.recordLoginAttempt(user.id, email, ipAddress, userAgent, false, 'Invalid password');
      await this.checkAndLockAccount(user, email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (!user.canLogin()) {
      await this.recordLoginAttempt(user.id, email, ipAddress, userAgent, false, `Account ${user.status}`);
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    // Check credit account validity
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId: user.id },
    });

    if (creditAccount && !creditAccount.isActive()) {
      user.status = UserStatus.EXPIRED;
      await this.userRepository.save(user);
      throw new UnauthorizedException('Account validity has expired');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save session
    await this.saveSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    // Record successful login
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

  async signup(signupDto: SignupDto): Promise<{ success: boolean; message: string }> {
    const { email, password, confirmPassword } = signupDto;

    // Check password match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email exists in users
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if email exists in pending signups
    const existingRequest = await this.signupRequestRepository.findOne({
      where: { email, status: SignupRequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new ConflictException('Signup request already pending for this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create signup request
    const signupRequest = this.signupRequestRepository.create({
      email,
      name: signupDto.fullName,
      phone: signupDto.phoneNumber,
      businessName: signupDto.businessName,
      campaignFrequency: signupDto.campaignFrequency,
      message: signupDto.message,
      passwordHash,
      status: SignupRequestStatus.PENDING,
    });

    await this.signupRequestRepository.save(signupRequest);

    await this.mailService.sendSignupConfirmation(email, signupDto.fullName);

    const superAdmins = await this.userRepository.find({ where: { role: UserRole.SUPER_ADMIN } });
    for (const admin of superAdmins) {
      await this.mailService.sendSignupNotificationToAdmin(admin.email, signupDto.fullName, email);
    }

    return {
      success: true,
      message: 'Signup request submitted successfully. You will be contacted shortly for verification.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const { email } = dto;

    // Find user (don't reveal if email exists)
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      // Invalidate existing tokens
      await this.resetTokenRepository.update(
        { userId: user.id, isUsed: false },
        { isUsed: true },
      );

      // Generate new token
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

  async approveSignup(signupRequestId: string): Promise<{ success: boolean; message: string }> {
    const signupRequest = await this.signupRequestRepository.findOne({
      where: { id: signupRequestId },
    });

    if (!signupRequest) {
      throw new BadRequestException('Signup request not found');
    }

    if (signupRequest.status !== SignupRequestStatus.PENDING) {
      throw new BadRequestException('Signup request is not in pending state');
    }

    const existingUser = await this.userRepository.findOne({ where: { email: signupRequest.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email: signupRequest.email,
      name: signupRequest.name,
      passwordHash: signupRequest.passwordHash,
      phone: signupRequest.phone,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    const creditAccount = this.creditAccountRepository.create({
      userId: user.id,
      unifiedBalance: 0,
      validityStart: new Date(),
      validityEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    await this.creditAccountRepository.save(creditAccount);

    signupRequest.status = SignupRequestStatus.APPROVED;
    await this.signupRequestRepository.save(signupRequest);

    await this.mailService.sendAccountActivation(signupRequest.email, signupRequest.name);

    return {
      success: true,
      message: 'Signup request approved and user account activated.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const newPassword = dto.newPassword || dto.password;
    if (!newPassword) {
      throw new BadRequestException('New password is required');
    }

    // Hash the token to find it
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.resetTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!resetToken.isValid()) {
      throw new BadRequestException('Reset token has expired or already been used');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(resetToken.userId, { passwordHash });

    // Mark token as used
    resetToken.isUsed = true;
    resetToken.usedAt = new Date();
    await this.resetTokenRepository.save(resetToken);

    // Invalidate all sessions for this user
    await this.sessionRepository.update(
      { userId: resetToken.userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );

    return {
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokenResponseDto> {
    const { refreshToken } = dto;

    // Hash token to find session
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await this.sessionRepository.findOne({
      where: { refreshTokenHash: tokenHash },
      relations: ['user'],
    });

    if (!session || !session.isValid()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = session.user;
    if (!user || !user.canLogin()) {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Revoke old session
    session.isRevoked = true;
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);

    // Create new session
    await this.saveSession(user.id, tokens.refreshToken, session.ipAddress, session.userAgent);

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.sessionRepository.update(
      { userId, refreshTokenHash: tokenHash },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  private async generateTokens(user: User): Promise<TokenResponseDto> {
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

  private async saveSession(
    userId: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId,
      refreshTokenHash: tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.sessionRepository.save(session);
  }

  private async recordLoginAttempt(
    userId: string | null,
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    failureReason: string | null,
  ): Promise<void> {
    const loginHistory = new LoginHistory();
    loginHistory.userId = userId;
    loginHistory.email = email;
    loginHistory.ipAddress = ipAddress;
    loginHistory.userAgent = userAgent;
    loginHistory.success = success;
    loginHistory.failureReason = failureReason;

    await this.loginHistoryRepository.save(loginHistory);
  }

  private async checkAndLockAccount(user: User, email: string): Promise<void> {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const recentFailures = await this.loginHistoryRepository.count({
      where: {
        email,
        success: false,
        createdAt: MoreThan(fifteenMinutesAgo),
      },
    });

    if (recentFailures >= 5) {
      user.status = UserStatus.LOCKED;
      await this.userRepository.save(user);
    }
  }

  private async getEnabledFeatureNames(
    userId: string,
    role: UserRole,
  ): Promise<FeatureName[]> {
    if (role === UserRole.SUPER_ADMIN) {
      return Object.values(FeatureName);
    }
    const rows = await this.featureAccessRepository.find({
      where: { userId, isEnabled: true },
      select: ['featureName'],
    });
    return rows.map((r) => r.featureName);
  }
}
