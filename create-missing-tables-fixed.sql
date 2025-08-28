-- Script pour créer les tables manquantes dans Supabase Cloud
-- Version corrigée - 28/08/2025

-- 1. Table sources (simple d'abord)
CREATE TABLE IF NOT EXISTS sources (
  id text primary key,
  name text not null,
  description text,
  base_url text,
  rate_limit_per_sec real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Insérer les sources LBA et FT
INSERT INTO sources (id, name, description, base_url, rate_limit_per_sec) 
VALUES 
  ('LBA', 'La Bonne Alternance', 'API d''offres d''alternance et formations', 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1', 5.0),
  ('FT', 'France Travail', 'API Pôle Emploi offres d''emploi', 'https://api.francetravail.io/partenaire/offresdemploi/v2', 10.0)
ON CONFLICT (id) DO NOTHING;

-- 3. Fonction pour créer les partitions (avant la table partitionnée)
CREATE OR REPLACE FUNCTION ensure_offers_raw_partition(p_month date DEFAULT date_trunc('month', now())::date)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
  s_date date := p_month;
  e_date date := (p_month + interval '1 month')::date;
  part_name text := format('offers_raw_%s', to_char(p_month, 'YYYY_MM'));
  sql_cmd text;
BEGIN
  -- Vérifier si la partition existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = part_name
  ) THEN
    -- Créer la partition
    sql_cmd := format(
      'CREATE TABLE %I PARTITION OF offers_raw FOR VALUES FROM (%L) TO (%L)',
      part_name, s_date::timestamptz, e_date::timestamptz
    );
    EXECUTE sql_cmd;
    RAISE NOTICE 'Partition % créée avec succès', part_name;
  ELSE
    RAISE NOTICE 'Partition % existe déjà', part_name;
  END IF;
END
$$;

-- 4. Table offers_raw partitionnée
CREATE TABLE IF NOT EXISTS offers_raw (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id text NOT NULL REFERENCES sources(id),
  source_offer_id text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  origin_url text,
  raw jsonb NOT NULL,
  content_sha256 bytea NOT NULL,
  PRIMARY KEY (id, fetched_at)
) PARTITION BY RANGE (fetched_at);

-- 5. Créer la partition pour le mois courant
SELECT ensure_offers_raw_partition();

-- 6. Index sur la table partitionnée (après création des partitions)
-- Note: Les index sur table partitionnée doivent inclure la clé de partition
CREATE INDEX IF NOT EXISTS offers_raw_source_offer_fetched_idx 
ON offers_raw (source_id, source_offer_id, fetched_at);

CREATE INDEX IF NOT EXISTS offers_raw_source_offer_idx 
ON offers_raw (source_id, source_offer_id);

CREATE INDEX IF NOT EXISTS offers_raw_raw_gin 
ON offers_raw USING gin (raw);

CREATE INDEX IF NOT EXISTS offers_raw_is_active_idx 
ON offers_raw (is_active, fetched_at);

-- 7. RLS pour offers_raw
ALTER TABLE offers_raw ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés (admin)
CREATE POLICY IF NOT EXISTS "offers_raw_admin_access" ON offers_raw
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. RLS pour sources
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Politique lecture publique pour sources
CREATE POLICY IF NOT EXISTS "sources_read_public" ON sources
  FOR SELECT USING (true);

-- Politique admin pour sources
CREATE POLICY IF NOT EXISTS "sources_admin_access" ON sources
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 9. Commentaires
COMMENT ON TABLE sources IS 'Sources de données externes (LBA, France Travail, etc.)';
COMMENT ON TABLE offers_raw IS 'Données brutes des offres partitionnées par mois de fetched_at';
COMMENT ON FUNCTION ensure_offers_raw_partition(date) IS 'Crée la partition offers_raw pour le mois donné si elle n''existe pas';

-- 10. Vérification finale
DO $$
BEGIN
  RAISE NOTICE '=== VÉRIFICATION FINALE ===';
  RAISE NOTICE 'Table sources créée: %', (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'sources'));
  RAISE NOTICE 'Table offers_raw créée: %', (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'offers_raw'));
  RAISE NOTICE 'Nombre de sources: %', (SELECT count(*) FROM sources);
  RAISE NOTICE 'Partitions offers_raw: %', (SELECT count(*) FROM pg_tables WHERE tablename LIKE 'offers_raw_%');
END
$$;