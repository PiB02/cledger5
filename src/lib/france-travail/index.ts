/**
 * France Travail Integration
 * Main exports for OAuth2 and API client
 */

export { FranceTravailOAuthClient, franceTravailOAuthClient } from './oauth-client';
export { 
  FranceTravailAPIClient, 
  franceTravailAPI,
  type FTSearchParams,
  type FTOffer,
  type FTSearchResult 
} from './api-client';