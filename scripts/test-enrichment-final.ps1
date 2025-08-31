# Test final pour l'API d'enrichissement GPT-4o-mini

$ApiUrl = "http://localhost:3007"
$AdminSecret = "Iletait1x"

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $AdminSecret
}

$offerIds = @(
    "66dabc3d-7411-41bc-8291-cae469bfc8b8",
    "9bd408e4-a9b9-49c4-b2a6-e6f1da4904cb"
)

$payload = @{
    offer_ids = $offerIds
    force_reprocess = $true
    confidence_threshold = 0.80
} | ConvertTo-Json

Write-Host "=== Test Final Enrichissement GPT-4o-mini ===" -ForegroundColor Magenta
Write-Host "Testing with $($offerIds.Count) offers..." -ForegroundColor Yellow

try {
    $result = Invoke-RestMethod -Uri "$ApiUrl/api/enrich/offers" -Method POST -Headers $headers -Body $payload
    
    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Total processed: $($result.total_processed)" -ForegroundColor Cyan
    Write-Host "Successful: $($result.successful)" -ForegroundColor Green
    Write-Host "Failed: $($result.failed)" -ForegroundColor Red
    
    if ($result.cost_tracking) {
        Write-Host "Tokens: $($result.cost_tracking.total_tokens_used)" -ForegroundColor Cyan
        Write-Host "Cost: $($result.cost_tracking.total_cost_usd) USD" -ForegroundColor Cyan
    }
    
    Write-Host "`nEnrichment API is working!" -ForegroundColor Green
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}