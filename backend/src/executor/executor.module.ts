import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ExecutionHistory } from './execution-history.entity';
import { ExecutorController } from './executor.controller';
import { ExecutorService } from './executor.service';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExecutionHistory]),
    HttpModule.register({ timeout: 60000 }),
    OAuthModule,
  ],
  controllers: [ExecutorController],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
