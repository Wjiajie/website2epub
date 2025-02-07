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
      pages: {
        Row: {
          id: string
          created_at: string
          title: string
          url: string
          content: string
          folder: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          url: string
          content: string
          folder?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          url?: string
          content?: string
          folder?: string | null
          user_id?: string | null
        }
      }
    }
  }
} 