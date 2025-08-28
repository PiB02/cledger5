# 13-Prompting-Guidelines.md — GPT‑4o‑mini (extraction, normalisation, matching)

> Objectif: sorties **fiables**, **déterministes**, **peu coûteuses**. Pas de prompts fournis. **Lignes directrices uniquement.**

## 1) Principes
- **Rôle unique**: l’IA est un **extracteur/normaliseur**, pas un rédacteur libre.
- **Sortie unique**: **JSON strict**. Aucune phrase ni commentaire.
- **Vocabulaire fermé**: privilégier **énumérations** et **schémas**. Pas de texte libre hors champs prévus.
- **Tolérance à l’incertitude**: si inconnu → `null` ou `[]`. **Jamais d’invention**.
- **Langue de sortie**: **FR**. Entrées multilingues acceptées.
- **Idempotence**: même entrée ⇒ même sortie (température basse + peu de hasard).

## 2) Paramètres par défaut
- `temperature`: **0.2** (extraction), **0.0–0.1** si dérives.
- `top_p`: **0.1**.  
- `frequency_penalty`: **0**, `presence_penalty`: **0**.  
- **Pas de streaming** pour l’extraction (plus d’erreurs JSON).
- **JSON structuré**: utiliser **response_format JSON** si dispo; sinon valider par `jsonschema`.

## 3) Schémas et validation
- **Définir un JSON Schema** par tâche:  
  - `offer_enrichment`: `{ job_title, rome_codes[], skills_required[], skills_preferred[], seniority, languages[], degree_min_eqf, confidence }`  
  - `cv_enrichment`: `{ profile_title, rome_codes[], skills_explicit[], skills_inferred[], career_level, languages[], degrees[], summary, confidence }`
- **Enums**: fermer les valeurs (ex: `career_level`: `intern|junior|mid|senior|lead|manager`).
- **Niveaux**: langues en **CEFR** (`A1`…`C2`). Diplôme en **EQF** (`1..8`) + `degree_label` optionnel.
- **Confiance**: `0.0..1.0`. Pas de `%`.
- **Validation**: parser la réponse, appliquer `jsonschema`, sinon **reparer** (voir §8).

## 4) Normalisation (ROME4, skills, géo, contrats)
- **ROME4**: renvoyer **codes** (ex: `M1805`) + optionnel `labels`. Multiples permis; **tri asc**; **dé‑dupe**.
- **Compétences**:  
  - **required** vs **preferred** (seuil `required` ≥ **0.80** de confiance interne).  
  - **lowercase**, **unaccent**, **trim**, max **50** par liste.  
  - Mapper via `skill_aliases` quand dispo; sinon laisser brut.
- **Géo**: retourner **ville/dept/région** si extraits; ne pas deviner lat/lon.
- **Contrat / work mode**: retourner **codes canoniques** (APP, PRO, CDI, CDD, `onsite|remote|hybrid`), sinon `unknown`.
- **Séniorité**: `intern|junior|mid|senior|lead|manager`. Deux clés: `career_level` + `min_years_exp?`.

## 5) Texte d’embedding (rappel, commun Offre/CV)
- Respecter strictement le **format** défini dans le PRD §3.1.  
- Tri et **séparateurs** exacts. Taille totale **≤ 1500** chars.  
- Interdits: ponctuation fantaisie, emojis, champs manquants.  
- Rejeter la sortie si `SKILLS_REQUIRED` vide alors que des requirements existent.

## 6) Patterns d’invite (sans fournir le texte)
- **Système**: rôle d’**extracteur**. Sortie **JSON strict**, schéma imposé, **FR** uniquement.
- **Développeur**: rappeler les **règles métier** (seuils, enums, non‑invention, null si inconnu, dé‑dupe, tri).
- **Utilisateur**: payload source **brut** + **rappels minimaux** (contexte FR, objectifs).  
- **Contre‑exemples**: inclure 1–2 **negative examples** (ex: sorties rejetées) pour renforcer les contraintes.
- **Few‑shot**: privilégier **1–3 exemples courts** et **valables**; bannir exemples contradictoires.

## 7) Coût et latence
- **Chunking**: offres et CV courts ⇒ un seul appel. Longs CV ⇒ **résumer sections** avant extraction.  
- **Tokens**: viser < **2k tokens**/appel. Au‑delà, pré‑filtrer/abréger.  
- **Batch**: paralléliser **jusqu’à la limite API**; respecter backoff et quotas fournisseurs.

## 8) Réparation & robustesse
- Si JSON invalide:  
  1) **Tentative parse** leniente (strip BOM, enlever préfixe/suffixe non JSON).  
  2) **Re‑prompt court**: “réponds en **JSON valide** strictement au schéma X, sans commentaire”.  
  3) **Auto‑réparation** via `jsonrepair` si acceptable.  
- **Contradictions**: si `degree_min_eqf` hors `1..8` ⇒ `null`.  
- **Post‑traitement**: dé‑dupe, limiter à **50** skills, normaliser ordres.

## 9) Évaluations offline (“goldens”)
- Construire un **jeu doré** de 100 offres et 50 CV.  
- Métriques: **validité JSON** (%), **précision ROME**, **F1 compétences requises**, **exact match CEFR**, **drift** par version de prompt.  
- Un **hash** de sortie attendue par entrée vérifie la **non‑régression** et l’**idempotence**.

## 10) Sécurité & conformité
- **Aucune PII** inventée. Si PII absente → champs `null`.  
- **Non‑lucratif LBA**: ne pas générer ou inférer des contacts employeurs si non fournis par la source.  
- **Traçabilité**: versionner prompts, **model**, **temperature**, **top_p**, **schema_version** dans `offer_enrichment` / `cv_parse_runs`.
- **Langue**: sortie **FR**; chiffres et unités SI; formats date **ISO**.

## 11) Anti‑hallucination
- Interdire “**deviner**” les ROME, diplômes, langues. Si incertain → `[]` ou `null`.  
- **Ne pas citer** de sources ou inventer de liens.  
- **Rappeler** la règle “inconnu ⇒ null” dans le rôle **développeur**.

## 12) Versionnage & dérives
- Chaque changement de consigne ⇒ **`prompt_version`** incrémenté + changelog.  
- Comparer les **goldens** avant merge.  
- Rollback si validité JSON < **98 %** ou F1 compétences < **95 %**.

## 13) Cas spécifiques
- **Offres multi‑langues**: conserver la sortie FR; capturer `original_language` dans les runs.  
- **Descriptions bruyantes** (PDF OCR): pré‑nettoyage minimal (espace/encodage) côté app, **pas** dans le prompt.  
- **Skills implicites**: autoriser `skills_inferred[]` mais **jamais** en `required` si info absente.

## 14) Journalisation
- Stocker: `prompt_version`, `model`, `params`, `schema_version`, `hash_input`, `hash_output`, `latency_ms`, `token_usage`.  
- Jamais de **payload complet** en logs si PII; garder `content_sha256`.

---

**Checklist d’implémentation (extraction)**  
- [ ] `temperature=0.2`, `top_p=0.1`.  
- [ ] `response_format=JSON` ou validation `jsonschema`.  
- [ ] Schéma + enums fermés.  
- [ ] Null si inconnu. Pas d’invention.  
- [ ] Post‑traitement: normalisation ROME/skills/CEFR/EQF, tri, limites.  
- [ ] Hash input/output + versionnage.  
- [ ] Tests “goldens” verts ≥ 98 % validité JSON.  
