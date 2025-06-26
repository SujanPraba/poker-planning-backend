import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetroSession } from './entities/retro-session.entity';
import { RetroUser } from './entities/retro-user.entity';
import { RetroItem } from './entities/retro-item.entity';
import { v4 as uuidv4 } from 'uuid';
import * as csv from 'csv-stringify';

export interface RetroSessionWithRelations extends RetroSession {
  participants: RetroUser[];
  items: RetroItem[];
}

@Injectable()
export class RetroService {
  private readonly logger = new Logger(RetroService.name);

  constructor(
    @InjectRepository(RetroSession)
    private retroSessionRepository: Repository<RetroSession>,
    @InjectRepository(RetroUser)
    private retroUserRepository: Repository<RetroUser>,
    @InjectRepository(RetroItem)
    private retroItemRepository: Repository<RetroItem>,
  ) {}

  async createSession(name: string, username: string): Promise<RetroSessionWithRelations> {
    const sessionId = uuidv4();
    const userId = uuidv4();

    // Create session with default category
    const session = await this.retroSessionRepository.save({
      sessionId,
      name,
      isVotingPhase: false,
      hasVotesRevealed: false,
      categories: ['went_well'], // Default category
    });

    // Create host user
    await this.retroUserRepository.save({
      id: userId,
      sessionId,
      name: username,
      isHost: true,
      remainingVotes: 3,
    });

    return this.findBySessionId(sessionId);
  }

  async joinSession(sessionId: string, username: string): Promise<{ session: RetroSessionWithRelations; user: RetroUser }> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const userId = uuidv4();
    const user = await this.retroUserRepository.save({
      id: userId,
      sessionId,
      name: username,
      isHost: false,
      remainingVotes: 3,
    });

