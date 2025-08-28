# 03-FT-Integration.md — API France Travail (Offres d’emploi)
> 🚫 **IMMUTABLE** — Toute modif via PR + revue CTO. 

**Objet**: intégrer la recherche d’offres, le détail d’une offre et les référentiels France Travail dans cledger5.  
**Portée**: endpoints `recupererListeOffre`, `recupererOffre`, et l’ensemble des `recupererReferentiel*`.  
Sources: présentation publique France Travail IO et fiche “API Offres d’emploi” (data.gouv.fr). Voir aussi endpoints OAuth documentés (client credentials). citeturn0search1turn0search3turn0search5

---

## 1) Accès, authentification, base

- **Base API**: `https://api.francetravail.io/` (chemins exacts fournis après habilitation). citeturn0search5
- **OAuth2 Client Credentials** (machine-to-machine).  
  - **Token endpoint**: `https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire` (form-encoded). citeturn0search5
  - Obtenir `client_id` / `client_secret` dans la console France Travail.  
  - `scope` selon votre habilitation “Offres d’emploi”.
- **Headers**: `Authorization: Bearer <access_token>` ; `Accept: application/json`.

> Les limites d’usage (rate limits) et la structure exacte des chemins (versions, préfixes) sont précisées dans votre habilitation. La fiche “API Offres d’emploi” décrit les trois familles: recherche, détail, référentiels. citeturn0search3

### 1.1 Exemple — obtenir un token
```bash
curl -s -X POST \
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$FT_CLIENT_ID&client_secret=$FT_CLIENT_SECRET&scope=$FT_SCOPE"
# => { "access_token": "...", "token_type":"Bearer", "expires_in": 3599 }
```

### 1.2 Exemple — appel générique authentifié
```bash
curl -s "https://api.francetravail.io/<PATH_LISTE_OFFRE>?page=1&perPage=50" \
  -H "Authorization: Bearer $FT_TOKEN" -H "Accept: application/json"
```

---

## 2) Opérations principales

### 2.1 Liste d’offres — `recupererListeOffre`
**But**: recherche paginée d’offres selon filtres.  
**Réponse**: objet type `ResultatRecherche` contenant `resultats[]` (aperçus d’offres), méta de pagination, **agrégations** et `filtresPossibles[]`. citeturn0search3

**Filtres usuels** (les noms exacts sont exposés par `FiltrePossible`) :  
- mots-clés, ROME/appellations/métiers, localisation (commune INSEE, département, région, distance), contrat (natures/types), salaire.  
- tri recommandé V1: **récence**.

**Pagination**: `page`, `perPage` (ou équivalent) + `total`/`nbPages` dans la réponse.

### 2.2 Détail d’une offre — `recupererOffre`
**But**: récupérer un objet `Offre` complet par identifiant.  
**Champs typiques**: `intitule`, `description`, `dateCreation`, `dateActualisation`, `nombrePostes`, `typeContrat`/`natureContrat`, `dureeTravail`, `experience`, `romeCode(s)`, sous-objets `Entreprise`, `LieuTravail`, `Salaire`, `Langue`, `Formation`, `Competence`, `ContexteTravail`… (selon disponibilité et consentements). citeturn0search3

> Les données de **contact** peuvent être non exposées via API selon la politique de diffusion. Reportez-vous aux conditions France Travail et à votre habilitation. citeturn0search3

---

## 3) Référentiels — `recupererReferentiel*`

À consommer et versionner côté DB pour normaliser et afficher les libellés. Liste (non exhaustive) fournie dans la doc: **Appellations, Codes NAF, Communes, Continents, Départements, Domaines Métiers, Langues, Métiers, Natures de contrats, Niveaux de formations, Pays, Permis, Régions, Secteurs d’activités, Thèmes, Types de contrats**. citeturn0search3

**Mapping conseillé → tables `*_ref`**:  
- Communes/Départements/Régions → `insee_communes`, `insee_departements`, `insee_regions`.  
- Natures/Types de contrats → `contract_types_ref`.  
- Langues → `languages_ref` (code ISO + CEFR côté app).  
- Niveaux de formations → `degrees_ref` (EQF) + correspondances locales.  
- Codes NAF → `naf_codes`.  
- Permis → `driver_licenses_ref`.

Rafraîchir périodiquement (cron) et loguer les valeurs **non mappées** dans `source_vocab_unmapped`.

---

## 4) Mapping France Travail → cledger5 (résumé)

