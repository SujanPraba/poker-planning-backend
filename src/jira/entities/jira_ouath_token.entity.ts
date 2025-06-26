// src/jira/entities/jira-oauth-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('')
export class JiraOAuthToken {
  @Column({ primary: true })
  id: string;

  @Column()
  accessToken: string;

  @Column()
  refreshToken: string;

  @Column()
  expiresIn: number;

  @Column()
  cloudId: string; // Jira instance

  @Column({ nullable: true })
  userId: string; // If you want to associate with your app's user

  @Column()
  state: string;

  @Column()
  rawResponse: string; // Store the full JSON response for debugging

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}