import { registerAs } from '@nestjs/config';

export default registerAs('jira', () => ({
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