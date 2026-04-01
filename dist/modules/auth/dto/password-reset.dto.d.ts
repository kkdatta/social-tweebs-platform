export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword?: string;
    password?: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class TokenResponseDto {
    accessToken: string;
    refreshToken: string;
}
