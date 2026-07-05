import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EnvironmentType {
  DEV = 'DEV',
  QAS = 'QAS',
  PRD = 'PRD',
  SANDBOX = 'SANDBOX',
  CUSTOM = 'CUSTOM',
}

@Entity('environments')
export class Environment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', default: EnvironmentType.DEV })
  type: EnvironmentType;

  @Column({ nullable: true })
  description: string;

  @Column({ length: 500 })
  baseUrl: string;

  @Column({ length: 500, nullable: true })
  oauthUrl: string;

  @Column({ length: 100, nullable: true })
  realm: string;

  @Column({ nullable: true })
  appKey: string;

  @Column({ nullable: true, select: false })
  clientId: string;

  @Column({ nullable: true, select: false })
  clientSecret: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  sslVerify: boolean;

  @Column({ type: 'simple-json', nullable: true })
  defaultHeaders: Record<string, string>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
