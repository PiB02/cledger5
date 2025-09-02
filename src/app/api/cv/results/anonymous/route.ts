import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get('session_token')
    const includeTeaserData = searchParams.get('include_teaser_data') === 'true'
    
    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_SESSION_TOKEN',
          message: 'Session token is required'
        },
        { status: 400 }
      )
    }
    
    // Get real analysis results from Supabase
    const supabase = await createSupabaseAdmin()
    
    // Find the session by session token
    const { data: sessionData, error: sessionError } = await supabase
      .from('anonymous_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single()
    
    if (sessionError || !sessionData) {
      return NextResponse.json(
        {
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'Session token not found or expired'
        },
        { status: 404 }
      )
    }
    
    // Get the CV session data
    const { data: cvSessionData, error: cvError } = await supabase
      .from('anonymous_cv_sessions')
      .select('*')
      .eq('anonymous_session_id', sessionData.id)
      .single()
    
    if (cvError || !cvSessionData) {
      return NextResponse.json(
        {
          success: false,
          error: 'CV_SESSION_NOT_FOUND', 
          message: 'CV analysis not found'
        },
        { status: 404 }
      )
    }
    
    // Check if processing is complete
    if (cvSessionData.processing_status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          status: 'processing',
          message: 'Analysis still in progress'
        },
        { status: 202 }
      )
    }
    
    // Extract AI analysis results
    const aiAnalysis = cvSessionData.partial_results?.aiAnalysis
    if (!aiAnalysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_ANALYSIS_FOUND',
          message: 'AI analysis not available'
        },
        { status: 404 }
      )
    }
    
    // Convert AI analysis to the format expected by the frontend
    const skillsPreview = aiAnalysis.skills.technical.slice(0, 3).map((skill: any) => ({
      name: skill.name,
      confidence: skill.confidence > 0.8 ? 'high' : skill.confidence > 0.6 ? 'medium' : 'low'
    }))
    
    const totalSkills = aiAnalysis.skills.technical.length + aiAnalysis.skills.soft.length
    
    const results = {
      success: true,
      session_id: cvSessionData.id,
      access_level: 'partial' as const,
      summary: {
        skills_found: totalSkills,
        experience_level: aiAnalysis.summary.careerLevel,
        job_opportunities_estimated: 40 + Math.floor(totalSkills * 3), // Estimate based on skills
        analysis_confidence: aiAnalysis.analysisMetadata.confidence
      },
      skills_preview: skillsPreview,
      location_detected: aiAnalysis.personalInfo?.city ? {
        city: aiAnalysis.personalInfo.city,
        region: 'France' // Default region
      } : null,
      full_results_available: {
        complete_skills_analysis: totalSkills,
        detailed_job_matches: 40 + Math.floor(totalSkills * 3),
        ai_powered_insights: true,
        personalized_recommendations: true
      },
      call_to_action: {
        title: 'Accédez à votre analyse complète',
        description: 'Créez votre compte gratuit pour débloquer toutes les fonctionnalités et postuler directement aux offres.',
        action_url: '/auth/signup',
        expires_at: cvSessionData.expires_at
      },
      processed_at: cvSessionData.processing_completed_at,
      expires_at: cvSessionData.expires_at
    }
    
    return NextResponse.json(results, { status: 200 })
    
  } catch (error: any) {
    console.error('CV Results Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'RESULTS_ERROR',
        message: 'Erreur lors de la récupération des résultats'
      },
      { status: 500 }
    )
  }
}