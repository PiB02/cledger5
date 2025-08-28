'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, MapPin, Building2, Calendar, Euro, Briefcase, Search, Filter } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"

interface Offer {
  id: string
  title: string
  description: string
  company_id: string
  location_id: string
  contract_type?: string
  contract_type_code?: string
  work_mode?: string
  work_mode_code?: string
  salary_min?: number
  salary_max?: number
  created_at: string
  expiration_at?: string
  alternance: boolean
  rome_codes?: string[]
  companies?: {
    name: string
    brand?: string
  }
  locations?: {
    city: string
    postal_code: string
    department_code: string
  }
}

interface OffersResponse {
  success: boolean
  data: {
    offers: Offer[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export default function OffersSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filtres
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [alternance, setAlternance] = useState(searchParams.get('alternance') === 'true')
  const [contractTypes, setContractTypes] = useState<string[]>(
    searchParams.get('contract_types')?.split(',').filter(Boolean) || []
  )
  const [workModes, setWorkModes] = useState<string[]>(
    searchParams.get('work_modes')?.split(',').filter(Boolean) || []
  )
  const [salaryMin, setSalaryMin] = useState(searchParams.get('salary_min') || '')
  const [salaryMax, setSalaryMax] = useState(searchParams.get('salary_max') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
  )
  
  // Charger les offres
  const fetchOffers = async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (alternance) params.append('alternance', 'true')
      if (contractTypes.length) params.append('contract_types', contractTypes.join(','))
      if (workModes.length) params.append('work_modes', workModes.join(','))
      if (salaryMin) params.append('salary_min', salaryMin)
      if (salaryMax) params.append('salary_max', salaryMax)
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)
      params.append('page', page.toString())
      params.append('limit', '10')
      
      const response = await fetch(`/api/search/offers?${params}`)
      const data: OffersResponse = await response.json()
      
      if (data.success) {
        setOffers(data.data.offers)
        setTotal(data.data.pagination.total)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Effectuer la recherche quand les paramètres changent
  useEffect(() => {
    fetchOffers()
  }, [page, sortBy, sortOrder])
  
  // Mettre à jour l'URL avec les filtres
  const updateUrl = () => {
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (alternance) params.set('alternance', 'true')
    if (contractTypes.length) params.set('contract_types', contractTypes.join(','))
    if (workModes.length) params.set('work_modes', workModes.join(','))
    if (salaryMin) params.set('salary_min', salaryMin)
    if (salaryMax) params.set('salary_max', salaryMax)
    params.set('sort_by', sortBy)
    params.set('sort_order', sortOrder)
    params.set('page', page.toString())
    
    router.push(`/offres?${params.toString()}`)
  }
  
  const handleSearch = () => {
    setPage(1)
    updateUrl()
    fetchOffers()
  }
  
  const resetFilters = () => {
    setQuery('')
    setAlternance(false)
    setContractTypes([])
    setWorkModes([])
    setSalaryMin('')
    setSalaryMax('')
    setSortBy('date')
    setSortOrder('desc')
    setPage(1)
    router.push('/offres')
  }
  
  // Formatter le salaire
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} €`
    if (min) return `À partir de ${min.toLocaleString()} €`
    if (max) return `Jusqu'à ${max.toLocaleString()} €`
  }
  
  // Formatter la date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  const handleContractTypeChange = (type: string) => {
    setContractTypes(prev =>
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }
  
