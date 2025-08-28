/**
 * Error Factory centralisé selon les règles Cursor
 * Gestion uniforme des erreurs avec codes HTTP et messages
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const httpErrorMap = {
  // 400 Bad Request
  BAD_REQUEST: (message = 'Requête invalide', details?: any) => 
    new AppError(400, 'BAD_REQUEST', message, details),
  
  VALIDATION_ERROR: (message = 'Erreur de validation', details?: any) =>
    new AppError(400, 'VALIDATION_ERROR', message, details),
  
  // 401 Unauthorized
  UNAUTHORIZED: (message = 'Non authentifié', details?: any) =>
    new AppError(401, 'UNAUTHORIZED', message, details),
  
  // 403 Forbidden
  FORBIDDEN: (message = 'Accès refusé', details?: any) =>
    new AppError(403, 'FORBIDDEN', message, details),
  
  // 404 Not Found
  NOT_FOUND: (message = 'Ressource introuvable', details?: any) =>
    new AppError(404, 'NOT_FOUND', message, details),
  
  // 409 Conflict
  CONFLICT: (message = 'Conflit de ressource', details?: any) =>
    new AppError(409, 'CONFLICT', message, details),
  
  // 422 Unprocessable Entity
  UNPROCESSABLE: (message = 'Entité non traitable', details?: any) =>
    new AppError(422, 'UNPROCESSABLE', message, details),
  
  // 429 Too Many Requests
  RATE_LIMIT: (message = 'Trop de requêtes', details?: any) =>
    new AppError(429, 'RATE_LIMIT', message, details),
  
  // 500 Internal Server Error
  INTERNAL: (message = 'Erreur interne du serveur', details?: any) =>
    new AppError(500, 'INTERNAL', message, details),
  
  // 502 Bad Gateway
  BAD_GATEWAY: (message = 'Erreur de passerelle', details?: any) =>
    new AppError(502, 'BAD_GATEWAY', message, details),
  
  // 503 Service Unavailable
  SERVICE_UNAVAILABLE: (message = 'Service temporairement indisponible', details?: any) =>
    new AppError(503, 'SERVICE_UNAVAILABLE', message, details),
} as const

export const errorFactory = httpErrorMap

/**
 * Helper pour créer une réponse d'erreur NextResponse
 */
export function errorResponse(error: AppError | Error) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: error.code,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Erreur non gérée
  console.error('Unhandled error:', error)
  return Response.json(
    {
      error: 'INTERNAL_ERROR',
      message: 'Une erreur inattendue s\'est produite',
    },
    { status: 500 }
  )
}

/**
 * Type guard pour AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Wrapper pour les API routes avec gestion d'erreur automatique
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse(error as Error)
    }
  }
} 