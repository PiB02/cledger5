import { NextRequest } from 'next/server';

/**
 * Endpoint de debug pour tester la configuration de base
 */
export async function GET(request: NextRequest) {
  return Response.json({
    success: true,
    message: 'Debug endpoint works!',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET'
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  
  return Response.json({
    success: true,
    message: 'POST debug endpoint works!',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'POST',
    body,
    headers: Object.fromEntries(request.headers.entries())
  });
}