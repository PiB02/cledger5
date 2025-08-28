-- Script corrigé v2 pour adapter les tables existantes dans Supabase Cloud
-- 27/12/2024 - Correction après erreur sur colonne label

-- Étape 1 : Ajouter les colonnes manquantes à la table sources si nécessaire
ALTER TABLE sources ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS base_url text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS rate_limit_per_sec real;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE sources ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Étape 2 : Insérer les sources LBA et FT avec label
INSERT INTO sources (id, label, name, description, base_url, rate_limit_per_sec) VALUES
('LBA', 'La Bonne Alternance', 'La Bonne Alternance', 'API d''offres d''alternance et formations', 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1', 5.0),
('FT', 'France Travail', 'France Travail', 'API Pôle Emploi offres d''emploi', 'https://api.francetravail.io/partenaire/offresdemploi/v2', 10.0)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  rate_limit_per_sec = EXCLUDED.rate_limit_per_sec,
  updated_at = now();

-- Étape 3 : Créer la table offers_raw si elle n'existe pas
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

-- Étape 4 : Créer les index sur offers_raw
CREATE UNIQUE INDEX IF NOT EXISTS offers_raw_uniq_part ON offers_raw (source_id, source_offer_id, fetched_at);
CREATE INDEX IF NOT EXISTS offers_raw_sid_soid_idx ON offers_raw (source_id, source_offer_id);
CREATE INDEX IF NOT EXISTS offers_raw_raw_gin ON offers_raw USING gin (raw);

-- Étape 5 : Créer la fonction de partition
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

-- Étape 6 : Créer la partition pour le mois courant
SELECT ensure_offers_raw_partition();

-- Étape 7 : Activer RLS sur offers_raw
ALTER TABLE offers_raw ENABLE ROW LEVEL SECURITY;

-- Étape 8 : Créer ou remplacer la policy RLS
DROP POLICY IF EXISTS raw_admin ON offers_raw;
CREATE POLICY raw_admin ON offers_raw FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Étape 9 : Commentaires
COMMENT ON TABLE sources IS 'Sources de données externes (LBA, France Travail, etc.)';
COMMENT ON TABLE offers_raw IS 'Données brutes des offres partitionnées par mois';
COMMENT ON FUNCTION ensure_offers_raw_partition(date) IS 'Crée la partition offers_raw pour le mois donné'; 