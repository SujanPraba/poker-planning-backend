import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class RetroUser {
  @PrimaryColumn()
  id: string;

  @Column()
  sessionId: string;

  @Column()
  name: string;

  @Column({ default: false })
  isHost: boolean;

  @Column({ default: 3 })
  remainingVotes: number;
} 