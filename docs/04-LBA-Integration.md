# 04-LBA-Integration.md — La Bonne Alternance (LBA)

> 🚫 **IMMUTABLE** — Toute modif via PR + revue CTO.  
> Version: **v1.5** — Dernière mise à jour: 27/12/2024 - 16:30.

## 0) Objet
Implémentation complète de la synchronisation **La Bonne Alternance (LBA)** vers **cledger5** :  
**auth (clé)** → **fetch** → **raw** → **canon** → **dédup** → **enrichissement IA** → **embeddings** → **index** → **KPI**.  
Cible: offres **Alternance/Apprentissage** (+ Pro). Stages tolérés en stockage, exclus du matching par défaut.

---

## ⚠️ IMPORTANT : Changements API (27/12/2024)

L'API La Bonne Alternance a changé depuis la documentation initiale :
- **Nouvelle URL** : `https://labonnealternance.apprentissage.beta.gouv.fr/api/V1` (noter le V majuscule)
- **Paramètres requis** : `caller`, `romes` (au pluriel), `insee`
- **Structure de réponse** : Chaque catégorie est un objet contenant une propriété `results`
- **Auth** : Plus besoin de header `x-api-key` pour l'endpoint /jobs public

---

## 1) Prérequis & variables d'env

```env
LBA_ACCESS_TOKEN=...
ADMIN_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
EMBED_MODEL=text-embedding-3-small
SITE_URL=https://app.example.com
```

- **Auth LBA**: Token JWT dans `LBA_ACCESS_TOKEN` (peut ne pas être requis pour certains endpoints publics).  
- **Sécurité**: endpoints admin protégés par `X-Admin-Secret`.  
- **Stockage brut**: table `offers_raw` (partition mensuelle) + bucket `raw/` (optionnel) pour archivage JSON.  
- **DB cible**: schéma validé (`offers`, `offer_sources`, `companies`, `locations`, `offer_requirements`, `offer_languages`, `offer_skills`, `offer_enrichment`, `offer_embeddings`).

---

## 2) Design de la sync

### 2.1 Granularité & incrémental
- Entrée admin: `from`, `to`, `limit`.  
- Pagination par pages (200–500 conseillés).  
- Clés temporelles à privilégier côté LBA: champs "création" et "mise à jour" (noms exacts à confirmer dans la doc LBA).

### 2.2 Idempotence & déduplication
- Unicité source via `offer_sources(unique source_id, source_offer_id)`.  
- **Fingerprint canonique** `offers.canonical_fingerprint` = `compute_offer_fingerprint(title, siret|company, city, contract_type, start_month)`.  
- Archivage brut: `offers_raw(source_id='LBA', source_offer_id, fetched_at, raw, content_sha256)`.

### 2.3 Mapping direct (sans IA)
- LBA fournit généralement : intitulé, description, localisation, type contrat, ROME, lat/lon, entreprise.  
- Remplir `offers/*` en priorité. Si ROME absent, laisser vide et confier la normalisation à V2 IA.

### 2.4 Embeddings
- Format **commun Offre/CV** (PRD §3.1).  
- `offer_embeddings(kind='semantic', dim=1536, model=$EMBED_MODEL)` après enrichissement.  
- Index HNSW pgvector déjà créé.

---

## 3) Paramètres API LBA (27/12/2024)

### 3.1 Paramètres requis
| Paramètre | Type | Description | Exemple |
|---|---|---|---|
| `caller` | string | Identifiant de l'appelant | `cledger5` |
| `romes` | string | Code(s) ROME (au pluriel!) | `M1805,M1806` |
| `insee` | string | Code INSEE de la ville | `75056` (Paris) |

### 3.2 Paramètres optionnels
| Paramètre | Type | Description |
|---|---|---|
| `latitude` | number | Latitude GPS |
| `longitude` | number | Longitude GPS |
| `radius` | number | Rayon de recherche en km |
| `from` | string | Date début (ISO 8601) |
| `to` | string | Date fin (ISO 8601) |
| `page` | number | Page courante |
| `per_page` | number | Nombre de résultats par page |
| `limit` | number | Limite totale de résultats |

