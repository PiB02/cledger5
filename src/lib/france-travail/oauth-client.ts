/**
 * France Travail OAuth2 Client
 * Implements client credentials flow for API authentication
 * Based on docs/03-FT-Integration.md specifications
 */

interface FranceTravailTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TokenCache {
  value: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export class FranceTravailOAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scope: string;
  private readonly tokenEndpoint = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
  
  constructor() {
    this.clientId = process.env.FT_CLIENT_ID!;
    this.clientSecret = process.env.FT_CLIENT_SECRET!;
    this.scope = process.env.FT_SCOPE!;
    
    if (!this.clientId || !this.clientSecret || !this.scope) {
      throw new Error('Missing France Travail OAuth2 configuration. Check FT_CLIENT_ID, FT_CLIENT_SECRET, and FT_SCOPE environment variables.');
    }
  }

  /**
   * Get valid access token, using cache or fetching new one
   */
  async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    // Return cached token if valid (with 60s buffer)
    if (tokenCache && tokenCache.expiresAt - 60 > now) {
      return tokenCache.value;
    }

    // Fetch new token
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.scope,
    });

    try {
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const tokenData: FranceTravailTokenResponse = await response.json();
      
      // Cache the token
      tokenCache = {
        value: tokenData.access_token,
        expiresAt: now + tokenData.expires_in,
      };

      return tokenData.access_token;
    } catch (error) {
      throw new Error(`Failed to fetch France Travail access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make authenticated request to France Travail API
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      // Clear cache and retry once
      tokenCache = null;
      const newToken = await this.getAccessToken();
      
      return fetch(url, {
        ...options,
        headers: {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }

    return response;
  }

  /**
   * Clear token cache (useful for testing or force refresh)
   */
  clearTokenCache(): void {
    tokenCache = null;
  }
}

// Singleton instance
export const franceTravailOAuthClient = new FranceTravailOAuthClient();