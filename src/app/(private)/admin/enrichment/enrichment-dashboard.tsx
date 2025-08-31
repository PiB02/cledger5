'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
  FileText
} from 'lucide-react'
import { triggerEnrichmentQueueAction } from './queue-actions'
import { toast } from 'sonner'

interface EnrichmentStats {
  overview: {
    total_offers: number
    enriched_offers: number
    pending_offers: number
    failed_offers: number
    success_rate: number
    avg_confidence: number
  }
  performance: {
    total_tokens_used: number
    total_cost_usd: number
    avg_processing_time_ms: number
    avg_tokens_per_offer: number
    cost_per_offer_usd: number
  }
  recent_activity: Array<{
    date: string
    offers_processed: number
    tokens_used: number
    cost_usd: number
    avg_confidence: number
  }>
  confidence_distribution: {
    high_confidence: number
    medium_confidence: number
    low_confidence: number
  }
  processing_status: {
    pending: number
    processing: number
    completed: number
    failed: number
    low_confidence: number
  }
}

export default function EnrichmentDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EnrichmentStats | null>(null)
  const [processing, setProcessing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchStats = async () => {
    try {
      // Utilise l'API admin qui ne nécessite pas de secret
      const response = await fetch('/api/admin/enrich/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const result = await response.json()
      setStats(result.data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching enrichment stats:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleTriggerQueue = async () => {
    setProcessing(true)
    try {
      const result = await triggerEnrichmentQueueAction()
      if (result.success) {
        toast.success(`Traitement lancé: ${result.data?.processed || 0} offres`)
        setTimeout(fetchStats, 2000) // Refresh après 2s
      } else {
        toast.error(result.error || 'Erreur lors du lancement')
      }
    } catch (error) {
      toast.error('Erreur lors du lancement du traitement')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 5,
      maximumFractionDigits: 5
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des statistiques d'enrichissement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Enrichissement IA
          </h2>
          <p className="text-muted-foreground">
            Monitoring GPT-4o-mini • Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            size="sm"
            onClick={handleTriggerQueue}
            disabled={processing}
          >
            <Zap className={`h-4 w-4 mr-2 ${processing ? 'animate-pulse' : ''}`} />
            {processing ? 'Traitement...' : 'Lancer Queue'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offres enrichies</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.enriched_offers}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Total: {stats.overview.total_offers}
              </p>
              <Badge variant="default">
                {stats.overview.success_rate.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.pending_offers}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Échecs: {stats.overview.failed_offers}
              </p>
              <Badge variant={stats.overview.pending_offers > 0 ? "secondary" : "outline"}>
                Queue
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance moyenne</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.overview.avg_confidence * 100).toFixed(1)}%
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Seuil: ≥80%</p>
              <Badge variant={stats.overview.avg_confidence >= 0.8 ? "default" : "destructive"}>
                {stats.overview.avg_confidence >= 0.8 ? "Élevée" : "Faible"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.performance.total_cost_usd)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Par offre: {formatCurrency(stats.performance.cost_per_offer_usd)}
              </p>
              <Badge variant="outline">OpenAI</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activité récente</TabsTrigger>
          <TabsTrigger value="queue">Queue de traitement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Distribution des confiances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribution des confiances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Haute confiance (≥80%)</span>
                    <Badge variant="default">{stats.confidence_distribution.high_confidence}</Badge>
                  </div>
                  <Progress 
                    value={(stats.confidence_distribution.high_confidence / Math.max(1, stats.overview.enriched_offers)) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Moyenne (60-79%)</span>
                    <Badge variant="secondary">{stats.confidence_distribution.medium_confidence}</Badge>
                  </div>
                  <Progress 
                    value={(stats.confidence_distribution.medium_confidence / Math.max(1, stats.overview.enriched_offers)) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Faible (<60%)</span>
                    <Badge variant="destructive">{stats.confidence_distribution.low_confidence}</Badge>
                  </div>
                  <Progress 
                    value={(stats.confidence_distribution.low_confidence / Math.max(1, stats.overview.enriched_offers)) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statuts de traitement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Statuts de traitement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Complétées</span>
                  </div>
                  <Badge variant="default">{stats.processing_status.completed}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">En attente</span>
                  </div>
                  <Badge variant="secondary">{stats.processing_status.pending}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">En cours</span>
                  </div>
                  <Badge variant="outline">{stats.processing_status.processing}</Badge>
                </div>

                {stats.processing_status.failed > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Échecs</span>
                    </div>
                    <Badge variant="destructive">{stats.processing_status.failed}</Badge>
                  </div>
                )}

                {stats.processing_status.low_confidence > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Confiance faible</span>
                    </div>
                    <Badge variant="secondary">{stats.processing_status.low_confidence}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Métriques de coût */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Métriques de coût
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Coût total</span>
                  <span className="font-medium">{formatCurrency(stats.performance.total_cost_usd)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Coût par offre</span>
                  <span className="font-medium">{formatCurrency(stats.performance.cost_per_offer_usd)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Tokens utilisés</span>
                  <span className="font-medium">{stats.performance.total_tokens_used.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Tokens par offre</span>
                  <span className="font-medium">{stats.performance.avg_tokens_per_offer}</span>
                </div>
              </CardContent>
            </Card>

            {/* Métriques de performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Temps de traitement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Temps moyen</span>
                  <Badge variant="outline">
                    {stats.performance.avg_processing_time_ms}ms
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance</span>
                    <Badge variant={stats.performance.avg_processing_time_ms < 5000 ? "default" : "destructive"}>
                      {stats.performance.avg_processing_time_ms < 5000 ? "Rapide" : "Lent"}
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.min(100, (stats.performance.avg_processing_time_ms / 10000) * 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">Target: &lt;5s par offre</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activité des 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recent_activity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune activité récente
                  </p>
                ) : (
                  stats.recent_activity.map((day, i) => (
                    <div key={day.date} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{formatDate(day.date)}</span>
                        <Badge variant="outline">{day.offers_processed} offres</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {day.tokens_used.toLocaleString()} tokens
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(day.cost_usd)}
                        </span>
                        {day.avg_confidence > 0 && (
                          <Badge variant={day.avg_confidence >= 0.8 ? "default" : "secondary"}>
                            {(day.avg_confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Queue de traitement
              </CardTitle>
              <CardDescription>
                Gestion des offres en attente d'enrichissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Offres en attente</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.overview.pending_offers} offres nécessitent un enrichissement IA
                  </p>
                </div>
                <Button 
                  onClick={handleTriggerQueue}
                  disabled={processing || stats.overview.pending_offers === 0}
                >
                  <Zap className={`h-4 w-4 mr-2 ${processing ? 'animate-pulse' : ''}`} />
                  {processing ? 'Traitement...' : 'Traiter la queue'}
                </Button>
              </div>

              {stats.overview.failed_offers > 0 && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Offres en échec
                    </p>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {stats.overview.failed_offers} offres ont échoué lors de l'enrichissement et nécessitent une intervention manuelle.
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>• Le traitement s'effectue par batches de 20 offres maximum</p>
                <p>• Les offres sont traitées par ordre chronologique</p>
                <p>• Le seuil de confiance minimum est de 80%</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}