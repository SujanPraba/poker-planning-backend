export interface JiraProject {
  id: string;
  key: string;
  name: string;
  lead: string | null;
  avatarUrl: string | null;
}

export interface JiraStory {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string | null;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    customfield_10004?: number; // Story points
  };
}

export interface JiraUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface EmailValidationResponse {
  isValid: boolean;
} 