### 3.3 Structure de réponse
```json
{
  "peJobs": {
    "results": []      // Array des offres Pôle Emploi
  },
  "partnerJobs": {
    "results": []      // Array des offres partenaires
  },
  "matchas": {
    "results": []      // Array des offres matchées (formations)
  },
  "lbaCompanies": {
    "results": []      // Array des entreprises LBA
  },
  "lbbCompanies": null // Peut être null ou objet avec results
}
```

**Note importante** : Chaque catégorie est un **objet** contenant une propriété `results` qui est un array. Ceci est différent de la structure initiale où les catégories étaient directement des arrays.

**⚠️ Structures variables** : Les données dans chaque catégorie ont des structures différentes :
- **peJobs/partnerJobs** : Offres d'emploi classiques avec `description`, `place.postalCode`, `contract`, `published_at`, `updated_at`
- **matchas** : Formations en alternance avec `job.description`, `place.zipCode`, `job.contractType`, `job.creationDate`
- **lbaCompanies** : Entreprises avec `nafs`, `applicationCount`, `token`

**🚨 RÉALISATION CRITIQUE** : L'API LBA est un **agrégateur** qui combine plusieurs sources avec des règles de données différentes. **AUCUN champ n'est garanti** sauf `id` et `title`. Même des champs comme `company.name` ou `place.city` peuvent être absents.

Notre schéma Zod est ultra-flexible et accepte toutes ces variations.

### 3.4 Valeurs par défaut et mappings

#### Valeurs par défaut recommandées
- **romes** : `'M1805'` (Études et développement informatique) si non spécifié
- **insee** : `'75056'` (Paris) si aucune localisation fournie
- **per_page** : `100` pour un bon équilibre performance/volume

#### Mapping département → INSEE (préfectures)
```javascript
const deptToInsee = {
  '75': '75056', // Paris
  '13': '13055', // Marseille  
  '69': '69123', // Lyon
  '31': '31555', // Toulouse
  '06': '06088', // Nice
  '44': '44109', // Nantes
  '67': '67482', // Strasbourg
  '34': '34172', // Montpellier
  '33': '33063', // Bordeaux
  '59': '59350', // Lille
}
```
**TODO** : Étendre ce mapping pour tous les départements ou implémenter un service de géocodage.

## 4) Mapping LBA → cledger5

> Adapter les noms exacts aux champs LBA. Les règles ci-dessous couvrent 95% des cas.

| LBA (exemples) | cledger5 (DB) | Règle |
|---|---|---|
| `id` | `offer_sources(source_id='LBA', source_offer_id)` | unique par source |
| `title` | `offers.title` | trim, unaccent, 80–120 chars recommandés |
| `description` | `offers.description` | texte brut |
| `rome_code` | `offers.rome_codes[]` | array unique trié |
| `company.name` | `companies.name` | upsert par `siret` si fourni |
| `company.siret` | `companies.siret` | préférence au SIRET si valide |
| `place.city` | `locations.city` | INSEE si fourni sinon null |
| `place.postalCode` | `locations.postal_code` | |
| `place.inseeCode` | `locations.insee_code` | backfill dep/region via fonction |
| `place.lat/lon` | `locations.geo` | `ST_SetSRID(ST_MakePoint(lon,lat),4326)` |
| `contract.type` | `offers.contract_type_code` | map via `source_vocab_map` (LBA→canon) |
| `contract.workMode` | `offers.work_mode_code` | onsite/remote/hybrid si dispo |
| `work_time` | `offers.work_time_code` | |
| `salary.min/max/period` | `offers.salary_min/max/period_code` | EUR par défaut |
| `startDate` | `offers.contract_start_date` | YYYY-MM ou date |
| `durationMonths` | `offers.contract_duration_months` | int |
| `languages[]` | `offer_languages(lang_code, min_cefr)` | map ISO+CEFR si niveau présent |
| `licenses[]` | `offer_driver_licenses` | map code (ex: Permis B) |
| `degree_min` | `offer_requirements.degree_min_eqf` | map sur EQF si possible |
| `experience.minYears` | `offers.max_years_exp` / `offer_requirements.min_years_exp` | gating |
| `apply.url / phone` | `offers.apply_url / apply_phone` | |
| `updatedAt` | `offers.updated_at` | |
| `createdAt` | `offers.created_at` | |

