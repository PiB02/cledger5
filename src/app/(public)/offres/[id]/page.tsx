'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Clock, 
  Euro, 
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Users,
  BookmarkPlus,
  Send
} from 'lucide-react'

interface Company {
  id: string
  name: string
  brand?: string
  legal_name?: string
  website?: string
  size_range?: string
  siret?: string
  naf_code?: string
}

interface Location {
  id: string
  address1?: string
  address2?: string
  city: string
  postal_code: string
  department_code: string
  region_code?: string
  insee_code?: string
}

interface Offer {
  id: string
  title: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  alternance: boolean
  contract_type?: string
  salary_min?: number
  salary_max?: number
  salary_period?: string
  rome_codes?: string[]
  apply_url?: string
  apply_phone?: string
  apply_email?: string
  expiration_at?: string
  source_primary: string
  companies?: Company
  locations?: Location
  _metadata?: {
    has_company: boolean
    has_location: boolean
    is_expired: boolean
  }
}

interface OfferResponse {
  success: boolean
  data: Offer
}

export default function OfferDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const { user, isSignedIn } = useUser()
  
  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/offers/${id}`)
        const data: OfferResponse = await response.json()
        
        if (!response.ok) {
          throw new Error(data.success === false ? 'Offre introuvable' : 'Erreur serveur')
        }
        
        if (data.success) {
          setOffer(data.data)
        }
      } catch (err) {
        console.error('Error fetching offer:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchOffer()
    }
  }, [id])
  
  const handleSave = async () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!offer) return

    if (saved) {
      // Remove from saved (for now just toggle, can implement removal later)
      setSaved(false)
      return
    }

    try {
      // Create a saved search for this specific offer
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${offer.title} - ${offer.companies?.name || 'Emploi'}`,
          description: `Recherche sauvée pour l'offre: ${offer.title}`,
          criteria: {
            rome_codes: offer.rome_codes,
            contract_types: offer.contract_type ? [offer.contract_type] : undefined,
            work_modes: offer.work_mode ? [offer.work_mode] : undefined,
            location: offer.locations ? {
              city: offer.locations.city,
              department_code: offer.locations.department_code,
            } : undefined,
            alternance: offer.alternance,
          },
          alerts_enabled: true,
          alert_frequency: 'daily',
          min_match_score: 0.80,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSaved(true)
        alert('Recherche sauvegardée ! Vous recevrez des alertes pour des offres similaires.')
      } else {
        console.error('Error saving search:', data.error)
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
      }
    } catch (error) {
      console.error('Error saving search:', error)
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    }
  }
  
  const handleApply = async () => {
    if (!isSignedIn) {
      // Redirect to sign-in page
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!offer) return

    setApplyLoading(true)
    
    try {
      // Try to apply through our internal system first
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offer.id,
          source: 'direct'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setApplied(true)
        // Show success message or redirect to dashboard
        alert('Candidature envoyée avec succès ! Vous pouvez suivre son évolution dans votre dashboard.')
      } else {
        // If internal application fails (e.g., no CV profile), fall back to external links
        if (data.error?.includes('CV profile required')) {
          alert('Vous devez d\'abord analyser votre CV pour postuler via notre système. Redirection vers l\'analyse CV...')
          router.push('/cv/upload')
          return
        }
        
        // Fall back to external application methods
        handleExternalApply()
      }
    } catch (error) {
      console.error('Error applying to job:', error)
      // Fall back to external application methods
      handleExternalApply()
    } finally {
      setApplyLoading(false)
    }
  }

  const handleExternalApply = () => {
    if (offer?.apply_url) {
      window.open(offer.apply_url, '_blank')
      setApplied(true)
    } else if (offer?.apply_phone) {
      window.open(`tel:${offer.apply_phone}`)
      setApplied(true)
    } else if (offer?.apply_email) {
      window.open(`mailto:${offer.apply_email}`)
      setApplied(true)
    }
  }
  
  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null
    
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('fr-FR').format(amount)
    }
    
    let salaryText = ''
    if (min && max) {
      salaryText = `${formatAmount(min)} - ${formatAmount(max)} €`
    } else if (min) {
      salaryText = `À partir de ${formatAmount(min)} €`
    } else if (max) {
      salaryText = `Jusqu'à ${formatAmount(max)} €`
    }
    
    if (period && period !== 'monthly') {
      const periodMap: Record<string, string> = {
        'hourly': '/heure',
        'daily': '/jour',
        'weekly': '/semaine',
        'monthly': '/mois',
        'yearly': '/an'
      }
      salaryText += periodMap[period] || ''
    }
    
    return salaryText
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  if (error || !offer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
          <p className="text-gray-600">{error || 'Offre introuvable'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux offres
          </Button>
        </div>
      </div>
    )
  }
  
  const salaryText = formatSalary(offer.salary_min, offer.salary_max, offer.salary_period)
  const isExpired = offer._metadata?.is_expired || offer.status === 'expired'
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux offres
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <BookmarkPlus className="h-4 w-4 mr-2" />
            {saved ? 'Sauvegardée' : 'Sauvegarder'}
          </Button>
          
          {!isExpired && (
            <Button 
              onClick={handleApply}
              disabled={applyLoading || applied}
              className={applied ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Send className="h-4 w-4 mr-2" />
              {applyLoading 
                ? 'Candidature...' 
                : applied 
                ? 'Candidature envoyée' 
                : isSignedIn 
                ? 'Postuler' 
                : 'Se connecter pour postuler'
              }
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Status */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{offer.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={isExpired ? "destructive" : "default"}>
                      {isExpired ? 'Expirée' : offer.status}
                    </Badge>
                    {offer.alternance && (
                      <Badge variant="secondary">Alternance</Badge>
                    )}
                    {offer.contract_type && (
                      <Badge variant="outline">{offer.contract_type}</Badge>
                    )}
                  </div>
                </div>
                
                {salaryText && (
                  <div className="text-right">
                    <div className="flex items-center text-green-600 font-semibold">
                      <Euro className="h-4 w-4 mr-1" />
                      {salaryText}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            {offer.description && (
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{offer.description}</p>
                </div>
              </CardContent>
            )}
          </Card>
          
          {/* Company Info */}
          {offer.companies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">{offer.companies.name}</h3>
                  {offer.companies.brand && offer.companies.brand !== offer.companies.name && (
                    <p className="text-sm text-gray-600">Marque : {offer.companies.brand}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {offer.companies.size_range && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {offer.companies.size_range}
                    </div>
                  )}
                  
                  {offer.companies.website && (
                    <div className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={offer.companies.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        Site web
                      </a>
                    </div>
                  )}
                </div>
                
                {offer.companies.siret && (
                  <p className="text-xs text-gray-500">SIRET : {offer.companies.siret}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Location */}
          {offer.locations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {offer.locations.address1 && (
                  <p>{offer.locations.address1}</p>
                )}
                {offer.locations.address2 && (
                  <p>{offer.locations.address2}</p>
                )}
                <p className="font-medium">
                  {offer.locations.postal_code} {offer.locations.city}
                </p>
                <p className="text-sm text-gray-600">
                  Département {offer.locations.department_code}
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* ROME Codes */}
          {offer.rome_codes && offer.rome_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Codes ROME</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {(offer.rome_codes || []).map((code, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Contact Info */}
          {(offer.apply_phone || offer.apply_email) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {offer.apply_phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <a 
                      href={`tel:${offer.apply_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {offer.apply_phone}
                    </a>
                  </div>
                )}
                
                {offer.apply_email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <a 
                      href={`mailto:${offer.apply_email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {offer.apply_email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Publiée le</span>
                <span>{formatDate(offer.created_at)}</span>
              </div>
              
              {offer.updated_at !== offer.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mise à jour</span>
                  <span>{formatDate(offer.updated_at)}</span>
                </div>
              )}
              
              {offer.expiration_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expire le</span>
                  <span className={isExpired ? 'text-red-600' : ''}>
                    {formatDate(offer.expiration_at)}
                  </span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Source</span>
                <Badge variant="outline" className="text-xs">
                  {offer.source_primary}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 