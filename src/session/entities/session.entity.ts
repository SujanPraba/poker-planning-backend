import { Entity, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Story } from './story.entity';

@Entity()
export class Session {
  @Column({ primary: true })
  id: string;

  @Column()
  name: string;

  @Column()
  votingSystem: string;

  @Column('json', { default: [] })
  participants: any[];

  @Column({ nullable: true })
  currentStoryId: string;

  @Column('boolean', { default: false })
  hasVotesRevealed: boolean;

  @Column('boolean', { default: false })
  isVotingComplete: boolean;

  @OneToMany(() => Story, story => story.session)
  stories: Story[];

  @CreateDateColumn()
  createdAt: Date;
}