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
      user_data: {
        Row: {
          id: number
          user_id: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          data: Json
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: number
          user_id: string
          stripe_customer_id: string
          stripe_payment_id: string
          amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          stripe_customer_id: string
          stripe_payment_id: string
          amount: number
          status: string
          created_at?: string
        }
      }
    }
  }
} 