import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum AribaModule {
  SOURCING = 'Sourcing',
  CONTRACTS = 'Contracts',
  BUYING = 'Buying',
  SUPPLIER = 'Supplier Management',
  COMMERCE_AUTOMATION = 'Commerce Automation',
  BUSINESS_NETWORK = 'Business Network',
  ANALYTICS = 'Analytics',
  CATALOG = 'Catalog',
  CUSTOM = 'Custom',
}

@Entity('api_catalog')
export class ApiCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: AribaModule.CUSTOM })
  module: AribaModule;

  @Column({ length: 1000 })
  endpoint: string;

  @Column({ type: 'varchar', default: HttpMethod.GET })
  method: HttpMethod;

  @Column({ type: 'simple-json', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'simple-json', nullable: true })
  queryParams: Record<string, string>;

  @Column({ type: 'text', nullable: true })
  payloadTemplate: string;

  @Column({ type: 'text', nullable: true })
  responseTemplate: string;

  @Column({ default: true })
  requiresOAuth: boolean;

  @Column({ nullable: true })
  oauthProfileId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  documentation: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
