# Test simplifié pour l'API d'enrichissement GPT-4o-mini
# Utilise des IDs d'offres connues directement

param(
    [string]$ApiUrl = "http://localhost:3007",
    [string]$AdminSecret = $env:ADMIN_SECRET
)

$ErrorActionPreference = "Stop"

Write-Host "=== Test Enrichissement GPT-4o-mini (Simplifié) ===" -ForegroundColor Magenta

if (-not $AdminSecret) {
    Write-Host "Error: ADMIN_SECRET parameter required" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $AdminSecret
}

# Test avec des IDs d'offres connus
$offerIds = @(
    "66dabc3d-7411-41bc-8291-cae469bfc8b8",
    "9bd408e4-a9b9-49c4-b2a6-e6f1da4904cb", 
    "6cb8c006-405e-47c1-8d54-0dfcebf147fb"
)

Write-Host "1. Test API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method GET
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   Health failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Test Enrichment avec IDs directs..." -ForegroundColor Yellow
Write-Host "   IDs à traiter: $($offerIds -join ', ')" -ForegroundColor Gray

$payload = @{
    offer_ids = $offerIds
    force_reprocess = $true
    confidence_threshold = 0.80
} | ConvertTo-Json

Write-Host "   Payload: $payload" -ForegroundColor Gray

try {
    $result = Invoke-RestMethod -Uri "$ApiUrl/api/enrich/offers" -Method POST -Headers $headers -Body $payload
    
    Write-Host "`n3. Résultats:" -ForegroundColor Green
    Write-Host "   Total traité: $($result.total_processed)" -ForegroundColor Cyan
    Write-Host "   Succès: $($result.successful)" -ForegroundColor Green
    Write-Host "   Échecs: $($result.failed)" -ForegroundColor Red
    Write-Host "   Confiance faible: $($result.low_confidence)" -ForegroundColor Yellow
    
    if ($result.cost_tracking) {
        $cost = $result.cost_tracking
        Write-Host "   Tokens utilisés: $($cost.total_tokens_used)" -ForegroundColor Cyan
        Write-Host "   Coût total: $([math]::Round($cost.total_cost_usd, 6)) USD" -ForegroundColor Cyan
    }
    
    if ($result.enrichments -and $result.enrichments.Count -gt 0) {
        Write-Host "`n4. Enrichissements réussis:" -ForegroundColor Green
        foreach ($enrichment in $result.enrichments) {
            Write-Host "   Offer ID: $($enrichment.offer_id)" -ForegroundColor Cyan
            if ($enrichment.confidence_scores) {
                $conf = $enrichment.confidence_scores
                Write-Host "     Confiance globale: $([math]::Round($conf.global, 3))" -ForegroundColor Green
            }
            if ($enrichment.seniority_level) {
                Write-Host "     Niveau: $($enrichment.seniority_level)" -ForegroundColor Green
            }
        }
    }
    
    if ($result.errors -and $result.errors.Count -gt 0) {
        Write-Host "`n5. Erreurs:" -ForegroundColor Red
        foreach ($error in $result.errors) {
            Write-Host "   $($error.offer_id): $($error.error)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nTest terminé avec succès!" -ForegroundColor Green
    
} catch {
    Write-Host "   Enrichment failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
    exit 1
}