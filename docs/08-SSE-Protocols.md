# 08-SSE-Protocols.md — Server-Sent Events

`Content-Type: text/event-stream`

## Batch d’ingestion
Types:
- status  → {"phase":"fetch|raw|canon|enrich|embed|done|error"}
- progress→ {"current":123,"total":10000}
- log     → {"level":"info|warn|error","msg":"..."}
- estimate→ {"durationSec":120,"costEur":1.23}
- result  → {"offerId":"uuid","source":"LBA|FT","action":"insert|update|skip"}
- error   → {"code":"string","message":"string"}
- done    → {"fetched":n,"upserted":n,"errors":n}

## Intégration CV
- step → {"name":"upload|parse|enrich|save|embed","state":"start|ok|error"}
