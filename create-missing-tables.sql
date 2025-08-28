-- Script pour créer les tables manquantes dans Supabase Cloud
-- 27/12/2024 - Tables nécessaires pour l'ingestion LBA

-- Table sources si elle n'existe pas
CREATE TABLE IF NOT EXISTS sources (
  id text primary key,
  name text not null,
  description text,
  base_url text,
  rate_limit_per_sec real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insérer les sources LBA et FT si elles n'existent pas
INSERT INTO sources (id, name, description, base_url, rate_limit_per_sec) VALUES
('LBA', 'La Bonne Alternance', 'API d''offres d''alternance et formations', 'https://labonnealternance.apprentissage.beta.gouv.fr/api/V1', 5.0),
('FT', 'France Travail', 'API Pôle Emploi offres d''emploi', 'https://api.francetravail.io/partenaire/offresdemploi/v2', 10.0)
ON CONFLICT (id) DO NOTHING;

-- Table offers_raw partitionnée par mois
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

-- Index sur offers_raw
CREATE UNIQUE INDEX IF NOT EXISTS offers_raw_uniq_part ON offers_raw (source_id, source_offer_id, fetched_at);
CREATE INDEX IF NOT EXISTS offers_raw_sid_soid_idx ON offers_raw (source_id, source_offer_id);
CREATE INDEX IF NOT EXISTS offers_raw_raw_gin ON offers_raw USING gin (raw);

-- Fonction pour créer les partitions mensuelles
CREATE OR REPLACE FUNCTION ensure_offers_raw_partition(p_month date default date_trunc('month', now())::date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
declare s date := p_month; e date := (p_month + interval '1 month')::date; part text := format('offers_raw_%s', to_char(p_month,'YYYY_MM')); sql text;
begin
  if not exists (select 1 from pg_tables where tablename = part) then
    sql := format($f$ create table %I partition of offers_raw for values from (%L) to (%L); $f$, part, s::timestamptz, e::timestamptz);
    execute sql;
  end if;
end $$;

-- Créer la partition pour le mois courant
SELECT ensure_offers_raw_partition();

-- RLS pour offers_raw (admin seulement)
ALTER TABLE offers_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY raw_admin ON offers_raw FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Commentaires
COMMENT ON TABLE sources IS 'Sources de données externes (LBA, France Travail, etc.)';
COMMENT ON TABLE offers_raw IS 'Données brutes des offres partitionnées par mois';
COMMENT ON FUNCTION ensure_offers_raw_partition(date) IS 'Crée la partition offers_raw pour le mois donné'; 