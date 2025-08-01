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
          payout_method: 'refund' // 返金選択
          refund_plan: 'beginner' | 'intermediate' | 'advanced' // 返金プラン
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
          payout_method: 'refund'
          refund_plan?: 'beginner' | 'intermediate' | 'advanced'
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
          payout_method?: 'refund'
          refund_plan?: 'beginner' | 'intermediate' | 'advanced'
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