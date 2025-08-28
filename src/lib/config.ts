// Configuration publique de l'application
// Ces valeurs peuvent être exposées côté client

export const publicConfig = {
  // Configuration API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // Feature flags
  features: {
    enableIngestion: true,
    enableRealtime: true,
  },
} as const

export default publicConfig 