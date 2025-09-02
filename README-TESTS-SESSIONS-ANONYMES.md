# 🧪 GUIDE DE TEST - SESSIONS ANONYMES CLEDGER5

## 🚀 **DÉMARRAGE RAPIDE APRÈS REDÉMARRAGE**

### **1. Démarrer le serveur (2 min)**
```bash
# Terminal 1 - Démarrer cledger5
cd C:\Users\Admin\odrive\Pierre@Barreaud\AI\cledger5.claude\cledger5
pnpm dev
# Serveur accessible sur http://localhost:3000
```

### **2. Tests automatiques des APIs (3 min)**
```bash
# Terminal 2 - Tester les endpoints
cd C:\Users\Admin\odrive\Pierre@Barreaud\AI\cledger5.claude\cledger5
.\test-anonymous-endpoints.ps1

# Attendu : Tous les tests passent
# - ✓ Création session anonyme (token crypto)
# - ✓ Validation session et rate limiting  
# - ✓ Initialisation upload CV
# - ✓ Gestion des erreurs de sécurité
```

### **3. Test interface utilisateur (5 min)**
1. **Ouvrir** http://localhost:3000
2. **Vérifier** : Homepage anonyme s'affiche (design moderne, CTA principal)
3. **Cliquer** "Analysez votre CV maintenant"
4. **Upload** un fichier PDF de test (n'importe lequel)
5. **Vérifier** : Progress tracker s'affiche avec animations
6. **Attendre** : Résultats partiels avec 5 compétences max
7. **Tester** : Bouton inscription + migration des données

---

## 🔧 **ENDPOINTS CORRIGÉS - TESTS MANUELS**

### **Test 1: Création Session Anonyme**
```bash
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/anonymous/session/create" -Method POST -Body '{"browser_fingerprint": "test-123"}' -ContentType "application/json"

# Attendu:
# {
#   "success": true,
#   "session_token": "AbCd123...", // Token crypto 43 caractères
#   "session_id": "uuid-format",
#   "expires_at": "2025-09-02T18:20:00.000Z",
#   "max_uploads": 3,
#   "remaining_uploads": 3
# }
```

### **Test 2: Résultats Partiels (après upload)**
```bash
# Utiliser session_token du test précédent
$token = "session_token_from_test_1"
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/cv/results/anonymous?session_token=$token&include_teaser_data=true" -Method GET

# Attendu: 
# - Status 404 (pas de CV) ou
# - Status 200 avec résultats partiels si CV uploadé
```

### **Test 3: Upload CV Anonyme**
```bash
# Upload init avec auto-création session
$uploadBody = @{
    filename = "test-cv.pdf"
    file_size = 1048576
    content_type = "application/pdf"
    file_hash = "sha256-hash-example"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/cv/upload/init?create_anonymous_session=true" -Method POST -Body $uploadBody -ContentType "application/json"

# Attendu:
# {
#   "session_id": "uuid",
#   "upload_url": "https://supabase-storage-url...",
#   "session_token": "auto-generated-token", 
#   "anonymous_session_id": "uuid"
# }
```

---

## 📊 **MÉTRIQUES DE SUCCÈS**

### **Tests Techniques ✅**
- [ ] **Création session** : Token 43 chars, UUID session_id, expiration 60min
- [ ] **Sécurité** : IP tracking, User-Agent hash, rate limiting
- [ ] **Upload init** : Signed URL généré, session créée automatiquement
- [ ] **Résultats partiels** : Max 5 compétences, CTA conversion
- [ ] **Performance** : Tous endpoints <500ms

### **Tests UX ✅**
- [ ] **Homepage anonyme** : Design attrayant, CTA visible
- [ ] **Upload flow** : Drag & drop, validation fichiers (PDF/Word, 10MB max)
- [ ] **Progress tracker** : Animations fluides, contenu éducatif
- [ ] **Résultats** : Interface partielle engageante, timer visible
- [ ] **Conversion** : Inscription seamless avec migration données

### **Tests Business ✅**
- [ ] **Lead capture** : User peut uploader sans inscription
- [ ] **Partial results** : Assez pour créer le désir, pas assez pour satisfaire
- [ ] **Time pressure** : Timer 60min visible et fonctionnel
- [ ] **Data migration** : Aucune perte lors de l'inscription
- [ ] **Mobile ready** : Responsive sur tous écrans

---

## 🚨 **PROBLÈMES POTENTIELS & SOLUTIONS**

### **Serveur ne démarre pas**
```bash
# Vérifier les ports occupés
netstat -an | findstr :3000
netstat -an | findstr :3006  
netstat -an | findstr :3009

# Killer les processus Node.js
taskkill /f /im node.exe
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### **Erreurs de base de données**
```bash
# Vérifier connexion Supabase
curl http://localhost:3000/api/health

# Appliquer migrations si nécessaire  
supabase db push
```

### **Erreurs 404 sur endpoints**
- Vérifier que les fichiers existent dans `src/app/api/`
- Redémarrer le serveur après modifications
- Vérifier les logs console du serveur

### **Frontend ne charge pas**
- Vérifier `src/app/page.tsx` utilise `SmartHomepage`
- Vérifier imports des composants anonymes
- Regarder console développeur du navigateur

---

## 📁 **FICHIERS IMPORTANTS**

### **APIs Corrigées:**
- `src/app/api/anonymous/session/create/route.ts` - **Création sessions**
- `src/app/api/cv/results/anonymous/route.ts` - **Résultats partiels**  
- `src/app/api/auth/sign-up/route.ts` - **Inscription + migration**
- `src/app/api/cv/upload/init/route.ts` - **Upload anonyme**

### **Composants Frontend:**
- `src/components/anonymous-homepage.tsx` - **Landing page**
- `src/components/anonymous-upload-flow.tsx` - **Flow upload**
- `src/components/partial-results-display.tsx` - **Résultats + CTA**
- `src/components/registration-prompt.tsx` - **Inscription**

### **Tests & Documentation:**
- `test-anonymous-endpoints.ps1` - **Tests automatiques**
- `docs/session-anonymes-audit-complet-02-sept-2025.md` - **Audit complet**

---

## 🎯 **CHECKLIST VALIDATION FINALE**

### **Phase 1: Tests Techniques (10 min)**
- [ ] Serveur démarre sans erreur
- [ ] Health check retourne status healthy
- [ ] Script `test-anonymous-endpoints.ps1` passe tous les tests
- [ ] Tous endpoints retournent JSON valide

### **Phase 2: Tests UX (10 min)**  
- [ ] Homepage anonyme s'affiche correctement
- [ ] Upload CV fonctionne (fichier PDF/Word)
- [ ] Progress tracker avec animations
- [ ] Résultats partiels s'affichent
- [ ] Bouton inscription mène au formulaire

### **Phase 3: Tests End-to-End (15 min)**
- [ ] Flow complet anonyme → résultats → inscription
- [ ] Migration des données fonctionne
- [ ] Utilisateur inscrit voit les données complètes
- [ ] Performance acceptable (<2 secondes total)

### **Phase 4: Validation Business (5 min)**
- [ ] Expérience "try-before-you-buy" convaincante
- [ ] Timer urgence visible et fonctionnel
- [ ] CTA conversion claire et engageante
- [ ] Mobile responsive

---

**✅ Si tous les tests passent : SYSTÈME PRÊT POUR PRODUCTION**

**❌ Si des tests échouent : Consulter la documentation d'audit complète**

---

*Guide créé le 2 septembre 2025*  
*Sessions Anonymes Cledger5 - Système "Try-Before-You-Buy"*