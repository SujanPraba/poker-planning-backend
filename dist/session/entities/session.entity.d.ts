import { Story } from './story.entity';
export declare class Session {
    id: string;
    name: string;
    votingSystem: string;
    participants: any[];
    currentStoryId: string;
    hasVotesRevealed: boolean;
    isVotingComplete: boolean;
    stories: Story[];
    createdAt: Date;
}
