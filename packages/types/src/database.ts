// Database types - These would normally be generated from Supabase
// For now, we're defining them manually based on the PRD and DB architecture

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string
          email: string
          role: 'candidate' | 'recruiter' | 'admin'
          email_verified_at: string | null
          is_active: boolean
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['app_users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['app_users']['Insert']>
      }
      offers: {
        Row: {
          id: string
          canonical_fingerprint: string
          title: string
          description: string | null
          company_id: string | null
          location_id: string | null
          status: 'active' | 'expired' | 'suspended'
          alternance: boolean
          contract_type_code: string | null
          work_mode_code: string | null
          seniority_level: string | null
          salary_min: number | null
          salary_max: number | null
          salary_period: string | null
          rome_codes: string[]
          naf_code: string | null
          contract_start_date: string | null
          expiration_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['offers']['Insert']>
      }
      offer_sources: {
        Row: {
          offer_id: string
          source_id: string
          source_offer_id: string
          source_url: string | null
          last_seen_at: string
          created_at: string
        }
        Insert: Database['public']['Tables']['offer_sources']['Row']
        Update: Partial<Database['public']['Tables']['offer_sources']['Insert']>
      }
      companies: {
        Row: {
          id: string
          name: string
          siret: string | null
          naf_code: string | null
          size: string | null
          description: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      locations: {
        Row: {
          id: string
          city: string
          postal_code: string | null
          department_code: string | null
          department_name: string | null
          region_code: string | null
          region_name: string | null
          country_code: string
          latitude: number | null
          longitude: number | null
        }
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      candidate_profiles: {
        Row: {
          app_user_id: string
          profile_title: string
          profile_summary: string | null
          years_experience: number | null
          seniority_level: string | null
          location_id: string | null
          work_mode_preference: string | null
          contract_type_preference: string | null
          availability: string | null
          availability_date: string | null
          salary_expectation_min: number | null
          salary_expectation_max: number | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['candidate_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['candidate_profiles']['Insert']>
      }
      cv_documents: {
        Row: {
          id: string
          app_user_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          upload_at: string
          delete_after_date: string
          is_current: boolean
        }
        Insert: Omit<Database['public']['Tables']['cv_documents']['Row'], 'id' | 'upload_at'>
        Update: Partial<Database['public']['Tables']['cv_documents']['Insert']>
      }
      match_scores: {
        Row: {
          candidate_id: string
          offer_id: string
          score: number
          score_ann: number
          score_skill: number
          score_geo: number
          gating_applied: boolean
          penalty_applied: boolean
          explanations: Record<string, any>
          computed_at: string
        }
        Insert: Database['public']['Tables']['match_scores']['Row']
        Update: Partial<Database['public']['Tables']['match_scores']['Insert']>
      }
      batches: {
        Row: {
          id: string
          name: string
          type: string
          status: string
          filters: Record<string, any> | null
          total_items: number | null
          processed_items: number
          failed_items: number
          estimated_cost: number | null
          estimated_duration_seconds: number | null
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['batches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['batches']['Insert']>
      }
    }
    Views: {
      kpi_daily_admin: {
        Row: {
          date: string
          total_offers: number
          active_offers: number
          total_candidates: number
          active_candidates: number
          total_matches: number
          avg_match_score: number
        }
      }
    }
    Functions: {}
  }
} 