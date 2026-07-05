import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum OAuthGrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
}

@Entity('oauth_profiles')
export class OAuthProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 1000 })
  tokenUrl: string;

  @Column({ type: 'varchar', default: OAuthGrantType.CLIENT_CREDENTIALS })
  grantType: OAuthGrantType;

  @Column()
  clientId: string;

  @Column({ select: false })
  clientSecret: string;

  @Column({ nullable: true })
  scope: string;

  @Column({ nullable: true })
  realm: string;

  @Column({ nullable: true })
  appKey: string;

  @Column({ type: 'simple-json', nullable: true })
  additionalParams: Record<string, string>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  environmentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
