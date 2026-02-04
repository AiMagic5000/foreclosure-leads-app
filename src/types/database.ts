export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      foreclosure_leads: {
        Row: {
          id: string
          property_address: string
          city: string | null
          state: string | null
          state_abbr: string | null
          zip_code: string | null
          parcel_id: string | null
          owner_name: string
          case_number: string | null
          sale_date: string | null
          sale_amount: number | null
          mortgage_amount: number | null
          lender_name: string | null
          trustee_name: string | null
          source: string | null
          source_type: string | null
          foreclosure_type: string | null
          batch_id: string | null
          scraped_at: string
          primary_phone: string | null
          secondary_phone: string | null
          phone_numbers: string[] | null
          primary_email: string | null
          email_addresses: string[] | null
          associated_names: string[] | null
          mailing_address: string | null
          skip_trace_source: string | null
          skip_traced_at: string | null
          dnc_checked: boolean
          on_dnc: boolean
          dnc_type: string | null
          can_contact: boolean
          dnc_checked_at: string | null
          voicemail_script: string | null
          voicemail_audio_url: string | null
          voicemail_generated_at: string | null
          voicemail_sent: boolean
          voicemail_delivery_id: string | null
          voicemail_sent_at: string | null
          voicemail_error: string | null
          callback_received: boolean
          callback_at: string | null
          callback_notes: string | null
          assigned_to: string | null
          contract_signed: boolean
          contract_signed_at: string | null
          contract_amount: number | null
          status: string
          last_updated: string
          created_at: string
          apn_number: string | null
          assessed_value: number | null
          tax_amount: number | null
          lot_size: string | null
          year_built: number | null
          estimated_market_value: number | null
          property_type: string | null
          bedrooms: number | null
          bathrooms: number | null
          square_footage: number | null
          enrichment_source: string | null
          enriched_at: string | null
        }
        Insert: {
          id: string
          property_address: string
          city?: string | null
          state?: string | null
          state_abbr?: string | null
          zip_code?: string | null
          parcel_id?: string | null
          owner_name: string
          case_number?: string | null
          sale_date?: string | null
          sale_amount?: number | null
          mortgage_amount?: number | null
          lender_name?: string | null
          trustee_name?: string | null
          source?: string | null
          source_type?: string | null
          foreclosure_type?: string | null
          batch_id?: string | null
          status?: string
        }
        Update: {
          id?: string
          property_address?: string
          city?: string | null
          state?: string | null
          state_abbr?: string | null
          zip_code?: string | null
          parcel_id?: string | null
          owner_name?: string
          case_number?: string | null
          sale_date?: string | null
          sale_amount?: number | null
          mortgage_amount?: number | null
          lender_name?: string | null
          trustee_name?: string | null
          source?: string | null
          source_type?: string | null
          foreclosure_type?: string | null
          batch_id?: string | null
          status?: string
          primary_phone?: string | null
          primary_email?: string | null
          skip_traced_at?: string | null
          dnc_checked?: boolean
          on_dnc?: boolean
          can_contact?: boolean
          apn_number?: string | null
          assessed_value?: number | null
          tax_amount?: number | null
          lot_size?: string | null
          year_built?: number | null
          estimated_market_value?: number | null
          property_type?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_footage?: number | null
          enrichment_source?: string | null
          enriched_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          full_name: string | null
          subscription_tier: 'free' | 'single_state' | 'multi_state'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          selected_states: string[]
          automation_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          clerk_id: string
          email: string
          full_name?: string | null
          subscription_tier?: 'free' | 'single_state' | 'multi_state'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          selected_states?: string[]
          automation_enabled?: boolean
        }
        Update: {
          clerk_id?: string
          email?: string
          full_name?: string | null
          subscription_tier?: 'free' | 'single_state' | 'multi_state'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          selected_states?: string[]
          automation_enabled?: boolean
        }
      }
      state_data: {
        Row: {
          id: string
          state_name: string
          state_abbr: string
          foreclosure_type: string
          tax_overage_statute: string | null
          mortgage_overage_statute: string | null
          timeline_notes: string | null
          fee_limits: string | null
          claim_window: string | null
          lead_count: number
          last_updated: string
        }
        Insert: {
          state_name: string
          state_abbr: string
          foreclosure_type: string
          tax_overage_statute?: string | null
          mortgage_overage_statute?: string | null
          timeline_notes?: string | null
          fee_limits?: string | null
          claim_window?: string | null
          lead_count?: number
        }
        Update: {
          state_name?: string
          state_abbr?: string
          foreclosure_type?: string
          tax_overage_statute?: string | null
          mortgage_overage_statute?: string | null
          timeline_notes?: string | null
          fee_limits?: string | null
          claim_window?: string | null
          lead_count?: number
        }
      }
      scrape_runs: {
        Row: {
          id: string
          batch_id: string
          status: 'running' | 'completed' | 'failed'
          states_scraped: string[]
          sources_scraped: string[]
          leads_found: number
          leads_skip_traced: number
          leads_dnc_blocked: number
          started_at: string
          completed_at: string | null
          error_message: string | null
        }
        Insert: {
          batch_id: string
          status?: 'running' | 'completed' | 'failed'
          states_scraped?: string[]
          sources_scraped?: string[]
          leads_found?: number
          leads_skip_traced?: number
          leads_dnc_blocked?: number
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
        Update: {
          batch_id?: string
          status?: 'running' | 'completed' | 'failed'
          states_scraped?: string[]
          sources_scraped?: string[]
          leads_found?: number
          leads_skip_traced?: number
          leads_dnc_blocked?: number
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
      }
      dnc_cache: {
        Row: {
          phone_number: string
          on_dnc: boolean
          dnc_type: string | null
          checked_at: string
          expires_at: string
        }
        Insert: {
          phone_number: string
          on_dnc: boolean
          dnc_type?: string | null
        }
        Update: {
          phone_number?: string
          on_dnc?: boolean
          dnc_type?: string | null
        }
      }
      user_activity: {
        Row: {
          id: string
          user_id: string | null
          action: string
          lead_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          action: string
          lead_id?: string | null
          details?: Json | null
        }
        Update: {
          user_id?: string | null
          action?: string
          lead_id?: string | null
          details?: Json | null
        }
      }
      user_pins: {
        Row: {
          id: string
          email: string
          pin: string
          states_access: string[]
          package_type: string
          gumroad_sale_id: string | null
          created_at: string
          expires_at: string | null
          is_active: boolean
          last_used_at: string | null
          created_by: string
        }
        Insert: {
          email: string
          pin: string
          states_access: string[]
          package_type?: string
          gumroad_sale_id?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_by?: string
        }
        Update: {
          id?: string
          email?: string
          pin?: string
          states_access?: string[]
          package_type?: string
          gumroad_sale_id?: string | null
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
          last_used_at?: string | null
          created_by?: string
        }
      }
      training_modules: {
        Row: {
          id: number
          module_number: number
          title: string
          description: string
          duration: string
          poster_url: string
          video_url: string
          status: 'completed' | 'current' | 'locked'
          sort_order: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          module_number: number
          title: string
          description: string
          duration?: string
          poster_url?: string
          video_url?: string
          status?: 'completed' | 'current' | 'locked'
          sort_order?: number
          updated_by?: string
        }
        Update: {
          module_number?: number
          title?: string
          description?: string
          duration?: string
          poster_url?: string
          video_url?: string
          status?: 'completed' | 'current' | 'locked'
          sort_order?: number
          updated_at?: string
          updated_by?: string
        }
      }
      training_resources: {
        Row: {
          id: string
          module_id: number
          file_name: string
          display_name: string
          file_url: string
          file_size: number
          file_type: string
          sort_order: number
          created_at: string
        }
        Insert: {
          module_id: number
          file_name: string
          display_name: string
          file_url: string
          file_size?: number
          file_type?: string
          sort_order?: number
        }
        Update: {
          module_id?: number
          file_name?: string
          display_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          sort_order?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type ForeclosureLead = Database['public']['Tables']['foreclosure_leads']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type StateData = Database['public']['Tables']['state_data']['Row']
export type ScrapeRun = Database['public']['Tables']['scrape_runs']['Row']
export type DncCache = Database['public']['Tables']['dnc_cache']['Row']
export type UserActivity = Database['public']['Tables']['user_activity']['Row']
export type UserPin = Database['public']['Tables']['user_pins']['Row']
export type TrainingModule = Database['public']['Tables']['training_modules']['Row']
export type TrainingResource = Database['public']['Tables']['training_resources']['Row']