| FT (schémas) | cledger5 (DB) |
|---|---|
| `Offre.id` | `offer_sources(source_id='FT', source_offer_id)` + `offers.canonical_fingerprint` |
| `intitule`, `description` | `offers.title`, `offers.description` |
| `dateCreation`, `dateActualisation` | `offers.created_at`, `offers.updated_at`/`updated_at_source` |
| `Entreprise.*` | `companies` (`siret`, `name`, `naf_code` si présents) |
| `LieuTravail.*` | `locations` (INSEE/city/CP/geo si présents) |
| `typeContrat`/`natureContrat` | `offers.contract_type_code` via `source_vocab_map` |
| `dureeTravail`, `tempsPartiel` | `offers.work_time_code` |
| `Salaire.*` | `offers.salary_min/max/period/currency/label` |
| `Formation` | `offer_requirements.degree_min_eqf` |
| `Langue` | `offer_languages(lang_code, min_cefr)` |
| `Permis` | `offer_driver_licenses` |
| `Competence` | `offer_skills` (`required` si indispensable) |
| `romeCode(s)` | `offers.rome_codes[]` |

> Post-ingest: enrichissement IA (compétences & séniorité) puis `offer_embeddings` (1536-d). Voir PRD et schéma DB.

---

## 5) Exemples d’implémentation

### 5.1 Next.js — Token cache simple
```ts
let FT_TOKEN: { value: string; exp: number } | null = null;

export async function getFtToken() {
  const now = Math.floor(Date.now()/1000);
  if (FT_TOKEN && FT_TOKEN.exp - 60 > now) return FT_TOKEN.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.FT_CLIENT_ID!,
    client_secret: process.env.FT_CLIENT_SECRET!,
    scope: process.env.FT_SCOPE!,
  });
  const r = await fetch("https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body });
  if (!r.ok) throw new Error(`FT token failed: ${r.status}`);
  const j = await r.json() as { access_token:string, expires_in:number };
  FT_TOKEN = { value: j.access_token, exp: now + j.expires_in };
  return FT_TOKEN.value;
}
```

### 5.2 Next.js — Recherche paginée (générique)
```ts
export async function ftSearchOffers(params: Record<string,string|number>) {
  const token = await getFtToken();
  const q = new URLSearchParams(params as any).toString();
  const url = `https://api.francetravail.io/<PATH_LISTE_OFFRE>?${q}`; // operationId: recupererListeOffre
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`FT search failed: ${r.status}`);
  return r.json(); // ResultatRecherche
}
```

### 5.3 Next.js — Détail offre
```ts
export async function ftGetOffer(id: string) {
  const token = await getFtToken();
  const url = `https://api.francetravail.io/<PATH_OFFRE>/${encodeURIComponent(id)}`; // operationId: recupererOffre
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`FT get offer failed: ${r.status}`);
  return r.json(); // Offre
}
```

---

## 6) Stratégie d’ingestion et qualité

1) **Raw**: stocker la réponse brute dans `offers_raw` (partition mensuelle).  
2) **Canon**: mapper vers `offers/*` + `offer_sources`.  
3) **Normaliser**: via `source_vocab_map` (contrats, work modes, etc.). Les valeurs inconnues → `source_vocab_unmapped`.  
4) **Enrichir**: extraction IA (compétences requises/induites, séniorité, langues, diplôme min).  
5) **Embed**: construire texte commun d’embedding (PRD §3.1) puis `offer_embeddings`.  
6) **KPI**: `ingest_runs_offers` + `app_events` + rafraîchissement quotidien.

---

## 7) Erreurs, quotas, robustesse

- **401/403**: token invalide/expiré → renouveler.  
- **429**: limite atteinte → backoff exponentiel + jitter.  
- **5xx** FT: retry plafonnés.  
- **Données incomplètes**: enrichir via référentiels et IA, journaliser.

> Les caractéristiques de quotas et d’error handling contractuels sont précisées dans l’espace d’habilitation. Référez-vous aux consignes officielles au moment de l’intégration. citeturn0search3

---

## 8) Références et liens

- Portail France Travail IO (présentation) — citeturn0search1  
- Fiche **API Offres d’emploi** (data.gouv.fr) — citeturn0search3  
- OAuth “client credentials” et token endpoint FT — citeturn0search5
## 9) DOCUMENTATION API OFFRE ET LISTE OFFRE

### 9.1 Doc Générique Offres et liste d'offres
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererListeOffre
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererOffre

### 9.2 REFERENTIEL 

https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielAppellations
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielCodesNAFs
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielCommunes
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielContinents
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielDepartements
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielDomainesMetiers
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielLangues
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielMetiers
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielNaturesContrats
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielNiveauxFormations
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielPays
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielPermis
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielRegions
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielSecteursActivites
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielThemes
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererReferentielTypesContrats

### 9.3 SCHEMA

https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Agence
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Agregation
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Competence
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Contact
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/ContexteTravail
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Entreprise
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/FiltrePossible
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Formation
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Langue
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/LieuTravail
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Offre
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/OrigineOffre
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/PartenaireOffre
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Permis
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/QualitePro
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/ResultatRecherche
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Salaire
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Referentiel
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Commune
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Departement
https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/schemas/Region