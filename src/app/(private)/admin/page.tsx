'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Users, 
  Building2, 
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Zap
} from 'lucide-react'

interface DashboardStats {
  offers: {
    total: number
    active: number
    expired: number
    alternance: number
    trend: number
  }
  candidates: {
    total: number
    active: number
    verified: number
    trend: number
  }
  companies: {
    total: number
    active: number
    verified: number
    trend: number
  }
  matches: {
    total: number
    today: number
    week: number
    trend: number
  }
  ingestion: {
    lastLBA: string
    lastFT: string
    pendingBatches: number
    failedBatches: number
  }
  performance: {
    searchLatencyP95: number
    matchingLatencyP95: number
    apiAvailability: number
    dbConnections: number
  }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    offers: { total: 3, active: 3, expired: 0, alternance: 1, trend: 15 },
    candidates: { total: 152, active: 89, verified: 45, trend: 8 },
    companies: { total: 2, active: 2, verified: 1, trend: 0 },
    matches: { total: 347, today: 23, week: 156, trend: 12 },
    ingestion: {
      lastLBA: '2024-12-26T10:30:00',
      lastFT: '2024-12-25T22:00:00',
      pendingBatches: 2,
      failedBatches: 0
    },
    performance: {
      searchLatencyP95: 1200,
      matchingLatencyP95: 450,
      apiAvailability: 99.95,
      dbConnections: 12
    }
  })
  
  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{value}%</span>
        </div>
      )
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )
    }
    return <span className="text-sm text-muted-foreground">Stable</span>
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de la plateforme cledger5
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offres actives</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offers.active}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Total: {stats.offers.total}
              </p>
              <TrendIndicator value={stats.offers.trend} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidats actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.candidates.active}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Total: {stats.candidates.total}
              </p>
              <TrendIndicator value={stats.candidates.trend} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies.active}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Vérifiées: {stats.companies.verified}
              </p>
              <TrendIndicator value={stats.companies.trend} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs cette semaine</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matches.week}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Aujourd'hui: {stats.matches.today}
              </p>
              <TrendIndicator value={stats.matches.trend} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '10:45', event: 'Nouvelle offre publiée', type: 'offer' },
                    { time: '10:32', event: '5 candidatures reçues', type: 'application' },
                    { time: '09:15', event: 'Ingestion LBA terminée', type: 'ingestion' },
                    { time: '08:45', event: 'Nouveau candidat inscrit', type: 'user' },
                    { time: '08:00', event: 'Batch FT démarré', type: 'batch' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        <span className="text-sm">{item.event}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Statistiques offres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition des offres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CDI</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CDD</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Alternance</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stage</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ingestion" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* État des sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Sources de données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">LBA</Badge>
                    <div>
                      <p className="text-sm font-medium">La Bonne Alternance</p>
                      <p className="text-xs text-muted-foreground">
                        Dernière synchro: {formatDate(stats.ingestion.lastLBA)}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">FT</Badge>
                    <div>
                      <p className="text-sm font-medium">France Travail</p>
                      <p className="text-xs text-muted-foreground">
                        Dernière synchro: {formatDate(stats.ingestion.lastFT)}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            {/* Batchs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Batchs en cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.ingestion.pendingBatches > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                      <div>
                        <p className="text-sm font-medium">En cours</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.ingestion.pendingBatches} batch{stats.ingestion.pendingBatches > 1 ? 's' : ''} en traitement
                        </p>
                      </div>
                      <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />
                    </div>
                  )}
                  
                  {stats.ingestion.failedBatches > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                      <div>
                        <p className="text-sm font-medium">Échecs</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.ingestion.failedBatches} batch{stats.ingestion.failedBatches > 1 ? 's' : ''} en erreur
                        </p>
                      </div>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Lancer une ingestion manuelle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Latences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Latences P95
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recherche</span>
                    <Badge variant={stats.performance.searchLatencyP95 > 500 ? "destructive" : "default"}>
                      {stats.performance.searchLatencyP95}ms
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.min(100, (stats.performance.searchLatencyP95 / 500) * 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">Target: &lt;500ms</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Matching</span>
                    <Badge variant="default">
                      {stats.performance.matchingLatencyP95}ms
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.min(100, (stats.performance.matchingLatencyP95 / 500) * 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">Target: &lt;500ms</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Système */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Santé du système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disponibilité API</span>
                  <Badge variant="default">
                    {stats.performance.apiAvailability}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connexions DB actives</span>
                  <Badge variant="secondary">
                    {stats.performance.dbConnections}/50
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">État général</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      Opérationnel
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alertes système
              </CardTitle>
              <CardDescription>
                Événements nécessitant votre attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Latence de recherche élevée</p>
                    <p className="text-xs text-muted-foreground">
                      La latence P95 dépasse 500ms. Optimisation requise.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Il y a 2 heures</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Investiguer
                  </Button>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ingestion LBA réussie</p>
                    <p className="text-xs text-muted-foreground">
                      245 nouvelles offres importées avec succès.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Il y a 4 heures</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Voir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 