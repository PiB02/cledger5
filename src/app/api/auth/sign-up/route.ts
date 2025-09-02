import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { validateAnonymousSession } from '@/lib/anonymous-sessions/session-utils'
import { errorFactory, httpErrorMap } from '@/lib/errors'
import { z } from 'zod'

/**
 * POST /api/auth/sign-up
 * Create a new user account with Clerk and migrate anonymous session data
 */

const SignUpRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  anonymousSessionToken: z.string().optional(),
  cvSessionId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  // NOTE: This endpoint is not used in the current flow.
  // Users should sign up through the Clerk UI at /sign-up
  return NextResponse.json({
    success: false,
    error: 'ENDPOINT_DEPRECATED',
    message: 'Please use the sign-up page at /sign-up instead',
    redirect_url: '/sign-up'
  }, { status: 400 })

  /* DISABLED - Use Clerk UI instead
  try {
    const body = await request.json()
    const validatedData = SignUpRequestSchema.parse(body)

    // Create user with Clerk
    const user = await clerkClient.users.createUser({
      emailAddress: [validatedData.email],
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
    })

    if (!user) {
      throw errorFactory.INTERNAL('Failed to create user account')
    }

    const supabaseAdmin = await createSupabaseAdmin()

    // Create user in our app_users table
    const { data: appUser, error: userError } = await supabaseAdmin
      .from('app_users')
      .insert({
        clerk_id: user.id,
        role: 'candidate'
      })
      .select()
      .single()

    if (userError) {
      console.error('Failed to create app user:', userError)
      // Cleanup Clerk user if our DB insertion fails
      await clerkClient.users.deleteUser(user.id)
      throw errorFactory.INTERNAL('Failed to create user profile')
    }

    // Migrate anonymous session data if provided
    if (validatedData.anonymousSessionToken && validatedData.cvSessionId) {
      try {
        // Validate the anonymous session
        const sessionValidation = await validateAnonymousSession(validatedData.anonymousSessionToken)
        
        if (sessionValidation.is_valid) {
          // Update CV session to link to new user
          const { error: migrationError } = await supabaseAdmin
            .from('cv_upload_sessions')
            .update({
              user_id: appUser.id,
              converted_user_id: appUser.id,
              session_type: 'authenticated',
              full_access_available: true,
              conversion_attempted: true,
              metadata: {
                ...{}, // existing metadata
                migrated_from_anonymous: true,
                migration_date: new Date().toISOString(),
                original_anonymous_session: sessionValidation.session_id
              }
            })
            .eq('id', validatedData.cvSessionId)
            .eq('anonymous_session_id', sessionValidation.session_id)

          if (!migrationError) {
            // Mark anonymous session as converted
            await supabaseAdmin
              .from('anonymous_sessions')
              .update({
                converted_to_user_id: appUser.id,
                converted_at: new Date().toISOString(),
                is_active: false
              })
              .eq('id', sessionValidation.session_id)
          }
        }
      } catch (migrationError) {
        console.error('Failed to migrate anonymous session:', migrationError)
        // Don't fail the signup, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      app_user: {
        id: appUser.id,
        role: appUser.role,
      },
      message: 'Account created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Sign-up error:', error)

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    // Handle Clerk API errors
    if (error.errors && Array.isArray(error.errors)) {
      const clerkError = error.errors[0]
      return NextResponse.json({
        success: false,
        error: 'CLERK_ERROR',
        message: clerkError.message || 'Failed to create account',
        details: error.errors
      }, { status: 400 })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      const appError = httpErrorMap[error.statusCode as keyof typeof httpErrorMap](error.message)
      return NextResponse.json(
        { 
          success: false,
          error: appError.code,
          message: appError.message,
          details: appError.details
        }, 
        { status: appError.statusCode }
      )
    }

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create account',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 })
  }
  */
}