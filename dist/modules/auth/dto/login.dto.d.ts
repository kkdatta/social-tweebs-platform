export declare class LoginDto {
    email: string;
    password: string;
}
export declare class LoginResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    creditBalance: number;
    accountExpiresAt: Date | null;
    daysRemaining: number;
}
