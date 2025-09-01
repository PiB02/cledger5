# Current Project Context
*Auto-loaded by Claude Code - Last Updated: 01/09/2025*

## 🚀 Current Project Status: cledger5

**cledger5** est une plateforme de matching emploi intelligente pour le marché français utilisant IA et matching vectoriel.

### **Stack Technique**
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui  
- **Backend**: Next.js Route Handlers + Supabase Cloud (EU)
- **Database**: Postgres + pgvector (embeddings 1536d) + partitioning + HNSW
- **AI**: OpenAI GPT-4o-mini (extraction) + text-embedding-3-small (matching sémantique)
- **External APIs**: LBA (La Bonne Alternance) + France Travail

## 🎯 Current Phase: **Phase 9 - Authentication & Security**

### ✅ **Phases Completed (0-8)**
- **Phase 0**: Setup environnement (GitHub, Supabase, Vercel, secrets) ✅
- **Phase 1**: Bootstrap Next.js + shadcn/ui + monorepo structure ✅  
- **Phase 2**: Database schema + migrations + seed data ✅
- **Phase 3**: Backend APIs (search, detail, SSE streaming) ✅
- **Phase 4**: UI V1 (pages recherche, détail, admin dashboard) ✅
- **Phase 5**: Ingestion LBA **100% fonctionnelle** ✅
- **Phase 6**: Canonicalisation et déduplication **COMPLÈTE** ✅
- **Phase 7**: AI Enhancement (GPT-4o-mini enrichissement) **COMPLÈTE** ✅
- **Phase 8**: Embeddings + Vector Matching **COMPLÈTE** ✅

### 🎉 **Phase 8: Embeddings + Vector Matching - COMPLÈTE**

#### ✅ **Semantic Search System - OPÉRATIONNEL**
- **Model**: OpenAI text-embedding-3-small (1536 dimensions) ✅
- **API Endpoints**: `/api/embeddings/generate`, `/api/embeddings/queue` ✅
- **Search Enhancement**: `semantic_search=true`, `hybrid_search=true` ✅
- **HNSW Index**: Production-optimized (m=32, ef=128) ✅
- **Performance**: <500ms p95 target, cosine similarity ✅

#### ✅ **Vector Database Implementation**
- **Tables**: `offer_embeddings`, `offer_embeddings_log` ✅
- **Function**: `match_offers_semantic()` PostgreSQL function ✅
- **Triggers**: Auto re-embedding sur changement données ✅
- **Monitoring**: `v_reembedding_activity` view ✅

#### ✅ **Admin Dashboard Embeddings - COMPLET**
- **Dashboard**: `/admin/embeddings` avec métriques temps réel ✅
- **Queue Management**: Processing automatique et force-regenerate ✅
- **Performance Testing**: Benchmarks intégrés ✅
- **Activity Monitoring**: Log re-embedding et statistics ✅

## 🔧 **APIs 100% Fonctionnelles**
1. `GET /api/health` - Connexion Supabase ✅
2. `GET /api/search/offers` - **Recherche avec semantic/hybrid search** ✅  
3. `GET /api/offers/[id]` - Détail complet avec relations ✅
4. `GET /api/batch/[id]/stream` - SSE streaming temps réel ✅
5. `POST /api/ingest/lba` - **Ingestion LBA 2002 offres** ✅
6. `POST /api/canonicalize` - **Pipeline canonicalisation complet** ✅
7. `GET /api/canonicalize` - Statistiques canonicalisation ✅
8. `POST /api/enrich/offers` - **Enrichissement IA GPT-4o-mini** ✅
9. `POST /api/enrich/queue` - **Queue worker enrichissement** ✅
10. `GET /api/admin/enrich/stats` - **Statistiques enrichissement pour dashboard** ✅
11. `POST /api/embeddings/generate` - **Génération embeddings OpenAI** ✅
12. `POST /api/embeddings/queue` - **Queue worker embeddings** ✅
13. `GET /api/admin/embeddings/activity` - **Log activité re-embedding** ✅

## 🏗️ **Architecture Actuelle**

### **Database Schema**
- `offers_raw` : Données brutes partitionnées par mois ✅  
- `offers` : Données canoniques enrichies ✅
- `companies`, `locations` : Référentiels normalisés ✅
- `offer_sources` : Gestion des sources multiples ✅
- `offer_enrichment` : **Enrichissement IA avec GPT-4o-mini** ✅
- `offer_embeddings` : **Embeddings vectoriels 1536d avec HNSW** ✅
- `offer_embeddings_log` : **Log activité re-embedding automatique** ✅
- Système fingerprinting pour déduplication ✅

### **Pages UI Disponibles**
- `/` - Page d'accueil ✅
- `/offres` - **Recherche avec semantic/hybrid search** ✅
- `/offres/[id]` - **Détail offre avec embedding text preview** ✅
- `/admin` - Dashboard KPIs et monitoring ✅  
- `/admin/ingestion` - Interface ingestion LBA sécurisée ✅
- `/admin/canonicalization` - **Interface canonicalisation temps réel** ✅
- `/admin/enrichment` - **Dashboard enrichissement IA avec métriques** ✅
- `/admin/embeddings` - **Dashboard embeddings et vector search** ✅

## ⚠️ **Issues Connues**
- **Character encoding**: é → Ã© dans les réponses API
- **SSE simulation**: Besoin Supabase Realtime pour production  

## 📋 **Prochaines Actions (Ordre de Priorité)**
1. **🔐 Authentication** : Setup Supabase Auth + RLS complet (Phase 9)
2. **👤 Candidate Profiles** : CV upload et profil candidat avec embeddings (Phase 10)  
3. **🇫🇷 France Travail integration** : OAuth2 + ingestion FT (Phase 11)
4. **🚀 Production optimization** : Performance + monitoring (Phase 12)

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
- **Semantic Search**: <500ms p95 avec HNSW optimisé ✅
- **Embedding Generation**: <2s per offer en batch ✅
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