    return {
      session: await this.findBySessionId(sessionId),
      user,
    };
  }

  async findBySessionId(sessionId: string): Promise<RetroSessionWithRelations> {
    const session = await this.retroSessionRepository.findOne({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const participants = await this.retroUserRepository.find({
      where: { sessionId },
    });

    const items = await this.retroItemRepository.find({
      where: { sessionId },
    });

    return {
      ...session,
      participants,
      items,
    };
  }

  async addItem(
    sessionId: string,
    userId: string,
    content: string,
    category: string
  ): Promise<RetroSessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    const user = await this.retroUserRepository.findOne({
      where: { id: userId, sessionId },
    });

    if (!user) {
      throw new NotFoundException(`User not found in session`);
    }

    // Verify the category exists
    if (!session.categories.includes(category)) {
      throw new Error(`Category ${category} does not exist in this session`);
    }

    await this.retroItemRepository.save({
      id: uuidv4(),
      sessionId,
      content,
      category,
      userId,
      userName: user.name,
      votes: 0,
    });

    return this.findBySessionId(sessionId);
  }

  async voteForItem(sessionId: string, userId: string, itemId: string): Promise<RetroSessionWithRelations> {
    const session = await this.findBySessionId(sessionId);
    const user = await this.retroUserRepository.findOne({
      where: { id: userId, sessionId },
    });

    if (!user) {
      throw new NotFoundException(`User not found in session`);
    }

    if (user.remainingVotes <= 0) {
      throw new Error('No remaining votes');
    }

    const item = await this.retroItemRepository.findOne({
      where: { id: itemId, sessionId },
    });

    if (!item) {
      throw new NotFoundException(`Item not found`);
    }

    await this.retroItemRepository.update(itemId, {
      votes: item.votes + 1,
    });

    await this.retroUserRepository.update(userId, {
      remainingVotes: user.remainingVotes - 1,
    });

    return this.findBySessionId(sessionId);
  }

  async startVoting(sessionId: string): Promise<RetroSessionWithRelations> {
    await this.retroSessionRepository.update(sessionId, {
      isVotingPhase: true,
    });

    return this.findBySessionId(sessionId);
  }

  async revealVotes(sessionId: string): Promise<RetroSessionWithRelations> {
    await this.retroSessionRepository.update(sessionId, {
      hasVotesRevealed: true,
    });

    return this.findBySessionId(sessionId);
  }

  async finishRetro(sessionId: string): Promise<RetroSessionWithRelations> {
    await this.retroSessionRepository.update(sessionId, {
      isVotingPhase: false,
      hasVotesRevealed: false,
    });

    // Reset votes
    await this.retroUserRepository.update(
      { sessionId },
      { remainingVotes: 3 }
    );

    return this.findBySessionId(sessionId);
  }

  async removeParticipant(sessionId: string, userId: string): Promise<RetroSession | null> {
    try {
      // Get the user before deleting
      const user = await this.retroUserRepository.findOne({
        where: { id: userId, sessionId }
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found in session ${sessionId}`);
        return this.findBySessionId(sessionId);
      }

      // Delete the user
      await this.retroUserRepository.delete({ id: userId, sessionId });

      // Get remaining participants
      const remainingParticipants = await this.retroUserRepository.find({ where: { sessionId } });

      // If this was the last participant, delete the session and all its items
      if (remainingParticipants.length === 0) {
        await this.retroItemRepository.delete({ sessionId });
        await this.retroSessionRepository.delete({ sessionId });
        return null;
      }

      // If the leaving user was the host, assign host role to the next participant
      if (user.isHost && remainingParticipants.length > 0) {
        const newHost = remainingParticipants[0];
        await this.retroUserRepository.update({ id: newHost.id }, { isHost: true });
      }

      return this.findBySessionId(sessionId);
    } catch (error) {
      this.logger.error(`Error removing participant: ${error.message}`);
      throw error;
    }
  }

  async addCategory(sessionId: string, categoryName: string): Promise<RetroSessionWithRelations> {
    const session = await this.findBySessionId(sessionId);

    if (session.categories.includes(categoryName)) {
      throw new Error('Category already exists');
    }

    // Add new category
    session.categories.push(categoryName);
    await this.retroSessionRepository.update(sessionId, {
      categories: session.categories,
    });

    return this.findBySessionId(sessionId);
  }

  async removeCategory(sessionId: string, categoryName: string): Promise<RetroSessionWithRelations> {
    const session = await this.findBySessionId(sessionId);

    if (!session.categories.includes(categoryName)) {
      throw new Error('Category does not exist');
    }

    if (session.categories.length === 1) {
      throw new Error('Cannot remove the last category');
    }

    // Remove category and its items
    session.categories = session.categories.filter(c => c !== categoryName);
    await this.retroSessionRepository.update(sessionId, {
      categories: session.categories,
    });

    // Delete all items in this category
    await this.retroItemRepository.delete({
      sessionId,
      category: categoryName,
    });

    return this.findBySessionId(sessionId);
  }

  async exportToCSV(sessionId: string): Promise<string> {
    const session = await this.findBySessionId(sessionId);

    let csvContent = '\ufeff'; // Add BOM for Excel compatibility

    // Project Details Section
    csvContent += 'Project Details\n';
    csvContent += `Project Name,${session.name}\n`;
    csvContent += `Session ID,${session.sessionId}\n`;
    csvContent += `Created At,${session.createdAt.toISOString()}\n\n`;

    // Team Members Section
    csvContent += 'Team Members\n';
    csvContent += 'Name,Role\n';
    session.participants.forEach(participant => {
      csvContent += `${this.escapeCsvField(participant.name)},${participant.isHost ? 'Host' : 'Member'}\n`;
    });
    csvContent += '\n';

    // Items by Category in Columns
    csvContent += 'Retro Items By Category\n';

    // Get maximum number of items in any category
    const itemsByCategory = session.categories.map(category => ({
      category,
      items: session.items.filter(item => item.category === category)
        .map(item => ({
          content: item.content,
          author: item.userName
        }))
    }));

    const maxItems = Math.max(...itemsByCategory.map(cat => cat.items.length));

    // Create headers for each category (two columns per category)
    itemsByCategory.forEach(cat => {
      csvContent += `${cat.category} - Item,${cat.category} - Author,`;
    });
    csvContent += '\n';

    // Add items row by row
    for (let i = 0; i < maxItems; i++) {
      itemsByCategory.forEach(cat => {
        const item = cat.items[i] || { content: '', author: '' };
        csvContent += `${this.escapeCsvField(item.content)},`;
        csvContent += `${this.escapeCsvField(item.author)},`;
      });
      csvContent += '\n';
    }
    csvContent += '\n';

    // Summary Section
    csvContent += 'Summary\n';
    const totalItems = session.items.length;

    csvContent += `Total Items,${totalItems}\n`;
    itemsByCategory.forEach(({ category, items }) => {
      csvContent += `${category} Items,${items.length}\n`;
    });

    return csvContent;
  }

  // Helper function to escape CSV fields
  private escapeCsvField(field: string): string {
    if (!field) return '';
    const escaped = field.replace(/"/g, '""');
    return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
  }
}