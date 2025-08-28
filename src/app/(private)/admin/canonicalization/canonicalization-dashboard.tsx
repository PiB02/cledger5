'use client'

/**
 * Dashboard interactif pour la canonicalisation
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Database,
  Filter,
  Users,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'

interface CanonicalizationStats {
  summary: {
    totalRawOffers: number
    totalCanonicalOffers: number
    totalPending: number
  }
  bySource: Record<string, {
    total: number
    processed: number
    pending: number
  }>
}

interface CanonicalizationResult {
  source_id: string
  processed: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
  errorCount: number
}

export function CanonicalizationDashboard() {
  const [stats, setStats] = useState<CanonicalizationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<CanonicalizationResult | null>(null)
  const [adminSecret, setAdminSecret] = useState('')

  // Charge les statistiques
  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/canonicalize?admin_secret=${encodeURIComponent(adminSecret)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  // Déclenche la canonicalisation pour une source
  const canonicalizeSource = async (sourceId: string) => {
    if (!adminSecret.trim()) {
      toast.error('Veuillez saisir le secret admin')
      return
    }

    try {
      setProcessing(sourceId)
      setLastResult(null)

      const response = await fetch('/api/canonicalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_id: sourceId,
          admin_secret: adminSecret,
          batch_size: 50,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      setLastResult(result.results)
      
      toast.success(`Canonicalisation terminée: ${result.results.inserted} nouvelles offres, ${result.results.updated} mises à jour`)
      
      // Recharge les statistiques
      await loadStats()
      
    } catch (error) {
      console.error('Canonicalization failed:', error)
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setProcessing(null)
    }
  }

  // Charge les stats au montage si le secret est disponible
  useEffect(() => {
    if (adminSecret.trim()) {
      loadStats()
    }
  }, [adminSecret])

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles</CardTitle>
          <CardDescription>
            Gérez le processus de canonicalisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Secret admin */}
          <div className="space-y-2">
            <label htmlFor="admin-secret" className="text-sm font-medium">
              Secret Admin
            </label>
            <div className="flex gap-2">
              <input
                id="admin-secret"
                type="password"
                placeholder="Entrez le secret admin..."
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
              <Button 
                onClick={loadStats} 
                disabled={loading || !adminSecret.trim()}
                size="sm"
                variant="outline"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offres Brutes</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalRawOffers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total des données brutes ingérées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offres Canoniques</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalCanonicalOffers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Offres après déduplication
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                À traiter
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques par source */}
      {stats && Object.keys(stats.bySource).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Canonicalisation par Source</CardTitle>
            <CardDescription>
              État du traitement pour chaque source de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(stats.bySource).map(([sourceId, sourceStats]) => {
                const progressPercent = sourceStats.total > 0 
                  ? Math.round((sourceStats.processed / sourceStats.total) * 100)
                  : 0

                return (
                  <div key={sourceId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{sourceId}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Total: {sourceStats.total}</span>
                          <span>Traité: {sourceStats.processed}</span>
                          <span>En attente: {sourceStats.pending}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={sourceStats.pending === 0 ? "default" : "secondary"}>
                          {progressPercent}% traité
                        </Badge>
                        
                        <Button
                          size="sm"
                          onClick={() => canonicalizeSource(sourceId)}
                          disabled={processing !== null || sourceStats.pending === 0}
                          className="min-w-[100px]"
                        >
                          {processing === sourceId ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              Process...
                            </>
                          ) : sourceStats.pending === 0 ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Terminé
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Canonicaliser
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Progress value={progressPercent} className="h-2" />
                    
                    {sourceId !== Object.keys(stats.bySource)[Object.keys(stats.bySource).length - 1] && (
                      <Separator />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats du dernier traitement */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Dernier Traitement - {lastResult.source_id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-green-600">{lastResult.inserted}</div>
                <div className="text-sm text-muted-foreground">Nouvelles offres</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-blue-600">{lastResult.updated}</div>
                <div className="text-sm text-muted-foreground">Mises à jour</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-yellow-600">{lastResult.skipped}</div>
                <div className="text-sm text-muted-foreground">Ignorées</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-red-600">{lastResult.errorCount}</div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
            </div>

            {lastResult.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{lastResult.errorCount} erreur(s) détectée(s)</strong>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">Voir les erreurs</summary>
                    <ul className="mt-2 space-y-1 text-sm">
                      {lastResult.errors.map((error, index) => (
                        <li key={index} className="text-destructive">{error}</li>
                      ))}
                      {lastResult.errorCount > lastResult.errors.length && (
                        <li className="text-muted-foreground">
                          ... et {lastResult.errorCount - lastResult.errors.length} autres erreurs
                        </li>
                      )}
                    </ul>
                  </details>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* État vide */}
      {!loading && !stats && adminSecret.trim() && (
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
            <p className="text-muted-foreground">
              Vérifiez vos permissions ou contactez l'administrateur.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}