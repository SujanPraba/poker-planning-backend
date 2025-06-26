import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RetroItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  content: string;

  @Column()
  category: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column({ default: 0 })
  votes: number;
} 