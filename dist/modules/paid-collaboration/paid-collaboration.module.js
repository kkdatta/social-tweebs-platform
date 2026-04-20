"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaidCollaborationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const paid_collaboration_controller_1 = require("./paid-collaboration.controller");
const paid_collaboration_service_1 = require("./paid-collaboration.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_module_1 = require("../credits/credits.module");
const discovery_module_1 = require("../discovery/discovery.module");
let PaidCollaborationModule = class PaidCollaborationModule {
};
exports.PaidCollaborationModule = PaidCollaborationModule;
exports.PaidCollaborationModule = PaidCollaborationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.PaidCollabReport,
                entities_1.PaidCollabInfluencer,
                entities_1.PaidCollabPost,
                entities_1.PaidCollabShare,
                entities_1.PaidCollabCategorization,
                user_entity_1.User,
            ]),
            credits_module_1.CreditsModule,
            discovery_module_1.DiscoveryModule,
        ],
        controllers: [paid_collaboration_controller_1.PaidCollaborationController],
        providers: [paid_collaboration_service_1.PaidCollaborationService],
        exports: [paid_collaboration_service_1.PaidCollaborationService],
    })
], PaidCollaborationModule);
//# sourceMappingURL=paid-collaboration.module.js.map