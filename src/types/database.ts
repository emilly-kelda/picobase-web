export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          default_duration_min: number
          default_price: number
          id: string
          name: string
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          school_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          default_duration_min?: number
          default_price?: number
          id?: string
          name: string
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          school_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          default_duration_min?: number
          default_price?: number
          id?: string
          name?: string
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          school_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "activities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      checkins: {
        Row: {
          activity_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          checkin_at: string
          emergency_name: string | null
          emergency_phone: string | null
          gdpr_consent: boolean | null
          health_condition: string | null
          id: string
          instructor_id: string | null
          ip_address: string | null
          lgpd_consent: boolean
          package_sale_id: string | null
          school_id: string
          signature_data: string | null
          status: Database["public"]["Enums"]["checkin_status"]
          student_email: string | null
          student_name: string
          student_nationality: string | null
          student_whatsapp: string | null
          user_agent: string | null
          waiver_pdf_url: string | null
          waiver_signed_at: string | null
          zapsign_doc_id: string | null
        }
        Insert: {
          activity_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          checkin_at?: string
          emergency_name?: string | null
          emergency_phone?: string | null
          gdpr_consent?: boolean | null
          health_condition?: string | null
          id?: string
          instructor_id?: string | null
          ip_address?: string | null
          lgpd_consent?: boolean
          package_sale_id?: string | null
          school_id: string
          signature_data?: string | null
          status?: Database["public"]["Enums"]["checkin_status"]
          student_email?: string | null
          student_name: string
          student_nationality?: string | null
          student_whatsapp?: string | null
          user_agent?: string | null
          waiver_pdf_url?: string | null
          waiver_signed_at?: string | null
          zapsign_doc_id?: string | null
        }
        Update: {
          activity_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          checkin_at?: string
          emergency_name?: string | null
          emergency_phone?: string | null
          gdpr_consent?: boolean | null
          health_condition?: string | null
          id?: string
          instructor_id?: string | null
          ip_address?: string | null
          lgpd_consent?: boolean
          package_sale_id?: string | null
          school_id?: string
          signature_data?: string | null
          status?: Database["public"]["Enums"]["checkin_status"]
          student_email?: string | null
          student_name?: string
          student_nationality?: string | null
          student_whatsapp?: string | null
          user_agent?: string | null
          waiver_pdf_url?: string | null
          waiver_signed_at?: string | null
          zapsign_doc_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_package_sale_id_fkey"
            columns: ["package_sale_id"]
            isOneToOne: false
            referencedRelation: "package_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      commission_overrides: {
        Row: {
          active: boolean
          activity_id: string | null
          commission_pct: number | null
          created_at: string
          fixed_amount: number | null
          id: string
          instructor_id: string
          model: Database["public"]["Enums"]["commission_model"]
          note: string | null
          package_type: Database["public"]["Enums"]["package_type"] | null
          priority: number
          school_id: string
        }
        Insert: {
          active?: boolean
          activity_id?: string | null
          commission_pct?: number | null
          created_at?: string
          fixed_amount?: number | null
          id?: string
          instructor_id: string
          model?: Database["public"]["Enums"]["commission_model"]
          note?: string | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          priority?: number
          school_id: string
        }
        Update: {
          active?: boolean
          activity_id?: string | null
          commission_pct?: number | null
          created_at?: string
          fixed_amount?: number | null
          id?: string
          instructor_id?: string
          model?: Database["public"]["Enums"]["commission_model"]
          note?: string | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          priority?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_overrides_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_overrides_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_overrides_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_overrides_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      documents: {
        Row: {
          filename: string
          generated_at: string
          hash: string | null
          id: string
          language: string
          reference_id: string | null
          school_id: string
          storage_url: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          filename: string
          generated_at?: string
          hash?: string | null
          id?: string
          language?: string
          reference_id?: string | null
          school_id: string
          storage_url: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          filename?: string
          generated_at?: string
          hash?: string | null
          id?: string
          language?: string
          reference_id?: string | null
          school_id?: string
          storage_url?: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      package_sales: {
        Row: {
          completed_at: string | null
          created_at: string
          discount_applied: number
          id: string
          minutes_purchased: number
          minutes_used: number
          notes: string | null
          package_id: string
          price_paid: number
          primary_instructor_id: string | null
          referral_partner_id: string | null
          referral_source: string | null
          school_id: string
          sold_at: string
          status: string
          student_email: string | null
          student_id: string | null
          student_name: string
          student_nationality: string | null
          student_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          discount_applied?: number
          id?: string
          minutes_purchased: number
          minutes_used?: number
          notes?: string | null
          package_id: string
          price_paid: number
          primary_instructor_id?: string | null
          referral_partner_id?: string | null
          referral_source?: string | null
          school_id: string
          sold_at?: string
          status?: string
          student_email?: string | null
          student_id?: string | null
          student_name: string
          student_nationality?: string | null
          student_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          discount_applied?: number
          id?: string
          minutes_purchased?: number
          minutes_used?: number
          notes?: string | null
          package_id?: string
          price_paid?: number
          primary_instructor_id?: string | null
          referral_partner_id?: string | null
          referral_source?: string | null
          school_id?: string
          sold_at?: string
          status?: string
          student_email?: string | null
          student_id?: string | null
          student_name?: string
          student_nationality?: string | null
          student_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_sales_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_sales_primary_instructor_id_fkey"
            columns: ["primary_instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_sales_referral_partner_id_fkey"
            columns: ["referral_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_sales_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_sales_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "package_sales_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean
          base_price: number
          code: string | null
          created_at: string
          discount_pct: number
          final_price: number | null
          id: string
          includes_transport: boolean
          max_participants: number | null
          min_participants: number | null
          name: string
          price_per_person: number | null
          school_id: string
          sort_order: number
          sport: string
          total_minutes: number | null
          type: Database["public"]["Enums"]["package_type"]
        }
        Insert: {
          active?: boolean
          base_price: number
          code?: string | null
          created_at?: string
          discount_pct?: number
          final_price?: number | null
          id?: string
          includes_transport?: boolean
          max_participants?: number | null
          min_participants?: number | null
          name: string
          price_per_person?: number | null
          school_id: string
          sort_order?: number
          sport: string
          total_minutes?: number | null
          type?: Database["public"]["Enums"]["package_type"]
        }
        Update: {
          active?: boolean
          base_price?: number
          code?: string | null
          created_at?: string
          discount_pct?: number
          final_price?: number | null
          id?: string
          includes_transport?: boolean
          max_participants?: number | null
          min_participants?: number | null
          name?: string
          price_per_person?: number | null
          school_id?: string
          sort_order?: number
          sport?: string
          total_minutes?: number | null
          type?: Database["public"]["Enums"]["package_type"]
        }
        Relationships: [
          {
            foreignKeyName: "packages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          commission_pct: number
          created_at: string
          finance_email: string | null
          id: string
          name: string
          pix_key: string | null
          portal_user_id: string | null
          school_id: string
          type: string | null
          updated_at: string
          wise_email: string | null
        }
        Insert: {
          active?: boolean
          commission_pct?: number
          created_at?: string
          finance_email?: string | null
          id?: string
          name: string
          pix_key?: string | null
          portal_user_id?: string | null
          school_id: string
          type?: string | null
          updated_at?: string
          wise_email?: string | null
        }
        Update: {
          active?: boolean
          commission_pct?: number
          created_at?: string
          finance_email?: string | null
          id?: string
          name?: string
          pix_key?: string | null
          portal_user_id?: string | null
          school_id?: string
          type?: string | null
          updated_at?: string
          wise_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      payments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bonus: number
          commission_amount: number
          commission_pct: number
          created_at: string
          export_included: boolean
          id: string
          instructor_id: string
          paid_at: string | null
          period: string
          receipt_url: string | null
          revenue_generated: number
          school_id: string
          sessions_count: number
          status: Database["public"]["Enums"]["payment_status"]
          total_to_pay: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bonus?: number
          commission_amount: number
          commission_pct: number
          created_at?: string
          export_included?: boolean
          id?: string
          instructor_id: string
          paid_at?: string | null
          period: string
          receipt_url?: string | null
          revenue_generated?: number
          school_id: string
          sessions_count?: number
          status?: Database["public"]["Enums"]["payment_status"]
          total_to_pay: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bonus?: number
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          export_included?: boolean
          id?: string
          instructor_id?: string
          paid_at?: string | null
          period?: string
          receipt_url?: string | null
          revenue_generated?: number
          school_id?: string
          sessions_count?: number
          status?: Database["public"]["Enums"]["payment_status"]
          total_to_pay?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      referrals: {
        Row: {
          approved_at: string | null
          commission_amount: number
          commission_pct: number
          created_at: string
          id: string
          package_sale_id: string | null
          paid_at: string | null
          partner_id: string
          period: string
          school_id: string
          session_id: string | null
          session_price: number
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          approved_at?: string | null
          commission_amount: number
          commission_pct: number
          created_at?: string
          id?: string
          package_sale_id?: string | null
          paid_at?: string | null
          partner_id: string
          period: string
          school_id: string
          session_id?: string | null
          session_price: number
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          approved_at?: string | null
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          id?: string
          package_sale_id?: string | null
          paid_at?: string | null
          partner_id?: string
          period?: string
          school_id?: string
          session_id?: string | null
          session_price?: number
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_package_sale_id_fkey"
            columns: ["package_sale_id"]
            isOneToOne: false
            referencedRelation: "package_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "referrals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          active: boolean
          burn_rate: number | null
          country: string | null
          created_at: string
          currency: string
          id: string
          language: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["school_plan"]
          slug: string
          sport_types: string[] | null
          stripe_customer_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          burn_rate?: number | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          language?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["school_plan"]
          slug: string
          sport_types?: string[] | null
          stripe_customer_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          burn_rate?: number | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          language?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["school_plan"]
          slug?: string
          sport_types?: string[] | null
          stripe_customer_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          burn_rate: number
          created_at: string
          end_date: string
          id: string
          label: string
          school_id: string
          start_date: string
        }
        Insert: {
          burn_rate?: number
          created_at?: string
          end_date: string
          id?: string
          label: string
          school_id: string
          start_date: string
        }
        Update: {
          burn_rate?: number
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasons_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      sessions: {
        Row: {
          activity_id: string | null
          checkin_id: string
          commission_amount: number
          commission_pct: number
          confirmed_at: string
          duration_min: number
          id: string
          instructor_id: string
          notes: string | null
          origin: Database["public"]["Enums"]["session_origin"]
          package_sale_id: string | null
          partner_id: string | null
          price: number | null
          price_override_reason: string | null
          school_id: string
          season: string | null
          session_date: string
          session_type: Database["public"]["Enums"]["session_type"]
        }
        Insert: {
          activity_id?: string | null
          checkin_id: string
          commission_amount: number
          commission_pct: number
          confirmed_at?: string
          duration_min: number
          id?: string
          instructor_id: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["session_origin"]
          package_sale_id?: string | null
          partner_id?: string | null
          price?: number | null
          price_override_reason?: string | null
          school_id: string
          season?: string | null
          session_date: string
          session_type?: Database["public"]["Enums"]["session_type"]
        }
        Update: {
          activity_id?: string | null
          checkin_id?: string
          commission_amount?: number
          commission_pct?: number
          confirmed_at?: string
          duration_min?: number
          id?: string
          instructor_id?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["session_origin"]
          package_sale_id?: string | null
          partner_id?: string | null
          price?: number | null
          price_override_reason?: string | null
          school_id?: string
          season?: string | null
          session_date?: string
          session_type?: Database["public"]["Enums"]["session_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: true
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_package_sale_id_fkey"
            columns: ["package_sale_id"]
            isOneToOne: false
            referencedRelation: "package_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          health_conditions: string | null
          height_cm: number | null
          id: string
          name: string
          nationality: string | null
          notes: string | null
          school_id: string
          skill_level: Database["public"]["Enums"]["skill_level_enum"] | null
          weight_kg: number | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          id?: string
          name: string
          nationality?: string | null
          notes?: string | null
          school_id: string
          skill_level?: Database["public"]["Enums"]["skill_level_enum"] | null
          weight_kg?: number | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          health_conditions?: string | null
          height_cm?: number | null
          id?: string
          name?: string
          nationality?: string | null
          notes?: string | null
          school_id?: string
          skill_level?: Database["public"]["Enums"]["skill_level_enum"] | null
          weight_kg?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean
          commission_pct: number | null
          created_at: string
          email: string | null
          id: string
          language: string
          log_token: string | null
          name: string
          pix_key: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          updated_at: string
          whatsapp: string | null
          wise_email: string | null
        }
        Insert: {
          active?: boolean
          commission_pct?: number | null
          created_at?: string
          email?: string | null
          id: string
          language?: string
          log_token?: string | null
          name: string
          pix_key?: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          updated_at?: string
          whatsapp?: string | null
          wise_email?: string | null
        }
        Update: {
          active?: boolean
          commission_pct?: number | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string
          log_token?: string | null
          name?: string
          pix_key?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          updated_at?: string
          whatsapp?: string | null
          wise_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_runway"
            referencedColumns: ["school_id"]
          },
        ]
      }
    }
    Views: {
      v_runway: {
        Row: {
          avg_ticket: number | null
          burn_rate: number | null
          crew_commissions: number | null
          currency: string | null
          current_season: string | null
          partner_commissions: number | null
          school_id: string | null
          school_name: string | null
          season_profit: number | null
          season_revenue: number | null
          total_sessions: number | null
          winter_runway_months: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_is_owner: { Args: never; Returns: boolean }
      auth_is_owner_or_accountant: { Args: never; Returns: boolean }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      auth_school_id: { Args: never; Returns: string }
      close_month: {
        Args: { p_period: string; p_school_id: string }
        Returns: number
      }
      resolve_commission: {
        Args: {
          p_activity_id: string
          p_instructor_id: string
          p_package_type: Database["public"]["Enums"]["package_type"]
          p_revenue: number
          p_school_id: string
        }
        Returns: number
      }
    }
    Enums: {
      checkin_status:
        | "pending_waiver"
        | "checked_in"
        | "session_confirmed"
        | "cancelled"
      commission_model: "percentage" | "fixed" | "hybrid"
      document_type:
        | "waiver"
        | "receipt"
        | "partner_report"
        | "pl_statement"
        | "apex_certificate"
        | "pix_export"
        | "wise_export"
      package_type: "lesson" | "trip" | "rental" | "supervision"
      payment_status: "pending" | "approved" | "paid"
      pricing_mode: "proportional" | "fixed"
      referral_status: "pending" | "approved" | "paid"
      school_plan: "setup" | "pro"
      session_origin: "direct" | "partner" | "online" | "referral"
      session_type: "lesson" | "trip" | "downwind" | "rental" | "supervision"
      skill_level_enum: "beginner" | "intermediate" | "advanced"
      user_role: "owner" | "instructor" | "partner" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      checkin_status: [
        "pending_waiver",
        "checked_in",
        "session_confirmed",
        "cancelled",
      ],
      commission_model: ["percentage", "fixed", "hybrid"],
      document_type: [
        "waiver",
        "receipt",
        "partner_report",
        "pl_statement",
        "apex_certificate",
        "pix_export",
        "wise_export",
      ],
      package_type: ["lesson", "trip", "rental", "supervision"],
      payment_status: ["pending", "approved", "paid"],
      pricing_mode: ["proportional", "fixed"],
      referral_status: ["pending", "approved", "paid"],
      school_plan: ["setup", "pro"],
      session_origin: ["direct", "partner", "online", "referral"],
      session_type: ["lesson", "trip", "downwind", "rental", "supervision"],
      skill_level_enum: ["beginner", "intermediate", "advanced"],
      user_role: ["owner", "instructor", "partner", "accountant"],
    },
  },
} as const

