"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentimentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sentiments_controller_1 = require("./sentiments.controller");
const sentiments_service_1 = require("./sentiments.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_module_1 = require("../credits/credits.module");
let SentimentsModule = class SentimentsModule {
};
exports.SentimentsModule = SentimentsModule;
exports.SentimentsModule = SentimentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.SentimentReport,
                entities_1.SentimentPost,
                entities_1.SentimentEmotion,
                entities_1.SentimentWordCloud,
                entities_1.SentimentShare,
                user_entity_1.User,
            ]),
            credits_module_1.CreditsModule,
        ],
        controllers: [sentiments_controller_1.SentimentsController],
        providers: [sentiments_service_1.SentimentsService],
        exports: [sentiments_service_1.SentimentsService],
    })
], SentimentsModule);
//# sourceMappingURL=sentiments.module.js.map