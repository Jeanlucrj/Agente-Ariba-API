import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { AiService } from '../ai/ai.service';

const CXML_NAMESPACES = [
  'http://xml.ariba.com/schema/1.0/CXML',
  'http://www.ariba.com/Ariba-Base-Catalog',
];

const REQUIRED_PO_FIELDS = [
  'OrderRequest',
  'OrderRequestHeader',
  'Total',
  'Currency',
  'ItemOut',
];

@Injectable()
export class AnalyzerService {
  private xmlParser: XMLParser;

  constructor(private aiService: AiService) {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseTagValue: true,
      ignoreDeclaration: true,
    });
  }

  async analyzeXml(xmlContent: string, useAi = true) {
    const issues: string[] = [];
    const warnings: string[] = [];
    let documentType = 'Unknown';
    let parsedData: any = null;

    try {
      parsedData = this.xmlParser.parse(xmlContent);
    } catch (err) {
      return {
        isValid: false,
        documentType: 'Invalid XML',
        issues: [`XML inválido: ${err.message}`],
        warnings: [],
        recommendations: ['Corrija a estrutura XML antes de prosseguir'],
      };
    }

    const rootKeys = Object.keys(parsedData);
    const rootElement = rootKeys[0];

    if (rootElement === 'cXML') documentType = 'cXML';
    else if (rootElement === 'OrderRequest') documentType = 'OrderRequest';
    else if (rootElement === 'InvoiceDetailRequest') documentType = 'Invoice';
    else if (rootElement === 'ReceiptRequest') documentType = 'Receipt';
    else documentType = rootElement;

    if (documentType === 'cXML') {
      const cxml = parsedData.cXML;

      if (!cxml['@_payloadID']) issues.push('Atributo payloadID ausente no elemento cXML');
      if (!cxml['@_timestamp']) warnings.push('Atributo timestamp ausente no elemento cXML');

      const header = cxml.Header;
      if (!header) {
        issues.push('Elemento Header ausente');
      } else {
        if (!header.From?.Credential) issues.push('Header.From.Credential ausente');
        if (!header.To?.Credential) issues.push('Header.To.Credential ausente');
        if (!header.Sender?.Credential) issues.push('Header.Sender.Credential ausente');
      }

      const request = cxml.Request;
      const message = cxml.Message;
      const response = cxml.Response;

      if (request) {
        const hasOrderRequest = !!request.OrderRequest;
        const hasInvoice = !!request.InvoiceDetailRequest;
        const hasReceipt = !!request.ReceiptRequest;
        const hasStatus = !!request.StatusUpdateRequest;
        const hasShipNotice = !!request.ShipNoticeRequest;
        const hasQuote = !!request.QuoteRequest;

        if (hasOrderRequest) {
          documentType = 'OrderRequest (cXML)';
          const or = request.OrderRequest;
          if (!or.OrderRequestHeader) issues.push('OrderRequestHeader ausente');
          if (!or.ItemOut && !or['ItemOut']) issues.push('Nenhum ItemOut encontrado na PO');
        } else if (hasInvoice) {
          documentType = 'InvoiceDetailRequest (cXML)';
        } else if (hasReceipt) {
          documentType = 'ReceiptRequest (cXML)';
        } else if (hasStatus) {
          documentType = 'StatusUpdateRequest (cXML)';
        } else if (hasShipNotice) {
          documentType = 'ShipNoticeRequest (cXML)';
        } else if (hasQuote) {
          documentType = 'QuoteRequest (cXML)';
        }
      } else if (message) {
        // Message-based cXML (async responses, quotes, confirmations)
        if (message.QuoteMessage) documentType = 'QuoteMessage (cXML)';
        else if (message.ConfirmationRequest) documentType = 'ConfirmationRequest (cXML)';
        else if (message.ShipNoticeRequest) documentType = 'ShipNoticeRequest (cXML)';
        else if (message.StatusUpdateRequest) documentType = 'StatusUpdateRequest (cXML)';
        else documentType = `Message.${Object.keys(message)[0] || 'Unknown'} (cXML)`;
      } else if (response) {
        documentType = 'Response (cXML)';
      } else {
        issues.push('Elemento Request, Message ou Response ausente no cXML');
      }
    }

    const xmlLower = xmlContent.toLowerCase();
    if (xmlContent.includes('xmlns') && !xmlContent.includes('ariba') && !xmlContent.includes('cxml')) {
      warnings.push('Namespace não reconhecido como SAP Ariba/cXML');
    }

    const result: any = {
      isValid: issues.length === 0,
      documentType,
      issues,
      warnings,
      size: xmlContent.length,
      recommendations: issues.length > 0
        ? ['Corrija os problemas identificados antes de enviar para o Ariba']
        : ['XML válido para processamento'],
    };

    if (useAi && (issues.length > 0 || xmlContent.length > 100)) {
      try {
        const aiAnalysis = await this.aiService.analyzeXml(xmlContent);
        result.aiAnalysis = aiAnalysis;
      } catch {
        result.aiAnalysis = null;
      }
    }

    return result;
  }

  analyzeJson(jsonContent: string) {
    const issues: string[] = [];
    let parsed: any = null;

    try {
      parsed = JSON.parse(jsonContent);
    } catch (err) {
      return {
        isValid: false,
        issues: [`JSON inválido: ${err.message}`],
        recommendations: ['Corrija a sintaxe JSON'],
      };
    }

    const checkRequired = (obj: any, fields: string[], path = '') => {
      for (const field of fields) {
        if (!(field in obj)) {
          issues.push(`Campo obrigatório ausente: ${path ? path + '.' : ''}${field}`);
        }
      }
    };

    return {
      isValid: issues.length === 0,
      issues,
      structure: this.describeJsonStructure(parsed),
      recommendations: issues.length > 0 ? ['Corrija os campos ausentes'] : ['JSON válido'],
    };
  }

  compareCigPayloads(
    aribaPayload: string,
    transformedPayload: string,
    sapPayload: string,
  ) {
    const parseAny = (content: string) => {
      try {
        return { type: 'json', data: JSON.parse(content) };
      } catch {
        try {
          return { type: 'xml', data: this.xmlParser.parse(content) };
        } catch {
          return { type: 'text', data: content };
        }
      }
    };

    const ariba = parseAny(aribaPayload);
    const transformed = parseAny(transformedPayload);
    const sap = parseAny(sapPayload);

    const aribaFields = this.flattenKeys(ariba.data);
    const sapFields = this.flattenKeys(sap.data);

    const lostFields = aribaFields.filter((f) => !sapFields.some((sf) => sf.includes(f.split('.').pop())));
    const addedFields = sapFields.filter((f) => !aribaFields.some((af) => af.includes(f.split('.').pop())));

    return {
      summary: {
        aribaFieldCount: aribaFields.length,
        sapFieldCount: sapFields.length,
        lostInTransformation: lostFields.length,
        addedInTransformation: addedFields.length,
      },
      lostFields,
      addedFields,
      recommendations: lostFields.length > 0
        ? [`${lostFields.length} campos perdidos na transformação CIG. Verifique os XPaths no XSL.`]
        : ['Todos os campos Ariba chegaram ao SAP'],
    };
  }

  private flattenKeys(obj: any, prefix = ''): string[] {
    if (typeof obj !== 'object' || obj === null) return prefix ? [prefix] : [];
    return Object.entries(obj).flatMap(([k, v]) =>
      this.flattenKeys(v, prefix ? `${prefix}.${k}` : k),
    );
  }

  private describeJsonStructure(obj: any, depth = 0): any {
    if (depth > 3) return typeof obj;
    if (Array.isArray(obj)) return `Array[${obj.length}]`;
    if (typeof obj !== 'object' || obj === null) return typeof obj;

    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, this.describeJsonStructure(v, depth + 1)]),
    );
  }
}
