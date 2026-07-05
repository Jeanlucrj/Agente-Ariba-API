import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ExecutionStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  AUTH_FAILED = 'auth_failed',
}

@Entity('execution_history')
export class ExecutionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  apiCatalogId: string;

  @Column({ nullable: true })
  apiName: string;

  @Column({ nullable: true })
  environmentId: string;

  @Column({ nullable: true })
  environmentName: string;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 2000 })
  url: string;

  @Column({ type: 'simple-json', nullable: true })
  requestHeaders: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  requestBody: string;

  @Column({ type: 'simple-json', nullable: true })
  responseHeaders: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  responseBody: string;

  @Column({ nullable: true })
  statusCode: number;

  @Column({ type: 'varchar' })
  status: ExecutionStatus;

  @Column({ nullable: true })
  durationMs: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'simple-json', nullable: true })
  aiDiagnosis: {
    diagnosis: string;
    possibleCause: string;
    suggestedFix: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };

  @Column({ type: 'uuid', nullable: true })
  correlationId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'executed_by' })
  executedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
