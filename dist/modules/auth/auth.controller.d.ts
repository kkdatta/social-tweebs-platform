import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, SignupDto, SignupResponseDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, TokenResponseDto } from './dto';
import { CurrentUserPayload } from '../../common/decorators';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, request: Request): Promise<LoginResponseDto>;
    signup(signupDto: SignupDto): Promise<SignupResponseDto>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto>;
    logout(user: CurrentUserPayload, body: RefreshTokenDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
