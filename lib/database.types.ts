export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          smoking_frequency: 'daily' | 'weekly' | 'monthly'
          smoking_amount: number // 箱数
          participation_fee: number // 参加費（円）
          payout_method: 'refund' | 'donation' // 返金・募金選択
          donation_target_id: string | null
          record_time: string // HH:MM形式
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          smoking_frequency: 'daily' | 'weekly' | 'monthly'
          smoking_amount: number
          participation_fee: number
          payout_method: 'refund' | 'donation'
          donation_target_id?: string | null
          record_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          smoking_frequency?: 'daily' | 'weekly' | 'monthly'
          smoking_amount?: number
          participation_fee?: number
          payout_method?: 'refund' | 'donation'
          donation_target_id?: string | null
          record_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string
          status: 'active' | 'completed' | 'abandoned'
          total_success_days: number
          total_failed_days: number
          achievement_rate: number
          donation_amount: number
          payment_intent_id: string | null
          payment_completed: boolean
          payment_completed_at: string | null
          refund_completed: boolean
          refund_amount: number | null
          refund_completed_at: string | null
          stripe_refund_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date: string
          status?: 'active' | 'completed' | 'abandoned'
          total_success_days?: number
          total_failed_days?: number
          achievement_rate?: number
          donation_amount?: number
          payment_intent_id?: string | null
          payment_completed?: boolean
          payment_completed_at?: string | null
          refund_completed?: boolean
          refund_amount?: number | null
          refund_completed_at?: string | null
          stripe_refund_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          end_date?: string
          status?: 'active' | 'completed' | 'abandoned'
          total_success_days?: number
          total_failed_days?: number
          achievement_rate?: number
          donation_amount?: number
          payment_intent_id?: string | null
          payment_completed?: boolean
          payment_completed_at?: string | null
          refund_completed?: boolean
          refund_amount?: number | null
          refund_completed_at?: string | null
          stripe_refund_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_records: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          record_date: string
          smoked: boolean
          countermeasure: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          record_date: string
          smoked: boolean
          countermeasure?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          record_date?: string
          smoked?: boolean
          countermeasure?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      donation_targets: {
        Row: {
          id: string
          name: string
          description: string
          logo_url: string | null
          website_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      donation_proofs: {
        Row: {
          id: string
          donation_target_id: string
          total_amount: number
          donation_date: string
          proof_url: string | null
          receipt_url: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donation_target_id: string
          total_amount: number
          donation_date: string
          proof_url?: string | null
          receipt_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donation_target_id?: string
          total_amount?: number
          donation_date?: string
          proof_url?: string | null
          receipt_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
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