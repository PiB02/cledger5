-- Script de diagnostic du schéma réel Supabase
-- 27/12/2024 - Pour comprendre la structure existante

-- ========================================
-- DIAGNOSTIC COMPLET DU SCHÉMA
-- ========================================

-- 1. Lister toutes les tables publiques
SELECT 'TABLES EXISTANTES:' as section;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Structure de la table offers (si elle existe)
SELECT 'STRUCTURE TABLE OFFERS:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'offers'
ORDER BY ordinal_position;

-- 3. Structure de la table locations (si elle existe)
SELECT 'STRUCTURE TABLE LOCATIONS:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'locations'
ORDER BY ordinal_position;

-- 4. Structure de la table companies (si elle existe)
SELECT 'STRUCTURE TABLE COMPANIES:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'companies'
ORDER BY ordinal_position;

-- 5. Structure de la table sources
SELECT 'STRUCTURE TABLE SOURCES:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sources'
ORDER BY ordinal_position;

-- 6. Structure de la table offers_raw (si elle existe)
SELECT 'STRUCTURE TABLE OFFERS_RAW:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'offers_raw'
ORDER BY ordinal_position;

-- 7. Vérifier les contraintes de clés étrangères
SELECT 'CONTRAINTES FK:' as section;
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('offers', 'locations', 'companies', 'sources', 'offers_raw')
ORDER BY tc.table_name, tc.constraint_name;

-- 8. Vérifier les index
SELECT 'INDEX EXISTANTS:' as section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('offers', 'locations', 'companies', 'sources', 'offers_raw')
ORDER BY tablename, indexname;

-- 9. Extensions installées
SELECT 'EXTENSIONS INSTALLÉES:' as section;
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

-- 10. Données d'exemple (si les tables existent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sources') THEN
        RAISE NOTICE 'CONTENU TABLE SOURCES:';
    END IF;
END $$;

SELECT * FROM sources LIMIT 3;

SELECT 'DIAGNOSTIC TERMINÉ' as status; 