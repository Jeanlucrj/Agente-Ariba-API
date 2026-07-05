import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { KnowledgeEntry } from '../knowledge-base/knowledge-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeEntry])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
