/**
 * Validation des variables d'environnement critiques
 * Ce fichier vérifie que toutes les variables requises sont présentes
 * et les charge dans un objet typé pour éviter les erreurs runtime
 */

// Variables d'environnement côté serveur (privées)
const serverEnv = {
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Admin
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  
  // APIs externes
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  LBA_ACCESS_TOKEN: process.env.LBA_ACCESS_TOKEN,
  FT_CLIENT_ID: process.env.FT_CLIENT_ID,
  FT_CLIENT_SECRET: process.env.FT_CLIENT_SECRET,
  
  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY,
}

// Variables d'environnement publiques (accessibles côté client)
const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}

/**
 * Valide que toutes les variables d'environnement requises sont présentes
 * @throws Error si une variable requise est manquante
 */
export function validateEnv() {
  const missingVars: string[] = []
  
  // Variables serveur requises en production
  if (process.env.NODE_ENV === 'production') {
    const requiredServerVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'ADMIN_SECRET',
      'OPENAI_API_KEY',
      'LBA_ACCESS_TOKEN',
      'RESEND_API_KEY',
    ]
    
    for (const varName of requiredServerVars) {
      if (!serverEnv[varName as keyof typeof serverEnv]) {
        missingVars.push(varName)
      }
    }
  }
  
  // Variables serveur requises même en dev
  const alwaysRequiredServerVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_SECRET', // CRITIQUE: jamais hardcoder ce secret!
  ]
  
  for (const varName of alwaysRequiredServerVars) {
    if (!serverEnv[varName as keyof typeof serverEnv]) {
      missingVars.push(varName)
    }
  }
  
  // Variables publiques toujours requises
  const requiredPublicVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  
  for (const varName of requiredPublicVars) {
    if (!publicEnv[varName as keyof typeof publicEnv]) {
      missingVars.push(varName)
    }
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `
⚠️  CONFIGURATION ERROR
━━━━━━━━━━━━━━━━━━━━━
Les variables d'environnement suivantes sont manquantes:
${missingVars.map(v => `  • ${v}`).join('\n')}

Pour configurer ces variables:
1. Copiez le fichier .env.example vers .env.local
2. Remplissez les valeurs manquantes
3. Redémarrez l'application

⚠️  SÉCURITÉ: Ne jamais commiter de secrets dans le code!
━━━━━━━━━━━━━━━━━━━━━
`
    
    console.error(errorMessage)
    
    // En production, on crash l'app si config manquante
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuration manquante. Voir les logs pour plus de détails.')
    }
  }
  
  return { serverEnv, publicEnv }
}

// Exporter les environnements typés et validés
export const env = validateEnv()

// Helper pour accéder aux variables serveur de manière sûre
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() ne peut être appelé que côté serveur!')
  }
  return env.serverEnv
}

// Helper pour accéder aux variables publiques
export function getPublicEnv() {
  return env.publicEnv
} 