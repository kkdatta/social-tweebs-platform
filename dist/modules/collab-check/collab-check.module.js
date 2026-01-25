"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollabCheckModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const collab_check_controller_1 = require("./collab-check.controller");
const collab_check_service_1 = require("./collab-check.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_module_1 = require("../credits/credits.module");
let CollabCheckModule = class CollabCheckModule {
};
exports.CollabCheckModule = CollabCheckModule;
exports.CollabCheckModule = CollabCheckModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.CollabCheckReport,
                entities_1.CollabCheckInfluencer,
                entities_1.CollabCheckPost,
                entities_1.CollabCheckShare,
                user_entity_1.User,
            ]),
            credits_module_1.CreditsModule,
        ],
        controllers: [collab_check_controller_1.CollabCheckController],
        providers: [collab_check_service_1.CollabCheckService],
        exports: [collab_check_service_1.CollabCheckService],
    })
], CollabCheckModule);
//# sourceMappingURL=collab-check.module.js.map