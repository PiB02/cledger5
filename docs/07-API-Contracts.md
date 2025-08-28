# 07-API-Contracts.md — Contrats HTTP internes

Erreur standard
```json
{ "code": "string", "message": "string", "traceId": "uuid" }
```

## Recherche offres
GET /api/search/offers
- Query: q?, rome?, contract?, workMode?, lat?, lon?, radiusKm?=20, page?=1, perPage?=20, sort?=recent
- 200:
```json
{ "items":[{"id":"uuid","title":"..","company":"..","city":"..","contract":"APP","score":0.87}],
  "total":1234,"page":1,"perPage":20 }
```

## Détail offre
GET /api/offers/:id
- 200: miroir offers/* + sources + enrichissements

## Ingest LBA
POST /api/ingest/offers/lba
- Auth: x-admin-secret
- Body: { "from":"YYYY-MM-DD","to":"YYYY-MM-DD","limit":10000,"perPage":500 }
- 200: { "fetched":123,"upserted":120,"errors":3 }

## Ingest FT
POST /api/ingest/offers/ft
- Contrat identique

## Upload CV
POST /api/cv/upload
- multipart/form-data → file: PDF
- 200: { "cvId":"uuid","documentId":"uuid" }

## Parse CV
POST /api/cv/parse
- Body: { "cvId":"uuid" } → { "status":"ok" }

## Embedding CV
POST /api/cv/embed
- Body: { "cvId":"uuid" } → { "status":"ok" }

## Lancer batch
POST /api/batch
- Body: { "source":"LBA|FT","filters":{...} } → { "batchId":"uuid","estimate":{"durationSec":120,"costEur":1.23} }

## Stream batch (SSE)
GET /api/batch/:id/stream
- text/event-stream
