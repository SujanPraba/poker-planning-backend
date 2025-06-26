import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Session } from './session.entity';

@Entity()
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  status: string;

  @Column('json')
  votes: Record<string, string>;

  @Column({ nullable: true })
  finalEstimate: string;

  @ManyToOne(() => Session, session => session.stories)
  session: Session;

  @Column()
  sessionId: string;
}
