'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search,
  Filter,
  Eye,
  Brain,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  Monitor,
  User,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { enrichOfferAction } from './enrich-actions'

interface OfferListItem {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  contract_type_code: string | null
  work_mode_code: string | null
  career_level: string | null
  max_years_exp: number | null
  source_primary: string
  company: {
    id: string
    name: string
    brand: string | null
  } | null
  location: {
    id: string
    city: string | null
    department_code: string | null
    region_code: string | null
  } | null
  enrichment: {
    enrichment_status: string
    confidence_scores: any
    processed_at: string | null
    seniority_level: string | null
  } | null
}

interface FilterOptions {
  sources: Array<{ id: string; label: string }>
  contract_types: Array<{ code: string; label: string }>
  work_modes: Array<{ code: string; label: string }>
  career_levels: Array<{ code: string; label: string }>
  enrichment_statuses: Array<{ code: string; label: string }>
}

interface OfferFilters {
  search: string
  enrichment_status: string
  source: string
  contract_type: string
  work_mode: string
  career_level: string
  created_after: string
  created_before: string
}

export default function OffersManagementDashboard() {
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<OfferListItem[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [filters, setFilters] = useState<OfferFilters>({
    search: '',
    enrichment_status: 'all',
    source: 'all',
    contract_type: 'all',
    work_mode: 'all',
    career_level: 'all',
    created_after: '',
    created_before: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  })

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.enrichment_status && filters.enrichment_status !== 'all') {
        params.set('enrichment_status', filters.enrichment_status)
      }
      if (filters.source && filters.source !== 'all') params.set('source', filters.source)
      if (filters.contract_type && filters.contract_type !== 'all') params.set('contract_type', filters.contract_type)
      if (filters.work_mode && filters.work_mode !== 'all') params.set('work_mode', filters.work_mode)
      if (filters.career_level && filters.career_level !== 'all') params.set('career_level', filters.career_level)
      if (filters.created_after) params.set('created_after', filters.created_after)
      if (filters.created_before) params.set('created_before', filters.created_before)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/admin/offers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error')
      }
      
      setOffers(result.data.offers)
      setPagination(result.data.pagination)
      
      if (!filterOptions) {
        setFilterOptions(result.data.filters)
      }
      
    } catch (error) {
      console.error('Error fetching offers:', error)
      toast.error('Erreur lors du chargement des offres')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit, filterOptions])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  const handleFilterChange = (key: keyof OfferFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEnrichmentStatusBadge = (enrichment: OfferListItem['enrichment']) => {
    if (!enrichment) {
      return <Badge variant="secondary">En attente</Badge>
    }

    switch (enrichment.enrichment_status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Enrichi
        </Badge>
      case 'failed':
        return <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Échec
        </Badge>
      case 'low_confidence':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Confiance faible
        </Badge>
      case 'processing':
        return <Badge variant="outline">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          En cours
        </Badge>
      default:
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
    }
  }

  const getConfidenceScore = (enrichment: OfferListItem['enrichment']): number | null => {
    if (!enrichment || !enrichment.confidence_scores) return null
    
    const scores = enrichment.confidence_scores
    if (typeof scores === 'number') return scores
    if (typeof scores === 'object') {
      const values = Object.values(scores).filter(v => typeof v === 'number') as number[]
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null
    }
    return null
  }

  if (loading && offers.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des offres d'emploi...</span>
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
            <Briefcase className="h-6 w-6" />
            Gestion des Offres
          </h2>
          <p className="text-muted-foreground">
            Administration des offres d'emploi • {pagination.total} offres au total
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchOffers()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Titre, description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut enrichissement</label>
              <Select 
                value={filters.enrichment_status} 
                onValueChange={(value) => handleFilterChange('enrichment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions?.enrichment_statuses.map(status => (
                    <SelectItem key={status.code} value={status.code}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select 
                value={filters.source} 
                onValueChange={(value) => handleFilterChange('source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  {filterOptions?.sources.map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de contrat</label>
              <Select 
                value={filters.contract_type} 
                onValueChange={(value) => handleFilterChange('contract_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {filterOptions?.contract_types.map(type => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mode de travail</label>
              <Select 
                value={filters.work_mode} 
                onValueChange={(value) => handleFilterChange('work_mode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  {filterOptions?.work_modes.map(mode => (
                    <SelectItem key={mode.code} value={mode.code}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau de carrière</label>
              <Select 
                value={filters.career_level} 
                onValueChange={(value) => handleFilterChange('career_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {filterOptions?.career_levels.map(level => (
                    <SelectItem key={level.code} value={level.code}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Offres d'emploi ({pagination.total})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} sur {pagination.pages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offre</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Enrichissement</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const confidence = getConfidenceScore(offer.enrichment)
                
                return (
                  <TableRow key={offer.id}>
                    <TableCell className="max-w-xs">
                      <div>
                        <div className="font-medium truncate" title={offer.title}>
                          {offer.title}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {offer.contract_type_code && (
                            <Badge variant="outline" className="text-xs">
                              {offer.contract_type_code}
                            </Badge>
                          )}
                          {offer.career_level && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {offer.career_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {offer.company ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate" title={offer.company.name}>
                            {offer.company.brand || offer.company.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Non renseignée</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {offer.location ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {offer.location.city}
                            {offer.location.department_code && (
                              <span className="text-muted-foreground ml-1">
                                ({offer.location.department_code})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Non renseignée</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {getEnrichmentStatusBadge(offer.enrichment)}
                        {confidence !== null && (
                          <div className="text-xs text-muted-foreground">
                            Confiance: {(confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {offer.source_primary}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(offer.created_at)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/offers/${offer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(!offer.enrichment || offer.enrichment.enrichment_status === 'pending' || offer.enrichment.enrichment_status === 'failed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const result = await enrichOfferAction(offer.id)
                                
                                if (result.success) {
                                  toast.success('Enrichissement lancé')
                                  setTimeout(fetchOffers, 2000)
                                } else {
                                  toast.error(result.error || 'Erreur lors du lancement')
                                }
                              } catch (error) {
                                toast.error('Erreur lors du lancement')
                              }
                            }}
                          >
                            <Brain className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {offers.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune offre trouvée avec les filtres actuels
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} offres
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}