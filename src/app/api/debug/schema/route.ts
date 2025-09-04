import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdmin()
    
    const results = {
      tableSchema: null,
      recentRecords: null,
      ftRecords: null,
      constraints: null,
      error: null
    }
    
    // Get table structure via information_schema
    console.log('🔍 Fetching offers_raw table schema...')
    
    const { data: schema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_name', 'offers_raw')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (schemaError) {
      console.error('Schema error:', schemaError)
      results.error = `Schema error: ${schemaError.message}`
    } else {
      results.tableSchema = schema
      console.log('✅ Schema fetched successfully')
    }
    
    // Get recent records
    console.log('🔍 Fetching recent records...')
    
    const { data: recent, error: recentError } = await supabase
      .from('offers_raw')
      .select('id, source_type, source_id, canonical_fingerprint, processed, created_at, fetched_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentError) {
      console.error('Recent records error:', recentError)
      results.error = (results.error || '') + ` Recent records error: ${recentError.message}`
    } else {
      results.recentRecords = recent
      console.log(`✅ Found ${recent?.length || 0} recent records`)
    }
    
    // Get France Travail records specifically
    console.log('🔍 Fetching France Travail records...')
    
    const { data: ftData, error: ftError } = await supabase
      .from('offers_raw')
      .select('id, source_type, source_id, processed, created_at')
      .eq('source_type', 'france_travail')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (ftError) {
      console.error('FT records error:', ftError)
      results.error = (results.error || '') + ` FT records error: ${ftError.message}`
    } else {
      results.ftRecords = ftData
      console.log(`✅ Found ${ftData?.length || 0} France Travail records`)
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        schemaColumns: results.tableSchema?.length || 0,
        recentRecordsCount: results.recentRecords?.length || 0,
        ftRecordsCount: results.ftRecords?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Debug schema error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}