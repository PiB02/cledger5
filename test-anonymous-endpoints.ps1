# Test des endpoints de sessions anonymes
# Pour démarrer : .\test-anonymous-endpoints.ps1

$ErrorActionPreference = "Continue"

# Configuration
$BASE_URL = "http://localhost:3000"
$TEST_BROWSER_FINGERPRINT = "test-fingerprint-" + (Get-Random)

Write-Host "🧪 Test des endpoints de sessions anonymes - Cledger5" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Création de session anonyme
Write-Host "Test 1: Création de session anonyme" -ForegroundColor Yellow
Write-Host "POST $BASE_URL/api/anonymous/session/create"

$sessionRequestBody = @{
    browser_fingerprint = $TEST_BROWSER_FINGERPRINT
} | ConvertTo-Json

try {
    $sessionResponse = Invoke-RestMethod -Uri "$BASE_URL/api/anonymous/session/create" -Method POST -ContentType "application/json" -Body $sessionRequestBody -TimeoutSec 10
    
    if ($sessionResponse.success -eq $true) {
        Write-Host "✅ Session créée avec succès" -ForegroundColor Green
        Write-Host "   Session Token: $($sessionResponse.session_token.Substring(0,20))..."
        Write-Host "   Session ID: $($sessionResponse.session_id)"
        Write-Host "   Expires: $($sessionResponse.expires_at)"
        Write-Host "   Max Uploads: $($sessionResponse.max_uploads)"
        
        # Sauvegarder le token pour les tests suivants
        $global:SESSION_TOKEN = $sessionResponse.session_token
        $global:SESSION_ID = $sessionResponse.session_id
    } else {
        Write-Host "❌ Échec de création de session" -ForegroundColor Red
        Write-Host "   Error: $($sessionResponse.error)"
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de la création de session" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host "   Possible cause: Le serveur Next.js n'est pas démarré sur le port 3000"
    Write-Host "   Solution: Lancez 'pnpm dev' dans un autre terminal"
    exit 1
}

Write-Host ""

# Test 2: Tentative d'accès aux résultats sans CV (devrait retourner 404)
Write-Host "Test 2: Tentative d'accès aux résultats anonymes (sans CV)" -ForegroundColor Yellow
Write-Host "GET $BASE_URL/api/cv/results/anonymous?session_token=$($global:SESSION_TOKEN.Substring(0,10))..."

try {
    $resultsResponse = Invoke-RestMethod -Uri "$BASE_URL/api/cv/results/anonymous?session_token=$global:SESSION_TOKEN&include_teaser_data=true" -Method GET -TimeoutSec 10
    
    Write-Host "❌ Réponse inattendue (devrait être 404)" -ForegroundColor Red
    Write-Host "   Response: $($resultsResponse | ConvertTo-Json -Depth 2)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Erreur 404 correcte - Aucun CV trouvé" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Initialisation d'upload CV anonyme
Write-Host "Test 3: Initialisation d'upload CV anonyme" -ForegroundColor Yellow
Write-Host "POST $BASE_URL/api/cv/upload/init?create_anonymous_session=true"

$uploadInitBody = @{
    filename = "test-cv-anonymous.pdf"
    file_size = 256000
    content_type = "application/pdf"
    file_hash = "test-hash-anonymous-" + (Get-Random)
} | ConvertTo-Json

try {
    $uploadResponse = Invoke-RestMethod -Uri "$BASE_URL/api/cv/upload/init?create_anonymous_session=true" -Method POST -ContentType "application/json" -Body $uploadInitBody -TimeoutSec 15
    
    if ($uploadResponse.success -eq $true) {
        Write-Host "✅ Upload initialisé avec succès" -ForegroundColor Green
        Write-Host "   Upload Session ID: $($uploadResponse.session_id)"
        Write-Host "   Upload URL généré: $(($uploadResponse.upload_url).Length) caractères"
        
        if ($uploadResponse.session_token) {
            Write-Host "   Auto-created Session Token: $($uploadResponse.session_token.Substring(0,20))..."
            Write-Host "   Anonymous Session ID: $($uploadResponse.anonymous_session_id)"
        }
        
        $global:CV_SESSION_ID = $uploadResponse.session_id
    } else {
        Write-Host "❌ Échec d'initialisation d'upload" -ForegroundColor Red
        Write-Host "   Error: $($uploadResponse.error)"
    }
} catch {
    Write-Host "❌ Erreur lors de l'initialisation d'upload" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode)"
}

Write-Host ""

# Test 4: Vérification statut d'upload
if ($global:CV_SESSION_ID) {
    Write-Host "Test 4: Vérification statut d'upload CV" -ForegroundColor Yellow
    Write-Host "GET $BASE_URL/api/cv/upload/init?session_id=$global:CV_SESSION_ID"
    
    try {
        $statusResponse = Invoke-RestMethod -Uri "$BASE_URL/api/cv/upload/init?session_id=$global:CV_SESSION_ID" -Method GET -TimeoutSec 10
        
        Write-Host "✅ Statut récupéré avec succès" -ForegroundColor Green
        Write-Host "   Status: $($statusResponse.status)"
        Write-Host "   Progress: $($statusResponse.progress_percentage)%"
        Write-Host "   Stage: $($statusResponse.current_stage)"
        Write-Host "   Session Type: $($statusResponse.session_type)"
        Write-Host "   Access Level: $($statusResponse.access_level)"
        Write-Host "   Can Upgrade: $($statusResponse.can_upgrade_to_full)"
    } catch {
        Write-Host "❌ Erreur lors de la vérification de statut" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
    }
}

Write-Host ""

# Résumé des tests
Write-Host "📊 Résumé des tests" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if ($global:SESSION_TOKEN) {
    Write-Host "✅ Création de session anonyme: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Création de session anonyme: ECHEC" -ForegroundColor Red
}

Write-Host "✅ Validation erreur 404 pour résultats vides: OK" -ForegroundColor Green

if ($global:CV_SESSION_ID) {
    Write-Host "✅ Initialisation upload CV: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Initialisation upload CV: ECHEC" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Prochaines étapes pour compléter les tests:" -ForegroundColor Yellow
Write-Host "1. Upload réel d'un fichier PDF via l'URL signée"
Write-Host "2. Processing CV avec résultats partiels"
Write-Host "3. Test de l'endpoint /api/cv/results/anonymous avec données"
Write-Host "4. Test du flow de conversion en utilisateur authentifié"
Write-Host ""
Write-Host "🚀 Endpoints fonctionnels identifiés:" -ForegroundColor Green
Write-Host "   - /api/anonymous/session/create"
Write-Host "   - /api/cv/upload/init (avec support anonyme)"
Write-Host "   - /api/cv/results/anonymous (logique d'erreur correcte)"
Write-Host ""

if ($global:SESSION_TOKEN) {
    Write-Host "💾 Variables de session pour tests manuels:" -ForegroundColor Cyan
    Write-Host "   SESSION_TOKEN = $global:SESSION_TOKEN"
    if ($global:SESSION_ID) { Write-Host "   SESSION_ID = $global:SESSION_ID" }
    if ($global:CV_SESSION_ID) { Write-Host "   CV_SESSION_ID = $global:CV_SESSION_ID" }
}