import { StoryDto } from './story.dto';
export declare class CreateSessionDto {
    name: string;
    votingSystem: 'fibonacci' | 'tshirt';
    username: string;
    initialStories?: StoryDto[];
}
