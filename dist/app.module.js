"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const database_config_1 = __importDefault(require("./config/database.config"));
const jira_config_1 = __importDefault(require("./config/jira.config"));
const database_module_1 = require("./database/database.module");
const session_entity_1 = require("./session/entities/session.entity");
const story_entity_1 = require("./session/entities/story.entity");
const user_entity_1 = require("./session/entities/user.entity");
const session_module_1 = require("./session/session.module");
const socket_module_1 = require("./socket/socket.module");
const retro_module_1 = require("./retro/retro.module");
const retro_session_entity_1 = require("./retro/entities/retro-session.entity");
const retro_user_entity_1 = require("./retro/entities/retro-user.entity");
const retro_item_entity_1 = require("./retro/entities/retro-item.entity");
const jira_module_1 = require("./jira/jira.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [database_config_1.default, jira_config_1.default],
            }),
            core_1.DiscoveryModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const dbConfig = configService.get('database');
                    return {
                        type: 'postgres',
                        host: dbConfig.host,
                        port: dbConfig.port,
                        username: dbConfig.username,
                        password: dbConfig.password,
                        database: dbConfig.database,
                        entities: [session_entity_1.Session, story_entity_1.Story, user_entity_1.User, retro_session_entity_1.RetroSession, retro_user_entity_1.RetroUser, retro_item_entity_1.RetroItem],
                        synchronize: dbConfig.synchronize,
                        dropSchema: dbConfig.dropSchema,
                        logging: dbConfig.logging,
                    };
                },
            }),
            database_module_1.DatabaseModule,
            session_module_1.SessionModule,
            socket_module_1.SocketModule,
            retro_module_1.RetroModule,
            jira_module_1.JiraModule,
            typeorm_1.TypeOrmModule.forFeature([story_entity_1.Story, session_entity_1.Session]),
        ],
        exports: [core_1.DiscoveryModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map