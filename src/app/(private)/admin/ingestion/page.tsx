'use client'

import { useState, useEffect, useCallback } from 'react'
import { startLbaIngestion } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  XCircle,
  Activity,
  Database,
  FileText,
  Calendar,
  Filter
} from 'lucide-react'
import { toast } from "sonner"

interface BatchStatus {
  batchId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt: string
  totalFetched: number
  totalProcessed: number
  totalInserted: number
  totalUpdated: number
  totalDeduplicated: number
  totalErrors: number
  errors: string[]
  currentPage: number
}

export default function IngestionPage() {
  // Codes ROME populaires pour l'alternance
  const romeCodes: MultiSelectOption[] = [
    { value: 'M1805', label: 'M1805 - Études et développement informatique', description: 'Développement, programmation, architecture logicielle' },
    { value: 'M1806', label: 'M1806 - Conseil et maîtrise d\'ouvrage en systèmes d\'information', description: 'Expertise technique, conseil IT' },
    { value: 'M1801', label: 'M1801 - Administration de systèmes d\'information', description: 'Administration réseau, systèmes, sécurité' },
    { value: 'M1802', label: 'M1802 - Expertise et support en systèmes d\'information', description: 'Support technique, maintenance IT' },
    { value: 'D1401', label: 'D1401 - Assistanat commercial', description: 'Commerce, vente, relation client' },
    { value: 'D1402', label: 'D1402 - Relation commerciale grands comptes et entreprises', description: 'Vente B2B, grands comptes' },
    { value: 'D1403', label: 'D1403 - Relation commerciale auprès de particuliers', description: 'Vente B2C, conseil clientèle' },
    { value: 'M1203', label: 'M1203 - Comptabilité', description: 'Comptabilité, gestion financière' },
    { value: 'M1204', label: 'M1204 - Contrôle de gestion', description: 'Analyse financière, contrôle budgétaire' },
    { value: 'M1205', label: 'M1205 - Direction administrative et financière', description: 'Management administratif et financier' },
    { value: 'I1401', label: 'I1401 - Maintenance informatique et bureautique', description: 'Maintenance, réparation matériel informatique' },
    { value: 'E1103', label: 'E1103 - Communication', description: 'Communication, marketing, digital' },
    { value: 'E1104', label: 'E1104 - Conception de contenus multimédias', description: 'Création graphique, web design, vidéo' },
    { value: 'K2111', label: 'K2111 - Formation professionnelle', description: 'Formation, enseignement professionnel' },
    { value: 'H1206', label: 'H1206 - Management et ingénierie études, recherche et développement industriel', description: 'R&D industrielle, innovation' }
  ]

  // Départements français (incluant le 45 - Loiret)
  const departments: MultiSelectOption[] = [
    { value: '75', label: '75 - Paris', description: 'Paris' },
    { value: '13', label: '13 - Bouches-du-Rhône', description: 'Marseille' },
    { value: '69', label: '69 - Rhône', description: 'Lyon' },
    { value: '31', label: '31 - Haute-Garonne', description: 'Toulouse' },
    { value: '06', label: '06 - Alpes-Maritimes', description: 'Nice' },
    { value: '44', label: '44 - Loire-Atlantique', description: 'Nantes' },
    { value: '67', label: '67 - Bas-Rhin', description: 'Strasbourg' },
    { value: '34', label: '34 - Hérault', description: 'Montpellier' },
    { value: '33', label: '33 - Gironde', description: 'Bordeaux' },
    { value: '59', label: '59 - Nord', description: 'Lille' },
    { value: '45', label: '45 - Loiret', description: 'Orléans' },
    { value: '77', label: '77 - Seine-et-Marne', description: 'Melun' },
    { value: '78', label: '78 - Yvelines', description: 'Versailles' },
    { value: '91', label: '91 - Essonne', description: 'Évry' },
    { value: '92', label: '92 - Hauts-de-Seine', description: 'Nanterre' },
    { value: '93', label: '93 - Seine-Saint-Denis', description: 'Bobigny' },
    { value: '94', label: '94 - Val-de-Marne', description: 'Créteil' },
    { value: '95', label: '95 - Val-d\'Oise', description: 'Cergy' },
  ]

  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState<BatchStatus[]>([])
  const [activeBatch, setActiveBatch] = useState<string | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  
  // Paramètres d'ingestion
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [limit, setLimit] = useState(1000)
  const [perPage, setPerPage] = useState(100)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedRomeCodes, setSelectedRomeCodes] = useState<string[]>(['M1805'])
  const [dryRun, setDryRun] = useState(false)

  // Charger les batchs existants
  useEffect(() => {
    fetchBatches()
    const interval = setInterval(fetchBatches, 5000) // Rafraîchir toutes les 5s
    return () => clearInterval(interval)
  }, [])

  // Écouter les SSE pour le batch actif
  useEffect(() => {
    if (!activeBatch) {
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }
      return
    }

    const es = new EventSource(`/api/batch/${activeBatch}/stream`)
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Mettre à jour le statut du batch
      setBatches(prev => prev.map(b => 
        b.batchId === activeBatch ? { ...b, ...data } : b
      ))
    }

    es.onerror = () => {
      console.error('SSE connection error')
      es.close()
    }

    setEventSource(es)
    
    return () => {
      es.close()
    }
  }, [activeBatch])

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/ingest/lba')
      if (response.ok) {
        const data = await response.json()
        setBatches(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const startIngestion = async () => {
    setLoading(true)
    
    try {
      const params = {
        limit,
        test: dryRun, // dryRun correspond au mode test
        from: fromDate || undefined,
        to: toDate || undefined,
        departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        romeCodes: selectedRomeCodes.length > 0 ? selectedRomeCodes : ['M1805'],
      }
      
      // Utiliser la Server Action sécurisée (s'exécute côté serveur)
      const result = await startLbaIngestion(params)
      
      if (result.success && result.data) {
        setActiveBatch(result.data.data.batchId)
        toast.success('Ingestion démarrée', {
          description: `Batch ID: ${result.data.data.batchId}`,
        })
        
        // Rafraîchir la liste des batchs
        setTimeout(fetchBatches, 1000)
      } else {
        toast.error('Erreur lors du démarrage de l\'ingestion', {
          description: result.error || 'Une erreur inconnue est survenue',
        })
      }
    } catch (error) {
      console.error('Error starting ingestion:', error)
      toast.error('Erreur réseau', {
        description: 'Impossible de démarrer l\'ingestion',
      })
    } finally {
      setLoading(false)
    }
  }

  const getBatchStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getBatchStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>
      case 'processing':
        return <Badge variant="default">En cours</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Terminé</Badge>
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR')
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ingestion des données</h1>
          <p className="text-muted-foreground">
            Gérer l'import des offres depuis LBA et France Travail
          </p>
        </div>
        <Button variant="outline" onClick={fetchBatches}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="lba" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lba">La Bonne Alternance</TabsTrigger>
          <TabsTrigger value="ft" disabled>France Travail (bientôt)</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* LBA Tab */}
        <TabsContent value="lba" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Formulaire d'ingestion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Nouvelle ingestion LBA
                </CardTitle>
                <CardDescription>
                  Configurer et lancer une ingestion depuis La Bonne Alternance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="from">Date début</Label>
                    <Input
                      id="from"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to">Date fin</Label>
                    <Input
                      id="to"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rome-codes">Codes ROME</Label>
                  <MultiSelect
                    options={romeCodes}
                    selected={selectedRomeCodes}
                    onChange={setSelectedRomeCodes}
                    placeholder="Sélectionner des codes ROME..."
                    searchPlaceholder="Rechercher un métier..."
                    maxDisplayed={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Par défaut : M1805 (Développement informatique). Sélectionnez plusieurs codes pour plus d'offres.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departments">Départements (optionnel)</Label>
                  <MultiSelect
                    options={departments}
                    selected={selectedDepartments}
                    onChange={setSelectedDepartments}
                    placeholder="Tous les départements (recommandé)"
                    searchPlaceholder="Rechercher un département..."
                    maxDisplayed={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laisser vide pour chercher dans toute la France. Le 45 (Loiret) est disponible.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limite d'offres</Label>
                    <Input
                      id="limit"
                      type="number"
                      min="1"
                      max="10000"
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perPage">Par page</Label>
                    <Input
                      id="perPage"
                      type="number"
                      min="10"
                      max="500"
                      value={perPage}
                      onChange={(e) => setPerPage(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="dry-run">Mode simulation</Label>
                    <p className="text-xs text-muted-foreground">
                      Tester sans sauvegarder en base
                    </p>
                  </div>
                  <Switch
                    id="dry-run"
                    checked={dryRun}
                    onCheckedChange={setDryRun}
                  />
                </div>

                <Button 
                  onClick={startIngestion} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Démarrage...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer l'ingestion
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Statut en temps réel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Batch actif
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeBatch && batches.find(b => b.batchId === activeBatch) ? (
                  <div className="space-y-4">
                    {(() => {
                      const batch = batches.find(b => b.batchId === activeBatch)!
                      const progressPercent = batch.totalProcessed > 0 
                        ? Math.round((batch.totalProcessed / Math.max(batch.totalFetched, 1)) * 100)
                        : 0
                        
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Statut</span>
                            {getBatchStatusBadge(batch.status)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progression</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Récupérées</p>
                              <p className="font-medium">{batch.totalFetched}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Traitées</p>
                              <p className="font-medium">{batch.totalProcessed}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Insérées</p>
                              <p className="font-medium text-green-600">{batch.totalInserted}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Dédupliquées</p>
                              <p className="font-medium text-orange-600">{batch.totalDeduplicated}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Erreurs</p>
                              <p className="font-medium text-red-600">{batch.totalErrors}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Page</p>
                              <p className="font-medium">{batch.currentPage}</p>
                            </div>
                          </div>
                          
                          {batch.errors.length > 0 && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                {batch.errors[batch.errors.length - 1]}
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aucune ingestion active
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des ingestions</CardTitle>
              <CardDescription>
                Liste des dernières ingestions effectuées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length > 0 ? (
                <div className="space-y-3">
                  {batches.map((batch) => (
                    <div
                      key={batch.batchId}
                      className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getBatchStatusIcon(batch.status)}
                          <span className="font-mono text-xs">
                            {batch.batchId}
                          </span>
                          {getBatchStatusBadge(batch.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Démarré le {formatDate(batch.startedAt)}
                        </p>
                        <div className="flex gap-4 text-xs">
                          <span>Récupérées: {batch.totalFetched}</span>
                          <span>Insérées: {batch.totalInserted}</span>
                          <span>Dédupliquées: {batch.totalDeduplicated}</span>
                          {batch.totalErrors > 0 && (
                            <span className="text-red-600">Erreurs: {batch.totalErrors}</span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveBatch(batch.batchId)}
                      >
                        Voir détails
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucune ingestion dans l'historique
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 