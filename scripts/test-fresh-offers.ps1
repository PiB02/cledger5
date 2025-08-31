# Test avec de vraies offres non enrichies

$ApiUrl = "http://localhost:3007"
$AdminSecret = "Iletait1x"

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $AdminSecret
}

# Vraies offres non enrichies
$freshOfferIds = @(
    "6f497b0c-4fad-4fbe-b39c-9acac3d931b0",
    "8316b53a-bc9e-4445-92fa-33c7e663e345",
    "1eb3a2d2-112d-4bf4-b2e0-e61287922ce9"
)

$payload = @{
    offer_ids = $freshOfferIds
    force_reprocess = $false
    confidence_threshold = 0.80
} | ConvertTo-Json

Write-Host "=== Test Nouvelles Offres Fraîches ===" -ForegroundColor Magenta
Write-Host "Testing with $($freshOfferIds.Count) fresh offers..." -ForegroundColor Yellow

try {
    $result = Invoke-RestMethod -Uri "$ApiUrl/api/enrich/offers" -Method POST -Headers $headers -Body $payload
    
    Write-Host "`nRESULT:" -ForegroundColor Green
    Write-Host "Total processed: $($result.total_processed)" -ForegroundColor Cyan
    Write-Host "Successful: $($result.successful)" -ForegroundColor Green  
    Write-Host "Failed: $($result.failed)" -ForegroundColor Red
    
    if ($result.cost_tracking) {
        Write-Host "Tokens: $($result.cost_tracking.total_tokens_used)" -ForegroundColor Cyan
        Write-Host "Cost: $($result.cost_tracking.total_cost_usd) USD" -ForegroundColor Cyan
    }
    
    if ($result.successful -and $result.successful -gt 0) {
        Write-Host "`n🎉 SUCCESS! AI Enrichment is working with fresh offers!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  No successful enrichments - check logs" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}