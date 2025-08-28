import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { errorFactory } from '@/lib/errors'
import { z } from 'zod'

// Schema de validation pour l'ID
const paramsSchema = z.object({
  id: z.string().uuid('ID invalide')
})

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * SSE endpoint pour suivre la progression d'un batch
 * Format SSE : "data: {json}\n\n"
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // Validation de l'ID
  const params = await context.params
  const validation = paramsSchema.safeParse(params)
  
  if (!validation.success) {
    return Response.json(
      { error: 'ID_INVALID', message: 'ID de batch invalide' },
      { status: 400 }
    )
  }
  
  const { id } = validation.data
  
  // Connexion Supabase
  const supabase = await createSupabaseServer()
  
  // Vérification que le batch existe
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .select('id, status, name, type')
    .eq('id', id)
    .single()
  
  if (batchError || !batch) {
    return Response.json(
      { error: 'NOT_FOUND', message: `Batch ${id} introuvable` },
      { status: 404 }
    )
  }
  
  // Création du stream SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Envoi du message initial
      const initialMessage = {
        type: 'batch_info',
        data: batch,
        timestamp: new Date().toISOString()
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
      )
      
      // Si le batch est déjà terminé, fermer le stream
      if (['completed', 'failed', 'cancelled'].includes(batch.status)) {
        const finalMessage = {
          type: 'batch_finished',
          data: { status: batch.status },
          timestamp: new Date().toISOString()
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(finalMessage)}\n\n`)
        )
        controller.close()
        return
      }
      
      // Simulation de progression (en production, utiliser Supabase Realtime)
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        
        if (progress >= 100) {
          clearInterval(interval)
          
          // Message de fin
          const completeMessage = {
            type: 'batch_completed',
            data: {
              batch_id: id,
              progress: 100,
              status: 'completed'
            },
            timestamp: new Date().toISOString()
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completeMessage)}\n\n`)
          )
          controller.close()
        } else {
          // Message de progression
          const progressMessage = {
            type: 'batch_progress',
            data: {
              batch_id: id,
              progress: Math.min(Math.floor(progress), 100),
              message: `Traitement en cours... ${Math.floor(progress)}%`
            },
            timestamp: new Date().toISOString()
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progressMessage)}\n\n`)
          )
        }
      }, 2000) // Toutes les 2 secondes
      
      // Gestion de la déconnexion client
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  // Retour de la réponse SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

/**
 * POST pour envoyer un événement au stream (admin only)
 * En production, utiliser Supabase Realtime ou Redis Pub/Sub
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  // Validation de l'ID
  const params = await context.params
  const validation = paramsSchema.safeParse(params)
  
  if (!validation.success) {
    return Response.json(
      { error: 'ID_INVALID', message: 'ID de batch invalide' },
      { status: 400 }
    )
  }
  
  const { id } = validation.data
  
  try {
    const body = await request.json()
    
    // Ici on pourrait publier l'événement dans un système pub/sub
    // Pour l'instant, on simule juste un succès
    
    return Response.json({
      success: true,
      message: 'Événement publié',
      batch_id: id,
      event: body
    })
  } catch (error) {
    return Response.json(
      { error: 'INVALID_BODY', message: 'Corps de requête invalide' },
      { status: 400 }
    )
  }
} 