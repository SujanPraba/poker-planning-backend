import { Session } from './entities/session.entity';
import { Story } from './entities/story.entity';
import { User } from './entities/user.entity';

export interface SessionWithRelations extends Session {
  stories: Story[];
  participants: User[];
}

export interface SessionExport {
  name: string;
  sessionId: string;
  votingSystem: 'fibonacci' | 't-shirt';
  participants: {
    id: string;
    name: string;
    isHost: boolean;
    participationRate: number;
  }[];
  stories: {
    id: string;
    title: string;
    description?: string;
    finalEstimate?: string;
    votes?: Record<string, string>;
    averageVote?: number;
    mostFrequentVote?: string;
  }[];
  summary: {
    totalStories: number;
    completedStories: number;
    averageEstimate: number;
    startTime: Date;
    endTime: Date;
  };
}