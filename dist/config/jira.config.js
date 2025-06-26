"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jira', () => ({
    clientId: process.env.JIRA_CLIENT_ID || '',
    clientSecret: process.env.JIRA_CLIENT_SECRET || '',
    redirectUri: process.env.JIRA_REDIRECT_URI || 'http://localhost:8080/api/jira/auth/callback',
    scopes: [
        'read:jira-work',
        'manage:jira-project',
        'manage:jira-configuration',
        'read:jira-user',
        'write:jira-work',
        'manage:jira-webhook',
        'manage:jira-data-provider'
    ]
}));
//# sourceMappingURL=jira.config.js.map