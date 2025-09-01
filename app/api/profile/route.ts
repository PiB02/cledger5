import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClerkClient, getCurrentUser } from '@/lib/supabase/clerk'
import { errorFactory } from '@/lib/errors'
import { z } from 'zod'

// Profile schema validation
const ProfileSchema = z.object({
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience_years: z.number().min(0).max(50).optional(),
  current_position: z.string().optional(),
  current_company: z.string().optional(),
  preferences: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw errorFactory.UNAUTHORIZED('Authentication required')
    }

    const supabase = await createSupabaseClerkClient()
    
    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw errorFactory.INTERNAL(`Failed to fetch profile: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      profile: profile || {}
    })

  } catch (error: any) {
    console.error('GET profile error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw errorFactory.UNAUTHORIZED('Authentication required')
    }

    const body = await request.json()
    const validatedProfile = ProfileSchema.parse(body)

    const supabase = await createSupabaseClerkClient()
    
    // Ensure user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.fullName,
        role: currentUser.role,
        last_sign_in: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (userError) {
      throw errorFactory.INTERNAL(`Failed to sync user: ${userError.message}`)
    }

    // Upsert user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: currentUser.id,
        ...validatedProfile,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (profileError) {
      throw errorFactory.INTERNAL(`Failed to save profile: ${profileError.message}`)
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error: any) {
    console.error('POST profile error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    )
  }
}