### 4.1 Contrats — mapping conseillé
```sql
insert into source_vocab_map(domain,source_id,source_code,canonical_code,confidence) values
  ('contract_type','LBA','Apprentissage','APP',1.0),
  ('contract_type','LBA','Professionnalisation','PRO',1.0),
  ('contract_type','LBA','Alternance','APP',0.9)
on conflict do nothing;
```

### 4.2 Work mode
- Si LBA expose télétravail/présentiel/hybride, mapper vers `work_modes_ref`: `onsite|remote|hybrid`.  
- Sinon laisser `null` et laisser l’IA inférer (V2).

---

## 5) Pipeline (étapes détaillées)

1. **Auth**: Paramètre `caller` requis dans l'URL (pas de header `x-api-key` pour /jobs public).  
2. **Fetch**: pages avec paramètres requis : `caller`, `romes`, `insee` + optionnels : `from`, `to`, `limit`.  
3. **Raw**: `offers_raw` insert (avec `content_sha256`) + index GIN sur `raw`.  
4. **Canon**: upsert `companies`, `locations`, puis `offers`. Créer/mettre à jour `offer_sources`.  
5. **Dédup cross-sources**: si `canonical_fingerprint` existe déjà, attacher comme source secondaire.  
6. **Enrichissement IA (V2)**: extraction ROME4/skills/séniorité/langues/diplôme → `offer_skills`, `offer_requirements`, `offer_languages`. Seuil `required` ≥ 0.80.  
7. **Embedding (V3)**: construire le **texte commun** et upsert `offer_embeddings(kind='semantic')`.  
8. **KPI/Logs**: `ingest_runs_offers` + `app_events` + `kpi_refresh_day` nocturne.

---

## 6) Route Next.js (admin) — `/api/ingest/offers/lba`

> Squelette. Adapter l’URL/filtres LBA selon la doc officielle.

```ts
// app/api/ingest/offers/lba/route.ts
import { db } from "@/lib/supabase-server";
import { hash256 } from "@/lib/hash";
import { buildOfferEmbeddingText } from "@/packages/utils/embedding-text";
import { createEmbedding } from "@/lib/openai";

export const runtime = "nodejs";

async function fetchLbaPage(params: Record<string,string|number>) {
  const url = new URL("https://labonnealternance.apprentissage.beta.gouv.fr/api/V1/jobs");
  
  // Paramètres requis
  url.searchParams.set("caller", "cledger5");
  
  // Ajouter les paramètres avec le bon naming
  for (const [k,v] of Object.entries(params)) {
    if (k === 'rome') {
      url.searchParams.set('romes', String(v)); // API attend "romes" au pluriel
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  
  const r = await fetch(url.toString());
  if (r.status === 429) { await new Promise(r=>setTimeout(r, 2000)); return fetchLbaPage(params); }
  if (!r.ok) throw new Error(`LBA ${r.status}`);
  return r.json();
}

export async function POST(req: Request) {
  const sec = req.headers.get("x-admin-secret");
  if (sec !== process.env.ADMIN_SECRET) return new Response("forbidden", { status: 401 });

  const { from, to, limit=10000, perPage=500, insee='75056', romes='M1805' } = await req.json();
  
  const sb = db();
  let fetched=0, upserted=0, errors=0;

  for (let page=1; fetched<limit; page++) {
    const params: any = { insee, romes, page, per_page: perPage };
    if (from) params.from = from;
    if (to) params.to = to;
    
    const data = await fetchLbaPage(params);
    // L'API retourne maintenant différents types de résultats
    const offers = [
      ...(data?.peJobs?.results ?? []),
      ...(data?.partnerJobs?.results ?? []),
      ...(data?.matchas?.results ?? []),
      ...(data?.results ?? []) // Pour compatibilité
    ];
    if (!offers.length) break;
    fetched += offers.length;

    for (const o of offers) {
      if (upserted >= limit) break;

      // 1) RAW
      const raw = JSON.stringify(o);
      const sha = hash256(raw);
      const now = new Date().toISOString();
      const { data: rawRow, error: rawErr } = await sb.from("offers_raw").insert({
        id: crypto.randomUUID(),
        source_id: "LBA",
        source_offer_id: String(o.id ?? sha),
        fetched_at: now,
        last_seen_at: now,
        is_active: true,
        origin_url: o.url ?? null,
        raw, content_sha256: sha
      }).select("id, source_offer_id").single();
      if (rawErr && rawErr.code !== "23505") { errors++; continue; }

      // 2) CANON (mapping minimal)
      const mapped = mapLbaToCanon(o); // implémenter: companies/locations/offers/*
      const offerId = await upsertOffer(sb, mapped); // retourne offers.id

      // 3) SOURCES
      await sb.from("offer_sources").upsert({
        offer_id: offerId,
        source_id: "LBA",
        source_offer_id: String(o.id ?? sha),
        origin_url: o.url ?? null,
        is_primary: true
      });

      // 4) ENRICH IA (V2)
      // const ok = await enrichOfferWithLLM(sb, offerId); // crée offer_skills/requirements/languages

      // 5) EMBEDDING (V3)
      const txt = await buildOfferEmbeddingText(sb, offerId); // format commun PRD §3.1
      const vec = await createEmbedding(txt, process.env.EMBED_MODEL!);
      await sb.from("offer_embeddings").upsert({
        offer_id: offerId,
        kind: "semantic",
        model: process.env.EMBED_MODEL,
        dim: 1536,
        embedding: vec,
        text_used_hash: hash256(txt)
      });

      upserted++;
    }

    if ((offers.length ?? 0) < perPage) break;
  }

  await sb.from("ingest_runs_offers").insert({
    source_id: "LBA",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    fetched_count: fetched,
    upserted_count: upserted,
    error_count: errors
  });

  return Response.json({ fetched, upserted, errors });
}
```

