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

  // Armazenado como JSON (simple-json): compatível com SQLite (dev) e PostgreSQL (prod).
  // O tipo antigo `text array` só funciona no Postgres e perdia os dados no SQLite.
  @Column({ type: 'simple-json' })
  possibleCauses: string[];

  @Column({ type: 'simple-json' })
  investigationSteps: string[];

  @Column({ type: 'simple-json' })
  solutions: string[];

  @Column({ type: 'simple-json', nullable: true })
  relatedErrors: string[];

  @Column({ type: 'simple-json', nullable: true })
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
