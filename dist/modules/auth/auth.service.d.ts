import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { FeatureAccess } from '../team/entities/feature-access.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginHistory } from './entities/login-history.entity';
import { SignupRequest } from './entities/signup-request.entity';
import { UserSession } from './entities/user-session.entity';
import { LoginDto, LoginResponseDto, SignupDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, TokenResponseDto } from './dto';
import { MailService } from '../../common/services/mail.service';
export declare class AuthService {
    private userRepository;
    private creditAccountRepository;
    private featureAccessRepository;
    private resetTokenRepository;
    private loginHistoryRepository;
    private signupRequestRepository;
    private sessionRepository;
    private jwtService;
    private configService;
    private mailService;
    constructor(userRepository: Repository<User>, creditAccountRepository: Repository<CreditAccount>, featureAccessRepository: Repository<FeatureAccess>, resetTokenRepository: Repository<PasswordResetToken>, loginHistoryRepository: Repository<LoginHistory>, signupRequestRepository: Repository<SignupRequest>, sessionRepository: Repository<UserSession>, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<LoginResponseDto>;
    signup(signupDto: SignupDto): Promise<{
        success: boolean;
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    approveSignup(signupRequestId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<TokenResponseDto>;
    logout(userId: string, refreshToken: string): Promise<void>;
    private generateTokens;
    private saveSession;
    private recordLoginAttempt;
    private checkAndLockAccount;
    private getEnabledFeatureNames;
}
