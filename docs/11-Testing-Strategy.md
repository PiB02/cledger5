# 11-Testing-Strategy.md — Stratégie de tests (Cloud)

## Cibles
- **Staging Supabase** dédié aux tests/intégration/E2E.
- **Jamais** la prod.

## Outils
ESLint + Prettier, Vitest, Playwright, k6.

## Seuils
Couverture ≥ 80 %. P95: recherche < 500 ms, fiche < 700 ms, SSE delay < 2 s.

## Pyramide
- Unitaires: utils, mapping LBA/FT, embedding builder, normalisation skills.
- Intégration: RLS par rôle (staging), SQL `02-DB-SQL-Queries.md`.
- E2E (staging):
  1) Upload CV → parse → embed → profil visible. 
  2) Recherche offres → fiche. 
  3) Batch LBA → SSE → résultats.

## Données de test
- Seeds **staging** via `supabase db push` + scripts SQL.  
- Nettoyage périodique via job (truncate tables non PII).
