import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../session/session.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('SocketGateway');
  private timers: Record<string, NodeJS.Timeout> = {};

  @WebSocketServer() server: Server;

  constructor(private readonly sessionService: SessionService) {}

  afterInit(server: Server) {
    this.logger.log('Socket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_session')
  async handleCreateSession(client: Socket, payload: { name: string; votingSystem: 'fibonacci' | 'tshirt'; username: string }) {
    try {
      const session = await this.sessionService.create({
        name: payload.name,
        votingSystem: payload.votingSystem,
        username: payload.username,
      });

      // Join the socket to a room with the session ID
      client.join(session.sessionId);

      // Send the created session back to the client
      client.emit('session_created', session);
    } catch (error) {
      this.logger.error(`Error creating session: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(client: Socket, payload: { sessionId: string; username: string }) {
    try {
      const { session, user } = await this.sessionService.join({
        sessionId: payload.sessionId,
        username: payload.username,
      });

      // Join the socket to a room with the session ID
      client.join(session.sessionId);

      // Notify all clients in the room about the updated session
      this.server.to(session.sessionId).emit('session_updated', session);

      // Send the joined session back to the client
      client.emit('session_joined', { session, user });
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('add_story')
  async handleAddStory(client: Socket, payload: { sessionId: string; title: string; description?: string }) {
    try {
      const updatedSession = await this.sessionService.addStory(
        payload.sessionId,
        payload.title,
        payload.description,
      );

      // Notify all clients in the room about the updated session
      this.server.to(payload.sessionId).emit('session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error adding story: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('start_voting')
  async handleStartVoting(client: Socket, payload: { sessionId: string; storyId: string }) {
    try {
      const updatedSession = await this.sessionService.startVoting(
        payload.sessionId,
        payload.storyId,
      );

      // Notify all clients in the room about the updated session
      this.server.to(payload.sessionId).emit('session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error starting voting: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('submit_vote')
  async handleSubmitVote(client: Socket, payload: { sessionId: string; storyId: string; userId: string; vote: string }) {
    try {
      const updatedSession = await this.sessionService.submitVote(
        payload.sessionId,
        payload.storyId,
        payload.userId,
        payload.vote,
      );

      // Notify all clients in the room about the updated session
      this.server.to(payload.sessionId).emit('session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error submitting vote: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('reveal_votes')
  async handleRevealVotes(client: Socket, payload: { sessionId: string }) {
    try {
      const updatedSession = await this.sessionService.revealVotes(payload.sessionId);

      // Notify all clients in the room about the updated session
      this.server.to(payload.sessionId).emit('session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error revealing votes: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('finish_voting')
  async handleFinishVoting(client: Socket, payload: { sessionId: string; storyId: string; finalEstimate: string }) {
    try {
      const updatedSession = await this.sessionService.finishVoting(
        payload.sessionId,
        payload.storyId,
        payload.finalEstimate,
      );

      // Notify all clients in the room about the updated session
      this.server.to(payload.sessionId).emit('session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error finishing voting: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('next_story')
  async handleNextStory(client: Socket, payload: { sessionId: string }) {
    try {
      const updatedSession = await this.sessionService.nextStory(payload.sessionId);

      // Notify all clients in the room about the updated session
      this.server.to(payload.sessionId).emit('session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error moving to next story: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('start_timer')
  async handleStartTimer(client: Socket, payload: { sessionId: string; seconds: number }) {
    try {
      // Clear any existing timer for this session
      if (this.timers[payload.sessionId]) {
        clearInterval(this.timers[payload.sessionId]);
      }

      let timeLeft = payload.seconds;

      // Emit initial time
      this.server.to(payload.sessionId).emit('timer_update', timeLeft);

      // Set up interval to count down
      this.timers[payload.sessionId] = setInterval(() => {
        timeLeft--;

        // Emit updated time
        this.server.to(payload.sessionId).emit('timer_update', timeLeft);

        // Clear interval when timer reaches 0
        if (timeLeft <= 0) {
          clearInterval(this.timers[payload.sessionId]);
          delete this.timers[payload.sessionId];
        }
      }, 1000);
    } catch (error) {
      this.logger.error(`Error starting timer: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('rejoin_session')
  async handleRejoinSession(client: Socket, payload: { sessionId: string; userId: string }) {
    try {
      const session = await this.sessionService.findBySessionId(payload.sessionId);
      if (!session) {
        throw new Error(`Session with ID ${payload.sessionId} not found`);
      }

      // Join the socket to the session room
      client.join(session.sessionId);

      // Find the user in the session
      const user = session.participants.find(p => p.id === payload.userId);
      if (!user) {
        throw new Error(`User not found in session`);
      }

      // Send the session data back to the client
      client.emit('session_joined', { session, user });
    } catch (error) {
      this.logger.error(`Error rejoining session: ${error.message}`);
      client.emit('error', error.message);
    }
  }
}
