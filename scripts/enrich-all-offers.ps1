# Script PowerShell pour enrichir toutes les offres par batches
# Usage: powershell -File scripts/enrich-all-offers.ps1

param(
    [string]$ApiUrl = "http://localhost:3007",
    [string]$AdminSecret = "Iletait1x",
    [int]$BatchSize = 10,
    [int]$DelayBetweenBatches = 2,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "=== Enrichissement Masse de Toutes les Offres ===" -ForegroundColor Magenta

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $AdminSecret
}

# Récupérer toutes les offres non enrichies
Write-Host "1. Récupération des offres non enrichies..." -ForegroundColor Yellow

try {
    # Simuler récupération via API (à implémenter)
    # Pour l'instant, on utilise des IDs de test
    $allOfferIds = @(
        "66dabc3d-7411-41bc-8291-cae469bfc8b8",
        "9bd408e4-a9b9-49c4-b2a6-e6f1da4904cb", 
        "6cb8c006-405e-47c1-8d54-0dfcebf147fb",
        "ab59d629-4cfb-4d09-be9c-26ffa1cab2cb",
        "f43cca03-c7d7-4055-ac83-17a86adb7cbe"
    )
    
    Write-Host "   Trouvé $($allOfferIds.Count) offres à enrichir" -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Host "   DRY RUN MODE - Aucune action ne sera prise" -ForegroundColor Yellow
        Write-Host "   Batches qui seraient traités:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $allOfferIds.Count; $i += $BatchSize) {
            $batch = $allOfferIds[$i..[Math]::Min($i + $BatchSize - 1, $allOfferIds.Count - 1)]
            Write-Host "     Batch $([Math]::Floor($i / $BatchSize) + 1): $($batch.Count) offres" -ForegroundColor Gray
        }
        return
    }
    
} catch {
    Write-Host "   Erreur lors de la récupération: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Traitement par batches
$totalBatches = [Math]::Ceiling($allOfferIds.Count / $BatchSize)
$totalProcessed = 0
$totalSuccessful = 0
$totalFailed = 0
$totalCost = 0
$totalTokens = 0

Write-Host "`n2. Traitement en $totalBatches batches de $BatchSize offres..." -ForegroundColor Yellow

for ($i = 0; $i -lt $allOfferIds.Count; $i += $BatchSize) {
    $batchNum = [Math]::Floor($i / $BatchSize) + 1
    $batch = $allOfferIds[$i..[Math]::Min($i + $BatchSize - 1, $allOfferIds.Count - 1)]
    
    Write-Host "`n   Batch $batchNum/$totalBatches ($($batch.Count) offres)..." -ForegroundColor Cyan
    
    $payload = @{
        offer_ids = $batch
        force_reprocess = $false
        confidence_threshold = 0.80
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        $result = Invoke-RestMethod -Uri "$ApiUrl/api/enrich/offers" -Method POST -Headers $headers -Body $payload
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        $totalProcessed += if ($result.total_processed) { $result.total_processed } else { 0 }
        $totalSuccessful += if ($result.successful) { $result.successful } else { 0 }
        $totalFailed += if ($result.failed) { $result.failed } else { 0 }
        
        if ($result.cost_tracking) {
            $totalCost += if ($result.cost_tracking.total_cost_usd) { $result.cost_tracking.total_cost_usd } else { 0 }
            $totalTokens += if ($result.cost_tracking.total_tokens_used) { $result.cost_tracking.total_tokens_used } else { 0 }
        }
        
        Write-Host "     ✅ Succès: $($result.successful), Échecs: $($result.failed), Durée: $([Math]::Round($duration))ms" -ForegroundColor Green
        
        if ($result.cost_tracking) {
            Write-Host "     💰 Tokens: $($result.cost_tracking.total_tokens_used), Coût: $($result.cost_tracking.total_cost_usd) USD" -ForegroundColor Cyan
        }
        
    } catch {
        Write-Host "     ❌ Erreur batch: $($_.Exception.Message)" -ForegroundColor Red
        $totalFailed += $batch.Count
    }
    
    # Délai entre batches pour éviter rate limiting
    if ($i + $BatchSize -lt $allOfferIds.Count) {
        Write-Host "     ⏳ Attente $DelayBetweenBatches secondes..." -ForegroundColor Gray
        Start-Sleep -Seconds $DelayBetweenBatches
    }
}

# Résumé final
Write-Host "`n=== RÉSUMÉ FINAL ===" -ForegroundColor Magenta
Write-Host "Total traité: $totalProcessed offres" -ForegroundColor Cyan
Write-Host "Succès: $totalSuccessful" -ForegroundColor Green
Write-Host "Échecs: $totalFailed" -ForegroundColor Red
Write-Host "Tokens total: $totalTokens" -ForegroundColor Cyan
Write-Host "Coût total: $([Math]::Round($totalCost, 6)) USD" -ForegroundColor Cyan

$successRate = if ($totalProcessed -gt 0) { [Math]::Round(($totalSuccessful / $totalProcessed) * 100, 1) } else { 0 }
Write-Host "Taux de succès: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } else { "Yellow" })

Write-Host "`n🎉 Enrichissement masse terminé!" -ForegroundColor Green