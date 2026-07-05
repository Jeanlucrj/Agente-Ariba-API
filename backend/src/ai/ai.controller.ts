import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { DiagnoseDto } from './dto/diagnose.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('diagnose')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Diagnóstico IA de erro SAP Ariba/CIG/OAuth' })
  diagnose(@Body() dto: DiagnoseDto) {
    return this.aiService.diagnose(dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat com Assistente SAP Ariba' })
  chat(@Body() body: { messages: ChatMessageDto[]; history?: any[] }) {
    return this.aiService.chat(body.messages, body.history);
  }

  @Post('analyze-xml')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Análise IA de XML cXML/Ariba' })
  analyzeXml(@Body() body: { xml: string }) {
    return this.aiService.analyzeXml(body.xml);
  }
}
