/**
 * France Travail API Client
 * Handles job offers search, details, and reference data fetching
 * Based on docs/03-FT-Integration.md specifications
 */

import { franceTravailOAuthClient } from './oauth-client';

export interface FTSearchParams {
  page?: number;
  perPage?: number;
  motsCles?: string;
  rome?: string[];
  commune?: string;
  departement?: string;
  region?: string;
  distance?: number;
  typeContrat?: string[];
  natureContrat?: string[];
  salaire?: string;
  tri?: 'recence' | 'pertinence';
}

export interface FTOffer {
  id: string;
  intitule: string;
  description: string;
  dateCreation: string;
  dateActualisation: string;
  nombrePostes: number;
  typeContrat?: {
    code: string;
    libelle: string;
  };
  natureContrat?: {
    code: string;
    libelle: string;
  };
  dureeTravail?: string;
  experience?: {
    code: string;
    libelle: string;
  };
  romeCode?: string;
  entreprise?: {
    nom?: string;
    siret?: string;
    naf?: {
      code: string;
      libelle: string;
    };
  };
  lieuTravail?: {
    commune?: string;
    codePostal?: string;
    latitude?: number;
    longitude?: number;
  };
  salaire?: {
    minimum?: number;
    maximum?: number;
    unite?: string;
    commentaire?: string;
  };
  formations?: Array<{
    code: string;
    libelle: string;
  }>;
  langues?: Array<{
    code: string;
    libelle: string;
  }>;
  competences?: Array<{
    code: string;
    libelle: string;
    exigence?: string;
  }>;
}

export interface FTSearchResult {
  resultats: FTOffer[];
  total: number;
  nbPages: number;
  page: number;
  perPage: number;
  agregations?: any[];
  filtresPossibles?: any[];
}

export class FranceTravailAPIClient {
  private readonly baseUrl = 'https://api.francetravail.io';
  
  /**
   * Search for job offers with filters and pagination
   */
  async searchOffers(params: FTSearchParams = {}): Promise<FTSearchResult> {
    const searchParams = new URLSearchParams();
    
    // Add pagination
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.perPage) searchParams.set('perPage', params.perPage.toString());
    
    // Add search filters
    if (params.motsCles) searchParams.set('motsCles', params.motsCles);
    if (params.rome?.length) searchParams.set('rome', params.rome.join(','));
    if (params.commune) searchParams.set('commune', params.commune);
    if (params.departement) searchParams.set('departement', params.departement);
    if (params.region) searchParams.set('region', params.region);
    if (params.distance) searchParams.set('distance', params.distance.toString());
    if (params.typeContrat?.length) searchParams.set('typeContrat', params.typeContrat.join(','));
    if (params.natureContrat?.length) searchParams.set('natureContrat', params.natureContrat.join(','));
    if (params.salaire) searchParams.set('salaire', params.salaire);
    if (params.tri) searchParams.set('tri', params.tri);

    const url = `${this.baseUrl}/partenaire/offresdemploi/v2/offres/search?${searchParams.toString()}`;
    
    try {
      const response = await franceTravailOAuthClient.authenticatedFetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`France Travail search failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return await response.json() as FTSearchResult;
    } catch (error) {
      throw new Error(`Failed to search France Travail offers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed offer by ID
   */
  async getOffer(offerId: string): Promise<FTOffer> {
    const url = `${this.baseUrl}/partenaire/offresdemploi/v2/offres/${encodeURIComponent(offerId)}`;
    
    try {
      const response = await franceTravailOAuthClient.authenticatedFetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Offer not found: ${offerId}`);
        }
        const errorText = await response.text();
        throw new Error(`France Travail get offer failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return await response.json() as FTOffer;
    } catch (error) {
      throw new Error(`Failed to get France Travail offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reference data (communes, départements, etc.)
   */
  async getReferentiel(type: string): Promise<any[]> {
    const url = `${this.baseUrl}/partenaire/offresdemploi/v2/referentiel/${type}`;
    
    try {
      const response = await franceTravailOAuthClient.authenticatedFetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`France Travail referentiel failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const result = await response.json();
      return result.resultats || result || [];
    } catch (error) {
      throw new Error(`Failed to get France Travail referentiel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple search with minimal results
      const result = await this.searchOffers({ page: 1, perPage: 1 });
      return typeof result.total === 'number';
    } catch (error) {
      console.error('France Travail API test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const franceTravailAPI = new FranceTravailAPIClient();