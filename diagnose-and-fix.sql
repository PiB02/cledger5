-- Script de diagnostic et correction pour Supabase Cloud
-- 27/12/2024 - Diagnostic complet puis correction

-- ========================================
-- PARTIE 1 : DIAGNOSTIC
-- ========================================

-- 1. Vérifier les tables existantes
SELECT 'Tables existantes:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sources', 'offers_raw', 'offers');

-- 2. Structure de la table sources
SELECT 'Structure de la table sources:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sources'
ORDER BY ordinal_position;

-- 3. Contenu actuel de sources
SELECT 'Contenu actuel de sources:' as info;
SELECT * FROM sources LIMIT 5;

-- ========================================
-- PARTIE 2 : CORRECTION
-- ========================================

-- Étape 1 : Ajouter les colonnes manquantes (si nécessaire)
ALTER TABLE sources ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS base_url text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS rate_limit_per_sec real;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE sources ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Étape 2 : Mise à jour des données existantes ou insertion
-- Stratégie : UPSERT avec toutes les colonnes possibles
INSERT INTO sources (id, label, name, description, base_url, rate_limit_per_sec) VALUES
('LBA', 'La Bonne Alternance', 'La Bonne Alternance', 'API d''offres d''alternance et formations', 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1', 5.0),
('FT', 'France Travail', 'France Travail', 'API Pôle Emploi offres d''emploi', 'https://api.francetravail.io/partenaire/offresdemploi/v2', 10.0)
ON CONFLICT (id) DO UPDATE SET
  label = COALESCE(EXCLUDED.label, sources.label),
  name = COALESCE(EXCLUDED.name, sources.name),
  description = COALESCE(EXCLUDED.description, sources.description),
  base_url = COALESCE(EXCLUDED.base_url, sources.base_url),
  rate_limit_per_sec = COALESCE(EXCLUDED.rate_limit_per_sec, sources.rate_limit_per_sec),
  updated_at = COALESCE(EXCLUDED.updated_at, now());

-- Étape 3 : Créer offers_raw (table partitionnée)
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

-- Étape 4 : Index sur offers_raw
CREATE UNIQUE INDEX IF NOT EXISTS offers_raw_uniq_part ON offers_raw (source_id, source_offer_id, fetched_at);
CREATE INDEX IF NOT EXISTS offers_raw_sid_soid_idx ON offers_raw (source_id, source_offer_id);
CREATE INDEX IF NOT EXISTS offers_raw_raw_gin ON offers_raw USING gin (raw);

-- Étape 5 : Fonction de partition
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

-- Étape 6 : Créer partition du mois courant
SELECT ensure_offers_raw_partition();

-- Étape 7 : RLS
ALTER TABLE offers_raw ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS raw_admin ON offers_raw;
CREATE POLICY raw_admin ON offers_raw FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- PARTIE 3 : VÉRIFICATION FINALE
-- ========================================

-- Vérifier que tout est créé
SELECT 'Vérification finale:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'offers_raw';
SELECT * FROM sources WHERE id IN ('LBA', 'FT');
SELECT schemaname, tablename FROM pg_tables WHERE tablename LIKE 'offers_raw_%';

SELECT 'Setup terminé avec succès!' as status; 