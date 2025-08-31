# 📚 Documentation Maintenance Guide
*Automated documentation quality and consistency*

## 🤖 **Automated Documentation Pipeline**

### **CI/CD Validation (GitHub Actions)**

Le pipeline `.github/workflows/docs-validation.yml` s'exécute automatiquement sur :
- **Push** vers `main` ou `develop` (fichiers docs/)
- **Pull Requests** vers `main` (fichiers docs/)

### **Validations Automatiques**

#### **1. 📝 Markdown Linting**
```yaml
- Formatage cohérent (titres, listes, liens)
- Respect des conventions Markdown
- Configuration: .markdownlint.json
```

#### **2. 🔗 Link Validation**  
```yaml
- Vérification liens internes entre docs/
- Validation liens externes (APIs, GitHub, etc.)
- Détection liens cassés automatique
```

#### **3. 🎯 Phase Consistency Check**
```yaml
- Cohérence numéros phases entre current-context.md et task-roadmap.md
- Alertes automatiques sur incohérences 
- Validation croisée statut projet
```

#### **4. 🗄️ Database Schema Sync**
```yaml
- Vérification références DB entre docs/ et migrations/
- Validation existence tables mentionnées
- Alertes sur désynchronisation schéma
```

#### **5. 📅 Auto-Update Dates**
```yaml
- Mise à jour automatique "Last Updated" sur modifications
- Commit automatique des dates [skip ci]
- Suivi chronologique des changements
```

## 📊 **Documentation Metrics**

### **Métriques Suivies Automatiquement**
- **Nombre total** de fichiers Markdown
- **Taille des fichiers** (lignes par document)  
- **TODOs/FIXMEs** en cours dans la documentation
- **Dates de mise à jour** des fichiers critiques
- **Références croisées** entre documents

### **Seuils de Qualité**
```yaml
Performance Targets Consistency: 
  - Search API: <500ms (mentions cohérentes)
  - Detail API: <700ms (références alignées)
  
Phase Numbers:
  - current-context.md ⟷ task-roadmap.md (synchronisation)
  
File Size Limits:
  - Warning: >500 lignes (considérer division)
  - Error: >1000 lignes (restructuration requise)
```

## 🔧 **Processus de Maintenance**

### **Workflow Développeur**

#### **1. Modification Documentation**
```bash
# Modifier un fichier docs/
vim docs/current-context.md

# Commit avec description claire  
git add docs/current-context.md
git commit -m "docs: update Phase 7 status - AI enhancement progress"
git push
```

#### **2. Validation Automatique**
- ✅ **CI/CD déclenché** automatiquement
- ✅ **Validations** markdown + liens + cohérence  
- ✅ **Dates mises à jour** si push vers main
- ❌ **Pull Request bloquée** si erreurs détectées

#### **3. Correction Erreurs**
```bash
# Si échec validation CI/CD
git checkout -b fix/docs-validation

# Corriger erreurs selon output CI
# Ex: lien cassé, incohérence phases, formatage

git commit -m "fix: resolve documentation validation errors"
git push origin fix/docs-validation

# Créer PR avec validations passantes
```

### **Maintenance Périodique** 

#### **Mensuelle** 
- [ ] **Review TODOs/FIXMEs** accumulés dans docs/
- [ ] **Validation liens externes** (APIs peuvent changer)
- [ ] **Mise à jour métriques** performance dans current-context.md
- [ ] **Synchronisation** DB schema avec nouvelles migrations

#### **Par Release (Phases)**
- [ ] **Update current-context.md** avec nouveau statut phase
- [ ] **Archivage** phase complétée dans development-history.md
- [ ] **Mise à jour** task-roadmap.md avec prochaines priorités
- [ ] **Validation croisée** de toute la documentation

#### **Annuelle**
- [ ] **Audit complet** structure documentation  
- [ ] **Réévaluation** processus maintenance
- [ ] **Migration** outils si nécessaire (markdownlint, etc.)

## ⚠️ **Alertes et Résolution**

### **Types d'Alertes CI/CD**

#### **🚨 CRITICAL (Bloque PR)**
```yaml
- Phase inconsistency entre fichiers critiques
- Liens cassés vers documentation technique  
- Schema références manquantes (DB tables inexistantes)
- Markdownlint errors (formatage incorrect)
```

#### **⚠️ WARNING (Informationnel)**
```yaml
- Fichiers >500 lignes (considérer refactoring)
- TODOs/FIXMEs anciens (>30 jours) 
- Performance targets incohérents
- Dates de mise à jour >14 jours
```

### **Guide de Résolution**

#### **Phase Inconsistency**
```bash
# Identifier les fichiers en conflit
grep -r "Phase [0-9]" docs/current-context.md docs/task-roadmap.md

# Corriger la phase dans le bon fichier selon état réel projet  
# current-context.md = état actuel
# task-roadmap.md = planification
```

#### **Liens Cassés**
```bash
# Identifier liens problématiques  
markdown-link-check docs/problematic-file.md

# Corriger URL ou chemin selon erreur
# Liens internes: vérifier chemin relatif
# Liens externes: vérifier URL encore valide
```

#### **Schema Désynchronisation**  
```bash
# Vérifier tables mentionnées dans docs/ vs migrations/
grep -r "CREATE TABLE" docs/ supabase/migrations/

# Mettre à jour 01-DB-Architecture.md selon dernières migrations
# Ou ajouter migration manquante si table documentée
```

## 🎯 **Best Practices**

### **Écriture Documentation**
- **Titres cohérents** avec emojis standards (🎯 🚀 ✅ ❌ ⚠️)
- **Dates systématiques** "Last Updated: DD/MM/YYYY" en header
- **Liens relatifs** pour navigation interne docs/
- **Status visual** avec checkboxes ✅ ❌ 🚧 pour suivi

### **Structure Fichiers**
- **<500 lignes** par fichier idéal
- **Sections claires** avec navigation interne  
- **Cross-references** entre documents liés
- **Versioning** via commit messages descriptifs

### **Maintenance Proactive**
- **Commit messages** clairs pour modifications docs
- **Review periodique** des métriques CI/CD
- **Update proactive** lors changements code/schema
- **Validation manuelle** avant gros changements

## 🔮 **Évolutions Futures**

### **Phase 1** (Prochains mois)
- **Documentation search** intégrée (fuzzy search)
- **API docs generation** automatique depuis code
- **Performance monitoring** docs vs metrics réels

### **Phase 2** (Long terme)  
- **Documentation portal** (GitBook/Notion intégration)
- **Visual validation** diagrammes Mermaid
- **Multi-language** support (FR/EN séparé)

---

*Guide complet maintenance documentation automatisée - Pipeline CI/CD opérationnel*