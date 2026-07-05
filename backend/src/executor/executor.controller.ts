import {
  Controller, Post, Get, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExecutorService } from './executor.service';
import { ExecuteApiDto } from './dto/execute-api.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('executor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'executor', version: '1' })
export class ExecutorController {
  constructor(private executorService: ExecutorService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar chamada de API SAP Ariba' })
  execute(@Body() dto: ExecuteApiDto, @CurrentUser() user: User) {
    return this.executorService.execute(dto, user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Histórico de execuções' })
  getHistory(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.executorService.getHistory(user.id, +page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de execuções' })
  getStats() {
    return this.executorService.getStats();
  }
}
