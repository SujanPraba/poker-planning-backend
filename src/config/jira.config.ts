import { registerAs } from '@nestjs/config';

export default registerAs('jira', () => ({
  host: process.env.JIRA_HOST || 'your-jira-instance.atlassian.net',
  username: process.env.JIRA_USERNAME || '',
  apiToken: process.env.JIRA_API_TOKEN || '',
}));