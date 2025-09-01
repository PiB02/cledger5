# Test script to verify the ingestion fix
# This tests that the September 2025 partition fix resolves the "error saving raw offer" issue

$adminSecret = $env:ADMIN_SECRET
if (-not $adminSecret) {
    Write-Error "ADMIN_SECRET environment variable not set"
    exit 1
}

Write-Host "🧪 Testing LBA ingestion after partition fix..." -ForegroundColor Cyan

try {
    # Test with a very small batch and dry run first
    Write-Host "1. Testing dry run (no actual DB writes)..."
    $dryRunResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/ingest/lba" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $adminSecret
    } -Body '{"limit": 5, "dryRun": true}'
    
    Write-Host "✅ Dry run successful - Batch ID: $($dryRunResponse.data.batchId)" -ForegroundColor Green
    
    # Test with a very small actual ingestion
    Write-Host "2. Testing real ingestion with 3 offers..."
    $realResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/ingest/lba" -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $adminSecret
    } -Body '{"limit": 3, "dryRun": false}'
    
    Write-Host "✅ Real ingestion started - Batch ID: $($realResponse.data.batchId)" -ForegroundColor Green
    Write-Host "📊 Stream URL: $($realResponse.data.streamUrl)" -ForegroundColor Blue
    
    # Wait a few seconds and check batch status
    Write-Host "3. Waiting 15 seconds for ingestion to complete..."
    Start-Sleep -Seconds 15
    
    $statusResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/ingest/lba?batchId=$($realResponse.data.batchId)" -Method GET
    
    Write-Host "📈 Batch Status: $($statusResponse.data.status)" -ForegroundColor Yellow
    Write-Host "📊 Total Fetched: $($statusResponse.data.totalFetched)"
    Write-Host "📊 Total Processed: $($statusResponse.data.totalProcessed)" 
    Write-Host "📊 Total Inserted: $($statusResponse.data.totalInserted)"
    Write-Host "📊 Total Errors: $($statusResponse.data.totalErrors)"
    
    if ($statusResponse.data.totalErrors -eq 0) {
        Write-Host "🎉 SUCCESS: Ingestion completed without errors!" -ForegroundColor Green
        Write-Host "🔧 The September 2025 partition fix resolved the issue." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some errors occurred during ingestion:" -ForegroundColor Yellow
        $statusResponse.data.errors | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    }
    
} catch {
    Write-Host "❌ Error testing ingestion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🏁 Test completed. Check the server logs for detailed output." -ForegroundColor Cyan