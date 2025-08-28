# 09-Runbooks.md — Exploitation (Cloud only)

## Déploiement DB (staging)
```bash
supabase link --project-ref <STAGING_REF>
supabase db push
```
Prod: via GitHub Action sur tag (`supabase link --project-ref <PROD_REF>` puis `db push`).

## Déploiement Web
- Vercel connecté au repo. Environnement **Preview/Production** pointant vers les bons projets Supabase.
- Regions EU.

## Rollback
- Web: redeployer la précédente sur Vercel.
- DB: migration de rollback. Ne pas modifier la prod via console.

## Rotation `APP_PII_KEY`
1) Ajouter `APP_PII_KEY_NEXT` en env.  
2) Lancer Edge Function `rotate_pii` (cloud) pour re-chiffrer.  
3) Basculer, vérifier, supprimer ancienne clé.

## Quotas LBA/FT
- 429: backoff + jitter, réduire perPage, log `ingest_runs_offers`.

## Incidents OpenAI
- Basculer modèle fallback, suspendre batchs, reprendre.
