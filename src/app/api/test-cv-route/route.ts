import { NextRequest, NextResponse } from 'next/server'

/**
 * Test route to verify if the issue is with the /api/cv path specifically
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Test CV route is working outside /api/cv',
    timestamp: new Date().toISOString() 
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Test CV GET route is working outside /api/cv',
    timestamp: new Date().toISOString() 
  })
}