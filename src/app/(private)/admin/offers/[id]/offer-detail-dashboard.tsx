'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ArrowLeft,
  RefreshCw,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  User,
  Globe,
  Phone,
  ExternalLink,
  Hash,
  Target,
  Languages,
  GraduationCap,
  Code,
  DollarSign,
  FileText,
  Database
} from 'lucide-react'
import { toast } from 'sonner'
import { enrichOfferAction } from '../enrich-actions'

interface OfferDetail {
  id: string
  canonical_fingerprint: string
  title: string
  description: string | null
  status: string
  created_at: string
  expiration_at: string | null
  updated_at: string
  alternance: boolean
  contract_type: string | null
  work_mode: string | null
  contract_type_code: string | null
  work_mode_code: string | null
  work_time_code: string | null
  contract_start_date: string | null
  contract_duration_months: number | null
  opening_count: number | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string | null
  salary_period_code: string | null
  salary_label: string | null
  target_diploma_label: string | null
  rome_codes: string[] | null
  rncp_codes: string[] | null
  apply_url: string | null
  apply_phone: string | null
  source_primary: string
  partner_label: string | null
  career_level: string | null
  max_years_exp: number | null
  company: {
    id: string
    siret: string | null
    name: string
    brand: string | null
    legal_name: string | null
    website: string | null
    size_range: string | null
    naf_code: string | null
  } | null
  location: {
    id: string
    address1: string | null
    address2: string | null
    postal_code: string | null
    city: string | null
    insee_code: string | null
    country_code: string
    department_code: string | null
    region_code: string | null
    geohash: string | null
  } | null
  enrichment: {
    offer_id: string
    parse_status: string
    last_parsed_at: string | null
    error_msg: string | null
    last_raw_id: string | null
    enrichment_status: string
    processed_at: string | null
    confidence_scores: any
    created_at: string
    updated_at: string
    enrichment_version: string
    model_used: string
    skills_required: any
    skills_preferred: any
    seniority_level: string | null
    languages_detected: any
    degree_requirements: any
    rome_codes_suggested: string[] | null
    job_category_detected: string | null
    company_size_indicators: string[] | null
    tokens_used: number | null
    processing_time_ms: number | null
    retry_count: number
  } | null
  sources: Array<{
    source_id: string
    source_offer_id: string
    origin_url: string | null
    is_primary: boolean
    created_at: string
  }>
  raw_data: Array<{
    id: string
    source_id: string
    source_offer_id: string
    fetched_at: string
    last_seen_at: string
    is_active: boolean
    origin_url: string | null
    raw: any
    processed_at: string | null
  }>
}

interface Props {
  offerId: string
}

