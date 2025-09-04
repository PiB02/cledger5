"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Simple Label component
function Label({ children, className, ...props }: { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return <label className={`block text-sm font-medium ${className || ''}`} {...props}>{children}</label>;
}
import { 
  ArrowLeft,
  FileText, 
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Phone,
  Euro,
  Clock,
  User,
  Briefcase,
  GraduationCap,
  Brain,
  Database,
  Code,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Hash,
  Globe,
  RefreshCw
} from "lucide-react";

interface OfferDetail {
  id: string;
  canonical_fingerprint: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  expiration_at: string | null;
  updated_at: string;
  alternance: boolean;
  contract_type: string | null;
  work_mode: string | null;
  contract_type_code: string | null;
  work_mode_code: string | null;
  work_time_code: string | null;
  contract_start_date: string | null;
  contract_duration_months: number | null;
  opening_count: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string | null;
  salary_period_code: string | null;
  salary_label: string | null;
  target_diploma_label: string | null;
  rome_codes: string[] | null;
  rncp_codes: string[] | null;
  apply_url: string | null;
  apply_phone: string | null;
  source_primary: string;
  partner_label: string | null;
  career_level: string | null;
  max_years_exp: number | null;
  search_tsv: string | null;
  company: {
    id: string;
    siret: string | null;
    name: string;
    brand: string | null;
    legal_name: string | null;
    website: string | null;
    size_range: string | null;
    naf_code: string | null;
  } | null;
  location: {
    id: string;
    address1: string | null;
    address2: string | null;
    postal_code: string | null;
    city: string | null;
    insee_code: string | null;
    country_code: string;
    department_code: string | null;
    region_code: string | null;
    geohash: string | null;
  } | null;
  enrichment: {
    offer_id: string;
    parse_status: string;
    last_parsed_at: string | null;
    error_msg: string | null;
    last_raw_id: string | null;
    enrichment_status: string;
    processed_at: string | null;
    confidence_scores: any;
    created_at: string;
    updated_at: string;
    enrichment_version: string;
    model_used: string;
    skills_required: any;
    skills_preferred: any;
    seniority_level: string | null;
    languages_detected: any;
    degree_requirements: any;
    rome_codes_suggested: string[] | null;
    job_category_detected: string | null;
    company_size_indicators: string[] | null;
    tokens_used: number | null;
    processing_time_ms: number | null;
    retry_count: number;
  } | null;
  sources: Array<{
    source_id: string;
    source_offer_id: string;
    origin_url: string | null;
    is_primary: boolean;
    created_at: string;
  }>;
  raw_data: Array<{
    id: string;
    source_id: string;
    source_offer_id: string;
    fetched_at: string;
    last_seen_at: string;
    is_active: boolean;
    origin_url: string | null;
    raw: any;
    processed_at: string | null;
  }>;
}

interface OfferResponse {
  success: boolean;
  data: OfferDetail;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Non spécifié";
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatSalary(min: number | null, max: number | null, currency = 'EUR', period: string | null) {
  if (!min && !max) return "Non spécifié";
  
  const periodLabel = period === 'monthly' ? '/mois' : period === 'yearly' ? '/an' : '';
  
  if (min && max) {
    return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}${periodLabel}`;
  }
  
  return `${(min || max)?.toLocaleString()} ${currency}${periodLabel}`;
}

function getEnrichmentStatusBadge(status: string | null, large = false) {
  const size = large ? "h-4 w-4" : "h-3 w-3";
  
  if (!status) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <Clock className={`${size} mr-1`} />
        En attente
      </Badge>
    );
  }

  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className={`${size} mr-1`} />
          Enrichi
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className={`${size} mr-1`} />
          Échec
        </Badge>
      );
    case 'low_confidence':
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className={`${size} mr-1`} />
          Confiance faible
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <Clock className={`${size} mr-1`} />
          En attente
        </Badge>
      );
  }
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'LBA':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Database className="h-3 w-3 mr-1" />
          LBA
        </Badge>
      );
    case 'FT':
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Database className="h-3 w-3 mr-1" />
          France Travail
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {source}
        </Badge>
      );
  }
}

export default function AdminOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embeddingText, setEmbeddingText] = useState<string>("");

  const fetchOffer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/offers/${offerId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Offre non trouvée");
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data: OfferResponse = await response.json();
      
      if (data.success) {
        setOffer(data.data);
        
        // Try to fetch embedding text if offer has embeddings
        if (data.data.enrichment?.enrichment_status === 'completed') {
          fetchEmbeddingText(offerId);
        }
      } else {
        throw new Error("Échec de récupération des données");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmbeddingText = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/offers/${id}/embedding-text`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmbeddingText(data.data.embedding_text || "");
        }
      }
    } catch (err) {
      console.warn("Failed to fetch embedding text:", err);
    }
  };

  const enrichOffer = async () => {
    try {
      const response = await fetch(`/api/admin/offers/${offerId}/enrich`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Refresh the offer data
        setTimeout(() => fetchOffer(), 1000);
      }
    } catch (err) {
      console.error("Failed to enrich offer:", err);
    }
  };

  useEffect(() => {
    if (offerId) {
      fetchOffer();
    }
  }, [offerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de l'offre...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-4">{error || "Offre non trouvée"}</p>
          <Link href="/admin/offers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back navigation */}
      <div className="flex items-center gap-4">
        <Link href="/admin/offers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 line-clamp-2">
                {offer.title}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center text-muted-foreground">
                  <Building2 className="h-4 w-4 mr-1" />
                  {offer.company?.name || 'Entreprise non spécifiée'}
                </div>
                {offer.location?.city && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {offer.location.city}
                    {offer.location.department_code && ` (${offer.location.department_code})`}
                  </div>
                )}
                {getSourceBadge(offer.source_primary)}
                {getEnrichmentStatusBadge(offer.enrichment?.enrichment_status || null, true)}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => fetchOffer()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        {offer.enrichment?.enrichment_status !== 'completed' && (
          <Button onClick={enrichOffer} className="bg-purple-600 hover:bg-purple-700">
            <Brain className="h-4 w-4 mr-2" />
            Enrichir
          </Button>
        )}
      </div>

      {/* Main content with tabs */}
      <Tabs defaultValue="offer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="offer" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Offre
          </TabsTrigger>
          <TabsTrigger value="raw" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Données brutes
          </TabsTrigger>
          <TabsTrigger value="enrichment" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Enrichissement IA
          </TabsTrigger>
          <TabsTrigger value="embedding" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Embedding
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        {/* Offer Tab */}
        <TabsContent value="offer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Titre</Label>
                  <p className="mt-1">{offer.title}</p>
                </div>
                
                {offer.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {offer.description.length > 500 
                        ? `${offer.description.substring(0, 500)}...` 
                        : offer.description
                      }
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Statut</Label>
                    <p className="mt-1">{offer.status}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Alternance</Label>
                    <p className="mt-1">{offer.alternance ? 'Oui' : 'Non'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Créée le</Label>
                    <p className="mt-1">{formatDate(offer.created_at)}</p>
                  </div>
                  {offer.expiration_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Expire le</Label>
                      <p className="mt-1">{formatDate(offer.expiration_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract & Work Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Contrat & Modalités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type de contrat</Label>
                    <p className="mt-1">{offer.contract_type || 'Non spécifié'}</p>
                    {offer.contract_type_code && (
                      <p className="text-xs text-gray-500">Code: {offer.contract_type_code}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Mode de travail</Label>
                    <p className="mt-1">{offer.work_mode || 'Non spécifié'}</p>
                    {offer.work_mode_code && (
                      <p className="text-xs text-gray-500">Code: {offer.work_mode_code}</p>
                    )}
                  </div>
                </div>

                {(offer.contract_start_date || offer.contract_duration_months) && (
                  <div className="grid grid-cols-2 gap-4">
                    {offer.contract_start_date && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Début de contrat</Label>
                        <p className="mt-1">{formatDate(offer.contract_start_date)}</p>
                      </div>
                    )}
                    {offer.contract_duration_months && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Durée</Label>
                        <p className="mt-1">{offer.contract_duration_months} mois</p>
                      </div>
                    )}
                  </div>
                )}

                {(offer.career_level || offer.max_years_exp) && (
                  <div className="grid grid-cols-2 gap-4">
                    {offer.career_level && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Niveau de carrière</Label>
                        <p className="mt-1">{offer.career_level}</p>
                      </div>
                    )}
                    {offer.max_years_exp && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Expérience max</Label>
                        <p className="mt-1">{offer.max_years_exp} ans</p>
                      </div>
                    )}
                  </div>
                )}

                {(offer.salary_min || offer.salary_max) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Salaire</Label>
                    <p className="mt-1">
                      {formatSalary(offer.salary_min, offer.salary_max, offer.salary_currency, offer.salary_period)}
                    </p>
                    {offer.salary_label && (
                      <p className="text-xs text-gray-500">{offer.salary_label}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            {offer.company && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nom</Label>
                    <p className="mt-1">{offer.company.name}</p>
                  </div>

                  {offer.company.brand && offer.company.brand !== offer.company.name && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Marque</Label>
                      <p className="mt-1">{offer.company.brand}</p>
                    </div>
                  )}

                  {offer.company.legal_name && offer.company.legal_name !== offer.company.name && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Raison sociale</Label>
                      <p className="mt-1">{offer.company.legal_name}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {offer.company.siret && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">SIRET</Label>
                        <p className="mt-1 font-mono text-sm">{offer.company.siret}</p>
                      </div>
                    )}
                    {offer.company.naf_code && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Code NAF</Label>
                        <p className="mt-1">{offer.company.naf_code}</p>
                      </div>
                    )}
                  </div>

                  {offer.company.size_range && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Taille</Label>
                      <p className="mt-1">{offer.company.size_range}</p>
                    </div>
                  )}

                  {offer.company.website && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Site web</Label>
                      <p className="mt-1">
                        <a 
                          href={offer.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {offer.company.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location Info */}
            {offer.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(offer.location.address1 || offer.location.address2) && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Adresse</Label>
                      <div className="mt-1">
                        {offer.location.address1 && <p>{offer.location.address1}</p>}
                        {offer.location.address2 && <p>{offer.location.address2}</p>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {offer.location.postal_code && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Code postal</Label>
                        <p className="mt-1">{offer.location.postal_code}</p>
                      </div>
                    )}
                    {offer.location.city && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Ville</Label>
                        <p className="mt-1">{offer.location.city}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {offer.location.department_code && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Département</Label>
                        <p className="mt-1">{offer.location.department_code}</p>
                      </div>
                    )}
                    {offer.location.region_code && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Région</Label>
                        <p className="mt-1">{offer.location.region_code}</p>
                      </div>
                    )}
                  </div>

                  {offer.location.insee_code && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Code INSEE</Label>
                      <p className="mt-1">{offer.location.insee_code}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ROME Codes & Application */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROME & Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Codes & Prérequis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.rome_codes && offer.rome_codes.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Codes ROME</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {offer.rome_codes.map((code) => (
                        <Badge key={code} variant="outline" className="font-mono">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {offer.rncp_codes && offer.rncp_codes.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Codes RNCP</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {offer.rncp_codes.map((code) => (
                        <Badge key={code} variant="outline" className="font-mono">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {offer.target_diploma_label && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Diplôme cible</Label>
                    <p className="mt-1">{offer.target_diploma_label}</p>
                  </div>
                )}

                {offer.opening_count && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombre de postes</Label>
                    <p className="mt-1">{offer.opening_count}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Candidature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.apply_url && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">URL de candidature</Label>
                    <p className="mt-1">
                      <a 
                        href={offer.apply_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 break-all"
                      >
                        {offer.apply_url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </p>
                  </div>
                )}

                {offer.apply_phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {offer.apply_phone}
                    </p>
                  </div>
                )}

                {offer.partner_label && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Partenaire</Label>
                    <p className="mt-1">{offer.partner_label}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Données brutes ({offer.raw_data.length} versions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {offer.raw_data.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée brute disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offer.raw_data.map((rawData, index) => (
                    <Card key={rawData.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Version {index + 1}</Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              {rawData.source_id}
                            </Badge>
                            {rawData.is_active && (
                              <Badge className="bg-green-100 text-green-800">Actif</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Récupéré le {formatDate(rawData.fetched_at)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          ID source: <span className="font-mono">{rawData.source_offer_id}</span>
                        </div>
                        {rawData.origin_url && (
                          <div className="text-sm">
                            <a 
                              href={rawData.origin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              URL d'origine
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 rounded-md p-4 overflow-auto max-h-96">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                            {JSON.stringify(rawData.raw, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrichment Tab */}
        <TabsContent value="enrichment" className="space-y-6">
          {offer.enrichment ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrichment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Statut d'enrichissement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getEnrichmentStatusBadge(offer.enrichment.enrichment_status, true)}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Modèle utilisé</Label>
                      <p className="mt-1 font-mono text-sm">{offer.enrichment.model_used}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Version</Label>
                      <p className="mt-1">{offer.enrichment.enrichment_version}</p>
                    </div>
                  </div>

                  {offer.enrichment.processed_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Traité le</Label>
                      <p className="mt-1">{formatDate(offer.enrichment.processed_at)}</p>
                    </div>
                  )}

                  {offer.enrichment.tokens_used && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tokens utilisés</Label>
                      <p className="mt-1">{offer.enrichment.tokens_used.toLocaleString()}</p>
                    </div>
                  )}

                  {offer.enrichment.processing_time_ms && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Temps de traitement</Label>
                      <p className="mt-1">{offer.enrichment.processing_time_ms} ms</p>
                    </div>
                  )}

                  {offer.enrichment.error_msg && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Erreur</Label>
                      <p className="mt-1 text-red-600 text-sm">{offer.enrichment.error_msg}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confidence Scores */}
              {offer.enrichment.confidence_scores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Scores de confiance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-md p-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(offer.enrichment.confidence_scores, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extracted Skills */}
              {(offer.enrichment.skills_required || offer.enrichment.skills_preferred) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Compétences extraites
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {offer.enrichment.skills_required && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Compétences requises</Label>
                        <div className="mt-1 bg-gray-50 rounded-md p-3">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                            {JSON.stringify(offer.enrichment.skills_required, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {offer.enrichment.skills_preferred && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Compétences préférées</Label>
                        <div className="mt-1 bg-gray-50 rounded-md p-3">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                            {JSON.stringify(offer.enrichment.skills_preferred, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Other AI Extractions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Autres extractions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offer.enrichment.seniority_level && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Niveau de séniorité</Label>
                      <p className="mt-1">{offer.enrichment.seniority_level}</p>
                    </div>
                  )}

                  {offer.enrichment.job_category_detected && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Catégorie détectée</Label>
                      <p className="mt-1">{offer.enrichment.job_category_detected}</p>
                    </div>
                  )}

                  {offer.enrichment.rome_codes_suggested && offer.enrichment.rome_codes_suggested.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Codes ROME suggérés</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {offer.enrichment.rome_codes_suggested.map((code) => (
                          <Badge key={code} variant="outline" className="font-mono">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {offer.enrichment.languages_detected && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Langues détectées</Label>
                      <div className="mt-1 bg-gray-50 rounded-md p-3">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(offer.enrichment.languages_detected, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {offer.enrichment.degree_requirements && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Exigences de diplôme</Label>
                      <div className="mt-1 bg-gray-50 rounded-md p-3">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(offer.enrichment.degree_requirements, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {offer.enrichment.company_size_indicators && offer.enrichment.company_size_indicators.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Indicateurs taille entreprise</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {offer.enrichment.company_size_indicators.map((indicator, index) => (
                          <Badge key={index} variant="secondary">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun enrichissement disponible</h3>
                <p className="text-gray-500 mb-4">Cette offre n'a pas encore été traitée par l'IA.</p>
                <Button onClick={enrichOffer} className="bg-purple-600 hover:bg-purple-700">
                  <Brain className="h-4 w-4 mr-2" />
                  Lancer l'enrichissement
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Embedding Tab */}
        <TabsContent value="embedding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Texte d'embedding
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Texte standardisé utilisé pour générer l'embedding vectoriel (matching sémantique)
              </p>
            </CardHeader>
            <CardContent>
              {embeddingText ? (
                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {embeddingText}
                  </pre>
                  <div className="mt-4 text-xs text-gray-600 border-t pt-4">
                    <p>Longueur: {embeddingText.length} caractères</p>
                    <p>Limite: 1500 caractères pour l'embedding</p>
                  </div>
                </div>
              ) : offer.enrichment?.enrichment_status === 'completed' ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Chargement du texte d'embedding...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Pas d'embedding disponible</h3>
                  <p className="text-gray-500">L'embedding sera généré après l'enrichissement IA.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Métadonnées d'import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID unique</Label>
                  <p className="mt-1 font-mono text-sm">{offer.id}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Empreinte canonique</Label>
                  <p className="mt-1 font-mono text-sm break-all">{offer.canonical_fingerprint}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Source primaire</Label>
                  <div className="mt-1">
                    {getSourceBadge(offer.source_primary)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Créée le</Label>
                    <p className="mt-1">{formatDate(offer.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Mise à jour le</Label>
                    <p className="mt-1">{formatDate(offer.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Sources ({offer.sources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {offer.sources.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">Aucune source enregistrée</p>
                ) : (
                  <div className="space-y-3">
                    {offer.sources.map((source, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              {source.source_id}
                            </Badge>
                            {source.is_primary && (
                              <Badge className="bg-green-100 text-green-800">
                                Primaire
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDate(source.created_at)}
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="font-mono mb-1">ID: {source.source_offer_id}</p>
                          {source.origin_url && (
                            <a 
                              href={source.origin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              URL d'origine
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}