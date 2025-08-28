-- Script de correction pour les tables manquantes
-- 27/12/2024 - Correction des erreurs d'ingestion

-- ========================================
-- PARTIE 1 : Table locations manquante
-- ========================================

-- Créer la table locations selon le schéma DB-Architecture
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
-- PARTIE 2 : Table companies (si nécessaire)
-- ========================================

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

-- Index pour companies
CREATE INDEX IF NOT EXISTS companies_txt_idx ON companies USING gin (
  to_tsvector('french_unaccent'::regconfig, coalesce(name,'')||' '||coalesce(brand,''))
);

-- ========================================
-- PARTIE 3 : RLS sur les nouvelles tables
-- ========================================

-- RLS pour locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS locations_admin ON locations;
CREATE POLICY locations_admin ON locations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- RLS pour companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_admin ON companies;
CREATE POLICY companies_admin ON companies FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- PARTIE 4 : Commentaires
-- ========================================

COMMENT ON TABLE locations IS 'Localisation des offres et candidats avec géolocalisation';
COMMENT ON TABLE companies IS 'Entreprises avec SIRET et informations commerciales';

-- ========================================
-- PARTIE 5 : Vérification
-- ========================================

SELECT 'Tables créées avec succès:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('locations', 'companies', 'offers_raw', 'sources'); 