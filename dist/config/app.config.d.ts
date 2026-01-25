declare const _default: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
    throttle: {
        ttl: number;
        limit: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    frontendUrl: string;
    throttle: {
        ttl: number;
        limit: number;
    };
}>;
export default _default;
