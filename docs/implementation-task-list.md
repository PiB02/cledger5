# implementation-task-list.md

> **But**: guider l’IA (Cursor) pas à pas, cloud-only.  
> **Règles**: après **chaque** tâche → log + mise à jour état + **commit Git**.

## Fichiers de pilotage
- État: `.progress/state.json` `{ "lastTaskId": "T-000", "done": [], "ts":"ISO" }`
- Log: `logs/implementation.log` (`ISO | TASK | status | note`)

---

## Phase 0 — Pré-requis

- [ ] **T-000** Créer l’orga GitHub et le repo **cledger5** (privé).  
  - Commit: `chore(repo): init cledger5`

- [ ] **T-001** Créer **Supabase Cloud** EU: projets **staging** et **prod**. Activer `pgvector`.  
  - Commit: `chore(infra): record supabase refs`

- [ ] **T-002** Créer **Vercel** relié au repo. Envs **Preview/Prod**.  
  - Commit: `chore(infra): link vercel`

- [ ] **T-003** Secrets (Vercel + Supabase). Remplir `.env.local` (staging).  
  - Commit: `chore(env): add .env.example and docs`

- [ ] **T-004** CI GitHub Actions (lint/tests + migrations dry-run + `supabase db push` staging).  
  - Commit: `chore(ci): add github actions`

---

## Phase 1 — Bootstrap monorepo

- [ ] **T-010** Next.js App Router + Tailwind.  
  - Commit: `feat(web): init next app`

- [ ] **T-011** shadcn/ui de base.  
  - Commit: `feat(ui): add shadcn base`

- [ ] **T-012** Supabase clients (server/client) pointant **staging cloud**.  
  - Commit: `chore(web): supabase clients`

- [ ] **T-013** Structure repo (PRD).  
  - Commit: `chore(repo): scaffold features`

- [ ] **T-014** Copier tous les MD dans `/docs`.  
  - Commit: `docs: add specs`

- [ ] **T-015** `.cursor/config.json` MCP (lecture seule).  
  - Commit: `chore(cursor): add mcp config`

---

## Phase 2 — Migrations cloud

- [ ] **T-020** Écrire migrations SQL selon `01-DB-Architecture.md`.  
  - Commit: `feat(db): add initial schema`

- [ ] **T-021** Lier et pousser sur **staging**:  
  ```bash
  supabase link --project-ref <STAGING_REF>
  supabase db push
  ```
  - Commit: `chore(db): push schema to staging`

- [ ] **T-022** Seeds **staging** (référentiels minimaux) via scripts SQL.  
  - Commit: `chore(db): seed staging refs`

---

## Phase 3 — Backend fondations

- [ ] **T-030** `/api/search/offers`, `/api/offers/[id]`.  
  - Commit: `feat(api): offers search & detail`

- [ ] **T-031** `errorFactory` + middleware.  
  - Commit: `chore(api): error handling`

- [ ] **T-032** SSE `/api/batch/[id]/stream`.  
  - Commit: `feat(api): sse endpoint`

---

## Phase 4 — UI V1

- [ ] **T-040** Liste offres + filtres.  
  - Commit: `feat(offers): list with filters`

- [ ] **T-041** Fiche offre.  
  - Commit: `feat(offers): detail page`

- [ ] **T-042** KPI admin basiques.  
  - Commit: `feat(admin): kpi v1`

---

## Phase 5 — Ingestion LBA

- [ ] **T-050** `/api/ingest/offers/lba` (cloud quotas, logs).  
  - Commit: `feat(ingest): lba route`

- [ ] **T-051** Dédup inter-sources.  
  - Commit: `feat(ingest): cross-source dedup`

- [ ] **T-052** Batch Manager + SSE.  
  - Commit: `feat(batches): manager ui + sse`

---

## Phase 6 — IA Offres

- [ ] **T-060** `offer_enrichment` (GPT-4o-mini).  
  - Commit: `feat(ai): offer enrichment`

- [ ] **T-061** Onglet Analyse IA.  
  - Commit: `feat(offers): ia tab`

---

## Phase 7 — Embeddings & matching

- [ ] **T-070** Builder texte commun. Tests golden.  
  - Commit: `feat(ml): embedding text builder`

- [ ] **T-071** `offer_embeddings` (1536-d) + HNSW.  
  - Commit: `feat(ml): offer embeddings`

- [ ] **T-072** Filtre ANN dans `/api/search/offers`.  
  - Commit: `feat(search): ann vector filter`

---

## Phase 8 — France Travail

- [ ] **T-080** `/api/ingest/offers/ft` (OAuth2).  
  - Commit: `feat(ingest): ft route`

- [ ] **T-081** Politique dédup FT↔LBA.  
  - Commit: `chore(ingest): ft dedup`

---

## Phase 9 — Batchs pilotés

- [ ] **T-090** Estimation coût/temps.  
  - Commit: `feat(batches): estimator`

- [ ] **T-091** Événements SSE complets.  
  - Commit: `chore(batches): sse events`

---

## Phase 10 — Candidat (V6–V7)

- [ ] **T-100** Upload PDF + CGU + timeline.  
  - Commit: `feat(candidate): upload + cgu`

- [ ] **T-101** Parsing IA CV + re-embedding synchrone.  
  - Commit: `feat(candidate): cv parse + embed`

- [ ] **T-102** Pages profil/offres/paramètres.  
  - Commit: `feat(candidate): profile/offers/settings`

- [ ] **T-103** Double opt-in + mot de passe.  
  - Commit: `feat(auth): email confirm + password set`

---

## Phase 11 — Qualité & monitoring

- [ ] **T-110** Tests (Vitest/Playwright) ≥ 80 %.  
  - Commit: `test(all): baseline`

- [ ] **T-111** KPI journaliers + vues publiques 30j.  
  - Commit: `feat(kpi): daily + public 30d`

---

## Phase 12 — Livraison

- [ ] **T-120** Go/NoGo V1…V7 selon PRD.

---

## Logs & reprise
- Après chaque tâche: append `logs/implementation.log` et MAJ `.progress/state.json`, puis **commit**.
- En cas d’échec: `fail` + cause, stopper, ouvrir ticket. Reprise = prochaine tâche non cochée.
