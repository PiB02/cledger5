# Test avec de nouvelles offres sans enrichissement existant

$ApiUrl = "http://localhost:3007"
$AdminSecret = "Iletait1x"

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $AdminSecret
}

# Nouvelles offres sans enrichissement
$offerIds = @(
    "ab59d629-4cfb-4d09-be9c-26ffa1cab2cb",
    "f43cca03-c7d7-4055-ac83-17a86adb7cbe"
)

$payload = @{
    offer_ids = $offerIds
    force_reprocess = $false
    confidence_threshold = 0.80
} | ConvertTo-Json

Write-Host "=== Test Nouvelles Offres Enrichissement ===" -ForegroundColor Magenta
Write-Host "Testing with $($offerIds.Count) fresh offers..." -ForegroundColor Yellow

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
    
    if ($result.successful -gt 0) {
        Write-Host "`n🎉 GPT-4o-mini AI Enrichment is fully functional!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}