-- Diagnostic Script for offer_enrichment table issues
-- Run this to understand the current state and conflicts

SELECT '=== DIAGNOSTIC OFFER_ENRICHMENT TABLE ===' as section;

-- 1. Check if table exists and its structure
SELECT 'Current table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'offer_enrichment'
ORDER BY ordinal_position;

-- 2. Check constraints
SELECT 'Current constraints:' as info;
SELECT 
  constraint_name, 
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'offer_enrichment';

-- 3. Check foreign keys
SELECT 'Current foreign keys:' as info;
SELECT 
  kcu.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu 
  ON kcu.constraint_name = ccu.constraint_name
WHERE kcu.table_schema = 'public' 
  AND kcu.table_name = 'offer_enrichment'
  AND kcu.constraint_name LIKE '%fkey%';

-- 4. Check indexes
SELECT 'Current indexes:' as info;
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'offer_enrichment' 
  AND schemaname = 'public';

-- 5. Check RLS policies
SELECT 'Current RLS policies:' as info;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'offer_enrichment' 
  AND schemaname = 'public';

-- 6. Check data count
SELECT 'Current data count:' as info;
SELECT COUNT(*) as total_rows FROM offer_enrichment;

-- 7. Check offers table reference
SELECT 'Offers table validation:' as info;
SELECT 
  'offers.id column exists' as check_result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'offers' 
  AND column_name = 'id' 
  AND data_type = 'uuid';

-- 8. Check for extension dependencies
SELECT 'Required extensions status:' as info;
SELECT 
  name,
  installed_version IS NOT NULL as is_installed
FROM pg_available_extensions 
WHERE name IN ('uuid-ossp', 'vector', 'pgcrypto')
ORDER BY name;

-- 9. Sample data preview (if any)
SELECT 'Sample data (first 5 rows):' as info;
SELECT * FROM offer_enrichment LIMIT 5;

SELECT '=== END DIAGNOSTIC ===' as section;