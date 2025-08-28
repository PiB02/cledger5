# 00-cledger5-PRD.md
> 🚫 **IMMUTABLE** — Toute modif via PR + revue CTO. 

> Produit : **cledger5**  
> Objet : ingestion et enrichissement d’offres (LBA → FT), ingestion de CV, normalisation ROME4, embeddings, matching, UX explicative.  
> Marché : France. Langue UI : FR. Stack : **Next.js (App Router)**, **Supabase** (Postgres/Auth/Edge/Storage/Realtime), **Tailwind + shadcn/ui**, **OpenAI** (**GPT‑4o‑mini** extraction, **text-embedding-3-small** 1536‑d), **Resend** emails. Déploiement : **Vercel** (web) + **Supabase** (DB + functions).

Références DB et SQL :  
- `01-DB-Architecture.md` — schéma SQL complet, RLS, index, référentiels, KPI.  
- `02-DB-SQL-Queries.md` — requêtes top‑K, batchs, géo, KPI, explainer.  
- `03-FT-Integration.md` — endpoints, filtres, mapping FT (fournis par Pierre).  
- `04-LBA-Integration.md` — endpoints, filtres, mapping LBA (fournis par Pierre).
- `05-Cursor-Dev-Rules.md` — Règles de développement, guidelines.
- `06-Env-Config.md`
- `07-API-Contracts.md`
- `08-SSE-Protocols.md`
- `09-Runbooks.md`
- `10-MCP-Config.md`
- `11-Testing-Strategy.md`
- `12-Email-Templates.md`
- `13-Prompting-Guidelines.md`
- `implementation-task-list.md` 
---

## 1) Vision et priorités

Priorité V1→V7 : **1. Offres**, **2. CV**, 3. Matching & UX explicatives, 4. Batchs industrialisés, 5. Inscription candidate sécurisée.  
Monétisation future côté recruteur (dépôt d’offres, recherche candidats).

Contraintes : coûts IA/infrastructure minimisés, latence faible mais avec **feedback visuel** continu lors des traitements.

---

## 2) Personas et rôles

- **Candidat** : upload **PDF**, accepte CGU, suit l’intégration, édite son profil, lance recherche et voit matching + explications.  
- **Recruteur** : poste des offres, consulte candidats publiés, envoie **contact_requests** sans candidature.  
- **Admin** : ingestion, batchs, KPI, supervision RGPD, mappings.

RLS conformes : PII via fonctions sécurisées, profils publics anonymisés par défaut.

---

## 3) Périmètre par version

### V1 — Liste/fiche LBA
- Page **Recherche Offres** : filtres (Contrat, Rayon km, ROME, Work mode), tri **récence**, pagination.  
- Clic → **Fiche Offre** : tous champs `offers` + liens `offer_sources`.  
- Pipeline LBA : fetch → `offers_raw` → canonisation `offers` (+ `companies`, `locations`) → index texte/pgvector prêts.  
- KPI admin de base (totaux, 30j).

**CA** : 95 % requêtes recherche < **500 ms** serveur hors warm; chaque offre affichable provient de `offers` avec traçabilité source.

---

### V2 — Enrichissement IA offres
- Extraction GPT‑4o‑mini : titre canonique ROME4, **skills requises** et **induites**, séniorité, langues, diplômes.  
- Seuil pour `offer_skills.required` : **≥ 0,80**.  
- **Fiche Offre** : onglet **Analyse IA** (données + confiance).  

**CA** : 100 % des offres traitées ont `offer_enrichment.parse_status in ('ok','error')` et erreurs loguées.

---

### V3 — Embeddings offres + **Spécification commune du texte d’embedding Offre/CV**
- Création `offer_embeddings(kind='semantic', dim=1536)` immédiate après V2.
- **Onglet Embedding** : montre le **texte exact** utilisé + hash `text_used_hash`.

#### 3.1 Spécification **unique** du texte d’embedding (Offre **et** CV)
Objectif : structure **déterministe**, **compacte**, **alignée** entre offre et CV pour minimiser la variance et maximiser la similarité sémantique.

