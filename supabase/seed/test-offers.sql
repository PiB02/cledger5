-- Seed data for testing

-- Insert NAF codes if they don't exist
INSERT INTO naf_codes (code, label)
VALUES 
  ('62.01Z', 'Programmation informatique'),
  ('63.11Z', 'Traitement de données, hébergement et activités connexes')
ON CONFLICT (code) DO NOTHING;

-- Insert sources if they don't exist
INSERT INTO sources (id, label)
VALUES
  ('LBA', 'La Bonne Alternance'),
  ('FT', 'France Travail')
ON CONFLICT (id) DO NOTHING;

-- Insert test companies
INSERT INTO companies (id, name, brand, siret, naf_code, website, size_range)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TechCorp France', 'TechCorp', '12345678901234', '62.01Z', 'https://techcorp.fr', '50-249'),
  ('22222222-2222-2222-2222-222222222222', 'DataSolutions', 'DataSol', '98765432109876', '63.11Z', 'https://datasol.fr', '10-49')
ON CONFLICT (id) DO NOTHING;

-- Insert test locations
INSERT INTO locations (id, city, postal_code, department_code, region_code, country_code)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Paris', '75001', '75', '11', 'FR'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lyon', '69001', '69', '84', 'FR')
ON CONFLICT (id) DO NOTHING;

-- Insert test offers
INSERT INTO offers (
  id,
  canonical_fingerprint,
  title,
  description,
  status,
  alternance,
  contract_type_code,
  work_mode_code,
  salary_min,
  salary_max,
  salary_currency,
  salary_period_code,
  rome_codes,
  company_id,
  location_id,
  source_primary,
  created_at,
  expiration_at
)
VALUES
  (
    'd0000001-0000-4000-8000-000000000001',
    'developpeur_fullstack_techcorp_paris_cdi',
    'Développeur Full-Stack React/Node.js',
    'Nous recherchons un développeur Full-Stack passionné pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants avec les dernières technologies.',
    'active',
    false,
    'CDI',
    'hybrid',
    45000,
    65000,
    'EUR',
    'year',
    ARRAY['M1805', 'M1810'],
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'LBA',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '30 days'
  ),
  (
    'd0000002-0000-4000-8000-000000000002',
    'data_analyst_datasol_lyon_cdd',
    'Data Analyst - Alternance',
    'Rejoignez notre équipe data en alternance ! Vous participerez à l''analyse des données clients et à la création de dashboards.',
    'active',
    true,
    'APP',
    'onsite',
    28000,
    32000,
    'EUR',
    'year',
    ARRAY['M1403'],
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'FT',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '60 days'
  ),
  (
    'd0000003-0000-4000-8000-000000000003',
    'devops_engineer_techcorp_paris_cdi',
    'DevOps Engineer Senior',
    'Nous recherchons un DevOps Engineer senior pour automatiser et optimiser notre infrastructure cloud.',
    'active',
    false,
    'CDI',
    'remote',
    55000,
    75000,
    'EUR',
    'year',
    ARRAY['M1802'],
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'LBA',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '45 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Update search_tsv for inserted offers (trigger should handle this but let's be sure)
UPDATE offers 
SET search_tsv = to_tsvector('french_unaccent', 
  coalesce(title, '') || ' ' || 
  coalesce(description, '') || ' ' || 
  coalesce(array_to_string(rome_codes, ' '), '')
)
WHERE search_tsv IS NULL; 