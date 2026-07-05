import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyzerService } from './analyzer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analyzer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analyzer', version: '1' })
export class AnalyzerController {
  constructor(private service: AnalyzerService) {}

  @Post('xml')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analisar payload XML cXML/Ariba' })
  analyzeXml(@Body() body: { xml: string; useAi?: boolean }) {
    return this.service.analyzeXml(body.xml, body.useAi !== false);
  }

  @Post('json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analisar payload JSON SAP Ariba' })
  analyzeJson(@Body() body: { json: string }) {
    return this.service.analyzeJson(body.json);
  }

  @Post('cig')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Comparar payloads no fluxo CIG (Ariba → CIG → SAP)' })
  compareCig(
    @Body() body: {
      aribaPayload: string;
      transformedPayload: string;
      sapPayload: string;
    },
  ) {
    return this.service.compareCigPayloads(
      body.aribaPayload,
      body.transformedPayload,
      body.sapPayload,
    );
  }
}
