import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  sessionId: string;

  @Column()
  name: string;

  @Column({ default: false })
  isHost: boolean;

  @Column({ default: false })
  hasVoted: boolean;
}