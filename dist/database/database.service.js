"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    constructor(dataSource, configService) {
        this.dataSource = dataSource;
        this.configService = configService;
        this.logger = new common_1.Logger(DatabaseService_1.name);
    }
    async onModuleInit() {
        const dbAction = this.configService.get('POSTGRES_DB_ACTION');
        if (dbAction === 'CREATE') {
            this.logger.log('Database action is CREATE. Tables will be automatically created.');
            try {
                if (!this.dataSource.isInitialized) {
                    await this.dataSource.initialize();
                }
                this.logger.log('Database tables created successfully');
            }
            catch (error) {
                this.logger.error('Error creating database tables:', error);
                throw error;
            }
        }
        else {
            this.logger.log('Database action is not CREATE. Skipping table creation.');
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map