export default function OfferDetailDashboard({ offerId }: Props) {
  const [loading, setLoading] = useState(true)
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [enriching, setEnriching] = useState(false)

  const fetchOffer = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/offers/${offerId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Offre non trouvée')
        }
        throw new Error('Erreur lors du chargement de l\'offre')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue')
      }
      
      setOffer(result.data)
      
    } catch (error) {
      console.error('Error fetching offer:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffer()
  }, [offerId])

  const handleEnrich = async () => {
    if (!offer) return
    
    try {
      setEnriching(true)
      
      const result = await enrichOfferAction(offerId)
      
      if (result.success) {
        toast.success('Enrichissement lancé avec succès')
        setTimeout(fetchOffer, 2000)
      } else {
        toast.error(result.error || 'Erreur lors de l\'enrichissement')
      }
      
    } catch (error) {
      console.error('Error enriching offer:', error)
      toast.error('Erreur lors de l\'enrichissement')
    } finally {
      setEnriching(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSalary = () => {
    if (!offer || (!offer.salary_min && !offer.salary_max)) return null
    
    const min = offer.salary_min ? `${offer.salary_min.toLocaleString('fr-FR')}` : '?'
    const max = offer.salary_max ? `${offer.salary_max.toLocaleString('fr-FR')}` : '?'
    const period = offer.salary_period || 'an'
    
    if (offer.salary_min && offer.salary_max) {
      return `${min} - ${max} ${offer.salary_currency} / ${period}`
    } else if (offer.salary_min) {
      return `À partir de ${min} ${offer.salary_currency} / ${period}`
    } else if (offer.salary_max) {
      return `Jusqu'à ${max} ${offer.salary_currency} / ${period}`
    }
    
    return null
  }

  const getEnrichmentStatusBadge = () => {
    if (!offer?.enrichment) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
    }

    switch (offer.enrichment.enrichment_status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />Enrichi
        </Badge>
      case 'failed':
        return <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />Échec
        </Badge>
      case 'low_confidence':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <AlertCircle className="h-3 w-3 mr-1" />Confiance faible
        </Badge>
      case 'processing':
        return <Badge variant="outline">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />En cours
        </Badge>
      default:
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />En attente
        </Badge>
    }
  }

  const getConfidenceScore = (): number | null => {
    if (!offer?.enrichment?.confidence_scores) return null
    
    const scores = offer.enrichment.confidence_scores
    if (typeof scores === 'number') return scores
    if (typeof scores === 'object') {
      const values = Object.values(scores).filter(v => typeof v === 'number') as number[]
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null
    }
    return null
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement du détail de l'offre...</span>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Offre non trouvée</h2>
          <p className="text-muted-foreground mb-4">L'offre demandée n'existe pas ou n'est plus disponible.</p>
          <Button asChild>
            <Link href="/admin/offers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/offers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{offer.title}</h1>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>ID: {offer.id}</span>
                <Badge variant="outline">{offer.status}</Badge>
                {getEnrichmentStatusBadge()}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchOffer}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {(!offer.enrichment || 
            ['pending', 'failed', 'low_confidence'].includes(offer.enrichment.enrichment_status)) && (
            <Button 
              size="sm"
              onClick={handleEnrich}
              disabled={enriching}
            >
              <Brain className={`h-4 w-4 mr-2 ${enriching ? 'animate-pulse' : ''}`} />
              {enriching ? 'Enrichissement...' : 'Enrichir'}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Informations générales</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichissement IA</TabsTrigger>
          <TabsTrigger value="sources">Sources & Données brutes</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Détails de l'offre
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Titre</label>
                  <p className="font-medium">{offer.title}</p>
                </div>

                {offer.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <ScrollArea className="h-32 w-full rounded border p-3">
                      <p className="text-sm whitespace-pre-wrap">{offer.description}</p>
                    </ScrollArea>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type de contrat</label>
                    <p>{offer.contract_type_code || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mode de travail</label>
                    <p>{offer.work_mode_code || 'Non renseigné'}</p>
                  </div>
                </div>

                {offer.career_level && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Niveau de carrière</label>
                    <Badge variant="outline" className="ml-2">
                      <User className="h-3 w-3 mr-1" />
                      {offer.career_level}
                    </Badge>
                  </div>
                )}

                {formatSalary() && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salaire</label>
                    <p className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                    <p className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {formatDate(offer.created_at)}
                    </p>
                  </div>
                  {offer.expiration_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date d'expiration</label>
                      <p className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDate(offer.expiration_at)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.company ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nom</label>
                      <p className="font-medium">{offer.company.brand || offer.company.name}</p>
                      {offer.company.brand && offer.company.name !== offer.company.brand && (
                        <p className="text-sm text-muted-foreground">({offer.company.name})</p>
                      )}
                    </div>

                    {offer.company.siret && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">SIRET</label>
                        <p className="font-mono text-sm">{offer.company.siret}</p>
                      </div>
                    )}

                    {offer.company.website && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Site web</label>
                        <a 
                          href={offer.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          {offer.company.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {offer.company.size_range && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Taille</label>
                          <p>{offer.company.size_range}</p>
                        </div>
                      )}
                      {offer.company.naf_code && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Code NAF</label>
                          <p>{offer.company.naf_code}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Informations entreprise non renseignées</p>
                )}
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.location ? (
                  <>
                    {(offer.location.address1 || offer.location.address2) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                        <div>
                          {offer.location.address1 && <p>{offer.location.address1}</p>}
                          {offer.location.address2 && <p>{offer.location.address2}</p>}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ville</label>
                        <p>{offer.location.city || 'Non renseignée'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Code postal</label>
                        <p>{offer.location.postal_code || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Département</label>
                        <p>{offer.location.department_code || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Région</label>
                        <p>{offer.location.region_code || 'Non renseignée'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Informations de localisation non renseignées</p>
                )}
              </CardContent>
            </Card>

            {/* Contact & Application */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Candidature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.apply_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL de candidature</label>
                    <a 
                      href={offer.apply_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline break-all"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      {offer.apply_url}
                    </a>
                  </div>
                )}

                {offer.apply_phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {offer.apply_phone}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Source</label>
                    <Badge variant="outline">{offer.source_primary}</Badge>
                  </div>
                  {offer.opening_count && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Postes ouverts</label>
                      <p>{offer.opening_count}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrichment" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Statut enrichissement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Statut de l'enrichissement IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.enrichment ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Statut</span>
                      {getEnrichmentStatusBadge()}
                    </div>

                    {getConfidenceScore() !== null && (
                      <div className="flex items-center justify-between">
                        <span>Score de confiance moyen</span>
                        <Badge variant={getConfidenceScore()! >= 0.8 ? "default" : "secondary"}>
                          {(getConfidenceScore()! * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Modèle</label>
                        <p>{offer.enrichment.model_used}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Version</label>
                        <p>{offer.enrichment.enrichment_version}</p>
                      </div>
                    </div>

                    {offer.enrichment.processed_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Traité le</label>
                        <p>{formatDate(offer.enrichment.processed_at)}</p>
                      </div>
                    )}

                    {offer.enrichment.tokens_used && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tokens utilisés</label>
                          <p>{offer.enrichment.tokens_used.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Temps de traitement</label>
                          <p>{offer.enrichment.processing_time_ms}ms</p>
                        </div>
                      </div>
                    )}

                    {offer.enrichment.error_msg && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Erreur</label>
                        <p className="text-red-600 text-sm">{offer.enrichment.error_msg}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Aucun enrichissement effectué</p>
                )}
              </CardContent>
            </Card>

            {/* Compétences détectées */}
            {offer.enrichment && (offer.enrichment.skills_required || offer.enrichment.skills_preferred) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Compétences détectées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offer.enrichment.skills_required && Array.isArray(offer.enrichment.skills_required) && offer.enrichment.skills_required.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Compétences requises</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {offer.enrichment.skills_required.map((skill: any, index: number) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {typeof skill === 'string' ? skill : skill.name || skill.skill}
                            {skill.confidence && (
                              <span className="ml-1 opacity-75">
                                ({(skill.confidence * 100).toFixed(0)}%)
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {offer.enrichment.skills_preferred && Array.isArray(offer.enrichment.skills_preferred) && offer.enrichment.skills_preferred.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Compétences souhaitées</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {offer.enrichment.skills_preferred.map((skill: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {typeof skill === 'string' ? skill : skill.name || skill.skill}
                            {skill.confidence && (
                              <span className="ml-1 opacity-75">
                                ({(skill.confidence * 100).toFixed(0)}%)
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Autres informations IA */}
            {offer.enrichment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Informations extraites
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offer.enrichment.seniority_level && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Niveau de séniorité</label>
                      <Badge variant="outline" className="ml-2">
                        <User className="h-3 w-3 mr-1" />
                        {offer.enrichment.seniority_level}
                      </Badge>
                    </div>
                  )}

                  {offer.enrichment.languages_detected && Array.isArray(offer.enrichment.languages_detected) && offer.enrichment.languages_detected.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Langues détectées</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {offer.enrichment.languages_detected.map((lang: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Languages className="h-3 w-3 mr-1" />
                            {lang.language || lang.name} 
                            {lang.level && <span className="ml-1">({lang.level})</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {offer.enrichment.rome_codes_suggested && offer.enrichment.rome_codes_suggested.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Codes ROME suggérés</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {offer.enrichment.rome_codes_suggested.map((code, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {offer.enrichment.job_category_detected && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Catégorie détectée</label>
                      <p>{offer.enrichment.job_category_detected}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scores de confiance détaillés */}
            {offer.enrichment?.confidence_scores && typeof offer.enrichment.confidence_scores === 'object' && (
              <Card>
                <CardHeader>
                  <CardTitle>Scores de confiance détaillés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(offer.enrichment.confidence_scores).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{key}</span>
                        <Badge variant={typeof value === 'number' && value >= 0.8 ? "default" : "secondary"}>
                          {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sources de données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offer.sources.map((source, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={source.is_primary ? "default" : "outline"}>
                          {source.source_id}
                        </Badge>
                        {source.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primaire</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(source.created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ID source</label>
                        <p className="font-mono text-sm">{source.source_offer_id}</p>
                      </div>
                      
                      {source.origin_url && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">URL origine</label>
                          <a 
                            href={source.origin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline text-sm break-all"
                          >
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            {source.origin_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Données brutes */}
          {offer.raw_data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Données brutes ({offer.raw_data.length} versions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offer.raw_data.slice(0, 3).map((rawItem, index) => (
                    <div key={rawItem.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">{rawItem.source_id}</Badge>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Récupéré: {formatDate(rawItem.fetched_at)}</div>
                          <div>Vu: {formatDate(rawItem.last_seen_at)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={rawItem.is_active ? "default" : "secondary"}>
                            {rawItem.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          {rawItem.processed_at && (
                            <Badge variant="outline" className="text-xs">
                              Traité le {new Date(rawItem.processed_at).toLocaleDateString('fr-FR')}
                            </Badge>
                          )}
                        </div>
                        
                        {rawItem.origin_url && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">URL</label>
                            <p className="text-sm font-mono break-all">{rawItem.origin_url}</p>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Données JSON</label>
                          <ScrollArea className="h-32 w-full rounded border p-3 mt-1">
                            <pre className="text-xs">
                              {JSON.stringify(rawItem.raw, null, 2)}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {offer.raw_data.length > 3 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... et {offer.raw_data.length - 3} autres versions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}