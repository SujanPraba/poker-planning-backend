"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const session_service_1 = require("../session/session.service");
let SocketGateway = class SocketGateway {
    constructor(sessionService) {
        this.sessionService = sessionService;
        this.logger = new common_1.Logger('SocketGateway');
        this.timers = {};
    }
    afterInit(server) {
        this.logger.log('Socket Gateway Initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleCreateSession(client, payload) {
        try {
            const session = await this.sessionService.create({
                name: payload.name,
                votingSystem: payload.votingSystem,
                username: payload.username,
            });
            client.join(session.id);
            client.emit('session_created', session);
        }
        catch (error) {
            this.logger.error(`Error creating session: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleJoinSession(client, payload) {
        try {
            const { session, user } = await this.sessionService.join({
                sessionId: payload.sessionId,
                username: payload.username,
            });
            client.join(session.id);
            this.server.to(session.id).emit('session_updated', session);
            client.emit('session_joined', { session, user });
        }
        catch (error) {
            this.logger.error(`Error joining session: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleAddStory(client, payload) {
        try {
            const updatedSession = await this.sessionService.addStory(payload.sessionId, payload.title, payload.description);
            this.server.to(payload.sessionId).emit('session_updated', updatedSession);
        }
        catch (error) {
            this.logger.error(`Error adding story: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleStartVoting(client, payload) {
        try {
            const updatedSession = await this.sessionService.startVoting(payload.sessionId, payload.storyId);
            this.server.to(payload.sessionId).emit('session_updated', updatedSession);
        }
        catch (error) {
            this.logger.error(`Error starting voting: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleSubmitVote(client, payload) {
        try {
            const updatedSession = await this.sessionService.submitVote(payload.sessionId, payload.storyId, payload.userId, payload.vote);
            const allVoted = updatedSession.participants.every(p => p.hasVoted);
            if (allVoted) {
                const sessionWithRevealedVotes = await this.sessionService.revealVotes(payload.sessionId);
                this.server.to(payload.sessionId).emit('session_updated', sessionWithRevealedVotes);
            }
            else {
                this.server.to(payload.sessionId).emit('session_updated', updatedSession);
            }
        }
        catch (error) {
            this.logger.error(`Error submitting vote: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleRevealVotes(client, payload) {
        try {
            const updatedSession = await this.sessionService.revealVotes(payload.sessionId);
            this.server.to(payload.sessionId).emit('session_updated', updatedSession);
        }
        catch (error) {
            this.logger.error(`Error revealing votes: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleFinishVoting(client, payload) {
        try {
            const updatedSession = await this.sessionService.finishVoting(payload.sessionId, payload.storyId, payload.finalEstimate);
            this.server.to(payload.sessionId).emit('session_updated', updatedSession);
        }
        catch (error) {
            this.logger.error(`Error finishing voting: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleNextStory(client, payload) {
        try {
            const updatedSession = await this.sessionService.nextStory(payload.sessionId);
            this.server.to(payload.sessionId).emit('session_updated', updatedSession);
        }
        catch (error) {
            this.logger.error(`Error moving to next story: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleStartTimer(client, payload) {
        try {
            if (this.timers[payload.sessionId]) {
                clearInterval(this.timers[payload.sessionId]);
            }
            let timeLeft = payload.seconds;
            this.server.to(payload.sessionId).emit('timer_update', timeLeft);
            this.timers[payload.sessionId] = setInterval(async () => {
                timeLeft--;
                this.server.to(payload.sessionId).emit('timer_update', timeLeft);
                if (timeLeft <= 0) {
                    clearInterval(this.timers[payload.sessionId]);
                    delete this.timers[payload.sessionId];
                    try {
                        const sessionWithRevealedVotes = await this.sessionService.revealVotes(payload.sessionId);
                        this.server.to(payload.sessionId).emit('session_updated', sessionWithRevealedVotes);
                    }
                    catch (error) {
                        this.logger.error(`Error revealing votes after timer: ${error.message}`);
                    }
                }
            }, 1000);
        }
        catch (error) {
            this.logger.error(`Error starting timer: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleRejoinSession(client, payload) {
        try {
            const session = await this.sessionService.findBySessionId(payload.sessionId);
            if (!session) {
                throw new Error(`Session with ID ${payload.sessionId} not found`);
            }
            client.join(session.id);
            const user = session.participants.find(p => p.id === payload.userId);
            if (!user) {
                throw new Error(`User not found in session`);
            }
            this.server.to(session.id).emit('session_updated', session);
            client.emit('session_joined', { session, user });
        }
        catch (error) {
            this.logger.error(`Error rejoining session: ${error.message}`);
            client.emit('error', error.message);
        }
    }
    async handleLeaveSession(client, payload) {
        try {
            const updatedSession = await this.sessionService.removeParticipant(payload.sessionId, payload.userId);
            client.leave(payload.sessionId);
            if (updatedSession) {
                this.server.to(payload.sessionId).emit('session_updated', updatedSession);
            }
            client.emit('session_left');
        }
        catch (error) {
            this.logger.error(`Error leaving session: ${error.message}`);
            client.emit('error', error.message);
        }
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('create_session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleCreateSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('add_story'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleAddStory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('start_voting'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleStartVoting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('submit_vote'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleSubmitVote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reveal_votes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleRevealVotes", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('finish_voting'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleFinishVoting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('next_story'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleNextStory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('start_timer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleStartTimer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('rejoin_session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleRejoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLeaveSession", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map