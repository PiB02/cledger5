/**
 * France Travail API Test Endpoint
 * Tests OAuth2 authentication and basic API connectivity
 * PUBLIC endpoint for testing purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { franceTravailAPI } from '@/lib/france-travail';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing France Travail OAuth2 authentication...');
    
    // Test 1: OAuth2 Token acquisition
    const { franceTravailOAuthClient } = await import('@/lib/france-travail');
    
    // Clear token cache to force new token with updated scope
    franceTravailOAuthClient.clearTokenCache();
    
    let tokenTest;
    try {
      const token = await franceTravailOAuthClient.getAccessToken();
      tokenTest = {
        success: true,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...',
      };
    } catch (error) {
      tokenTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown token error',
      };
    }

    // Test 2: Try basic API call with debugging
    let apiTest;
    try {
      console.log('Testing France Travail API call...');
      
      // Test with minimal request first
      const testUrl = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?page=1&perPage=1';
      const response = await franceTravailOAuthClient.authenticatedFetch(testUrl);
      
      apiTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: testUrl,
      };
      
      if (response.ok) {
        const data = await response.json();
        apiTest.data = {
          hasResults: Boolean(data.resultats),
          resultCount: data.resultats?.length || 0,
          total: data.total,
        };
      } else {
        const errorText = await response.text();
        apiTest.errorBody = errorText.substring(0, 500);
      }
    } catch (error) {
      apiTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error',
      };
    }

    return NextResponse.json({
      success: tokenTest.success && (apiTest.success || apiTest.status < 500),
      tests: {
        oauth2Token: tokenTest,
        apiCall: apiTest,
      },
      environment: {
        hasClientId: Boolean(process.env.FT_CLIENT_ID),
        hasClientSecret: Boolean(process.env.FT_CLIENT_SECRET),
        hasScope: Boolean(process.env.FT_SCOPE),
        clientIdPrefix: process.env.FT_CLIENT_ID ? process.env.FT_CLIENT_ID.substring(0, 15) + '...' : 'missing',
        scope: process.env.FT_SCOPE,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('France Travail test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}