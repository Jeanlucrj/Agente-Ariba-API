import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiCatalog } from './api-catalog.entity';
import { ApisController } from './apis.controller';
import { ApisService } from './apis.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiCatalog])],
  controllers: [ApisController],
  providers: [ApisService],
  exports: [ApisService],
})
export class ApisModule {}
