-- Script complet de création des tables pour cledger5
-- 27/12/2024 - Basé sur docs/01-DB-Architecture.md

-- ========================================
-- PARTIE 1 : Extensions PostgreSQL
-- ========================================

-- Extensions nécessaires (si pas déjà activées)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ========================================
-- PARTIE 2 : Configuration & Dictionnaire
-- ========================================

-- Dictionnaire français sans accents (si pas déjà créé)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_unaccent') THEN
    CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
    ALTER TEXT SEARCH CONFIGURATION french_unaccent 
    ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, hword, hword_part, word 
    WITH unaccent, french_stem;
  END IF;
END $$;

-- ========================================
-- PARTIE 3 : Tables de référence
-- ========================================

-- Sources
CREATE TABLE IF NOT EXISTS sources (
  id text primary key check (id in ('LBA','FT')), 
  label text not null,
  name text,
  description text,
  base_url text,
  rate_limit_per_sec real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

INSERT INTO sources(id, label, name, description, base_url, rate_limit_per_sec) VALUES 
('LBA', 'La Bonne Alternance', 'La Bonne Alternance', 'API d''offres d''alternance et formations', 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1', 5.0),
('FT', 'France Travail', 'France Travail', 'API Pôle Emploi offres d''emploi', 'https://api.francetravail.io/partenaire/offresdemploi/v2', 10.0)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  rate_limit_per_sec = EXCLUDED.rate_limit_per_sec,
  updated_at = now();

-- Tables de référence pour les codes
CREATE TABLE IF NOT EXISTS contract_types_ref (code text primary key, label text not null);
CREATE TABLE IF NOT EXISTS work_modes_ref (code text primary key, label text not null);  
CREATE TABLE IF NOT EXISTS work_time_ref (code text primary key, label text not null);
CREATE TABLE IF NOT EXISTS salary_periods_ref (code text primary key, label text not null);

-- Insertion des données de référence basiques
INSERT INTO contract_types_ref(code,label) VALUES
('CDI','Contrat à durée indéterminée'),('CDD','Contrat à durée déterminée'),
('INTERIM','Intérim'),('APPRENTISSAGE','Contrat d''apprentissage'),
('PROFESSIONNALISATION','Contrat de professionnalisation')
ON CONFLICT DO NOTHING;

INSERT INTO work_modes_ref(code,label) VALUES
('REMOTE','Télétravail'),('ONSITE','Sur site'),('HYBRID','Hybride')
ON CONFLICT DO NOTHING;

INSERT INTO work_time_ref(code,label) VALUES
('FULLTIME','Temps plein'),('PARTTIME','Temps partiel')
ON CONFLICT DO NOTHING;

INSERT INTO salary_periods_ref(code,label) VALUES
('hour','Horaire'),('month','Mensuel'),('year','Annuel')
ON CONFLICT DO NOTHING;

-- ========================================
-- PARTIE 4 : Tables offers_raw (partitionnée)
-- ========================================

CREATE TABLE IF NOT EXISTS offers_raw (
  id uuid not null,
  source_id text not null references sources(id),
  source_offer_id text not null,
  fetched_at timestamptz not null,
  last_seen_at timestamptz not null,
  is_active boolean not null,
  origin_url text,
  raw jsonb not null,
  content_sha256 bytea not null,
  primary key (id, fetched_at)
) partition by range (fetched_at);

-- Index pour offers_raw
CREATE UNIQUE INDEX IF NOT EXISTS offers_raw_uniq_part ON offers_raw (source_id, source_offer_id, fetched_at);
CREATE INDEX IF NOT EXISTS offers_raw_sid_soid_idx ON offers_raw (source_id, source_offer_id);
CREATE INDEX IF NOT EXISTS offers_raw_raw_gin ON offers_raw USING gin (raw);

-- Fonction de partition pour offers_raw
CREATE OR REPLACE FUNCTION ensure_offers_raw_partition(p_month date default date_trunc('month', now())::date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
declare 
  s date := p_month; 
  e date := (p_month + interval '1 month')::date; 
  part text := format('offers_raw_%s', to_char(p_month,'YYYY_MM')); 
  sql text;
begin
  if not exists (select 1 from pg_tables where tablename = part) then
    sql := format('CREATE TABLE %I PARTITION OF offers_raw FOR VALUES FROM (%L) TO (%L)', part, s::timestamptz, e::timestamptz);
    execute sql;
  end if;
end $$;

-- Créer la partition du mois courant
SELECT ensure_offers_raw_partition();

-- ========================================
-- PARTIE 5 : Tables entités (companies, locations)
-- ========================================

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid primary key default gen_random_uuid(),
  siret char(14) unique,
  name text not null,
  brand text,
  legal_name text,
  website text,
  size_range text,
  naf_code text
);

CREATE INDEX IF NOT EXISTS companies_txt_idx ON companies USING gin (
  to_tsvector('french_unaccent'::regconfig, coalesce(name,'')||' '||coalesce(brand,''))
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id uuid primary key default gen_random_uuid(),
  address1 text,
  address2 text,
  postal_code text,
  city text,
  insee_code char(5),
  country_code char(2) not null default 'FR',
  geo geography(point,4326),
  department_code char(3),
  region_code char(2),
  geohash text generated always as (st_geohash(geo::geometry, 7)) stored,
  check (length(country_code)=2)
);

-- Index pour locations
CREATE INDEX IF NOT EXISTS locations_geo_idx ON locations USING gist (geo);
CREATE INDEX IF NOT EXISTS locations_geohash_idx ON locations(geohash);
CREATE INDEX IF NOT EXISTS locations_insee_idx ON locations(insee_code);
CREATE INDEX IF NOT EXISTS locations_city_idx ON locations(lower(city));

-- ========================================
-- PARTIE 6 : Table offers (canonique)
-- ========================================

CREATE TABLE IF NOT EXISTS offers (
  id uuid primary key default gen_random_uuid(),
  canonical_fingerprint text not null unique,
  title text not null,
  description text,
  status text not null check (status in ('active','expired','suspended')),
  created_at timestamptz default now(),
  expiration_at timestamptz,
  updated_at timestamptz default now(),

  alternance boolean not null default false,
  contract_type text,                 -- libellé source
  work_mode text,                     -- libellé source
  contract_type_code text references contract_types_ref(code),
  work_mode_code text references work_modes_ref(code),
  work_time_code text references work_time_ref(code),
  contract_start_date date,
  contract_duration_months int,
  opening_count int,

  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_currency char(3) not null default 'EUR',
  salary_period text,                 -- libellé source
  salary_period_code text references salary_periods_ref(code),
  salary_label text,
  check (salary_min is null or salary_max is null or salary_min <= salary_max),

  target_diploma_label text,
  rome_codes text[],
  rncp_codes text[],

  apply_url text,
  apply_phone text,

  company_id uuid references companies(id) on delete set null,
  location_id uuid references locations(id) on delete set null,

  source_primary text not null references sources(id),
  partner_label text,

  recruiter_id uuid,

  career_level text check (career_level in ('intern','junior','mid','senior','lead','manager')),
  max_years_exp smallint,

  -- plain column; maintained by trigger
  search_tsv tsvector
);

-- Index pour offers
CREATE INDEX IF NOT EXISTS offers_rome_gin ON offers USING gin (rome_codes);
CREATE INDEX IF NOT EXISTS offers_tsv_idx ON offers USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS offers_title_trgm ON offers USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS offers_status_active_idx ON offers (created_at desc) WHERE status='active';
CREATE INDEX IF NOT EXISTS offers_fk_company_idx ON offers (company_id);
CREATE INDEX IF NOT EXISTS offers_fk_location_idx ON offers (location_id);
CREATE INDEX IF NOT EXISTS offers_contract_type_code_idx ON offers (contract_type_code) WHERE status='active';

-- Trigger pour maintenir offers.search_tsv
CREATE OR REPLACE FUNCTION offers_tsv_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  new.search_tsv :=
    setweight(to_tsvector('french_unaccent'::regconfig, coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('french_unaccent'::regconfig, coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('french_unaccent'::regconfig, coalesce(array_to_string(coalesce(new.rome_codes,'{}'::text[]),' '),'')), 'C');
  return new;
END $$;

DROP TRIGGER IF EXISTS trg_offers_tsv ON offers;
CREATE TRIGGER trg_offers_tsv
BEFORE INSERT OR UPDATE OF title, description, rome_codes ON offers
FOR EACH ROW EXECUTE FUNCTION offers_tsv_refresh();

-- ========================================
-- PARTIE 7 : Tables de liaison offers
-- ========================================

CREATE TABLE IF NOT EXISTS offer_sources (
  offer_id uuid references offers(id) on delete cascade,
  source_id text references sources(id),
  source_offer_id text not null,
  source_url text,
  is_primary boolean not null default false,
  primary key (offer_id, source_id)
);

-- ========================================
-- PARTIE 8 : RLS (Row Level Security)
-- ========================================

-- RLS pour toutes les tables
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_sources ENABLE ROW LEVEL SECURITY;

-- Policies admin (accès complet pour les utilisateurs authentifiés)
DROP POLICY IF EXISTS sources_admin ON sources;
CREATE POLICY sources_admin ON sources FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS raw_admin ON offers_raw;
CREATE POLICY raw_admin ON offers_raw FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS companies_admin ON companies;
CREATE POLICY companies_admin ON companies FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS locations_admin ON locations;
CREATE POLICY locations_admin ON locations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS offers_admin ON offers;
CREATE POLICY offers_admin ON offers FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS offer_sources_admin ON offer_sources;
CREATE POLICY offer_sources_admin ON offer_sources FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- PARTIE 9 : Commentaires
-- ========================================

COMMENT ON TABLE sources IS 'Sources de données externes (LBA, France Travail, etc.)';
COMMENT ON TABLE offers_raw IS 'Données brutes des offres partitionnées par mois';
COMMENT ON TABLE companies IS 'Entreprises avec SIRET et informations commerciales';
COMMENT ON TABLE locations IS 'Localisation des offres et candidats avec géolocalisation';
COMMENT ON TABLE offers IS 'Offres d''emploi canoniques avec recherche full-text';
COMMENT ON TABLE offer_sources IS 'Liens entre offres canoniques et sources externes';

-- ========================================
-- PARTIE 10 : Vérification finale
-- ========================================

SELECT 'Setup complet terminé avec succès!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sources', 'offers_raw', 'companies', 'locations', 'offers', 'offer_sources')
ORDER BY table_name; 