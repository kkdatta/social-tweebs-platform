export type AppMode = 'development' | 'production';
declare const _default: (() => {
    nodeEnv: string;
    mode: AppMode;
    isProduction: boolean;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
    throttle: {
        ttl: number;
        limit: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    mode: AppMode;
    isProduction: boolean;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
    throttle: {
        ttl: number;
        limit: number;
    };
}>;
export default _default;
