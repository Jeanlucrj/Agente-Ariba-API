import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { KnowledgeEntry, ErrorCategory } from './knowledge-entry.entity';

const SEED_ENTRIES: Partial<KnowledgeEntry>[] = [
  {
    title: 'OAuth 401 - Token Inválido ou Expirado',
    category: ErrorCategory.OAUTH,
    errorCode: 'HTTP_401',
    description: 'O token OAuth retornou 401 Unauthorized ao chamar a API SAP Ariba.',
    possibleCauses: [
      'Token expirado (padrão SAP Ariba: 1800s)',
      'Client ID ou Secret incorretos',
      'Realm inválido ou não configurado',
      'AppKey incorreta ou ausente',
      'Escopo insuficiente para a operação',
    ],
    investigationSteps: [
      'Verifique o token via OAuth Manager > Test Token',
      'Confirme Client ID e Secret no SAP Ariba Administration',
      'Verifique se o Realm está no formato correto: <companycode>-T (sandbox) ou <companycode>-s (prod)',
      'Confirme que a AppKey corresponde à aplicação correta no Ariba Network',
      'Tente gerar novo token via POST /v2/oauth/token',
    ],
    solutions: [
      'Gerar novo token OAuth via endpoint /v2/oauth/token',
      'Verificar e atualizar credenciais no SAP Ariba Administration',
      'Confirmar Realm na URL: ?realm=<valor>',
      'Renovar credenciais expiradas no portal SAP Ariba',
    ],
    tags: ['oauth', '401', 'token', 'ariba'],
  },
  {
    title: 'CIG - Campo Perdido na Transformação XSL',
    category: ErrorCategory.CIG,
    errorCode: 'CIG_MAPPING_001',
    description: 'Campo presente no payload Ariba não chegou ao SAP após transformação no CIG.',
    possibleCauses: [
      'XPath incorreto no mapeamento CIG',
      'Namespace não declarado no XSL',
      'Campo em seção condicional não avaliada',
      'Versão do XSL incompatível com o payload',
      'Campo extrinsic com nome diferente do esperado',
    ],
    investigationSteps: [
      'Ativar trace no CIG para a mensagem problemática',
      'Comparar payload de entrada vs saída no CIG',
      'Verificar XPath do campo no XSL do CIG',
      'Confirmar namespace correto: xmlns:cxml="http://xml.ariba.com/schema/1.0/CXML"',
      'Testar XPath no CIG Analyzer da plataforma',
    ],
    solutions: [
      'Corrigir XPath no XSL do CIG',
      'Adicionar namespace correto ao XSL',
      'Verificar condicionais que possam excluir o campo',
      'Atualizar mapeamento no CIG Mapping Designer',
    ],
    tags: ['cig', 'xsl', 'xpath', 'mapping', 'namespace'],
  },
  {
    title: 'IDoc SAP - Status 51 (Erro no Processamento)',
    category: ErrorCategory.IDOC,
    errorCode: 'IDOC_51',
    description: 'IDoc com status 51 indica erro no processamento dentro do SAP ECC/S4.',
    possibleCauses: [
      'Parceiro (partner profile) não configurado',
      'Segmento obrigatório ausente',
      'Conversão de número/moeda incorreta',
      'Material não encontrado (MM60)',
      'Fornecedor não cadastrado (XK01)',
      'Conta contábil inválida',
    ],
    investigationSteps: [
      'Verificar WE02/WE05 para detalhes do IDoc',
      'Analisar SLG1 para logs de aplicação',
      'Verificar BD87 para reprocessamento',
      'Confirmar parceiro via WE20',
      'Verificar tabela de conversão VEDI no SM30',
    ],
    solutions: [
      'Configurar partner profile em WE20',
      'Corrigir dados do IDoc e reprocessar via BD87',
      'Criar material/fornecedor ausente',
      'Corrigir mapeamento de campos numéricos',
    ],
    tags: ['idoc', 'sap', 'ecc', 'status51', 'we02'],
  },
  {
    title: 'HTTP 422 - Payload JSON Inválido SAP Ariba',
    category: ErrorCategory.JSON,
    errorCode: 'HTTP_422',
    description: 'API SAP Ariba retornou 422 Unprocessable Entity indicando dados inválidos no payload.',
    possibleCauses: [
      'Campo obrigatório ausente no JSON',
      'Tipo de dado incorreto (string onde esperava number)',
      'Formato de data inválido (deve ser ISO 8601)',
      'Enum com valor não suportado',
      'Tamanho máximo de campo excedido',
    ],
    investigationSteps: [
      'Verificar a mensagem de erro no campo "error_description" da resposta',
      'Validar o payload contra o schema Swagger/OpenAPI da API',
      'Confirmar formato de datas: YYYY-MM-DDTHH:mm:ssZ',
      'Usar o JSON Analyzer da plataforma para validação',
    ],
    solutions: [
      'Corrigir campos ausentes ou com tipo errado',
      'Ajustar formato de datas para ISO 8601',
      'Verificar documentação da API para valores de enum válidos',
    ],
    tags: ['json', '422', 'validation', 'payload', 'ariba'],
  },
  {
    title: 'Commerce Automation - PO não processada',
    category: ErrorCategory.ARIBA,
    errorCode: 'CA_PO_001',
    description: 'Purchase Order do Commerce Automation não foi processada pelo fornecedor ou SAP.',
    possibleCauses: [
      'Fornecedor sem configuração cXML no Ariba Network',
      'URL de endpoint do fornecedor incorreta',
      'Credenciais cXML do fornecedor incorretas',
      'PO com campos obrigatórios ausentes',
      'Problema de integração CIG',
      'IDoc com erro no SAP',
    ],
    investigationSteps: [
      'Verificar status da PO no Ariba Buying',
      'Checar log de transmissão no Ariba Network',
      'Analisar trace CIG se integrado via CIG',
      'Verificar WE02 para IDoc correspondente no SAP',
      'Analisar SMQ1/SMQ2 para falhas de qRFC',
    ],
    solutions: [
      'Configurar endpoint cXML do fornecedor no Ariba Network',
      'Reenviar PO após correção de credenciais',
      'Corrigir mapeamento CIG e reprocessar',
      'Reprocessar IDoc via BD87 após correção',
    ],
    tags: ['commerce-automation', 'po', 'purchase-order', 'cxml', 'fornecedor'],
  },
];

@Injectable()
export class KnowledgeBaseService implements OnModuleInit {
  constructor(@InjectRepository(KnowledgeEntry) private repo: Repository<KnowledgeEntry>) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(SEED_ENTRIES as KnowledgeEntry[]);
    }
  }

  async search(query: string, category?: ErrorCategory) {
    const where: any[] = [
      { title: ILike(`%${query}%`) },
      { description: ILike(`%${query}%`) },
      { errorCode: ILike(`%${query}%`) },
    ];

    const results = await this.repo.find({
      where: category ? where.map((w) => ({ ...w, category })) : where,
      order: { usageCount: 'DESC' },
      take: 20,
    });

    return results;
  }

  async findAll(category?: ErrorCategory, page = 1, limit = 20) {
    const where: any = { isActive: true };
    if (category) where.category = category;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { usageCount: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada não encontrada');
    await this.repo.increment({ id }, 'usageCount', 1);
    return entry;
  }

  async create(dto: Partial<KnowledgeEntry>) {
    const entry = this.repo.create(dto);
    return this.repo.save(entry);
  }

  async update(id: string, dto: Partial<KnowledgeEntry>) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }
}
