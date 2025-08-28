-- Script simplifié pour créer les tables manquantes dans Supabase
-- À exécuter dans SQL Editor de Supabase Dashboard
-- Version: 28/08/2025

-- 1. Table sources
CREATE TABLE IF NOT EXISTS sources (
  id text primary key,
  name text not null,
  description text,
  base_url text,
  rate_limit_per_sec real default 1.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Insérer les sources
INSERT INTO sources (id, name, description, base_url, rate_limit_per_sec) 
VALUES 
  ('LBA', 'La Bonne Alternance', 'API d''offres d''alternance et formations', 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1', 5.0),
  ('FT', 'France Travail', 'API Pôle Emploi offres d''emploi', 'https://api.francetravail.io/partenaire/offresdemploi/v2', 10.0)
ON CONFLICT (id) DO NOTHING;

-- 3. Table offers_raw (sans partition pour commencer)
CREATE TABLE IF NOT EXISTS offers_raw (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id text NOT NULL REFERENCES sources(id),
  source_offer_id text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  origin_url text,
  raw jsonb NOT NULL,
  content_sha256 bytea,
  PRIMARY KEY (id)
);

-- 4. Index essentiels
CREATE INDEX IF NOT EXISTS offers_raw_source_offer_idx ON offers_raw (source_id, source_offer_id);
CREATE INDEX IF NOT EXISTS offers_raw_fetched_at_idx ON offers_raw (fetched_at);
CREATE INDEX IF NOT EXISTS offers_raw_is_active_idx ON offers_raw (is_active);
CREATE INDEX IF NOT EXISTS offers_raw_raw_gin ON offers_raw USING gin (raw);

-- 5. Index unique pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS offers_raw_source_unique_idx ON offers_raw (source_id, source_offer_id);

-- 6. RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers_raw ENABLE ROW LEVEL SECURITY;

-- Sources: lecture publique
CREATE POLICY IF NOT EXISTS "sources_read_all" ON sources FOR SELECT USING (true);

-- Offers_raw: admin seulement
CREATE POLICY IF NOT EXISTS "offers_raw_admin_only" ON offers_raw FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Vérification
SELECT 'Table sources créée' as status, count(*) as nb_sources FROM sources;
SELECT 'Table offers_raw créée' as status, 0 as nb_offers;