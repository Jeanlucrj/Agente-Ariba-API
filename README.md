# Agente Ariba Enterprise AI

**Plataforma Full Stack para Testes, Diagnóstico e Monitoramento SAP Ariba**

> Substitui o Postman para o ecossistema SAP Ariba, com IA especializada, análise de CIG, IDocs, OAuth e muito mais.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, React, MUI, Tailwind, Monaco Editor, Recharts |
| Backend | NestJS, TypeScript, Swagger/OpenAPI |
| Banco | PostgreSQL 16 |
| Cache | Redis 7 |
| Mensageria | RabbitMQ 3.13 |
| IA | OpenAI GPT-4o (abstrato, multi-provider) |
| Segurança | JWT, Refresh Token, RBAC, MFA (TOTP), AES-256 |
| DevOps | Docker, Docker Compose |

---

## Início Rápido — 100% Docker (sem Node.js local)

### Pré-requisito único
- **Docker Desktop** instalado e rodando

### Windows (PowerShell)

```powershell
cd "Agente API Ariba"
.\start.ps1          # sobe tudo em produção
.\start.ps1 -Logs    # ver logs em tempo real
.\start.ps1 -Down    # parar tudo
```

### Linux / Mac

```bash
cd "Agente API Ariba"
chmod +x start.sh
./start.sh           # produção
./start.sh dev       # desenvolvimento com hot-reload
```

### Ou diretamente com Docker Compose

```bash
# Produção (build + start)
docker-compose up -d --build

# Desenvolvimento com hot-reload
docker-compose -f docker-compose.dev.yml up -d --build
```

### Acesso após subir

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Swagger | http://localhost:3001/api/docs |
| RabbitMQ Admin | http://localhost:15672 |

### Login inicial

```
Email: admin@aribaenterprise.ai
Senha: Admin@123456
```

> **IMPORTANTE:** Troque a senha após o primeiro login.

---

## Arquitetura Docker

```
Browser
  │
  ▼
[Frontend :3000]  ← Next.js (container)
  │  /api-proxy/*  (rewrite interno)
  ▼
[Backend :3001]   ← NestJS (container)
  │
  ├── [postgres]  ← PostgreSQL (container)
  ├── [redis]     ← Redis (container)
  └── [rabbitmq]  ← RabbitMQ (container)
```

O browser NUNCA chama o backend diretamente. Todas as chamadas de API
vão para `/api-proxy/*` no Next.js, que faz rewrite server-side para
o container backend via rede Docker interna — sem localhost, sem IP fixo.

---

## Módulos MVP

| # | Módulo | Status |
|---|--------|--------|
| 1 | Dashboard Executivo | ✅ |
| 2 | Gerenciamento de APIs | ✅ |
| 3 | OAuth Manager | ✅ |
| 4 | Executor de APIs | ✅ |
| 5 | Analisador XML (cXML) | ✅ |
| 6 | Analisador JSON | ✅ |
| 7 | CIG Analyzer | ✅ |
| 8 | IA Troubleshooting | ✅ |
| 9 | Base de Conhecimento | ✅ |
| 10 | Autenticação JWT + MFA | ✅ |

---

## Rodar tudo com Docker

```bash
cp .env.example .env
# Configure o .env
docker-compose up -d
# Aguarde ~30s para os serviços iniciarem
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/docs
# RabbitMQ Admin: http://localhost:15672
```

---

## Estrutura do Projeto

```
/
├── backend/                  # NestJS API
│   └── src/
│       ├── auth/             # JWT + MFA + RBAC
│       ├── users/            # Gestão de usuários
│       ├── environments/     # DEV/QAS/PRD
│       ├── apis/             # Catálogo de APIs Ariba
│       ├── oauth/            # OAuth Manager (cache Redis)
│       ├── executor/         # Executor de APIs
│       ├── analyzer/         # XML/JSON/CIG
│       ├── ai/               # OpenAI + Knowledge Base
│       ├── knowledge-base/   # Base de conhecimento SAP Ariba
│       └── health/
├── frontend/                 # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── (auth)/login
│       │   └── (dashboard)/
│       │       ├── dashboard
│       │       ├── executor
│       │       ├── oauth
│       │       └── analyzer/
│       ├── components/layout/
│       ├── services/api.ts
│       └── store/auth.store.ts
├── database/migrations/      # SQL de inicialização
├── docker/                   # Dockerfiles
├── docker-compose.yml
└── .env.example
```

---

## Roadmap

### V1 (próxima fase)
- [ ] SAP Analyzer (IDoc: WE02, WE05, BD87)
- [ ] Mapping Analyzer (DE→PARA automático)
- [ ] Commerce Automation Analyzer
- [ ] Monitoramento contínuo com alertas
- [ ] Centro de Evidências (PDF/Excel)

### V2
- [ ] Regression Test Center
- [ ] Multi-tenant
- [ ] Integração SAP Integration Suite

### Enterprise
- [ ] White Label
- [ ] Marketplace de Conectores
- [ ] SAP BTP, Azure, AWS

---

## Segurança

- Senhas: bcrypt (rounds=12)
- Tokens: JWT RS256 + Refresh Token com rotação
- Secrets OAuth: nunca expostos na API (mascarados)
- RBAC: super_admin, admin, architect, consultant, viewer
- MFA: TOTP (Google Authenticator / Authy)
- Rate limiting: 100 req/min por IP
- Helmet: headers de segurança HTTP

---

## Contribuição

Projeto proprietário. Todos os direitos reservados.