##### 3.1.1 Format exact (UTF‑8, fin de ligne `\n`, pas d’emoji)
```
TITLE: <titre canonique court>          # ≤ 80 chars, sans sigles internes
ROME: <code1>[; <code2>...]             # codes ROME4 triés asc
LOCATION: <city>|<dept>|<region>|FR     # manquants remplacés par vide, garder séparateurs
SENIORITY: intern|junior|mid|senior|lead|manager
CONTRACT: <CDI|CDD|APP|PRO|INTERIM|STAGE|UNKNOWN>
WORK_MODE: onsite|remote|hybrid|unknown
LANGUAGES: <lang=CEFR>[; ...]           # ex: en=C1; fr=C2 (tri alpha par lang)
DEGREE_EQF_MIN: <1..8|unknown>          # côté CV mettre top degree: DEGREE_EQF_TOP
SKILLS_REQUIRED: <s1>|<s2>|...          # triées par importance desc, max 50, lowercase unaccent
SKILLS_PREFERRED: <s1>|<s2>|...         # idem, max 50
SALARY: <min-max EUR period|unknown>    # ex: 32000-38000 EUR year
AVAILABILITY: <YYYY-MM|ASAP|unknown>    # offre: start date -> YYYY-MM; CV: earliest availability
```

##### 3.1.2 Règles de normalisation
1. **Titre** : heuristique courte = `job title` IA canonisé; CV = titre profil. Supprimer suffixes “H/F”, “(Alternance)”.  
2. **ROME** : codes version 4 triés, dé‑dupliqués.  
3. **Localisation** : utiliser `locations.city|department_code|region_code|FR`.  
4. **Séniorité** : mapping unique d’après V2/V6 (`career_level`).  
5. **Contrat / Work mode** : codes canoniques (`*_ref`).  
6. **Langues** : `code=CEFR(1..6 → A1..C2)`; convertir chiffres en lettres.  
7. **Diplôme** : Offre → `DEGREE_EQF_MIN`; CV → `DEGREE_EQF_TOP`.  
8. **Skills** :  
   - lower‑case, **unaccent**, trim.  
   - regrouper alias via `skill_aliases` puis dé‑dupliquer.  
   - trier **par importance** (offre : requises puis préférées; CV : par `confidence`, `years`, `level`).  
   - couper à **50** max par liste.  
9. **Salaire** : `min-max EUR period` si dispo sinon `unknown`.  
10. **Disponibilité** : Offre = `contract_start_date` (YYYY‑MM) sinon `ASAP/unknown`. CV = meilleure estimation IA.  
11. **Séparateurs** : exacts comme le format. Pas de virgule dans SKILLS.  
12. **Lignes vides interdites**. Champs inconnus → `unknown` ou segment vide selon le champ.

##### 3.1.3 Contrôles qualité (bloquants)
- Taille totale **≤ 1500 caractères**.  
- `SKILLS_REQUIRED` non vide si l’offre comporte des requirements.  
- Hash SHA‑256 du texte stocké en `text_used_hash`.

##### 3.1.4 Exemple (Offre)
```
TITLE: data analyst
ROME: M1805
LOCATION: Paris|075|11|FR
SENIORITY: junior
CONTRACT: APP
WORK_MODE: hybrid
LANGUAGES: fr=C1; en=B2
DEGREE_EQF_MIN: 6
SKILLS_REQUIRED: sql|python|tableau|data cleaning|statistics
SKILLS_PREFERRED: airflow|dbt|git
SALARY: 28000-32000 EUR year
AVAILABILITY: 2025-10
```

##### 3.1.5 Exemple (CV)
```
TITLE: data analyst
ROME: M1805
LOCATION: Paris|075|11|FR
SENIORITY: junior
CONTRACT: unknown
WORK_MODE: onsite
LANGUAGES: fr=C2; en=B2
DEGREE_EQF_TOP: 6
SKILLS_REQUIRED: sql|python|statistics|excel
SKILLS_PREFERRED: tableau|git
SALARY: unknown
AVAILABILITY: ASAP
```

