export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Tells createClient which PostgREST API version to use
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          password_hash: string | null
          source_lang: string
          speaker_name: string | null
          status: string
          target_languages: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id: string
          password_hash?: string | null
          source_lang: string
          speaker_name?: string | null
          status?: string
          target_languages?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          password_hash?: string | null
          source_lang?: string
          speaker_name?: string | null
          status?: string
          target_languages?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user: {
        Args: Record<never, never>
        Returns: undefined
      }
      get_event_protection: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      verify_event_password: {
        Args: { p_event_id: string; p_password_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
