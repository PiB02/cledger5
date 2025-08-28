# 12-Email-Templates.md — Transactionnels (Resend)

Variables: {{appName}}, {{userName}}, {{confirmUrl}}, {{resetUrl}}, {{alertUrl}}

## Confirmation
Sujet: Confirmez votre compte {{appName}}
Corps:
Bonjour,
Cliquez pour confirmer: {{confirmUrl}}

## Reset mot de passe
Sujet: Réinitialisation de votre mot de passe
Corps:
Bonjour,
Définissez un nouveau mot de passe: {{resetUrl}}

## Alerte nouvelles offres
Sujet: Nouvelles offres pour vous
Corps:
Des correspondances sont disponibles: {{alertUrl}}

## Suppression compte
Sujet: Suppression de votre compte
Corps:
Votre compte sera supprimé sous 48 h.
