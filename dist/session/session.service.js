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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const session_entity_1 = require("./entities/session.entity");
const story_entity_1 = require("./entities/story.entity");
const user_entity_1 = require("./entities/user.entity");
let SessionService = SessionService_1 = class SessionService {
    constructor(sessionRepository, userRepository, storyRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.storyRepository = storyRepository;
        this.logger = new common_1.Logger(SessionService_1.name);
        this.logger.log('SessionService initialized');
    }
    async create(createSessionDto) {
        this.logger.log(`Creating session: ${JSON.stringify(createSessionDto)}`);
        const { name, votingSystem, username } = createSessionDto;
        const sessionId = this.generateSessionId();
        const userId = (0, uuid_1.v4)();
        const session = await this.sessionRepository.save({
            id: sessionId,
            name,
            votingSystem,
            participants: [],
        });
        const user = await this.userRepository.save({
            id: userId,
            name: username,
            isHost: true,
            hasVoted: false,
            sessionId: session.id,
        });
        return this.findBySessionId(session.id);
    }
    async join(joinSessionDto) {
        const { sessionId, username } = joinSessionDto;
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        const userId = (0, uuid_1.v4)();
        const user = await this.userRepository.save({
            id: userId,
            name: username,
            isHost: false,
            hasVoted: false,
            sessionId: session.id,
        });
        return { session, user };
    }
    async findBySessionId(sessionId) {
        this.logger.log(`Finding session by ID: ${sessionId}`);
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
        if (!session)
            return null;
        const [stories, participants] = await Promise.all([
            this.storyRepository.find({ where: { sessionId } }),
            this.userRepository.find({ where: { sessionId } })
        ]);
        return { ...session, stories, participants };
    }
    async addStory(sessionId, title, description) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        await this.storyRepository.save({
            id: (0, uuid_1.v4)(),
            title,
            description,
            votes: {},
            finalEstimate: null,
            sessionId: session.id,
        });
        return this.findBySessionId(sessionId);
    }
    async startVoting(sessionId, storyId) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        await this.sessionRepository.update(sessionId, {
            currentStoryId: storyId,
            hasVotesRevealed: false,
            isVotingComplete: false,
        });
        await this.userRepository.update({ sessionId }, { hasVoted: false });
        return this.findBySessionId(sessionId);
    }
    async submitVote(sessionId, storyId, userId, vote) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        const story = session.stories.find(s => s.id === storyId);
        if (!story) {
            throw new common_1.NotFoundException(`Story with ID ${storyId} not found`);
        }
        story.votes[userId] = vote;
        await this.storyRepository.save(story);
        await this.userRepository.update({ id: userId }, { hasVoted: true });
        const allVoted = session.participants.every(p => p.hasVoted);
        if (allVoted) {
            await this.sessionRepository.update(sessionId, { isVotingComplete: true });
        }
        return this.findBySessionId(sessionId);
    }
    async revealVotes(sessionId) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        await this.sessionRepository.update(sessionId, { hasVotesRevealed: true });
        return this.findBySessionId(sessionId);
    }
    async finishVoting(sessionId, storyId, finalEstimate) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        await this.storyRepository.update({ sessionId, id: storyId }, { finalEstimate });
        return this.findBySessionId(sessionId);
    }
    async nextStory(sessionId) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        await this.sessionRepository.update(sessionId, {
            currentStoryId: null,
            hasVotesRevealed: false,
            isVotingComplete: false,
        });
        await this.userRepository.update({ sessionId }, { hasVoted: false });
        return this.findBySessionId(sessionId);
    }
    generateSessionId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    async generateSessionExport(sessionId) {
        const session = await this.findBySessionId(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${sessionId} not found`);
        }
        const completedStories = session.stories.filter(story => story.finalEstimate);
        const numericEstimates = completedStories
            .map(story => parseFloat(story.finalEstimate))
            .filter(estimate => !isNaN(estimate));
        const averageEstimate = numericEstimates.length > 0
            ? numericEstimates.reduce((a, b) => a + b, 0) / numericEstimates.length
            : 0;
        const processedStories = session.stories.map(story => {
            const votes = Object.values(story.votes || {});
            const numericVotes = votes
                .map(v => parseFloat(v))
                .filter(v => !isNaN(v));
            const averageVote = numericVotes.length > 0
                ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
                : undefined;
            const voteFrequency = votes.reduce((acc, vote) => {
                acc[vote] = (acc[vote] || 0) + 1;
                return acc;
            }, {});
            const mostFrequentVote = Object.entries(voteFrequency)
                .sort(([, a], [, b]) => b - a)[0]?.[0];
            return {
                id: story.id,
                title: story.title,
                description: story.description,
                finalEstimate: story.finalEstimate,
                votes: story.votes,
                averageVote,
                mostFrequentVote,
            };
        });
        const participantStats = session.participants.map(participant => {
            const storiesVoted = session.stories.filter(story => story.votes && story.votes[participant.id]).length;
            return {
                id: participant.id,
                name: participant.name,
                isHost: participant.isHost,
                participationRate: session.stories.length > 0
                    ? (storiesVoted / session.stories.length) * 100
                    : 0,
            };
        });
        return {
            sessionId: session.id,
            name: session.name,
            votingSystem: session.votingSystem,
            stories: processedStories,
            participants: participantStats,
            summary: {
                totalStories: session.stories.length,
                completedStories: completedStories.length,
                averageEstimate,
                startTime: session.createdAt,
                endTime: new Date(),
            },
        };
    }
    async removeParticipant(sessionId, userId) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId, sessionId: sessionId }
            });
            if (!user) {
                this.logger.warn(`User ${userId} not found in session ${sessionId}`);
                return this.findBySessionId(sessionId);
            }
            await this.userRepository.delete({ id: userId, sessionId: sessionId });
            const remainingParticipants = await this.userRepository.find({ where: { sessionId } });
            if (remainingParticipants.length === 0) {
                await this.storyRepository.delete({ sessionId });
                await this.sessionRepository.delete({ id: sessionId });
                return null;
            }
            if (user.isHost && remainingParticipants.length > 0) {
                const newHost = remainingParticipants[0];
                await this.userRepository.update({ id: newHost.id }, { isHost: true });
            }
            return this.findBySessionId(sessionId);
        }
        catch (error) {
            this.logger.error(`Error removing participant: ${error.message}`);
            throw error;
        }
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(story_entity_1.Story)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SessionService);
//# sourceMappingURL=session.service.js.map