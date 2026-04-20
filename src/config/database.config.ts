import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const appMode = process.env.APP_MODE || 'development';
  const defaultDbName =
    appMode === 'production' ? 'zorbitads_production' : 'postgres';

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || defaultDbName,
    schema: process.env.DB_SCHEMA || 'zorbitads',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  };
});
