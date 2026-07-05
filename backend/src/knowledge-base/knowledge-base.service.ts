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
  // === Webinar SAP Ariba: CIG Custom Mapping (extraido do video via Gemini) ===
  {
    title: 'Visão Geral da Ferramenta de Mapeamento CIG',
    category: ErrorCategory.CIG,
    description: 'A ferramenta de mapeamento CIG foi introduzida como um serviço de autoatendimento para atender à demanda por mapeamentos customizados. Ela permite que os compradores gerenciem suas próprias transformações de documentos, oferecendo flexibilidade e controle sobre as integrações.',
    possibleCauses: [],
    investigationSteps: [],
    solutions: ['Editar e criar mapeamentos.', 'Implantar, desativar e gerenciar versões de mapeamentos customizados.', 'Testar e validar mapeamentos customizados usando a ferramenta de teste de mapeamento.', 'Usar a ferramenta de teste para comparar resultados entre mapeamentos padrão e customizados.', 'Visualizar e editar versões anteriores dos mapeamentos.', 'Adicionar descrição a cada versão para controle de customização e alterações.', 'Migrar mapeamentos customizados da ferramenta de mapeamento para uma versão mais recente do add-on.'],
    tags: ['cig', 'mapeamento', 'customização', 'ferramenta', 'funcionalidades'],
  },
  {
    title: 'Como Acessar a Ferramenta de Mapeamento CIG',
    category: ErrorCategory.CIG,
    description: 'A ferramenta de mapeamento CIG pode ser acessada através de qualquer uma das soluções Ariba, como Ariba Network, Ariba Sourcing ou Ariba Procurement Core, uma vez que o CIG esteja habilitado. O acesso é feito através da seção de configurações.',
    possibleCauses: ['CIG não habilitado na solução Ariba.'],
    investigationSteps: [],
    solutions: ['1. Acesse o CIG através de qualquer uma das soluções Ariba (ex: Ariba Network, Ariba Sourcing, Ariba Procurement Core).', '2. Navegue até a página de administração da solução Ariba.', '3. Clique no link \'Ir para o SAP Ariba Cloud Integration Gateway\'.', '4. Dentro do CIG, clique na aba \'My Configurations\'.', '5. Selecione a sub-aba \'Mappings\' para visualizar e gerenciar os mapeamentos.'],
    tags: ['acesso', 'cig', 'mapeamento', 'configurações', 'ariba network'],
  },
  {
    title: 'Níveis e Prioridade dos Mapeamentos CIG',
    category: ErrorCategory.MAPPING,
    description: 'Existem três níveis de mapeamentos no CIG: Padrão, Extensão Manual e Customizado. A prioridade de execução determina qual mapeamento será aplicado a um campo específico, sendo o mapeamento customizado o de maior prioridade.',
    possibleCauses: ['Conflitos de mapeamento devido a sobreposição de regras.'],
    investigationSteps: [],
    solutions: ['**Mapeamento Padrão**: Entregues \'out of the box\' pelo SAP Ariba para cada tipo de documento. Não requerem criação manual.', '**Mapeamento de Extensão Manual**: Desenvolvidos pela equipe de Engenharia do CIG em circunstâncias especiais (geralmente antes da ferramenta de mapeamento estar disponível). Recomenda-se migrá-los para a ferramenta de mapeamento para maior controle.', '**Mapeamento Customizado**: Criados pelos clientes usando a Ferramenta de Mapeamento CIG.', '**Prioridade de Execução**: Mapeamento Customizado > Mapeamento de Extensão Manual > Mapeamento Padrão. Se um campo é mapeado em mais de um nível, o de maior prioridade prevalece. Se campos diferentes são mapeados, ambos são aplicados.'],
    relatedErrors: ['CIG-MAP-001'],
    tags: ['prioridade', 'mapeamento', 'padrão', 'customizado', 'extensão manual', 'conflito'],
  },
  {
    title: 'Criação de Mapeamentos 1:1 e Constantes para Purchase Order',
    category: ErrorCategory.MAPPING,
    description: 'Este procedimento demonstra como mapear um campo de origem (IDoc) para um campo de destino (cXML) e como adicionar um valor constante a um atributo de campo no CIG Mapping Tool. O exemplo utiliza um cenário de Purchase Order (OrderRequest).',
    possibleCauses: ['Estruturas de origem/destino incorretas.', 'SystemID não selecionado.'],
    investigationSteps: ['1. Acesse a ferramenta de mapeamento CIG (My Configurations > Mappings).', '2. Clique no botão \'+\' para \'OrderRequest\' para adicionar um novo mapeamento.', '3. Selecione o \'SystemID\' (ex: HBOCLMT900) e clique \'OK\'.', '4. Expanda a estrutura de origem \'AddOn Order\' e navegue até \'E1EDK01\' > \'BSART\'.', '5. Expanda a estrutura de destino \'cXML OrderRequest\' e navegue até \'OrderRequestHeader\' > \'Extrinsic\'.', '6. Arraste e solte o campo \'BSART\' da origem para o campo \'Extrinsic\' no destino.', '7. Para adicionar uma constante, clique com o botão direito no campo \'Extrinsic\' no destino e selecione \'Add Constant Value\'.', '8. No campo \'Constant Value\', digite \'DocumentType\' para o atributo \'@name\' e clique \'OK\'.', '9. Clique em \'Save Mapping\' e forneça uma descrição (ex: \'Exemplo 1:1 mapping and constants\').', '10. Para testar, marque a caixa \'TEST\' para o mapeamento e clique no botão \'Test the mapping\'.', '11. Cole o payload do IDoc de Purchase Order no campo \'Content\', selecione o \'SystemID\' e clique \'Test\'.', '12. Verifique o log de teste para confirmar que o campo \'Extrinsic\' foi mapeado com o \'name\' \'DocumentType\' e o valor de \'BSART\'.'],
    solutions: [],
    relatedErrors: ['CIG-MAP-002', 'CIG-MAP-003'],
    tags: ['mapeamento 1:1', 'constantes', 'purchase order', 'idoc', 'cxml', 'extrinsic', 'payload', 'teste'],
  },
  {
    title: 'Adição de Condições de Origem e Destino em Mapeamentos',
    category: ErrorCategory.MAPPING,
    description: 'Condições permitem que um mapeamento seja aplicado ou ignorado com base em valores específicos nos campos de origem ou destino. Isso é crucial para implementar lógicas condicionais complexas diretamente na ferramenta de mapeamento.',
    possibleCauses: ['Condição mal configurada, resultando em mapeamento incorreto ou ausente.', 'XPath incorreto para o campo da condição.'],
    investigationSteps: ['1. Edite o mapeamento existente para \'OrderRequest\'.', '2. Arraste e solte o campo \'BELNR\' (de E1EDK02) da origem para \'@parentAgreementID\' (de OrderRequestHeader) no destino.', '3. Clique com o botão direito na linha que conecta \'QUALF\' (de E1EDK02) ao mapeamento recém-criado e selecione \'Add Source Condition\'.', '4. No diálogo \'Set Condition\', selecione \'Value\' como \'Condition Type\'.', '5. O \'XPath\' para \'QUALF\' será preenchido automaticamente. No campo \'Value to be applied for condition\', digite \'012\'.', '6. Clique \'OK\' e depois \'Save Mapping\', fornecendo uma descrição (ex: \'Exemplo 2 Conditions\').', '7. Teste o mapeamento com um payload de IDoc que contenha \'QUALF = 012\' e outro que não contenha, verificando se o mapeamento de \'BELNR\' ocorre apenas quando a condição é satisfeita.'],
    solutions: [],
    relatedErrors: ['CIG-MAP-004', 'CIG-MAP-005'],
    tags: ['condições', 'mapeamento condicional', 'xpath', 'qualifier', 'belnr', 'parentagreementid'],
  },
  {
    title: 'Tratamento de Campos Customizados na Ferramenta de Mapeamento CIG',
    category: ErrorCategory.MAPPING,
    description: 'Campos customizados criados no Ariba Procurement ou campos padrão não externalizados no cXML por padrão, ou não disponíveis no esquema da ferramenta de mapeamento CIG, precisam ser tratados de forma específica. Eles devem ser mapeados para um dos tipos de valores customizados disponíveis na ferramenta.',
    possibleCauses: ['Campo customizado não mapeado para um tipo CustomValues.', 'Condição `@name` ausente ou incorreta para diferenciar campos customizados.'],
    investigationSteps: ['1. Edite o mapeamento existente para \'PurchaseOrderExportRequest\'.', '2. Expanda a estrutura de origem \'cXML.PurchaseOrderExportRequest\' e navegue até \'ItemOut\' > \'Item\' > \'Custom\' > \'CustomString\'.', '3. Expanda a estrutura de destino \'AddOn PurchaseOrderExportRequest\' e navegue até \'PO_ITEMS\' > \'Item\' > \'VEND_MAT\'.', '4. Arraste e solte \'CustomString\' da origem para \'VEND_MAT\' no destino.', '5. Clique com o botão direito na linha que conecta \'CustomString\' a \'VEND_MAT\' e selecione \'Add Source Condition\'.', '6. No diálogo \'Set Condition\', selecione \'Value\' como \'Condition Type\'.', '7. O \'XPath\' para o atributo \'@name\' de \'CustomString\' será preenchido. No campo \'Value to be applied for condition\', digite \'VendorID\'.', '8. Clique \'OK\' e depois \'Save Mapping\', fornecendo uma descrição (ex: \'Exemplo 3 CustomFields\').', '9. Teste o mapeamento com um payload cXML que contenha \'CustomString\' com `@name=\'VendorID\'` e verifique se \'VEND_MAT\' é preenchido corretamente.'],
    solutions: ['Mapear o campo customizado para um dos tipos \'CustomBoolean\', \'CustomDate\', \'CustomInteger\', \'CustomMoney\' ou \'CustomString\'.', 'Sempre adicionar uma condição de origem no atributo \'@name\' do campo customizado para identificar qual campo está sendo externalizado, especialmente se houver múltiplos campos customizados do mesmo tipo.'],
    relatedErrors: ['CIG-MAP-006', 'CIG-MAP-007', 'Why my custom fields are not available in CIG Mapping Tool for mapping?'],
    tags: ['campos customizados', 'customvalues', 'extrinsic', 'cxml', 'vendorid', 'tag name', 'troubleshooting'],
  },
  {
    title: 'Implementação de Loops para Mapeamentos em Nível de Item',
    category: ErrorCategory.MAPPING,
    description: 'Ao mapear estruturas que se repetem, como itens de linha em um pedido, é essencial criar um loop para garantir que os valores não sejam concatenados no campo de destino. A variável de posição assegura que cada item da estrutura de origem seja mapeado para o item correspondente na estrutura de destino.',
    possibleCauses: ['Valores concatenados no campo de destino devido à falta de loop.', 'Variável de posição configurada incorretamente.'],
    investigationSteps: ['1. Edite o mapeamento existente para \'PurchaseOrderExportRequest\'.', '2. Selecione a linha de mapeamento do campo customizado (CustomString) para o campo de destino (VEND_MAT).', '3. Clique com o botão direito na linha de mapeamento e selecione \'Add Position Variable\'.', '4. No diálogo \'Select XPath\', selecione o XPath para a estrutura de item de origem (ex: \'cXML.PurchaseOrderExportRequest/Request/OrderRequest/ItemOut/Item\').', '5. Selecione o XPath para a estrutura de item de destino (ex: \'ARIBOC_BAPI_PO_CREATE/PO_ITEMS/ITEM\').', '6. Clique \'OK\' e depois \'Save Mapping\', fornecendo uma descrição (ex: \'Exemplo 4 Loops\').', '7. Teste o mapeamento com um payload cXML que contenha múltiplos itens de linha e verifique se os valores de \'VEND_MAT\' são mapeados corretamente para cada item, sem concatenação.'],
    solutions: [],
    relatedErrors: ['CIG-MAP-008', 'CIG-MAP-009'],
    tags: ['loop', 'item level', 'concatenação', 'variável de posição', 'mapeamento de itens'],
  },
  {
    title: 'Gerenciamento de Versões e Migração de Mapeamentos',
    category: ErrorCategory.MAPPING,
    description: 'A ferramenta de mapeamento CIG permite gerenciar diferentes versões dos mapeamentos, incluindo a visualização do histórico, a edição e a implantação de versões anteriores. Além disso, oferece a funcionalidade de migrar mapeamentos customizados para versões mais recentes do add-on, garantindo compatibilidade e aproveitando novas funcionalidades.',
    possibleCauses: ['Mapeamentos antigos não compatíveis com novas versões do add-on.', 'Perda de histórico de alterações sem descrições adequadas.'],
    investigationSteps: ['1. Na tela \'My Configurations\' > \'Mappings\', localize o mapeamento desejado.', '2. Clique no ícone \'Version Details\' (um documento com um relógio) na coluna \'Actions\'.', '3. A tela \'Mapping Version Details\' exibirá o histórico de versões, incluindo a razão/descrição, o usuário e a data da alteração.', '4. Para implantar uma versão antiga, clique no ícone de \'Deploy\' (um \'V\' verde) na coluna \'TEST\' ou \'PROD\' para a versão desejada.', '5. Para migrar um mapeamento para uma nova versão do add-on (se disponível), clique no ícone de \'Migrate Custom Mapping\' (uma seta circular) na coluna \'Actions\'.', '6. Confirme a migração no pop-up. Isso atualizará o mapeamento para a estrutura mais recente do add-on.'],
    solutions: ['Sempre adicione descrições claras ao salvar novas versões para facilitar o rastreamento de alterações.', 'Utilize a funcionalidade de migração para manter os mapeamentos atualizados com as versões mais recentes do add-on CIG, evitando problemas de compatibilidade.'],
    relatedErrors: ['CIG-MAP-010', 'CIG-MAP-011'],
    tags: ['gerenciamento de versões', 'migração', 'histórico', 'deploy', 'add-on', 'compatibilidade'],
  },
  {
    title: 'Como Lidar com Mapeamentos Complexos (BAdI)',
    category: ErrorCategory.ECC,
    description: 'Quando os requisitos de mapeamento são muito complexos para serem atendidos pelas funcionalidades da ferramenta de mapeamento CIG, a lógica pode ser implementada no SAP ERP usando Business Add-Ins (BAdIs). Isso permite criar lógicas personalizadas e complexas em ABAP.',
    possibleCauses: ['Lógica de mapeamento muito complexa para a ferramenta CIG.', 'Necessidade de acessar dados ou funcionalidades específicas do ERP.'],
    investigationSteps: ['1. Identifique se a lógica de mapeamento excede as capacidades da ferramenta CIG (ex: múltiplas condições aninhadas, cálculos complexos, acesso a tabelas específicas do ERP).', '2. Para documentos de entrada (inbound) no ERP, mapeie as informações relevantes para segmentos de extensão (EXTENSIONIN) no IDoc.', '3. Implemente a lógica customizada no BAdI correspondente no ERP para processar os dados dos segmentos de extensão.', '4. Para documentos de saída (outbound) do ERP, realize a transformação necessária nos dados antes de enviá-los ao CIG, utilizando um BAdI para preparar o IDoc.'],
    solutions: ['Utilize BAdIs no SAP ERP para criar lógicas complexas em ABAP.', 'Aproveite os segmentos EXTENSIONIN nos IDocs para armazenar informações que serão tratadas no BAdI.', 'Manter a lógica no ambiente do ERP diminui a dependência da equipe de suporte do CIG para futuras alterações.'],
    relatedErrors: ['CIG-MAP-012', 'How can I map extension segments in the CIG Mapping Tool?'],
    tags: ['badi', 'mapeamentos complexos', 'abap', 'erp', 'extensionin', 'idoc', 'lógica customizada'],
  },
  {
    title: 'Outras Funções Úteis da Ferramenta de Mapeamento CIG',
    category: ErrorCategory.MAPPING,
    description: 'Além das funcionalidades básicas, a ferramenta de mapeamento CIG oferece diversas funções para manipulação de dados, como tradução, formatação de números, divisão de texto, concatenação de valores e extração de substrings. Essas funções aumentam a flexibilidade e o poder da ferramenta para atender a requisitos variados de integração.',
    possibleCauses: ['Necessidade de transformar dados de forma específica (ex: formatação, tradução).', 'Campos de destino com restrições de tamanho ou formato.'],
    investigationSteps: [],
    solutions: ['**Translation Function**: Usada para tradução de valores de campo.', '**Number Format Function**: Usada para adicionar zeros à esquerda e alterar casas decimais em números.', '**Split Text**: Usada para dividir uma descrição longa em múltiplos campos de destino.', '**Concat Function**: Usada para concatenar múltiplos valores de campo em um único campo de destino.', '**Substring function**: Usada para mapear apenas alguns caracteres de um campo de origem para um campo de destino (útil para campos com limite de caracteres).'],
    tags: ['funções', 'tradução', 'formatação de número', 'split text', 'concat', 'substring', 'manipulação de dados'],
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
