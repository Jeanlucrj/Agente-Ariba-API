import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('environments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'environments', version: '1' })
export class EnvironmentsController {
  constructor(private service: EnvironmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar ambiente' })
  create(@Body() dto: CreateEnvironmentDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ambientes' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ambiente por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar ambiente' })
  update(@Param('id') id: string, @Body() dto: UpdateEnvironmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar ambiente' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
