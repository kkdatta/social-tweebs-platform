"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('modash', () => {
    const appMode = process.env.APP_MODE || 'development';
    const explicitEnabled = process.env.MODASH_ENABLED;
    const enabled = explicitEnabled !== undefined
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
//# sourceMappingURL=modash.config.js.map