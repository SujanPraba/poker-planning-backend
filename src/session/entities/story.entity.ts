import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Story {
  @PrimaryColumn()
  id: string;

  @Column()
  sessionId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  votes: Record<string, string>;

  @Column({ nullable: true })
  finalEstimate: string;
}