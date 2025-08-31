# Task Roadmap - cledger5
*Auto-loaded by Claude Code - Complete Implementation Roadmap - Last Updated: 31/08/2025*

## 🎯 **Vue d'Ensemble du Roadmap**

**Objectif** : Développement structuré de cledger5 en 12 phases avec suivi précis des tâches.  
**Statut Actuel** : **Phase 7 - AI Enhancement** (EN COURS)

### **📊 Progression Globale : 50% (6/12 phases complétées)**

---

## ✅ **PHASES COMPLÉTÉES (0-6)**

### **Phase 0 - Pré-requis ✅** 
*Complété : 27/12/2024*
- ✅ **T-000** GitHub repo privé créé
- ✅ **T-001** Supabase Cloud EU (staging/prod) + pgvector  
- ✅ **T-002** Vercel projet lié + environnements
- ✅ **T-003** Secrets configurés + `.env.local` complet
- ✅ **T-004** CI/CD structure (à finaliser)

### **Phase 1 - Bootstrap ✅**
*Complété : 26/12/2024*
- ✅ **T-010** Next.js 15 App Router + Tailwind
- ✅ **T-011** shadcn/ui base + dark mode + composants
- ✅ **T-012** Clients Supabase (server/client/route/service)  
- ✅ **T-013** Structure repo selon PRD 4.4
- ✅ **T-014** Documentation complète dans `/docs`
- ✅ **T-015** MCP config (Context7, Playwright)

### **Phase 2 - Database ✅**
*Complété : 26/12/2024*  
- ✅ **T-020** Migrations SQL selon 01-DB-Architecture.md
- ✅ **T-021** Supabase Cloud linkage + schema push
- ✅ **T-022** Seeds staging (référentiels + test data)

### **Phase 3 - Backend APIs ✅**
*Complété : 26/12/2024*
- ✅ **T-030** `/api/search/offers` + `/api/offers/[id]`
- ✅ **T-031** `errorFactory` + middleware + error handling
- ✅ **T-032** SSE `/api/batch/[id]/stream`

### **Phase 4 - UI V1 ✅** 
*Complété : 26/12/2024*
- ✅ **T-040** Pages recherche offres + filtres + pagination
- ✅ **T-041** Fiche offre détaillée + responsive  
- ✅ **T-042** Dashboard admin KPIs + monitoring

### **Phase 5 - Ingestion LBA ✅**
*100% Fonctionnel : 27/12/2024*
- ✅ **T-050** `/api/ingest/lba` (183 offres ingérées avec succès)
- ✅ **T-051** Gestion multi-sources + schémas ultra-flexibles
- ✅ **T-052** Batch Manager + SSE temps réel

### **Phase 6 - Canonicalisation ✅**  
*Pipeline Complet : 28/08/2025*
- ✅ **T-060** Déduplication intelligente (fingerprinting)
- ✅ **T-061** Pipeline `offers_raw` → `offers` + `companies` + `locations`
- ✅ **T-062** Interface admin canonicalisation + monitoring temps réel

---

## 🚀 **PHASE ACTUELLE : 7 - AI Enhancement**
*Statut : EN COURS - Priorité #1*

### **Objectifs Phase 7**
- **GPT-4o-mini** pour extraction compétences + séniorité  
- **Seuil confidence** ≥ 0.80 pour qualité garantie
- **Interface admin** monitoring enrichissement IA
- **Pipeline automatisé** offers → AI analysis → enriched offers

### **Tâches Phase 7**
- [ ] **T-070** API `/api/enrich/offers` avec GPT-4o-mini
  - Extraction : skills, seniority, languages, degree requirements
  - Validation confidence scores ≥ 0.80
  - Stockage résultats dans `offer_enrichment`
  
- [ ] **T-071** Interface admin enrichissement IA
  - Dashboard monitoring enrichissement temps réel
  - Contrôles par batch d'offres
  - Statistiques qualité + coûts API
  
- [ ] **T-072** Integration pipeline canonicalisation → enrichissement  
  - Auto-trigger enrichissement après canonicalisation
  - Gestion queue processing
  - Retry logic + error handling

---

## 📋 **PHASES À VENIR (8-12)**

### **Phase 8 - Embeddings & Matching Vectoriel**
*Priorité : #2*
- [ ] **T-080** Builder texte commun standardisé (critical!)
  - Format PRD 3.1 : TITLE|ROME|LOCATION|SENIORITY|etc.
  - ≤1500 chars + normalisation skills
  - Tests golden dataset
  
- [ ] **T-081** `offer_embeddings` (text-embedding-3-small 1536d)
  - HNSW indexing pgvector optimisé  
  - Re-embedding triggers sur changements critiques
  - Performance caching stratégique
  
