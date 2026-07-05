import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EnvironmentsModule } from './environments/environments.module';
import { ApisModule } from './apis/apis.module';
import { OAuthModule } from './oauth/oauth.module';
import { ExecutorModule } from './executor/executor.module';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { AiModule } from './ai/ai.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { EvidencesModule } from './evidences/evidences.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env.local', '.env.local', '../.env', '.env'], ignoreEnvFile: false }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isDev = cfg.get('NODE_ENV', 'development') !== 'production';

        if (isDev) {
          // Dev local: sql.js (SQLite puro WASM) — locateFile aponta para o .wasm correto
          const path = require('path');
          return {
            type: 'sqljs',
            autoSave: true,
            location: path.join(process.cwd(), 'ariba-dev.db'),
            sqlJsConfig: {
              locateFile: (file: string) =>
                path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
            },
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          } as any;
        }

        // Produção: PostgreSQL via Docker
        return {
          type: 'postgres',
          host: cfg.get('POSTGRES_HOST', 'postgres'),
          port: cfg.get<number>('POSTGRES_PORT', 5432),
          username: cfg.get('POSTGRES_USER', 'ariba'),
          password: cfg.get('POSTGRES_PASSWORD'),
          database: cfg.get('POSTGRES_DB', 'ariba_agent'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: false,
          ssl: { rejectUnauthorized: false },
        };
      },
    }),

    // Dev: cache em memória — Prod: Redis
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService): Promise<any> => {
        const isDev = cfg.get('NODE_ENV', 'development') !== 'production';

        if (isDev) {
          return { ttl: 3600 * 1000 };
        }

        const { redisStore } = await import('cache-manager-redis-yet');
        return {
          store: await redisStore({
            socket: {
              host: cfg.get('REDIS_HOST', 'redis'),
              port: cfg.get<number>('REDIS_PORT', 6379),
            },
            password: cfg.get('REDIS_PASSWORD'),
            ttl: cfg.get<number>('REDIS_TTL', 3600) * 1000,
          }),
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: cfg.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: cfg.get<number>('THROTTLE_LIMIT', 200),
        },
      ],
    }),

    AuthModule,
    UsersModule,
    EnvironmentsModule,
    ApisModule,
    OAuthModule,
    ExecutorModule,
    AnalyzerModule,
    AiModule,
    KnowledgeBaseModule,
    EvidencesModule,
    HealthModule,
  ],
})
export class AppModule {}
