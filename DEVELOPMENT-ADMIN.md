# 🔓 DEVELOPMENT ADMIN ACCESS SYSTEM

Cette documentation décrit le système d'accès admin temporaire pour le développement de cledger5.

## ⚠️ IMPORTANT SÉCURITÉ

**Ce système doit être DÉSACTIVÉ en production !**

## 🔧 Configuration Développement

### Variables d'environnement

```bash
# .env.local (développement uniquement)
NODE_ENV=development
DEV_ADMIN_BYPASS=true
```

### Comment ça fonctionne

1. **Mode développement** (`NODE_ENV=development`)
2. **Bypass activé** (`DEV_ADMIN_BYPASS=true`)
3. **Auto-promotion admin** : Tout utilisateur connecté devient automatiquement admin

## 🚀 Utilisation en Développement

### Accès aux interfaces admin

Avec le bypass activé, tu as automatiquement accès à :

- **Dashboard Admin** : `/admin`
- **Ingestion LBA/FT** : `/admin/ingestion`
- **Monitoring Batches** : `/admin/batches`
- **Toutes les APIs admin** : `/api/admin/*`

### Audit et Logs

Le système logs automatiquement :
- **Actions admin** avec prefix `DEV_`
- **Bypass reason** dans les métadonnées
- **IP et User Agent** pour traçabilité

```javascript
// Exemple de log en mode dev
{
  user_id: "user_2xxx",
  action: "DEV_lba_ingestion_start",
  resource: "lba_ingestion",
  metadata: {
    dev_bypass: "DEV_ADMIN_BYPASS enabled",
    params: {...}
  }
}
```

## 🏭 Transition vers Production

### ✅ Checklist Sécurité Production

1. **Variables d'environnement** :
   ```bash
   # .env.production (OBLIGATOIRE)
   NODE_ENV=production
   # DEV_ADMIN_BYPASS=false  # OU supprimer complètement
   ```

2. **Configuration Admin Réelle** :
   - Créer des utilisateurs admin dans `app_users`
   - Configurer les rôles via Clerk metadata
   - Tester l'accès sans bypass

3. **Audit de Sécurité** :
   - Vérifier que `getDevAdminStatus()` retourne `DISABLED`
   - Confirmer que `/api/auth/admin-check` refuse l'accès aux non-admin
   - Tests avec utilisateurs normaux

### 🔒 Gestion Admin Production

```sql
-- Créer un admin en production
INSERT INTO app_users (clerk_id, role) 
VALUES ('user_2xxxxx', 'admin');

-- Vérifier les admins
SELECT clerk_id, role, created_at 
FROM app_users 
WHERE role = 'admin';
```

## 🧪 Tests de Sécurité

### Test 1: Vérification du bypass

```bash
# Dev (doit retourner status: ACTIVE)
curl http://localhost:3001/api/auth/admin-check

# Production (doit retourner 403)
curl https://production.cledger5.com/api/auth/admin-check
```

### Test 2: Interface admin

- **Développement** : Accès automatique pour utilisateurs connectés
- **Production** : "Accès non autorisé" pour utilisateurs normaux

### Test 3: APIs admin

```javascript
// Test d'ingestion
fetch('/api/admin/ingest/lba', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ romeCodes: ['M1805'], limit: 10, dryRun: true })
})
```

## 📋 Utilisation par les Développeurs

### Développement Local

```bash
# 1. Assure-toi que les variables sont configurées
cat .env.local | grep -E "(NODE_ENV|DEV_ADMIN_BYPASS)"

# 2. Lance le serveur
pnpm dev

# 3. Connecte-toi avec n'importe quel compte Clerk
# 4. Va sur /admin - tu as automatiquement accès admin
```

### Debug et Logs

```javascript
// Vérifie le statut du bypass
console.log(getDevAdminStatus());
// { isDevelopment: true, devAdminBypass: true, status: 'ACTIVE' }

// Vérifie tes permissions
fetch('/api/auth/admin-check', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
// { isAdmin: true, bypassReason: "DEV_ADMIN_BYPASS enabled", devMode: true }
```

## 🚨 Signaler des Problèmes

Si tu rencontres des problèmes :

1. **Vérifier les variables d'environnement**
2. **Regarder les logs de développement**
3. **Tester `/api/auth/admin-check`**
4. **Vérifier la connexion Clerk**

## 📝 Code Impliqué

### Fichiers Modifiés

- `src/lib/auth/dev-admin.ts` - Logique de bypass
- `src/app/api/auth/admin-check/route.ts` - API de vérification
- `src/app/admin/*/page.tsx` - Interfaces admin modifiées
- `src/app/api/admin/*/route.ts` - Endpoints admin sécurisés
- `.env.local` - Configuration développement

### Composants de Sécurité

```typescript
// Utilisation dans les composants
const [adminStatus, setAdminStatus] = useState({ isAdmin: false });

useEffect(() => {
  fetch('/api/auth/admin-check', { method: 'POST' })
    .then(r => r.json())
    .then(setAdminStatus);
}, []);

if (!adminStatus.isAdmin) {
  return <div>Accès non autorisé</div>;
}
```

---

## ⚡ Résumé

- **Développement** : `DEV_ADMIN_BYPASS=true` → Accès admin automatique
- **Production** : `NODE_ENV=production` → Sécurité stricte obligatoire  
- **Transition** : Variables d'env + admins réels + tests sécurité
- **Audit** : Tous les accès sont loggés avec traçabilité

**🔒 RAPPEL** : Ce système doit être DÉSACTIVÉ avant déploiement production !