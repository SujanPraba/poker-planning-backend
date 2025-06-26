import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class RetroSession {
  @PrimaryColumn()
  sessionId: string;

  @Column()
  name: string;

  @Column({ default: false })
  isVotingPhase: boolean;

  @Column({ default: false })
  hasVotesRevealed: boolean;

  @Column('simple-array', { default: 'went_well' })
  categories: string[];

  @CreateDateColumn()
  createdAt: Date;
} 