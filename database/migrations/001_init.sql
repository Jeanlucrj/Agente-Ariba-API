-- =============================================
-- AGENTE ARIBA ENTERPRISE AI — Init Migration
-- Executado automaticamente no primeiro start
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'architect', 'consultant', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE environment_type AS ENUM ('DEV', 'QAS', 'PRD', 'SANDBOX', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE http_method AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE execution_status AS ENUM ('success', 'error', 'timeout', 'auth_failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users (seed admin)
INSERT INTO users (id, email, name, password, role, status, "mfaEnabled", "loginAttempts", "createdAt", "updatedAt")
VALUES (
  uuid_generate_v4(),
  'admin@aribaenterprise.ai',
  'Administrador',
  -- bcrypt hash of 'Admin@123456' (rounds=12) — CHANGE IN PRODUCTION
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2dZJHHlDmq',
  'super_admin',
  'active',
  false,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- GIN indexes for text search
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_title_gin ON knowledge_entries USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_desc_gin ON knowledge_entries USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_api_catalog_name_gin ON api_catalog USING gin(name gin_trgm_ops);
