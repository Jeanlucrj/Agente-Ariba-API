import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApisService } from './apis.service';
import { CreateApiDto } from './dto/create-api.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { AribaModule, HttpMethod } from './api-catalog.entity';

@ApiTags('apis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'apis', version: '1' })
export class ApisController {
  constructor(private service: ApisService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar API SAP Ariba' })
  create(@Body() dto: CreateApiDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar APIs do catálogo' })
  findAll(
    @Query('module') module?: AribaModule,
    @Query('method') method?: HttpMethod,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ module, method, search }, +page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do catálogo de APIs' })
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar API por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar API' })
  update(@Param('id') id: string, @Body() dto: CreateApiDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar API' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