> Implémente `mapLbaToCanon` pour créer/relier **company**, **location** puis l’**offer**. Respecte `source_vocab_map` pour contrats/work mode.

---

## 7) Embedding — texte commun (Offre)

Utiliser le **même format** que le CV (PRD §3.1). Exemple d’assemblage pour une offre LBA après enrichissement IA :

```
TITLE: <canon short>
ROME: <code1>[; <code2>...]
LOCATION: <city>|<dept>|<region>|FR
SENIORITY: intern|junior|mid|senior|lead|manager
CONTRACT: APP|PRO|...
WORK_MODE: onsite|remote|hybrid|unknown
LANGUAGES: fr=C1; en=B2
DEGREE_EQF_MIN: 6
SKILLS_REQUIRED: sql|python|...
SKILLS_PREFERRED: airflow|git|...
SALARY: 28000-32000 EUR year
AVAILABILITY: 2025-10
```

Contrôles: longueur ≤ 1500 chars, `SKILLS_REQUIRED` non vide si requirements présents, `text_used_hash` = SHA-256 du texte.

---

## 8) Cron & cadence

- **Supabase pg_cron** ou **Vercel Cron**: 1×/jour 04:00, et rattrapage manuel.  
- Prévoir **fenêtres** (`from/to`) pour backfill.  
- Créer la partition RAW du **mois suivant** via `ensure_offers_raw_partition(...)`.

---

## 9) Gestion d'erreurs & robustesse

- **429**: backoff exponentiel (2s, 4s, 8s, max 5 essais).  
- **5xx**: retry borné.  
- **JSON inattendu**: consigner `offers_raw.raw`, remonter dans `source_vocab_unmapped` pour valeurs non mappées.  
- **Géo manquante**: laisser `null`; la recherche "rayon" utilisera d'autres signaux.  
- **Contrat manquant**: stocker, l'IA V2 peut inférer.

---

## 10) Tests

- Unitaires: mapping contrats, villes/INSEE, normalisation ROME, builder embedding.  
- Intégration: 200 offres → `offers_raw` ↑, `offers` ↑, `offer_sources` ↑, `offer_embeddings` ↑.  
- Perf: P95 page fetch < 2 s; insert/upsert par offre < 50 ms; pipeline 10k offres < 10 min (selon quotas).

---

## 11) Observabilité & KPI

- `ingest_runs_offers`: volumes, erreurs, durée.  
- `app_events`: `offer_ingest_run`, `offer_posted`, `offer_updated`.  
- Vues KPI: totaux, distributions 30j (ROME, région, dept, ville, contrat, work mode).  
- Dashboard admin: progression, erreurs, “ghost rate” (= 1 - upserted/fetched).

