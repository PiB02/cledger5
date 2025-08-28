-- Script pour vérifier la structure existante des tables dans Supabase
-- 27/12/2024

-- 1. Vérifier les tables existantes
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sources', 'offers_raw', 'offers');

-- 2. Vérifier la structure de la table sources
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sources'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de la table offers_raw si elle existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'offers_raw'
ORDER BY ordinal_position;

-- 4. Vérifier le contenu de la table sources
SELECT * FROM sources LIMIT 5;

-- 5. Vérifier les partitions de offers_raw
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename LIKE 'offers_raw_%'; 