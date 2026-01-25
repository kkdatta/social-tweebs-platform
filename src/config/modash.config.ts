import { registerAs } from '@nestjs/config';

export default registerAs('modash', () => ({
  // When true, calls go to Modash API
  // When false, data is fetched from local database only
  enabled: process.env.MODASH_ENABLED === 'true',
  apiUrl: process.env.MODASH_API_URL || 'https://api.modash.io/v1',
  apiKey: process.env.MODASH_API_KEY || '',
}));
