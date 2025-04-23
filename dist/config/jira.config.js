"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jira', () => ({
    host: process.env.JIRA_HOST || 'your-jira-instance.atlassian.net',
    username: process.env.JIRA_USERNAME || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
}));
//# sourceMappingURL=jira.config.js.map