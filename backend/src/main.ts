import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('BACKEND_PORT', 3001);

  app.use(helmet());

  // Em Docker, o frontend acessa o backend via rewrite interno do Next.js
  // (Next.js server → backend container), não diretamente do browser.
  // CORS permissivo para o container frontend e dev local.
  const allowedOrigins = [
    'http://ariba_frontend:3000',
    'http://frontend:3000',
    configService.get<string>('FRONTEND_URL', ''),
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permite: sem origin (server-to-server / Next.js rewrite), ou origens listadas
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissivo — restrinja em produção via firewall/proxy
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Agente Ariba Enterprise AI')
    .setDescription('API completa para testes, diagnóstico e monitoramento SAP Ariba')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('users', 'Gerenciamento de usuários')
    .addTag('environments', 'Ambientes (DEV/QAS/PRD)')
    .addTag('apis', 'Catálogo de APIs SAP Ariba')
    .addTag('oauth', 'Gerenciamento OAuth SAP Ariba')
    .addTag('executor', 'Executor de APIs')
    .addTag('analyzer', 'Análise de XML/JSON/CIG/SAP')
    .addTag('ai', 'IA e Troubleshooting')
    .addTag('knowledge-base', 'Base de Conhecimento')
    .addTag('monitoring', 'Monitoramento')
    .addTag('evidences', 'Centro de Evidências')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  console.log(`\n🚀 Agente Ariba Enterprise AI running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs\n`);
}

bootstrap();

// triggered reload
