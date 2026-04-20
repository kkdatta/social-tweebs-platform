import { registerAs } from '@nestjs/config';

export default registerAs('modash', () => {
  const appMode = process.env.APP_MODE || 'development';
  const explicitEnabled = process.env.MODASH_ENABLED;
  const enabled =
    explicitEnabled !== undefined
      ? explicitEnabled === 'true'
      : appMode === 'production';

  return {
    enabled,
    appMode,
    apiUrl: process.env.MODASH_API_URL || 'https://api.modash.io/v1',
    apiKey: process.env.MODASH_API_KEY || '',
    rawApiUrl: process.env.MODASH_RAW_API_URL || 'https://api.modash.io/v1',
  };
});
