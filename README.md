# cledger5

Ingestion d’offres (LBA, FT), parsing CV, enrichissement IA, embeddings, matching, UX explicatives.

## Stack
Next.js (App Router), Supabase Cloud (Postgres/Auth/Edge/Storage/Realtime), Tailwind + shadcn/ui, OpenAI (GPT-4o-mini + text-embedding-3-small 1536-d), Resend, pgvector, SSE.

## Prérequis
- Node 18+
- Supabase **Cloud** (projets **staging** et **prod** en EU)
- Vercel (EU)
- Clés API OpenAI, Resend, FT, LBA
- Supabase CLI (pour lier et pousser les migrations en **cloud**)

## Démarrage (cloud-only)
1. Crée deux projets Supabase EU: **staging** et **prod**. Active `pgvector`.
2. Lie le repo au projet **staging** (machine locale ou CI):
   ```bash
   supabase link --project-ref <STAGING_REF>
   supabase db push      # applique les migrations au cloud staging
   ```
3. Configure `.env.local` avec les **variables cloud** (voir `06-Env-Config.md`).
4. Lance le web:
   ```bash
   pnpm i
   pnpm dev
   ```

## Déploiement
- DB: `supabase link --project-ref <REF>` puis `supabase db push` (staging). Prod via GitHub Action sur tag.
- Web: Vercel relié au repo. Env **staging** pointant vers Supabase **staging**.
- Cron: Vercel cron ou Edge Functions planifiées.

## Documentation
- PRD: `00-cledger5-PRD.md`
- DB: `01-DB-Architecture.md`, `02-DB-SQL-Queries.md`
- Intégrations: `03-FT-Integration.md`, `04-LBA-Integration.md`
- Règles dev: `05-Cursor-Dev-Rules.md`
- Config env: `06-Env-Config.md`
- Contrats API internes: `07-API-Contracts.md`
- SSE: `08-SSE-Protocols.md`
- Runbooks: `09-Runbooks.md`
- MCP: `10-MCP-Config.md`
- Tests: `11-Testing-Strategy.md`
- Emails: `12-Email-Templates.md`
- Prompting: `13-Prompting-Guidelines.md`

## Lint, tests, qualité
```bash
pnpm lint
pnpm test        # Vitest
pnpm test:e2e    # Playwright
```

## Sécurité
RLS partout. PII chiffrées. Rotation clés 90 j. Voir `05-Cursor-Dev-Rules.md` et `09-Runbooks.md`.
