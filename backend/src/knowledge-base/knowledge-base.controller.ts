import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeEntry, ErrorCategory } from './knowledge-entry.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('knowledge-base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'knowledge-base', version: '1' })
export class KnowledgeBaseController {
  constructor(private service: KnowledgeBaseService) {}

  @Get()
  @ApiOperation({ summary: 'Listar base de conhecimento' })
  findAll(@Query('category') category?: ErrorCategory, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.findAll(category, +page, +limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Pesquisar na base de conhecimento' })
  search(@Query('q') q: string, @Query('category') category?: ErrorCategory) {
    return this.service.search(q, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar entrada por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Adicionar entrada à base de conhecimento' })
  create(@Body() dto: Partial<KnowledgeEntry>) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar entrada' })
  update(@Param('id') id: string, @Body() dto: Partial<KnowledgeEntry>) {
    return this.service.update(id, dto);
  }
}
