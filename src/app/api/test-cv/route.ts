import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'test-cv-working' })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    session_id: 'test-123',
    message: 'Test CV working'
  })
}