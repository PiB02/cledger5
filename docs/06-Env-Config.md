# 06-Env-Config.md — Configuration des variables d'environnement

> 🚫 **IMMUTABLE** — Toute modif via PR + revue CTO.  
> Version: **v1.1** — Dernière mise à jour: 2024-12-26.

## 0) Objet
Centralise toutes les variables d'environnement requises pour **cledger5** par environnement.  
Chaque variable est documentée avec sa fonction et un exemple.

---

## 1) Variables requises par environnement

### 1.1 Variables de base

| Variable | Dev | Staging | Prod | Description | Exemple |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | URL publique Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | Clé publique (anon) Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | Clé service (admin) — **SECRET** | `eyJhbGciOi...` |
| `DATABASE_URL` | ❌ | ✅ | ✅ | URL directe PostgreSQL (migrations) | `postgresql://...` |
| `OPENAI_API_KEY` | ✅ | ✅ | ✅ | Clé OpenAI (GPT-4o-mini, embeddings) | `sk-...` |
| `RESEND_API_KEY` | ❌ | ✅ | ✅ | Clé Resend (emails transactionnels) | `re_...` |
| `SITE_URL` | ✅ | ✅ | ✅ | URL publique du site | `https://app.cledger5.com` |

### 1.2 Variables d'intégration API

| Variable | Dev | Staging | Prod | Description | Exemple |
|---|---|---|---|---|---|
| `LBA_ACCESS_TOKEN` | ⚠️ | ✅ | ✅ | Token API La Bonne Alternance | `lba_...` |
| `FT_CLIENT_ID` | ⚠️ | ✅ | ✅ | Client ID France Travail OAuth2 | `PAR_...` |
| `FT_CLIENT_SECRET` | ⚠️ | ✅ | ✅ | Client Secret FT — **SECRET** | `secret_...` |
| `FT_REDIRECT_URI` | ❌ | ✅ | ✅ | URI de callback OAuth2 FT | `https://app.cledger5.com/api/auth/ft/callback` |

### 1.3 Variables de sécurité

| Variable | Dev | Staging | Prod | Description | Exemple |
|---|---|---|---|---|---|
| `ADMIN_SECRET` | ✅ | ✅ | ✅ | Secret pour endpoints admin — **SECRET** | `secure-random-string` |
| `NEXT_PUBLIC_ADMIN_SECRET` | ⚠️ | ❌ | ❌ | Secret admin côté client (dev only) | `dev-secret` |
| `APP_PII_KEY` | ❌ | ✅ | ✅ | Clé de chiffrement PII — **SECRET** | `base64-encoded-key` |
| `JWT_SECRET` | ❌ | ✅ | ✅ | Secret JWT (si custom auth) | `your-256-bit-secret` |
| `NEXTAUTH_SECRET` | ❌ | ✅ | ✅ | Secret NextAuth (si utilisé) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ❌ | ✅ | ✅ | URL NextAuth | `https://app.cledger5.com` |

## 2) Configuration par service

### 2.1 Supabase
```env
# Public (client-side safe)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Secret (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 2.2 OpenAI
```env
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-... # Optionnel
EMBED_MODEL=text-embedding-3-small
GPT_MODEL=gpt-4o-mini
```

### 2.3 Ingestion APIs

#### La Bonne Alternance (LBA)
```env
LBA_ACCESS_TOKEN=your-lba-api-token
LBA_API_URL=https://labonnealternance-api.apprentissage.beta.gouv.fr/api/v3 # Optionnel
```

#### France Travail (FT)
```env
FT_CLIENT_ID=PAR_...
FT_CLIENT_SECRET=your-secret
FT_REDIRECT_URI=https://your-app.com/api/auth/ft/callback
FT_API_URL=https://api.francetravail.io/partenaire # Optionnel
```

### 2.4 Email (Resend)
```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@cledger5.com
RESEND_FROM_NAME=cledger5
```

### 2.5 Admin & Security
```env
# Admin endpoints protection
ADMIN_SECRET=use-a-secure-random-string-here

# PII encryption (production)
APP_PII_KEY=base64-encoded-256-bit-key

# Session encryption
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://app.cledger5.com
```

## 5) Exemple fichier `.env.local` complet

```env
# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# === OPENAI ===
OPENAI_API_KEY=sk-proj-...
EMBED_MODEL=text-embedding-3-small
GPT_MODEL=gpt-4o-mini

# === INGESTION ===
LBA_ACCESS_TOKEN=lba_token_here
FT_CLIENT_ID=PAR_client_id
FT_CLIENT_SECRET=ft_secret_here

# === EMAIL ===
RESEND_API_KEY=re_...

# === SECURITY ===
ADMIN_SECRET=your-secure-admin-secret
APP_PII_KEY=base64-key-for-pii-encryption

# === APP ===
SITE_URL=http://localhost:3000
NODE_ENV=development
```

---

## 6) Notes importantes

1. **Ne jamais committer** `.env.local` ou tout fichier contenant des vraies clés
2. **Rotation des secrets** tous les 90 jours en production
3. **Variables publiques** (`NEXT_PUBLIC_*`) sont exposées côté client
4. **Service Role Key** donne accès admin total à Supabase - protéger absolument
5. **PII Key** doit être sauvegardée de façon sécurisée pour pouvoir déchiffrer les données

## 7) Commandes utiles

```bash
# Générer une clé aléatoire sécurisée
openssl rand -base64 32

# Encoder une clé en base64
echo -n "your-key" | base64

# Vérifier les variables chargées (dev)
node -e "console.log(process.env)"
```
