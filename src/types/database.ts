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
      api_keys: {
        Row: {
          id: string
          user_id: string
          provider: string
          encrypted_key: string
          key_hint: string
          is_valid: boolean
          last_validated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          encrypted_key: string
          key_hint?: string
          is_valid?: boolean
          last_validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          encrypted_key?: string
          key_hint?: string
          is_valid?: boolean
          last_validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          allowed_tts_modes: string[] | null
          created_at: string
          default_tts_mode: string | null
          expires_at: string
          id: string
          password_hash: string | null
          scheduled_at: string | null
          source_lang: string
          speaker_name: string | null
          stt_provider: string | null
          status: string
          target_languages: string[]
          title: string
          tts_provider: string | null
          tts_speed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_tts_modes?: string[] | null
          created_at?: string
          default_tts_mode?: string | null
          expires_at?: string
          id: string
          password_hash?: string | null
          scheduled_at?: string | null
          source_lang: string
          speaker_name?: string | null
          stt_provider?: string | null
          status?: string
          target_languages?: string[]
          title?: string
          tts_provider?: string | null
          tts_speed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_tts_modes?: string[] | null
          created_at?: string
          default_tts_mode?: string | null
          expires_at?: string
          id?: string
          password_hash?: string | null
          scheduled_at?: string | null
          source_lang?: string
          speaker_name?: string | null
          stt_provider?: string | null
          status?: string
          target_languages?: string[]
          title?: string
          tts_provider?: string | null
          tts_speed?: number | null
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

export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ApiProvider = "openai" | "elevenlabs";
export type TTSProvider = "openai" | "elevenlabs" | "browser";
