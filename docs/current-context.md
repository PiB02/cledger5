# Current Project Context
*Auto-loaded by Claude Code - Last Updated: 31/08/2025*

## 🚀 Current Project Status: cledger5

**cledger5** est une plateforme de matching emploi intelligente pour le marché français utilisant IA et matching vectoriel.

### **Stack Technique**
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui  
- **Backend**: Next.js Route Handlers + Supabase Cloud (EU)
- **Database**: Postgres + pgvector (embeddings 1536d) + partitioning
- **AI**: OpenAI GPT-4o-mini (extraction) + text-embedding-3-small (matching)
- **External APIs**: LBA (La Bonne Alternance) + France Travail

## 🎯 Current Phase: **Phase 7 - AI Enhancement**

### ✅ **Phases Completed (0-6)**
- **Phase 0**: Setup environnement (GitHub, Supabase, Vercel, secrets) ✅
- **Phase 1**: Bootstrap Next.js + shadcn/ui + monorepo structure ✅  
- **Phase 2**: Database schema + migrations + seed data ✅
- **Phase 3**: Backend APIs (search, detail, SSE streaming) ✅
- **Phase 4**: UI V1 (pages recherche, détail, admin dashboard) ✅
- **Phase 5**: Ingestion LBA **100% fonctionnelle** ✅
- **Phase 6**: Canonicalisation et déduplication **COMPLÈTE** ✅

### 🚀 **Phase 7 En Cours: AI Enhancement**
- **GPT-4o-mini** pour extraction compétences/séniorité (≥0.80 confidence)
- Pipeline enrichissement offres avec validation
- Interface admin pour monitoring IA

## 🔧 **APIs 100% Fonctionnelles**
1. `GET /api/health` - Connexion Supabase ✅
2. `GET /api/search/offers` - Recherche avec filtres, pagination ✅  
3. `GET /api/offers/[id]` - Détail complet avec relations ✅
4. `GET /api/batch/[id]/stream` - SSE streaming temps réel ✅
5. `POST /api/ingest/lba` - **Ingestion LBA 183 offres** ✅
6. `POST /api/canonicalize` - **Pipeline canonicalisation complet** ✅
7. `GET /api/canonicalize` - Statistiques canonicalisation ✅

## 🏗️ **Architecture Actuelle**

### **Database Schema**
- `offers_raw` : Données brutes partitionnées par mois ✅  
- `offers` : Données canoniques enrichies ✅
- `companies`, `locations` : Référentiels normalisés ✅
- `offer_sources` : Gestion des sources multiples ✅
- Système fingerprinting pour déduplication ✅

### **Pages UI Disponibles**
- `/` - Page d'accueil ✅
- `/offres` - Recherche avec filtres avancés ✅
- `/offres/[id]` - Détail offre complet ✅
- `/admin` - Dashboard KPIs et monitoring ✅  
- `/admin/ingestion` - Interface ingestion LBA sécurisée ✅
- `/admin/canonicalization` - **Interface canonicalisation temps réel** ✅

## ⚠️ **Issues Connues**
- **Character encoding**: é → Ã© dans les réponses API
- **SSE simulation**: Besoin Supabase Realtime pour production  
- **Performance**: Search ~1200ms (target <500ms) - optimisation nécessaire

## 📋 **Prochaines Actions (Ordre de Priorité)**
1. **🎯 AI enrichment** : GPT-4o-mini extraction compétences/séniorité (EN COURS)
2. **Embeddings** : text-embedding-3-small pour matching vectoriel
3. **Auth implementation** : Setup Supabase Auth + RLS
4. **Candidate features** : CV upload et profil candidat  
5. **France Travail integration** : OAuth2 + ingestion FT

## 🔑 **Configuration Critique**

### **Supabase Cloud (EU)**
- Toutes les tables créées selon 01-DB-Architecture.md ✅
- RLS activé sur données sensibles ✅
- Partitioning `offers_raw` par mois ✅
- Index HNSW prêts pour embeddings ✅

### **Sécurité**
- Variables sensibles côté serveur uniquement ✅
- Server Actions pour opérations admin ✅
- `ADMIN_SECRET` jamais exposé côté client ✅
- Validation environnement au démarrage ✅

### **Ingestion LBA**  
- URL correcte: `labonnealternance.apprentissage.beta.gouv.fr/api/V1` ✅
- Paramètres requis: `caller`, `romes`, `insee` ✅
- Gestion multi-structures (peJobs, partnerJobs, matchas) ✅
- Schéma ultra-flexible pour données incomplètes ✅

## 🎯 **Objectifs Performance**
- Search: <500ms p95 (actuel: ~1200ms)
- Job details: <700ms p95 (actuel: ~1000ms)  
- SSE streaming: <2s delay (actuel: ~2s) ✅

## 📦 **Monorepo Packages**
- `@cledger5/types` - Schemas Zod complets ✅
- `@cledger5/utils` - Embedding builder + normalizers ✅  
- `@cledger5/api-clients` - SDK LBA/FT ✅

## 🔧 **Commandes Essentielles**
```powershell
# Développement  
pnpm dev              # Start avec Turbopack
pnpm build            # Build production
pnpm lint             # ESLint

# Tests APIs
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
Invoke-RestMethod -Uri "http://localhost:3000/api/search/offers"
```

## 📚 **Documentation de Référence**
- `docs/00-cledger5-PRD.md` - Requirements produit complets
- `docs/01-DB-Architecture.md` - Schéma database + RLS  
- `docs/development-history.md` - Historique développement détaillé
- `docs/troubleshooting-guide.md` - Issues résolus + solutions
- `docs/task-roadmap.md` - Feuille de route phases 0-12

---
*Fichier auto-chargé par Claude Code pour contexte projet immédiat*