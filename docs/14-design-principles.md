# Cledger — Design Principles

Ce document définit les principes directeurs de conception UI/UX de Cledger. Il est à la fois un manifeste, un guide visuel et une procédure de vérification. Toute modification front-end doit se conformer à ce document.

---

## 1. Design Principles Manifesto

1. **Puissance invisible**  
   L’interface est épurée. La puissance technologique se ressent par la fluidité, la précision et la qualité des résultats, jamais par une accumulation de boutons ou d’options.

2. **Confiance par la clarté**  
   Chaque écran doit inspirer fiabilité. Textes courts, clairs, ton affirmé. Couleurs et typographies sérieuses et solides.

3. **Innovation tangible**  
   Les utilisateurs doivent sentir qu’ils utilisent un outil d’avant-garde. Micro-animations discrètes, transitions douces, organisation nouvelle mais évidente.

4. **Simplicité d’abord, profondeur ensuite**  
   Premier contact ultra simple. Ensuite, révélation progressive des fonctionnalités puissantes. Surface minimaliste, profondeur progressive.

5. **Desktop first, mobile fluide**  
   L’expérience de base est pensée pour desktop. Chaque composant doit être modulaire et s’adapter au mobile.

6. **Rythme rapide, mais posé**  
   Feedback immédiat, réponses instantanées. Ambiance visuelle posée, pas de stimuli agressifs.

7. **Identité visuelle premium-tech**  
   Palette sobre, technologique, élégante. Accent cyan pour signaler intelligence et sélection. Typo moderne. Icônes vectorielles, jamais cartoon.

8. **Expérience de vérité**  
   Cledger manipule des données de carrière. Priorité à la lisibilité, la traçabilité et la transparence. Pas de décoratif inutile.

9. **Next-gen recruitment**  
   Interfaces qui ne ressemblent pas à un job board classique. Plutôt dashboards analytiques et apps premium.

10. **Autonomie et indépendance**  
    Branding universel, intemporel, internationalisable. Pas de référence académique.

11. **Design for trust scaling**  
    Chaque feature doit être crédible. Transparence, explication simple des résultats, preuves visibles.

12. **Émotions : sérénité et maîtrise**  
    Le design doit générer calme et assurance. Mise en scène rassurante : “c’est complexe mais tu peux me faire confiance”.

---

## 2. UI Kit

### Palette de couleurs
- Fond clair : `#F8FAFB`
- Fond sombre : `#111827`
- Texte primaire : `#111111`
- Texte secondaire : `#6B7280`
- Accent principal : `#00C2A8`
- Accent secondaire : `#2563EB`
- Succès : `#16A34A`
- Attention : `#DC2626`
- Neutre gris clair : `#E5E7EB`

### Typographie
- Police principale : **Inter**
- Titres : SemiBold  
- Corps : Regular  
- Labels/UI : Medium

### Layout & Grille
- Desktop first, grille 12 colonnes, marges larges.  
- Mobile simplifié en pile verticale.  
- **Cards** comme surface principale.

### Composants
- **Navigation latérale** sombre, accent cyan sur actif.  
- **Header top** clair, logo minimal, CTA à droite.  
- **Cards** blanches, coins arrondis 4px, ombre douce.  
- **Boutons** : primaire cyan/blanc, secondaire contour gris/noir, danger rouge/blanc.  
- **Feedback** : animations discrètes, illustrations vectorielles minimalistes.

### Iconographie
- Style line icons (24px, 2px stroke).  
- Sources recommandées : Heroicons, Phosphor Icons.

### Moodboard visuel
- Notion (sobriété, espace premium)  
- Linear (accent color, rapidité)  
- Raycast (sobriété et puissance).

### Identité visuelle
- Logo minimal Cledger (Inter SemiBold, accent cyan sur “C”).  
- Tagline visuelle : *“Next-gen recruitment”*.

---

## 3. Procédures de vérification

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** – Review modified components/pages.  
2. **Navigate to affected pages** – Use `mcp_playwright_browser_navigate` to visit each changed view.  
3. **Verify design compliance** – Compare against `/context/design-principles.md` and `/context/style-guide.md`.  
4. **Validate feature implementation** – Ensure the change fulfills the user’s request.  
5. **Check acceptance criteria** – Review context files or requirements.  
6. **Capture evidence** – Take full page screenshot at 1440px viewport.  
7. **Check for errors** – Run `mcp_playwright_browser_console_messages`.  

### Comprehensive Design Review
Invoke the `agent-design-review` subagent for thorough design validation when:  
- Completing significant UI/UX features.  
- Submitting PRs with visual changes.  
- Needing extensive accessibility or responsiveness testing.  

### shadcn/ui
- Librairie de composants modernes basée sur Radix UI primitives.  
- Emplacement : `src/components/ui/`  
- Utiliser Tailwind CSS + variables CSS pour le theming.  
- Icônes Lucide React partout.  

---

## 4. Conclusion
Ce document est la référence unique pour toute décision UI/UX de Cledger.  
Toute implémentation doit :  
- Respecter le **Design Principles Manifesto**.  
- S’appuyer sur le **UI Kit**.  
- Passer par les **procédures de vérification** avant release.

