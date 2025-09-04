const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function inspectSchema() {
  console.log('🔍 Inspecting offers_raw table schema...\n')
  
  // Get table structure
  const { data: tableInfo, error: tableError } = await supabase
    .rpc('get_table_info', { table_name: 'offers_raw' })
    .catch(() => {
      // If RPC doesn't exist, fall back to information_schema query
      return supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'offers_raw')
        .eq('table_schema', 'public')
    })

  if (tableError) {
    console.error('❌ Error fetching table info:', tableError)
    
    // Try alternative approach with raw SQL
    const { data: rawSchema, error: rawError } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = 'offers_raw' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
      .catch(() => null)
    
    if (rawError) {
      console.error('❌ Raw schema query failed:', rawError)
      // Last resort - direct query structure
      const { data: directQuery, error: directError } = await supabase
        .from('offers_raw')
        .select('*')
        .limit(0)
      
      if (directError) {
        console.error('❌ Direct query failed:', directError)
      } else {
        console.log('✅ Table exists, no schema details available via this method')
      }
    } else {
      console.log('✅ Schema via raw SQL:')
      console.table(rawSchema)
    }
  } else {
    console.log('✅ Table schema:')
    console.table(tableInfo)
  }
  
  // Get recent records to understand current state
  console.log('\n🔍 Fetching recent offers_raw records...\n')
  
  const { data: recentRecords, error: recordsError } = await supabase
    .from('offers_raw')
    .select('id, source_type, source_id, canonical_fingerprint, processed, created_at, fetched_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (recordsError) {
    console.error('❌ Error fetching records:', recordsError)
  } else {
    console.log(`✅ Found ${recentRecords?.length || 0} recent records:`)
    if (recentRecords && recentRecords.length > 0) {
      console.table(recentRecords)
    } else {
      console.log('📝 No records found in offers_raw table')
    }
  }
  
  // Check for any FT records specifically
  console.log('\n🔍 Checking France Travail records...\n')
  
  const { data: ftRecords, error: ftError } = await supabase
    .from('offers_raw')
    .select('id, source_type, source_id, processed, created_at')
    .eq('source_type', 'france_travail')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (ftError) {
    console.error('❌ Error fetching FT records:', ftError)
  } else {
    console.log(`✅ Found ${ftRecords?.length || 0} France Travail records:`)
    if (ftRecords && ftRecords.length > 0) {
      console.table(ftRecords)
    } else {
      console.log('📝 No France Travail records found')
    }
  }
  
  // Check table constraints and indexes
  console.log('\n🔍 Checking table constraints...\n')
  
  const { data: constraints, error: constraintsError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT tc.constraint_name, tc.constraint_type, cc.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage cc 
          ON cc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'offers_raw'
        AND tc.table_schema = 'public'
        ORDER BY tc.constraint_type, tc.constraint_name;
      `
    })
    .catch(() => null)
  
  if (constraintsError) {
    console.error('❌ Error fetching constraints:', constraintsError)
  } else if (constraints) {
    console.log('✅ Table constraints:')
    console.table(constraints)
  }
}

// Run the inspection
inspectSchema().catch(console.error)