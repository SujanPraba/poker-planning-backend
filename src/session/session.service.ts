import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';
import { Session } from './entities/session.entity';
import { Story } from './entities/story.entity';
import { User } from './entities/user.entity';
import { SessionExport, SessionWithRelations } from './types';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
  ) {
    this.logger.log('SessionService initialized');
  }

  async create(createSessionDto: CreateSessionDto): Promise<SessionWithRelations> {
    this.logger.log(`Creating session: ${JSON.stringify(createSessionDto)}`);
    const { name, votingSystem, username } = createSessionDto;
    const sessionId = this.generateSessionId();
    const userId = uuidv4();

    const session = await this.sessionRepository.save({
      sessionId,
      name,
      votingSystem,
    });

    const user = await this.userRepository.save({
      id: userId,
      name: username,
      isHost: true,
      hasVoted: false,
      sessionId: session.sessionId,
    });

    return this.findBySessionId(session.sessionId);
  }

  async join(joinSessionDto: JoinSessionDto): Promise<{ session: SessionWithRelations; user: User }> {
    const { sessionId, username } = joinSessionDto;
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const userId = uuidv4();
    const user = await this.userRepository.save({
      id: userId,
      name: username,
      isHost: false,
      hasVoted: false,
      sessionId: session.sessionId,
    });

    return { session, user };
  }

  async findBySessionId(sessionId: string): Promise<SessionWithRelations | null> {
    this.logger.log(`Finding session by ID: ${sessionId}`);
    const session = await this.sessionRepository.findOne({ where: { sessionId } });
    if (!session) return null;

    const [stories, participants] = await Promise.all([
      this.storyRepository.find({ where: { sessionId } }),
      this.userRepository.find({ where: { sessionId } })
    ]);

    return { ...session, stories, participants };
  }

  async addStory(sessionId: string, title: string, description?: string): Promise<SessionWithRelations> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.storyRepository.save({
      id: uuidv4(),
      title,
      description,
      votes: {},
      finalEstimate: null,
      sessionId: session.sessionId,
    });

    return this.findBySessionId(sessionId);
  }

  async startVoting(sessionId: string, storyId: string): Promise<SessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.sessionRepository.update(sessionId, {
      currentStoryId: storyId,
      hasVotesRevealed: false,
      isVotingComplete: false,
    });

    await this.userRepository.update(
      { sessionId },
      { hasVoted: false }
    );

    return this.findBySessionId(sessionId);
  }

  async submitVote(sessionId: string, storyId: string, userId: string, vote: string): Promise<SessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const story = session.stories.find(s => s.id === storyId);
    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
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

  async revealVotes(sessionId: string): Promise<SessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.sessionRepository.update(sessionId, { hasVotesRevealed: true });
    return this.findBySessionId(sessionId);
  }

  async finishVoting(sessionId: string, storyId: string, finalEstimate: string): Promise<SessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.storyRepository.update(
      { sessionId, id: storyId },
      { finalEstimate }
    );

    return this.findBySessionId(sessionId);
  }

  async nextStory(sessionId: string): Promise<SessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.sessionRepository.update(sessionId, {
      currentStoryId: null,
      hasVotesRevealed: false,
      isVotingComplete: false,
    });

    await this.userRepository.update(
      { sessionId },
      { hasVoted: false }
    );

    return this.findBySessionId(sessionId);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async generateSessionExport(sessionId: string): Promise<SessionExport> {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
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
      }, {} as Record<string, number>);

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
      const storiesVoted = session.stories.filter(story =>
        story.votes && story.votes[participant.id]
      ).length;

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
      sessionId: session.sessionId,
      name: session.name,
      votingSystem: session.votingSystem as 'fibonacci' | 't-shirt',
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
}