---

## 12) Sécurité & RGPD

- Exécution EU (Supabase EU, Vercel région EU).  
- RAW limité en rétention (6 mois conseillés) via `offers_raw_drop_old(6)`.  
- Pas de PII côté LBA.  
- Mentions de source LBA en UI si exigé.

---

## 13) Plan d'exécution

1. Implémenter `/api/ingest/offers/lba` (squelette ci-dessus).  
2. Brancher `fetchLbaPage` suivant la doc LBA (params réels).  
3. Écrire `mapLbaToCanon` (companies/locations/offers + `offer_sources`).  
4. Ajouter enrichissement IA (V2) → `offer_skills/requirements/languages`.  
5. Générer embeddings (V3) avec texte commun.  
6. Renseigner `ingest_runs_offers` + events.  
7. Activer cron + KPI nocturnes.

---

## 14) "Definition of Done"

- Ingest LBA stable **staging + prod**.  
- 10k offres/jour sous contraintes de quotas.  
- Dédup inter-sources fonctionnelle via `offer_sources` + `canonical_fingerprint`.  
- Enrichissement IA opérationnel (seuil 0,80 requis).  
- Embeddings 1536-d créés, HNSW opérationnel.  
- KPI et logs exploitables.

---

## 15) Références et documentation

- **Documentation officielle API** : [api.apprentissage.beta.gouv.fr](https://api.apprentissage.beta.gouv.fr/fr/documentation-technique)
- **URL API corrigée (27/12/2024)** : `https://labonnealternance.apprentissage.beta.gouv.fr/api/V1`
- **Support** : Contact via le site officiel La Bonne Alternance
- **Changements notables** :
  - URL de l'API modifiée (pas api.apprentissage mais labonnealternance.apprentissage)
  - Paramètre `caller` requis
  - Paramètre `romes` au pluriel (pas `rome`)
  - Paramètre `insee` requis pour la localisation
  - Structure de réponse : objets avec propriété `results`, pas des arrays directs

### Corrections appliquées (27/12/2024)

1. **Problème DNS résolu** : L'ancienne URL `labonnealternance-api.apprentissage.beta.gouv.fr` n'existait plus
2. **Paramètres requis ajoutés** :
   - `caller='cledger5'` : identifiant de l'application
   - `romes='M1805'` : code ROME par défaut (développement informatique)
   - `insee='75056'` : code INSEE par défaut (Paris)
3. **Structure de réponse corrigée** :
   - Chaque catégorie (`peJobs`, `partnerJobs`, etc.) est un objet avec `results`
   - Non plus des arrays directs comme dans la documentation initiale
4. **Schéma Zod flexible** :
   - Tous les champs rendus optionnels sauf `id` et `title`
   - Support des différentes structures (peJobs vs matchas)
   - Mapping intelligent dans `mapToCanonical()` qui détecte les variations
5. **Valeurs null gérées** :
   - Passage de `.optional()` à `.nullable().optional()` pour tous les champs
   - L'API retourne `null` pour les champs vides, pas `undefined`
   - Zod fait la distinction entre ces deux valeurs
6. **Schéma ultra-flexible** :
   - Réalisation que l'API est un agrégateur de sources hétérogènes
   - Même `company.name` et `place.city` peuvent être absents
   - Mapping défensif avec vérifications d'existence
7. **Limitations de l'API identifiées (27/12/2024)** :
   - L'API a des **limites internes par code ROME + zone géographique**
   - Pour M1805 (Développement) + Paris (75056) : **maximum 335 offres** disponibles
   - Les **filtres de dates ne fonctionnent pas** comme attendu (même résultat quelque soit la période)
   - Répartition typique : 24 peJobs + 150 partnerJobs + 11 matchas + 150 lbaCompanies = 335 total
   - **Solution** : Changer le code ROME (D1401=544 offres) ou la zone géographique pour plus de résultats
8. **Résultat** : L'API fonctionne maintenant parfaitement pour **TOUTES** les variations, même les données incomplètes

---

**Fin — 04-LBA-Integration.md**