##### 3.1.6 Déclencheurs re‑embedding
- Offre : changement sur `title`, `rome_codes`, `work_mode_code`, `contract_type_code`, `offer_skills`, `offer_requirements`, `offer_languages`, `salary_*`, `contract_start_date`, `location_id`.  
- CV : changement sur `profile_title`, `cv_skills`, `cv_languages`, `cv_degrees`, `seniority_years/career_level`, `location_id`, `work_mode_pref`.  
- Politique : **immédiat** (synchrone) V1, évolutif vers file asynchrone si volumétrie.

---

### V4 — FT intégration
- Ajout **France Travail** (doc `03-FT-Integration.md`).  
- Identique à LBA : raw → canon → V2 → V3.  
- Dédup via `canonical_fingerprint` et `offer_sources` unique `(source_id, source_offer_id)`.

---

### V5 — Batchs offres
- **Batch Manager** : filtres, **estimation coût/temps**, confirmation, **SSE** des logs, résultats consultables.  
- Concurrence par défaut = **3** jobs, retry **2**, backoff exponentiel.

---

### V6 — Interface candidat
- Upload **PDF** uniquement. Prompts en EN, sorties FR.  
- Étapes affichées : Profil, Lecture, Analyse/Normalisation, Sauvegarde, Embedding.  
- Menu : **Mon profil** (édition → re‑parsing auto + re‑embedding **synchrone**), **Mes offres** (recherche cledger + LBA/FT temps réel, matching %, onglet **Pourquoi ça matche**), **Paramètres** (mdp, suppression 48 h, alertes).  
- `candidate_public_profiles` activé par défaut.  
- **Double opt‑in obligatoire avant accès aux offres** (V7).

---

### V7 — Inscription/e‑mails
- À l’upload CV : création compte + e‑mail Resend.  
- Lien → page **définir le mot de passe** (8, 1 maj, 1 chiffre, 1 spécial).  
- Tant que non confirmé : blocage des offres.

---

## 4) Stack et architecture

### 4.1 Front (Next.js)
- **App Router** + RSC. shadcn/ui + Tailwind.  
- Data fetching serveur via Supabase client service ou `@supabase/postgrest-js`.  
- SSE pour logs batch : `/api/batch/:id/stream`.

### 4.2 Back
- **Route Handlers** orchestrent ingestion, IA, embeddings.  
- **Edge Functions Supabase** : `kpi_refresh_day` (cron), purge RAW, rotation clé PII, heavy workers légers si besoin.  
- Matching en SQL (pgvector).

### 4.3 Données
- INSEE chargé complet (régions, départements, communes, CP). BAN pour géocodage manquant.  
- `offers_raw` partitionné mois. `match_scores` partitionnable si > 5 M lignes.  
- Embeddings HNSW `m=16` / `ef_construction=64` par défaut.

### 4.4 Structure repo
```
/apps/web
  /app
    /(public)        # pages publiques
    /(private)       # pages authentifiées
    /api             # routes ingestion, batch, cv, search, sse
  /components        # UI shadcn
  /features          # offers, batches, candidate, auth
  /lib               # supabase, openai, server-side helpers
  /styles
  /hooks
/prompts             # prompts LLM versionnés (YAML/MD)
/packages
  /types             # zod + TS types partagés
  /utils             # coûts/ETAs, normalizers, embedding-text builder
  /api-clients       # SDK LBA/FT
/docs
  00-cledger5-PRD.md
  01-DB-Architecture.md
  02-DB-SQL-Queries.md
  03-FT-Integration.md
  04-LBA-Integration.md
/supabase
  /migrations
  /functions
  /seed
```

---

## 5) User stories et critères d’acceptation

### 5.1 V1 Offres
- US : filtrer, voir résultats en < 500 ms p95, ouvrir fiche.  
- CA : tri récence, pagination stable, dédup affichée côté UI si multi‑sources.

### 5.2 V2 IA
- US : voir onglet **Analyse IA** avec compétences triées, séniorité, langues, diplômes.  
- CA : requises créées si confiance ≥ 0,80. Sinon en préférées.

