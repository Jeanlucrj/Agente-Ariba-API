import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AxiosRequestConfig } from 'axios';
import { ExecutionHistory, ExecutionStatus } from './execution-history.entity';
import { ExecuteApiDto } from './dto/execute-api.dto';
import { OAuthService } from '../oauth/oauth.service';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);

  constructor(
    @InjectRepository(ExecutionHistory) private historyRepo: Repository<ExecutionHistory>,
    private httpService: HttpService,
    private oauthService: OAuthService,
  ) {}

  async execute(dto: ExecuteApiDto, userId: string) {
    const correlationId = uuidv4();
    const start = Date.now();

    const headers: Record<string, string> = { ...dto.headers };

    if (dto.oauthProfileId) {
      try {
        const tokenData = await this.oauthService.getToken(dto.oauthProfileId);
        headers['Authorization'] = `Bearer ${tokenData.token}`;
      } catch (err) {
        return this.saveHistory({
          correlationId,
          userId,
          dto,
          status: ExecutionStatus.AUTH_FAILED,
          statusCode: 401,
          errorMessage: err.message,
          durationMs: Date.now() - start,
        });
      }
    }

    const config: AxiosRequestConfig = {
      method: dto.method as any,
      url: dto.url,
      headers,
      params: dto.queryParams,
      data: dto.body,
      timeout: dto.timeoutMs || 30000,
      validateStatus: () => true,
    };

    try {
      const response = await firstValueFrom(this.httpService.request(config));
      const durationMs = Date.now() - start;

      const status =
        response.status >= 200 && response.status < 300
          ? ExecutionStatus.SUCCESS
          : ExecutionStatus.ERROR;

      this.logger.log(
        `[${correlationId}] ${dto.method} ${dto.url} → ${response.status} (${durationMs}ms)`,
      );

      const history = await this.saveHistory({
        correlationId,
        userId,
        dto,
        status,
        statusCode: response.status,
        responseBody: typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2),
        responseHeaders: response.headers as Record<string, string>,
        durationMs,
      });

      return {
        executionId: history.id,
        correlationId,
        request: {
          method: dto.method,
          url: dto.url,
          headers: this.maskSensitiveHeaders(headers),
          body: dto.body,
        },
        response: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: response.headers,
          body: response.data,
        },
        durationMs,
        status,
      };
    } catch (err) {
      const durationMs = Date.now() - start;
      const isTimeout = err.code === 'ECONNABORTED';

      await this.saveHistory({
        correlationId,
        userId,
        dto,
        status: isTimeout ? ExecutionStatus.TIMEOUT : ExecutionStatus.ERROR,
        statusCode: 0,
        errorMessage: err.message,
        durationMs,
      });

      throw err;
    }
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.historyRepo.findAndCount({
      where: { executedBy: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats() {
    const total = await this.historyRepo.count();
    const success = await this.historyRepo.count({ where: { status: ExecutionStatus.SUCCESS } });
    const error = await this.historyRepo.count({ where: { status: ExecutionStatus.ERROR } });

    const avgResult = await this.historyRepo
      .createQueryBuilder('h')
      .select('AVG(h.durationMs)', 'avg')
      .getRawOne();

    return {
      total,
      success,
      error,
      successRate: total ? Math.round((success / total) * 100) : 0,
      avgDurationMs: Math.round(parseFloat(avgResult?.avg || '0')),
    };
  }

  private async saveHistory(params: {
    correlationId: string;
    userId: string;
    dto: ExecuteApiDto;
    status: ExecutionStatus;
    statusCode: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    errorMessage?: string;
    durationMs: number;
  }) {
    const history = this.historyRepo.create({
      correlationId: params.correlationId,
      executedBy: { id: params.userId } as any,
      apiCatalogId: params.dto.apiCatalogId,
      apiName: params.dto.apiName,
      environmentId: params.dto.environmentId,
      method: params.dto.method,
      url: params.dto.url,
      requestHeaders: params.dto.headers,
      requestBody: params.dto.body,
      responseBody: params.responseBody,
      responseHeaders: params.responseHeaders,
      statusCode: params.statusCode,
      status: params.status,
      durationMs: params.durationMs,
      errorMessage: params.errorMessage,
    });

    return this.historyRepo.save(history);
  }

  private maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitive = ['authorization', 'x-api-key', 'apikey'];
    return Object.fromEntries(
      Object.entries(headers).map(([k, v]) =>
        sensitive.includes(k.toLowerCase()) ? [k, '***MASKED***'] : [k, v],
      ),
    );
  }
}
