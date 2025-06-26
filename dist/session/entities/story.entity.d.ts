import { Session } from './session.entity';
export declare class Story {
    id: string;
    title: string;
    description: string;
    status: string;
    votes: Record<string, string>;
    finalEstimate: string;
    session: Session;
    sessionId: string;
}
