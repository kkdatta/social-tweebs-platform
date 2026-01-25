"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('modash', () => ({
    enabled: process.env.MODASH_ENABLED === 'true',
    apiUrl: process.env.MODASH_API_URL || 'https://api.modash.io/v1',
    apiKey: process.env.MODASH_API_KEY || '',
}));
//# sourceMappingURL=modash.config.js.map