### 5.3 V3 Embedding
- US : voir onglet **Embedding** avec texte exact.  
- CA : hash `text_used_hash` correspond au texte affiché.

### 5.4 V5 Batchs
- US : estimer coût/temps, suivre progression, consulter résultats.  
- CA : SSE < 2 s de latence per step.

### 5.5 V6 Candidat
- US : upload PDF, suivre pipeline, éditer, rechercher, voir % et explications.  
- CA : re‑parsing/re‑embedding bloquants et rapides ; accès offres seulement après V7.

### 5.6 V7 Auth
- US : recevoir mail, définir mdp, accéder aux offres.  
- CA : règles mdp appliquées, double opt‑in vérifié.

---

## 6) Matching (rappel)
- Score = `w_ann*ann + w_skill*overlap + w_geo*geo`.  
- `gate/penalize` sur under/overqual confirmés.  
- Explications : matched skills, manques requis, gating, distance.

---

## 7) KPI et observabilité
- Totaux, pass‑rate gating, moyennes pertinence, latences parsing/ingest, distributions 30j (ROME, NAF*, région, dept, ville, career level, EQF, work mode, contrat).  
- Vues publiques anonymisées k=5. Dashboards recruteur/candidat.  
- `app_events`, `ingest_runs_offers`, `kpi_daily_admin`.  
- `pg_stat_statements` pour profiling. (*NAF optionnel au lancement.)

---

## 8) Sécurité & RGPD
- PII chiffrée (`pgcrypto`), clé `APP_PII_KEY` secret Supabase.  
- **Rotation simple** : nouvelles écritures sous K2, tâche Edge de ré‑chiffrement offline.  
- Rétention `cv_documents.delete_after_date = +6 mois`.  
- Droit d’accès, rectification, effacement UI V6.  
- Double opt‑in strict avant consultation d’offres.

---

## 9) Non‑fonctionnel
- Perfs : recherche < 500 ms p95, fiche < 700 ms p95.  
- Batch : streaming SSE en temps réel.  
- Disponibilité : mode dégradé si FT/LBA down (cache dernières offres).  
- Tests : **ESLint + Prettier + Vitest + Playwright**.  
- CI : GitHub Actions (lint/tests), Vercel deploy, migrations Supabase.

---

## 10) Endpoints (proposition)
- `POST /api/ingest/lba` — ingest unitaire/filtré.  
- `POST /api/ingest/ft` — idem FT.  
- `POST /api/batch` — crée batch.  
- `GET /api/batch/:id/stream` — **SSE**.  
- `POST /api/cv/upload` — PDF → Storage + `cv_documents`.  
- `POST /api/cv/parse` — parsing IA → `cv_*`.  
- `POST /api/cv/embed` — embedding CV.  
- `GET /api/search/offers` — recherche server‑side.  
- `POST /api/auth/confirm` — set mot de passe.

---

## 11) Embedding‑text builder (pseudo‑code commun)

