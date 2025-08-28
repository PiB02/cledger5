-- Script minimal pour corriger les tables manquantes
-- 27/12/2024 - Basé sur l'analyse du code d'ingestion réel

-- ========================================
-- EXTENSIONS MINIMALES
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ========================================
-- TABLES NÉCESSAIRES POUR L'INGESTION
-- ========================================

-- Table companies (utilisée par le code d'ingestion)
CREATE TABLE IF NOT EXISTS companies (
  id uuid primary key default gen_random_uuid(),
  siret char(14) unique,
  name text not null,
  size_range text
);

-- Table locations (utilisée par le code d'ingestion)
CREATE TABLE IF NOT EXISTS locations (
  id uuid primary key default gen_random_uuid(),
  city text,
  postal_code text,
  department_code char(3),
  region_code char(2),
  insee_code char(5),
  geo geography(point,4326)
);

-- Table offers (selon le schéma DB-Architecture mais colonnes utilisées)
CREATE TABLE IF NOT EXISTS offers (
  id uuid primary key default gen_random_uuid(),
  canonical_fingerprint text not null unique,
  title text not null,
  description text,
  status text not null check (status in ('active','expired','suspended')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  alternance boolean not null default false,
  contract_type text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_period text,
  rome_codes text[],

  apply_url text,
  apply_phone text,

  company_id uuid references companies(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  source_primary text not null references sources(id)
);

-- ========================================
-- INDEX ESSENTIELS
-- ========================================

-- Index pour companies
CREATE INDEX IF NOT EXISTS companies_siret_idx ON companies(siret);
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(name);

-- Index et contraintes pour locations
CREATE INDEX IF NOT EXISTS locations_insee_idx ON locations(insee_code);
CREATE INDEX IF NOT EXISTS locations_city_idx ON locations(city);
CREATE INDEX IF NOT EXISTS locations_geo_idx ON locations USING gist(geo);
CREATE UNIQUE INDEX IF NOT EXISTS locations_city_postal_unique ON locations(city, postal_code) WHERE city IS NOT NULL AND postal_code IS NOT NULL;

-- Index pour offers
CREATE INDEX IF NOT EXISTS offers_fingerprint_idx ON offers(canonical_fingerprint);
CREATE INDEX IF NOT EXISTS offers_company_idx ON offers(company_id);
CREATE INDEX IF NOT EXISTS offers_location_idx ON offers(location_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON offers(status);

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Activer RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Policies admin (accès complet pour utilisateurs authentifiés)
DROP POLICY IF EXISTS companies_admin ON companies;
CREATE POLICY companies_admin ON companies FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS locations_admin ON locations;
CREATE POLICY locations_admin ON locations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS offers_admin ON offers;
CREATE POLICY offers_admin ON offers FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- VÉRIFICATION
-- ========================================

SELECT 'Tables créées avec succès!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'locations', 'offers')
ORDER BY table_name; 