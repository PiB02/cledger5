# Prompts LLM versionnés

Ce dossier contient tous les prompts utilisés pour les appels à OpenAI.

## Structure

- `offer-extraction/` - Prompts pour l'extraction et enrichissement des offres
- `cv-parsing/` - Prompts pour le parsing et l'analyse des CV
- `matching/` - Prompts pour expliquer les matchings

## Format

Les prompts sont stockés en YAML ou Markdown avec frontmatter pour le versioning.

## Bonnes pratiques

1. **Versionner** : Chaque modification majeure = nouvelle version
2. **Tester** : Toujours tester sur un échantillon avant déploiement
3. **Documenter** : Expliquer les changements dans les commentaires
4. **JSON strict** : Toujours demander du JSON valide en sortie
5. **Exemples** : Inclure des exemples dans les prompts

## Variables

Les prompts utilisent des variables au format `{{variable}}` qui sont remplacées à l'exécution. 