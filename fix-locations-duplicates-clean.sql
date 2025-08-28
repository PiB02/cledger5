-- Script pour nettoyer les doublons dans locations
-- 27/12/2024 - Correction avant contrainte unique

-- ========================================
-- ETAPE 1 : IDENTIFIER LES DOUBLONS
-- ========================================

-- Voir les doublons existants
SELECT 'Doublons trouves:' as info;
SELECT city, postal_code, COUNT(*) as count
FROM locations 
WHERE city IS NOT NULL AND postal_code IS NOT NULL
GROUP BY city, postal_code 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ========================================
-- ETAPE 2 : SUPPRIMER LES DOUBLONS
-- ========================================

-- Garder seulement le premier enregistrement de chaque doublon
-- (celui avec l'ID le plus petit - premier cree)
DELETE FROM locations 
WHERE id NOT IN (
  SELECT DISTINCT ON (city, postal_code) id
  FROM locations 
  WHERE city IS NOT NULL AND postal_code IS NOT NULL
  ORDER BY city, postal_code, id ASC
);

-- ========================================
-- ETAPE 3 : CREER LA CONTRAINTE UNIQUE
-- ========================================

-- Maintenant on peut creer la contrainte unique
CREATE UNIQUE INDEX IF NOT EXISTS locations_city_postal_unique 
ON locations(city, postal_code) 
WHERE city IS NOT NULL AND postal_code IS NOT NULL;

-- ========================================
-- ETAPE 4 : VERIFICATION
-- ========================================

SELECT 'Verification apres nettoyage:' as info;
SELECT city, postal_code, COUNT(*) as count
FROM locations 
WHERE city IS NOT NULL AND postal_code IS NOT NULL
GROUP BY city, postal_code 
HAVING COUNT(*) > 1;

SELECT 'Contrainte creee avec succes!' as status; 