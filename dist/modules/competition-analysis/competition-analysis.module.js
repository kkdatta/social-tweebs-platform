"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionAnalysisModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const competition_analysis_controller_1 = require("./competition-analysis.controller");
const competition_analysis_service_1 = require("./competition-analysis.service");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_module_1 = require("../credits/credits.module");
const discovery_module_1 = require("../discovery/discovery.module");
let CompetitionAnalysisModule = class CompetitionAnalysisModule {
};
exports.CompetitionAnalysisModule = CompetitionAnalysisModule;
exports.CompetitionAnalysisModule = CompetitionAnalysisModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.CompetitionAnalysisReport,
                entities_1.CompetitionBrand,
                entities_1.CompetitionInfluencer,
                entities_1.CompetitionPost,
                entities_1.CompetitionShare,
                user_entity_1.User,
            ]),
            credits_module_1.CreditsModule,
            discovery_module_1.DiscoveryModule,
        ],
        controllers: [competition_analysis_controller_1.CompetitionAnalysisController],
        providers: [competition_analysis_service_1.CompetitionAnalysisService],
        exports: [competition_analysis_service_1.CompetitionAnalysisService],
    })
], CompetitionAnalysisModule);
//# sourceMappingURL=competition-analysis.module.js.map