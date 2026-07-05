import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum ErrorCategory {
  OAUTH = 'OAuth',
  CIG = 'CIG',
  ARIBA = 'SAP Ariba',
  BUSINESS_NETWORK = 'Business Network',
  ECC = 'SAP ECC',
  S4HANA = 'SAP S/4HANA',
  XML = 'XML',
  JSON = 'JSON',
  HTTP = 'HTTP',
  IDOC = 'IDoc',
  MAPPING = 'Mapping',
}

@Entity('knowledge_entries')
export class KnowledgeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'varchar' })
  category: ErrorCategory;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true })
  possibleCauses: string[];

  @Column({ type: 'text', array: true })
  investigationSteps: string[];

  @Column({ type: 'text', array: true })
  solutions: string[];

  @Column({ type: 'text', array: true, nullable: true })
  relatedErrors: string[];

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
