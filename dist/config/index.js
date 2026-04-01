"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailConfig = exports.modashConfig = exports.appConfig = exports.jwtConfig = exports.databaseConfig = void 0;
var database_config_1 = require("./database.config");
Object.defineProperty(exports, "databaseConfig", { enumerable: true, get: function () { return database_config_1.default; } });
var jwt_config_1 = require("./jwt.config");
Object.defineProperty(exports, "jwtConfig", { enumerable: true, get: function () { return jwt_config_1.default; } });
var app_config_1 = require("./app.config");
Object.defineProperty(exports, "appConfig", { enumerable: true, get: function () { return app_config_1.default; } });
var modash_config_1 = require("./modash.config");
Object.defineProperty(exports, "modashConfig", { enumerable: true, get: function () { return modash_config_1.default; } });
var mail_config_1 = require("./mail.config");
Object.defineProperty(exports, "mailConfig", { enumerable: true, get: function () { return mail_config_1.default; } });
//# sourceMappingURL=index.js.map