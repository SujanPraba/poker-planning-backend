import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../session/session.service';
export declare class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly sessionService;
    private logger;
    private timers;
    server: Server;
    constructor(sessionService: SessionService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleCreateSession(client: Socket, payload: {
        name: string;
        votingSystem: 'fibonacci' | 'tshirt';
        username: string;
    }): Promise<void>;
    handleJoinSession(client: Socket, payload: {
        sessionId: string;
        username: string;
    }): Promise<void>;
    handleAddStory(client: Socket, payload: {
        sessionId: string;
        title: string;
        description?: string;
    }): Promise<void>;
    handleStartVoting(client: Socket, payload: {
        sessionId: string;
        storyId: string;
    }): Promise<void>;
    handleSubmitVote(client: Socket, payload: {
        sessionId: string;
        storyId: string;
        userId: string;
        vote: string;
    }): Promise<void>;
    handleRevealVotes(client: Socket, payload: {
        sessionId: string;
    }): Promise<void>;
    handleFinishVoting(client: Socket, payload: {
        sessionId: string;
        storyId: string;
        finalEstimate: string;
    }): Promise<void>;
    handleNextStory(client: Socket, payload: {
        sessionId: string;
    }): Promise<void>;
    handleStartTimer(client: Socket, payload: {
        sessionId: string;
        seconds: number;
    }): Promise<void>;
    handleRejoinSession(client: Socket, payload: {
        sessionId: string;
        userId: string;
    }): Promise<void>;
}