```ts
type EmbeddingContext = 'offer' | 'cv';

function toCEFR(n?: number) { // 1..6 -> A1..C2
  const map = [,'A1','A2','B1','B2','C1','C2'];
  return n && n>=1 && n<=6 ? map[n] : 'unknown';
}

function normSkill(s: string): string {
  return unaccent(s).trim().toLowerCase().replace(/\s+/g,' ');
}

function buildEmbeddingText(ctx: EmbeddingContext, data: CanonicalizedInput): string {
  const title = data.title_canonical.slice(0,80);
  const rome = (data.rome_codes||[]).sort();
  const loc = `${data.city||''}|${data.department_code||''}|${data.region_code||''}|FR`;

  const seniority = data.career_level ?? 'unknown';
  const contract = data.contract_type_code ?? 'unknown';
  const workMode = data.work_mode_code ?? 'unknown';

  const langs = (data.languages||[]) // [{code:'fr',cefr:6},...]
    .sort((a,b)=>a.code.localeCompare(b.code))
    .map(l=>`${l.code}=${toCEFR(l.cefr)}`)
    .join('; ');

  const degree =
    ctx==='offer' ? (data.degree_min_eqf?.toString() ?? 'unknown')
                  : (data.degree_top_eqf?.toString() ?? 'unknown');

  const req = (data.skills_required||[])
    .map(normSkill)
    .filter(Boolean);
  const pref = (data.skills_preferred||[])
    .map(normSkill)
    .filter(Boolean);

  const dedup = (arr:string[]) => Array.from(new Set(arr));
  const limit = (arr:string[]) => arr.slice(0,50);

  const reqF = limit(dedup(req));
  const prefF = limit(dedup(pref));

  const salary = data.salary_min && data.salary_max && data.salary_period
    ? `${data.salary_min}-${data.salary_max} EUR ${data.salary_period}`
    : 'unknown';

  const avail = data.availability || 'unknown';

  const lines = [
    `TITLE: ${title}`,
    `ROME: ${rome.join('; ')}`,
    `LOCATION: ${loc}`,
    `SENIORITY: ${seniority}`,
    `CONTRACT: ${contract}`,
    `WORK_MODE: ${workMode}`,
    `LANGUAGES: ${langs||'unknown'}`,
    `${ctx==='offer' ? 'DEGREE_EQF_MIN' : 'DEGREE_EQF_TOP'}: ${degree}`,
    `SKILLS_REQUIRED: ${reqF.join('|')}`,
    `SKILLS_PREFERRED: ${prefF.join('|')}`,
    `SALARY: ${salary}`,
    `AVAILABILITY: ${avail}`,
  ];

  const txt = lines.join('\n');
  if (txt.length > 1500) throw new Error('embedding text too long');
  if (ctx==='offer' && !reqF.length) throw new Error('required skills empty');
  return txt;
}
```

---

## 12) Paramètres défaut et décisions validées

- Modèle embeddings : **text‑embedding‑3‑small** (1536).  
- Extraction IA : **GPT‑4o‑mini**.  
- SSE pour logs batch. Concurrence = **3**, retry = **2**.  
- Partition `match_scores` activée à partir de **> 5 M** lignes cumulées.  
- HNSW `m=16`, `ef_construction=64`.  
- 50 skills max par liste.  
- INSEE complet requis pour qualité géo et KPI. BAN pour géocodage manquant.  
- Double opt‑in strict avant accès offres.  
- Suppression compte : **48 h** de grâce.  
- Affichage score candidat en **%** arrondi + onglet “Pourquoi”.

---

## 13) Plan de livraison

| Version | Périmètre | Jalons | Go/NoGo |
|---|---|---|---|
| V1 | Liste/fiche LBA, ingestion, filtres, KPI | Intégration LBA, liste, fiche, seeds | p95 < 500 ms |
| V2 | IA offres | prompt v1, parse strict, seuils | JSON valide ≥ 98 % |
| V3 | Embeddings + spec commune | builder commun, hash | Embeddings en place |
| V4 | FT | fetch FT, mapping, dédup | > 95 % dédup |
| V5 | Batchs | Estimation, SSE, logs, reprise | 10k offres stable |
| V6 | Candidat | Upload→profil, édition, matching, “Pourquoi” | < 2 min p95 |
| V7 | Opt‑in | Mail, mdp, gating accès | délivrabilité > 98 % |

---

## 14) Risques et mitigations
- **Rate limits** FT/LBA : backoff, fenêtres, caches.  
- **Coûts IA** : estimation ex‑ante, plafond, batchs annulables.  
- **Normalisation ROME** : table `source_vocab_unmapped` + revue.  
- **PII** : rotation clé simple, audit logs, vues restreintes.  
- **Volumétrie** : activer partition `match_scores` si nécessaire.

---

## 15) Annexes
- `01-DB-Architecture.md` — schéma SQL.  
- `02-DB-SQL-Queries.md` — requêtes.  
- `03-FT-Integration.md` — FT.  
- `04-LBA-Integration.md` — LBA.

Fin du document.
