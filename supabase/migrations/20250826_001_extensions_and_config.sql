-- Migration 001: Extensions et configuration de base
-- Date: 2025-08-26
-- Description: Active les extensions nécessaires et configure la recherche française

-- Extensions essentielles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- Pour UUID et chiffrement PII
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Pour recherche fuzzy
CREATE EXTENSION IF NOT EXISTS "postgis";       -- Pour géolocalisation
CREATE EXTENSION IF NOT EXISTS "vector";        -- Pour embeddings vectoriels
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- Pour normalisation française

-- Extensions optionnelles pour monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Pour monitoring des requêtes

-- Configuration de la recherche française avec unaccent
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_unaccent'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
    ALTER TEXT SEARCH CONFIGURATION french_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, french_stem;
  END IF;
END $$; 