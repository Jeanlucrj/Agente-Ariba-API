import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { KnowledgeEntry } from '../knowledge-base/knowledge-entry.entity';
import { DiagnoseDto } from './dto/diagnose.dto';
import { ChatMessageDto } from './dto/chat-message.dto';

const SYSTEM_PROMPT = `Você é um especialista sênior em SAP Ariba, SAP Business Network, SAP CIG (Cloud Integration Gateway), SAP ECC, SAP S/4HANA, Commerce Automation e integrações B2B.

Suas especialidades incluem:
- APIs REST do SAP Ariba (Sourcing, Contracts, Buying, Supplier Management, Commerce Automation)
- OAuth 2.0 para SAP Ariba
- Análise de payloads XML cXML e JSON
- SAP CIG: mapeamentos, transformações XSL, namespaces, XPath
- IDocs SAP: WE02, WE05, BD87, SLG1, SM58, SMQ1, SMQ2
- Erros HTTP (401, 403, 404, 409, 422, 500) no contexto SAP Ariba
- Troubleshooting de integrações B2B

Sempre responda em português brasileiro.
Seja objetivo, técnico e prático.
Quando identificar um problema, forneça:
1. Diagnóstico claro
2. Causa raiz provável
3. Passos de investigação
4. Solução sugerida
5. Nível de confiança (0-100%)`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(KnowledgeEntry) private kbRepo: Repository<KnowledgeEntry>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your-gemini-api-key-here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.modelName = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
    }
  }

  private get isConfigured(): boolean {
    return !!this.genAI;
  }

  private getModel(jsonMode = false): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: jsonMode
        ? { responseMimeType: 'application/json', temperature: 0.1 }
        : { temperature: 0.3 },
    });
  }

  async diagnose(dto: DiagnoseDto) {
    const kbContext = await this.searchKnowledgeBase(dto.errorMessage || dto.payload || '');
    const prompt = this.buildDiagnosePrompt(dto, kbContext);

    if (!this.isConfigured) {
      return this.buildFallbackDiagnosis(dto, kbContext);
    }

    try {
      const model = this.getModel(true);
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      this.logger.error(`Gemini diagnose error: ${err.message}`);
      return this.buildFallbackDiagnosis(dto, kbContext);
    }
  }

  async chat(messages: ChatMessageDto[], sessionHistory: Array<{ role: string; content: string }> = []) {
    if (!this.isConfigured) {
      return {
        message: 'IA não configurada. Adicione GEMINI_API_KEY no arquivo .env para habilitar o assistente.',
        type: 'info',
      };
    }

    const lastMessage = messages[messages.length - 1];
    const kbContext = await this.searchKnowledgeBase(lastMessage.content);

    const systemWithKb = kbContext.length > 0
      ? `${SYSTEM_PROMPT}\n\nBase de Conhecimento Relevante:\n${kbContext.map((e) => `- ${e.title}: ${e.description}`).join('\n')}`
      : SYSTEM_PROMPT;

    // Map history — Gemini uses 'model' instead of 'assistant'
    const history = sessionHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // O Gemini exige que o histórico comece com uma mensagem 'user'.
    // O frontend inicia a conversa com uma saudação do assistente ('model'),
    // então removemos quaisquer mensagens iniciais que não sejam do usuário.
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemWithKb,
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);

      return {
        message: result.response.text(),
        tokensUsed: result.response.usageMetadata?.totalTokenCount,
      };
    } catch (err) {
      this.logger.error(`Gemini chat error: ${err.message}`);
      throw err;
    }
  }

  async analyzeXml(xmlContent: string) {
    if (!this.isConfigured) {
      return { error: 'IA não configurada' };
    }

    const prompt = `Analise este XML SAP Ariba/cXML e retorne um JSON com:
{
  "documentType": "tipo do documento",
  "isValid": true/false,
  "issues": ["lista de problemas"],
  "missingFields": ["campos obrigatórios ausentes"],
  "namespaceIssues": ["problemas de namespace"],
  "recommendations": ["recomendações"],
  "summary": "resumo em português"
}

XML:
${xmlContent.substring(0, 8000)}`;

    try {
      const model = this.getModel(true);
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      this.logger.error(`Gemini analyzeXml error: ${err.message}`);
      return { error: 'Erro ao analisar XML com IA' };
    }
  }

  private async searchKnowledgeBase(text: string): Promise<KnowledgeEntry[]> {
    if (!text || text.length < 3) return [];

    const words = text.split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
    if (words.length === 0) return [];

    const results = await Promise.all(
      words.map((word) =>
        this.kbRepo.find({
          where: [
            { description: ILike(`%${word}%`) },
            { title: ILike(`%${word}%`) },
          ],
          take: 3,
        }),
      ),
    );

    const flat = results.flat();
    const unique = Array.from(new Map(flat.map((e) => [e.id, e])).values());
    return unique.slice(0, 5);
  }

  private buildDiagnosePrompt(dto: DiagnoseDto, kbContext: KnowledgeEntry[]): string {
    const parts = [`Analise o seguinte problema SAP Ariba e retorne um JSON com diagnóstico:\n`];

    if (dto.errorMessage) parts.push(`Mensagem de Erro: ${dto.errorMessage}`);
    if (dto.statusCode) parts.push(`HTTP Status: ${dto.statusCode}`);
    if (dto.context) parts.push(`Contexto: ${dto.context}`);
    if (dto.payload) parts.push(`Payload:\n${dto.payload.substring(0, 4000)}`);

    if (kbContext.length > 0) {
      parts.push(`\nErros similares na base de conhecimento:`);
      kbContext.forEach((e) => {
        parts.push(`- ${e.title}: ${e.solutions.join(', ')}`);
      });
    }

    parts.push(`\nRetorne JSON: { "diagnosis": "", "possibleCause": "", "suggestedFix": "", "investigationSteps": [], "confidence": 0-100, "priority": "low|medium|high|critical", "impact": "" }`);

    return parts.join('\n');
  }

  private buildFallbackDiagnosis(dto: DiagnoseDto, kbContext: KnowledgeEntry[]) {
    if (kbContext.length > 0) {
      const entry = kbContext[0];
      return {
        diagnosis: entry.description,
        possibleCause: entry.possibleCauses[0] || 'Verifique as credenciais e configurações',
        suggestedFix: entry.solutions[0] || 'Consulte a base de conhecimento',
        investigationSteps: entry.investigationSteps,
        confidence: 60,
        priority: 'medium',
        impact: 'Integração impactada',
        source: 'knowledge-base',
      };
    }

    return {
      diagnosis: 'IA não configurada. Adicione GEMINI_API_KEY no .env para diagnóstico completo.',
      possibleCause: dto.statusCode === 401 ? 'Token OAuth expirado ou inválido' : 'Verifique os logs do sistema',
      suggestedFix: dto.statusCode === 401 ? 'Renovar token OAuth via OAuth Manager' : 'Verificar configurações do ambiente',
      investigationSteps: ['Verificar logs', 'Testar credenciais OAuth', 'Validar payload'],
      confidence: 30,
      priority: 'medium',
      impact: 'Integração pode estar comprometida',
      source: 'rules-engine',
    };
  }
}
