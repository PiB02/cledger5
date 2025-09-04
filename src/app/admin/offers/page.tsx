"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Search,
  Filter,
  Eye,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Brain,
  Database
} from "lucide-react";

interface OfferListItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  contract_type_code: string | null;
  work_mode_code: string | null;
  career_level: string | null;
  max_years_exp: number | null;
  source_primary: string;
  company: {
    id: string;
    name: string;
    brand: string | null;
  } | null;
  location: {
    id: string;
    city: string | null;
    department_code: string | null;
    region_code: string | null;
  } | null;
  enrichment: {
    enrichment_status: string;
    confidence_scores: any;
    processed_at: string | null;
    seniority_level: string | null;
    skills_required: any;
    skills_preferred: any;
  } | null;
}

interface OffersResponse {
  success: boolean;
  data: {
    offers: OfferListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters: {
      sources: Array<{ id: string; label: string }>;
      contract_types: Array<{ code: string; label: string }>;
      work_modes: Array<{ code: string; label: string }>;
      career_levels: Array<{ code: string; label: string }>;
      enrichment_statuses: Array<{ code: string; label: string }>;
    };
  };
}

function getEnrichmentStatusBadge(status: string | null) {
  if (!status) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <Clock className="h-3 w-3 mr-1" />
        En attente
      </Badge>
    );
  }

  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enrichi
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Échec
        </Badge>
      );
    case 'low_confidence':
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Confiance faible
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <Clock className="h-3 w-3 mr-1" />
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

function formatContractType(code: string | null) {
  if (!code) return "Non spécifié";
  
  const mapping: Record<string, string> = {
    'CDI': 'CDI',
    'CDD': 'CDD',
    'APP': 'Apprentissage',
    'PRO': 'Professionnalisation',
    'INTERIM': 'Intérim',
    'STAGE': 'Stage'
  };
  
  return mapping[code] || code;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminOffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [offers, setOffers] = useState<OfferListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    sources: [],
    contract_types: [],
    work_modes: [],
    career_levels: [],
    enrichment_statuses: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    enrichment_status: searchParams.get('enrichment_status') || 'all',
    source: searchParams.get('source') || '',
    contract_type: searchParams.get('contract_type') || '',
    work_mode: searchParams.get('work_mode') || '',
    career_level: searchParams.get('career_level') || '',
    location_department: searchParams.get('location_department') || '',
    location_region: searchParams.get('location_region') || '',
    confidence_threshold: searchParams.get('confidence_threshold') || '',
    created_after: searchParams.get('created_after') || '',
    created_before: searchParams.get('created_before') || ''
  });

  // Fetch offers
  const fetchOffers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters to URL params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });
      
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/admin/offers?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: OffersResponse = await response.json();
      
      if (data.success) {
        setOffers(data.data.offers);
        setPagination(data.data.pagination);
        setFilterOptions(data.data.filters as any);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchOffers(1);
  }, []);

  // Apply filters
  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.append(key, value);
      }
    });
    
    router.push(`/admin/offers?${params}`);
    fetchOffers(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      enrichment_status: 'all',
      source: '',
      contract_type: '',
      work_mode: '',
      career_level: '',
      location_department: '',
      location_region: '',
      confidence_threshold: '',
      created_after: '',
      created_before: ''
    });
    router.push('/admin/offers');
    fetchOffers(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Offres</h1>
            <p className="text-muted-foreground">
              {pagination.total > 0 ? `${pagination.total} offres trouvées` : 'Chargement...'}
            </p>
          </div>
        </div>
        <Button onClick={() => fetchOffers(pagination.page)} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Titre de l'offre, entreprise..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="enrichment_status" className="text-sm font-medium">Statut enrichissement</Label>
              <Select value={filters.enrichment_status} onValueChange={(value) => setFilters(prev => ({ ...prev, enrichment_status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.enrichment_statuses.map((status: any) => (
                    <SelectItem key={status.code} value={status.code}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="source" className="text-sm font-medium">Source</Label>
              <Select value={filters.source} onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {filterOptions.sources.map((source: any) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contract_type" className="text-sm font-medium">Type contrat</Label>
              <Select value={filters.contract_type} onValueChange={(value) => setFilters(prev => ({ ...prev, contract_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {filterOptions.contract_types.map((type: any) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="work_mode" className="text-sm font-medium">Mode travail</Label>
              <Select value={filters.work_mode} onValueChange={(value) => setFilters(prev => ({ ...prev, work_mode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {filterOptions.work_modes.map((mode: any) => (
                    <SelectItem key={mode.code} value={mode.code}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="career_level" className="text-sm font-medium">Niveau</Label>
              <Select value={filters.career_level} onValueChange={(value) => setFilters(prev => ({ ...prev, career_level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {filterOptions.career_levels.map((level: any) => (
                    <SelectItem key={level.code} value={level.code}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="created_after" className="text-sm font-medium">Créé après</Label>
              <Input
                id="created_after"
                type="date"
                value={filters.created_after}
                onChange={(e) => setFilters(prev => ({ ...prev, created_after: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="created_before" className="text-sm font-medium">Créé avant</Label>
              <Input
                id="created_before"
                type="date"
                value={filters.created_before}
                onChange={(e) => setFilters(prev => ({ ...prev, created_before: e.target.value }))}
              />
            </div>
          </div>

          {/* Action buttons */}
          <Separator />
          <div className="flex gap-3">
            <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Appliquer les filtres
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <XCircle className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Liste des Offres
            </div>
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} sur {pagination.pages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Chargement des offres...</span>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune offre trouvée</h3>
              <p className="text-gray-500">Essayez de modifier vos filtres pour voir plus de résultats.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Headers */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                <div className="col-span-3">Titre & Entreprise</div>
                <div className="col-span-2">Localisation</div>
                <div className="col-span-2">Contrat</div>
                <div className="col-span-1">Source</div>
                <div className="col-span-2">Enrichissement</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Offer Rows */}
              {offers.map((offer) => (
                <div key={offer.id} className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  {/* Title & Company */}
                  <div className="col-span-3">
                    <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {offer.title}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-3 w-3 mr-1" />
                      {offer.company?.name || 'Entreprise non spécifiée'}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-span-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {offer.location?.city ? (
                        <span>
                          {offer.location.city}
                          {offer.location.department_code && ` (${offer.location.department_code})`}
                        </span>
                      ) : (
                        'Non spécifié'
                      )}
                    </div>
                  </div>

                  {/* Contract */}
                  <div className="col-span-2">
                    <div className="text-sm">
                      {formatContractType(offer.contract_type_code)}
                    </div>
                    {offer.career_level && (
                      <div className="text-xs text-gray-500">
                        {offer.career_level}
                      </div>
                    )}
                  </div>

                  {/* Source */}
                  <div className="col-span-1">
                    {getSourceBadge(offer.source_primary)}
                  </div>

                  {/* Enrichment Status */}
                  <div className="col-span-2">
                    {getEnrichmentStatusBadge(offer.enrichment?.enrichment_status || null)}
                    {offer.enrichment?.confidence_scores && (
                      <div className="text-xs text-gray-500 mt-1">
                        Confiance: {typeof offer.enrichment.confidence_scores === 'number' 
                          ? Math.round(offer.enrichment.confidence_scores * 100) 
                          : 'N/A'
                        }%
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="col-span-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(offer.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <Link href={`/admin/offers/${offer.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} offres
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOffers(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <div className="px-3 py-1 text-sm bg-gray-100 rounded">
                  {pagination.page} / {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOffers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || isLoading}
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
  );
}