import { registerAs } from '@nestjs/config';

export type AppMode = 'development' | 'production';

export default registerAs('app', () => {
  const appMode = (process.env.APP_MODE as AppMode) || 'development';

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    mode: appMode,
    isProduction: appMode === 'production',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },
  };
});
