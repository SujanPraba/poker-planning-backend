import { Repository } from 'typeorm';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { Session } from './entities/session.entity';
import { Story } from './entities/story.entity';
import { User } from './entities/user.entity';
import { SessionExport, SessionWithRelations } from './types';
export declare class SessionService {
    private sessionRepository;
    private userRepository;
    private storyRepository;
    private readonly logger;
    constructor(sessionRepository: Repository<Session>, userRepository: Repository<User>, storyRepository: Repository<Story>);
    create(createSessionDto: CreateSessionDto): Promise<SessionWithRelations>;
    join(joinSessionDto: JoinSessionDto): Promise<{
        session: SessionWithRelations;
        user: User;
    }>;
    findBySessionId(sessionId: string): Promise<SessionWithRelations | null>;
    addStory(sessionId: string, title: string, description?: string): Promise<SessionWithRelations>;
    startVoting(sessionId: string, storyId: string): Promise<SessionWithRelations>;
    submitVote(sessionId: string, storyId: string, userId: string, vote: string): Promise<SessionWithRelations>;
    revealVotes(sessionId: string): Promise<SessionWithRelations>;
    finishVoting(sessionId: string, storyId: string, finalEstimate: string): Promise<SessionWithRelations>;
    nextStory(sessionId: string): Promise<SessionWithRelations>;
    private generateSessionId;
    generateSessionExport(sessionId: string): Promise<SessionExport>;
    removeParticipant(sessionId: string, userId: string): Promise<SessionWithRelations | null>;
}