- [ ] **T-082** Filtre ANN dans `/api/search/offers`
  - Semantic search avec similarité cosinus
  - Hybrid search (full-text + vectoriel)
  - Boost factors configurables

### **Phase 9 - Auth & Security**
*Priorité : #3*
- [ ] **T-090** Supabase Auth implementation
  - Email/password + social providers
  - RLS policies complètes toutes tables
  - Admin vs Candidate roles
  
- [ ] **T-091** Candidate profile security
  - PII encryption avec `APP_PII_KEY`
  - GDPR compliance + data retention
  - Anonymisation pipeline

### **Phase 10 - France Travail Integration**
*Priorité : #4* 
- [ ] **T-100** OAuth2 France Travail setup
  - Client credentials flow
  - Token refresh automatique  
  - Rate limiting 10 req/s compliance
  
- [ ] **T-101** `/api/ingest/ft` avec déduplication LBA↔FT
  - Cross-source fingerprinting avancé
  - Politique priorité sources (LBA vs FT)
  - Merge conflicts resolution

### **Phase 11 - Candidate Features**
*Priorité : #5*
- [ ] **T-110** CV upload + parsing IA  
  - PDF parsing avec extraction structurée
  - Timeline upload + CGU acceptance
  - PII encryption systématique
  
- [ ] **T-111** Profil candidat + matching
  - CV → embedding standardisé (même format offres)
  - Matching vectoriel candidat ↔ offres
  - Explications matching + scoring
  
- [ ] **T-112** Interface candidat complète
  - Pages : profil/offres/paramètres/historique
  - Double opt-in email + password set
  - Notifications matching temps réel

### **Phase 12 - Production & Monitoring** 
*Priorité : #6*
- [ ] **T-120** Tests automatisés ≥ 80% coverage
  - Vitest unit tests (packages + API routes)
  - Playwright E2E tests (user flows critiques)
  - Performance benchmarks CI/CD
  
- [ ] **T-121** KPI + monitoring production
  - Métriques journalières business
  - Dashboards publics (30j data)
  - Alerting seuils critiques
  
- [ ] **T-122** Performance optimization finale
  - Search <500ms p95 (actuel: ~1200ms)
  - Job details <700ms p95 (actuel: ~1000ms)
  - CDN + caching stratégique

---

## 🔄 **PROCESSUS DE DÉVELOPPEMENT**

### **Règles de Suivi**
1. **Après chaque tâche** → commit Git avec message standardisé
2. **Mise à jour état** → current-context.md + development-history.md
3. **Log implémentation** → `logs/implementation.log` (ISO | TASK | status | note)
4. **Échec/blocage** → documentation troubleshooting.md

### **Pattern Commits**  
```git
feat(ai): implement GPT-4o-mini enrichment pipeline    # T-070
feat(admin): add ai enrichment monitoring dashboard   # T-071  
chore(pipeline): integrate canonicalization → ai      # T-072
```

### **État Progression**
```json
// .progress/state.json (à créer)
{
  "lastTaskId": "T-062",
  "currentPhase": 7,
  "done": ["T-000", "T-001", ..., "T-062"],
  "inProgress": ["T-070"],
  "timestamp": "2025-08-31T17:00:00.000Z"
}
```

---

## 🎯 **PRIORITÉS IMMÉDIATES**

### **Cette Semaine**
1. **T-070** : API enrichissement GPT-4o-mini (skills extraction)
2. **T-071** : Interface admin monitoring IA 
3. **Tests** : Validation pipeline enrichissement

### **Prochaines 2 Semaines**
1. **T-072** : Integration canonicalisation → enrichissement
2. **T-080** : Début Phase 8 - Embedding text builder
3. **Performance** : Optimisation search queries

### **Ce Mois**
1. **Phase 8 complète** : Embeddings + matching vectoriel
2. **Début Phase 9** : Auth Supabase + RLS
3. **CI/CD** : Tests automatisés baseline

---

## 📊 **MÉTRIQUES DE SUCCÈS**

### **Par Phase**
- **Phase 7** : 95%+ offres enrichies avec confidence ≥0.80
- **Phase 8** : Matching vectoriel <2s response time
- **Phase 9** : 100% tables avec RLS + auth fonctionnelle
- **Phase 10** : Ingestion FT sans doublons LBA
- **Phase 11** : Upload CV → matching <5s end-to-end
- **Phase 12** : Performance targets atteints + tests ≥80%

### **Business KPIs Finaux**
- **Offres** : >10k offres actives multi-sources
- **Matching** : >90% précision candidat-offre matching
- **Performance** : <500ms search, <700ms detail pages
- **Qualité** : >95% données enrichies IA validées

---

*Roadmap complet 120+ tâches - Vision claire phases 7-12 - Processus structuré préservé*