# 05-Cursor-Dev-Rules.md

> 🚫 **NE PAS MODIFIER SANS ACCORD ÉCRIT DU CTO**  
> Projet: **cledger5** — Stack: Next.js · Supabase Cloud (EU) · Tailwind + shadcn/ui · OpenAI · Resend · pgvector · SSE  
> Version: v1.1 — 2025-08-25 (cloud-only)

## 1) Règles critiques (bloquantes)

1. **Schéma & migrations (cloud)**
   - Migrations SQL **écrites et versionnées** dans `/supabase/migrations`.
   - Application via `supabase link --project-ref <REF>` + `supabase db push` (**staging**). Prod via CI sur tag.
   - **Interdit**: modifier le schéma en console prod.

2. **Surfaces sensibles**
   - Endpoints réservés: `/api/cv/*`, `/api/ingest/*`, `/api/batch*`, `/rgpd/*`.
   - Aucun renommage sans RFC CTO.

3. **Config & secrets**
   - Secrets via Vercel env et variables chiffrées Supabase. Rotation 90 j, TTL tokens ≤ 60 min.
   - Aucune clé en clair dans code/logs.

4. **RLS & PII**
   - RLS stricte. Accès PII via fonctions sécurisées. `APP_PII_KEY` serveur only. Rotation staged.

5. **Sources externes**
   - LBA non lucratif. FT OAuth2 + quotas. Respect CGU.

6. **Sécurité Web**
   - CSRF pour POST mutatifs. CSP stricte. Pas d’HTML non sanitizé.

7. **Performance**
   - p95: recherche < 500 ms, fiche < 700 ms, SSE delay < 2 s.

## 2) Conventions
- DB snake_case pluriel, API kebab-case, TS camelCase / PascalCase.
- `errorFactory` + `httpErrorMap` centralisés.
- Nouvelle lib → approbation.

## 3) Base de données (Cloud)
- Migrations incluent tables, index, RLS, fonctions, vues KPI, HNSW.
- `offers_raw` partition mensuelle; `match_scores` partition si > 5M.
- Re-embedding immédiat si champs critiques changent.

## 4) Intégrations externes
- **LBA**: Bearer, 5–20 req/s, datasets opportunités, dédup FT.
- **FT**: OAuth2, 10 req/s, référentiels.

## 5) IA & embeddings
- Prompts versionnés (`/prompts`). JSON strict. Seuil required 0.80.
- Texte d’embedding **commun** (PRD §3.1). Tests golden.

## 6) Backend
- Route Handlers. SSE `/api/batch/:id/stream`. Retries backoff + jitter. Logs sans PII.

## 7) Frontend
- Pas d’appel OpenAI côté client. UI process feedback pour traitements longs.

## 8) Sécurité & RGPD
- PII chiffrées. Rétentions (CV 6 mois). Droits RGPD exposés V6.
- Hébergement EU uniquement.

## 9) Tests & CI/CD
- ESLint, Vitest, Playwright. Couverture ≥ 80 %.
- CI GitHub Actions: lint/tests, `supabase db push` **staging** sur `main`; prod sur tag.

## 10) PR & docs
- Une PR = un ticket. Docs mises à jour (`/docs`). Fichiers immuables listés.

## 11) MCP
- Allowlist (GitHub RO, Vercel RO+preview, http RO vers LBA/FT/Context7, OpenAPI FT/LBA). Aucune écriture prod via MCP.

## 12) Références utiles

- PRD: `docs/00-cledger5-PRD.md`  
- Intégrations: `docs/03-FT-Integration.md`, `docs/04-LBA-Integration.md`  
- DB & requêtes: `docs/01-DB-Architecture.md`, `docs/02-DB-SQL-Queries.md`  
- OWASP Secrets Management Cheat Sheet  
- Rapid API Key Security Guide

## 13) IMPORTANT+++

- Pour implémenter les best practices interroge toujours le serveur MCP Context7.
- Pour débugging ou nouvelles fonctionnalitées va chercher les best practices interroge toujours le serveur MCP Context7.
- le powershell de windows n'accepte pas les &&.
