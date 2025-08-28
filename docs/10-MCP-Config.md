# 10-MCP-Config.md — Serveurs Cursor

Allowlist stricte. Lecture par défaut. Aucune écriture prod sans RFC CTO.

## Serveurs
- github (RO): lire issues/PR/tags repo
- vercel (RO + preview): lire déploiements, créer previews; pas de promote prod
- http (RO): allowlist https://api.apprentissage.beta.gouv.fr; https://api.francetravail.io; https://context7.com
- openapi-ft (RO): charger spec FT
- openapi-lba (RO): charger spec LBA

## Exemple .cursor/config.json
```json
{
  "mcpServers": {
    "github": { "command":"node","args":["./mcp/github/index.js"],"env":{"GITHUB_TOKEN":"${GITHUB_TOKEN}","REPO_ALLOWLIST":"org/cledger5"} },
    "vercel": { "command":"node","args":["./mcp/vercel/index.js"],"env":{"VERCEL_TOKEN":"${VERCEL_TOKEN}","VERCEL_TEAM":"team","PROJECT_ALLOWLIST":"cledger5","ALLOW_PROMOTE_PROD":"false"} },
    "http": { "command":"node","args":["./mcp/http/index.js"],"env":{"HTTP_ALLOWLIST":"https://api.apprentissage.beta.gouv.fr;https://api.francetravail.io;https://context7.com","HTTP_METHODS":"GET"} },
    "openapi-ft": { "command":"node","args":["./mcp/openapi/index.js"],"env":{"OPENAPI_SPEC_URL":"<FT OpenAPI URL>","ALLOW_WRITE":"false"} },
    "openapi-lba": { "command":"node","args":["./mcp/openapi/index.js"],"env":{"OPENAPI_SPEC_URL":"<LBA Swagger URL>","ALLOW_WRITE":"false"} }
  }
}
```