  const handleWorkModeChange = (mode: string) => {
    setWorkModes(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recherche d'offres d'emploi</h1>
        <p className="text-muted-foreground">
          {total > 0 ? `${total} offre${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}` : 'Aucune offre trouvée'}
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Rechercher par titre, description, compétences..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
          
          {/* Filtres sur mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
                <SheetDescription>
                  Affinez votre recherche avec ces critères
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6">
                {/* Contenu des filtres mobile */}
                <FiltersContent
                  alternance={alternance}
                  setAlternance={setAlternance}
                  contractTypes={contractTypes}
                  handleContractTypeChange={handleContractTypeChange}
                  workModes={workModes}
                  handleWorkModeChange={handleWorkModeChange}
                  salaryMin={salaryMin}
                  setSalaryMin={setSalaryMin}
                  salaryMax={salaryMax}
                  setSalaryMax={setSalaryMax}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                />
              </div>
              <SheetFooter className="gap-2">
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser
                </Button>
                <Button onClick={handleSearch}>
                  Appliquer
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filtres desktop */}
        <aside className="hidden lg:block w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FiltersContent
                alternance={alternance}
                setAlternance={setAlternance}
                contractTypes={contractTypes}
                handleContractTypeChange={handleContractTypeChange}
                workModes={workModes}
                handleWorkModeChange={handleWorkModeChange}
                salaryMin={salaryMin}
                setSalaryMin={setSalaryMin}
                salaryMax={salaryMax}
                setSalaryMax={setSalaryMax}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetFilters} className="flex-1">
                  Réinitialiser
                </Button>
                <Button onClick={handleSearch} className="flex-1">
                  Appliquer
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Liste des offres */}
        <div className="flex-1 space-y-4">
          {loading ? (
            // Skeletons de chargement
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <Card
                key={offer.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/offres/${offer.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{offer.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        {offer.companies && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {offer.companies.name}
                          </span>
                        )}
                        {offer.locations && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {offer.locations.city} ({offer.locations.department_code})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {offer.alternance && (
                      <Badge variant="secondary">Alternance</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {offer.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {offer.contract_type && (
                      <Badge variant="outline">
                        {offer.contract_type}
                      </Badge>
                    )}
                    {offer.work_mode && (
                      <Badge variant="outline">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {offer.work_mode === 'onsite' ? 'Sur site' :
                         offer.work_mode === 'remote' ? 'Télétravail' :
                         offer.work_mode === 'hybrid' ? 'Hybride' : 
                         offer.work_mode}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      {formatSalary(offer.salary_min, offer.salary_max) && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {formatSalary(offer.salary_min, offer.salary_max)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(offer.created_at)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Voir l'offre →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Aucune offre ne correspond à vos critères de recherche.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(p => Math.max(1, p - 1))
                  updateUrl()
                }}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(p => Math.min(totalPages, p + 1))
                  updateUrl()
                }}
                disabled={page >= totalPages || loading}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant réutilisable pour les filtres
function FiltersContent({
  alternance,
  setAlternance,
  contractTypes,
  handleContractTypeChange,
  workModes,
  handleWorkModeChange,
  salaryMin,
  setSalaryMin,
  salaryMax,
  setSalaryMax,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: {
  alternance: boolean
  setAlternance: (v: boolean) => void
  contractTypes: string[]
  handleContractTypeChange: (type: string) => void
  workModes: string[]
  handleWorkModeChange: (mode: string) => void
  salaryMin: string
  setSalaryMin: (v: string) => void
  salaryMax: string
  setSalaryMax: (v: string) => void
  sortBy: string
  setSortBy: (v: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (v: 'asc' | 'desc') => void
}) {
  return (
    <>
      {/* Alternance */}
      <div className="space-y-2">
        <Label>Formation</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="alternance"
            checked={alternance}
            onCheckedChange={(checked) => setAlternance(checked as boolean)}
          />
          <label
            htmlFor="alternance"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Alternance uniquement
          </label>
        </div>
      </div>
      
      {/* Types de contrat */}
      <div className="space-y-2">
        <Label>Type de contrat</Label>
        <div className="space-y-2">
          {['CDI', 'CDD', 'Interim', 'Stage', 'Freelance'].map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={contractTypes.includes(type)}
                onCheckedChange={() => handleContractTypeChange(type)}
              />
              <label
                htmlFor={type}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modes de travail */}
      <div className="space-y-2">
        <Label>Mode de travail</Label>
        <div className="space-y-2">
          {['Remote', 'Hybrid', 'OnSite'].map(mode => (
            <div key={mode} className="flex items-center space-x-2">
              <Checkbox
                id={mode}
                checked={workModes.includes(mode)}
                onCheckedChange={() => handleWorkModeChange(mode)}
              />
              <label
                htmlFor={mode}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {mode === 'Remote' ? 'Télétravail' :
                 mode === 'Hybrid' ? 'Hybride' : 'Sur site'}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Salaire */}
      <div className="space-y-2">
        <Label>Salaire annuel (€)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tri */}
      <div className="space-y-2">
        <Label>Trier par</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="salary">Salaire</SelectItem>
            <SelectItem value="relevance">Pertinence</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Décroissant</SelectItem>
            <SelectItem value="asc">Croissant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
} 