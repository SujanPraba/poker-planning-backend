import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Session {
  @PrimaryColumn()
  sessionId: string;

  @Column()
  name: string;

  @Column()
  votingSystem: string;

  @Column({ nullable: true })
  currentStoryId: string;

  @Column({ default: false })
  isVotingComplete: boolean;

  @Column({ default: false })
  hasVotesRevealed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}