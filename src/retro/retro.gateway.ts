import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RetroService } from './retro.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RetroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RetroGateway.name);

  constructor(private readonly retroService: RetroService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_retro_session')
  async handleCreateSession(client: Socket, payload: { name: string; username: string }) {
    try {
      const session = await this.retroService.createSession(
        payload.name,
        payload.username,
      );

      client.join(session.sessionId);
      client.emit('retro_session_created', session);
    } catch (error) {
      this.logger.error(`Error creating retro session: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('join_retro_session')
  async handleJoinSession(client: Socket, payload: { sessionId: string; username: string }) {
    try {
      const { session, user } = await this.retroService.joinSession(
        payload.sessionId,
        payload.username,
      );

      client.join(session.sessionId);
      client.emit('retro_session_joined', { session, user });
      this.server.to(session.sessionId).emit('retro_session_updated', session);
    } catch (error) {
      this.logger.error(`Error joining retro session: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('rejoin_retro_session')
  async handleRejoinSession(client: Socket, payload: { sessionId: string; userId: string }) {
    try {
      const session = await this.retroService.findBySessionId(payload.sessionId);
      client.join(session.sessionId);
      this.server.to(session.sessionId).emit('retro_session_updated', session);
    } catch (error) {
      this.logger.error(`Error rejoining retro session: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('add_retro_item')
  async handleAddItem(
    client: Socket,
    payload: {
      sessionId: string;
      userId: string;
      content: string;
      category: string;
    }
  ) {
    try {
      const updatedSession = await this.retroService.addItem(
        payload.sessionId,
        payload.userId,
        payload.content,
        payload.category,
      );

      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error adding retro item: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('vote_retro_item')
  async handleVoteItem(client: Socket, payload: { sessionId: string; userId: string; itemId: string }) {
    try {
      const updatedSession = await this.retroService.voteForItem(
        payload.sessionId,
        payload.userId,
        payload.itemId,
      );

      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error voting for retro item: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('start_retro_voting')
  async handleStartVoting(client: Socket, payload: { sessionId: string }) {
    try {
      const updatedSession = await this.retroService.startVoting(payload.sessionId);
      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error starting retro voting: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('reveal_retro_votes')
  async handleRevealVotes(client: Socket, payload: { sessionId: string }) {
    try {
      const updatedSession = await this.retroService.revealVotes(payload.sessionId);
      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error revealing retro votes: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('finish_retro')
  async handleFinishRetro(client: Socket, payload: { sessionId: string }) {
    try {
      const updatedSession = await this.retroService.finishRetro(payload.sessionId);
      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error finishing retro: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('leave_retro_session')
  async handleLeaveSession(client: Socket, payload: { sessionId: string; userId: string }) {
    try {
      this.logger.log(`User ${payload.userId} leaving session ${payload.sessionId}`);
      
      const updatedSession = await this.retroService.removeParticipant(
        payload.sessionId,
        payload.userId,
      );

      // Leave the socket room
      client.leave(payload.sessionId);
      
      // Notify the leaving client
      client.emit('session_left');

      // If session still exists, notify remaining participants
      if (updatedSession) {
        this.logger.log(`Notifying remaining participants about user leaving`);
        this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
      } else {
        this.logger.log(`Session ${payload.sessionId} was deleted (no participants remaining)`);
      }
    } catch (error) {
      this.logger.error(`Error leaving retro session: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('add_retro_category')
  async handleAddCategory(client: Socket, payload: { sessionId: string; categoryName: string }) {
    try {
      const updatedSession = await this.retroService.addCategory(
        payload.sessionId,
        payload.categoryName,
      );

      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error adding retro category: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('remove_retro_category')
  async handleRemoveCategory(client: Socket, payload: { sessionId: string; categoryName: string }) {
    try {
      const updatedSession = await this.retroService.removeCategory(
        payload.sessionId,
        payload.categoryName,
      );

      this.server.to(payload.sessionId).emit('retro_session_updated', updatedSession);
    } catch (error) {
      this.logger.error(`Error removing retro category: ${error.message}`);
      client.emit('error', error.message);
    }
  }
} 