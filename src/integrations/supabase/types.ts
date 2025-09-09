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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_completions: {
        Row: {
          activity_id: string
          actual_duration_minutes: number | null
          completed_at: string
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          actual_duration_minutes?: number | null
          completed_at?: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          actual_duration_minutes?: number | null
          completed_at?: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "self_care_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string
          counselor_name: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type: string
          counselor_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type?: string
          counselor_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dep_classifier: {
        Row: {
          classifier: string | null
          created_at: string
          edu: number
          family: number
          financial: number
          general: number
          id: number
          phone: string | null
          rom: number
          social: number
          "total messages": number
          work: number
        }
        Insert: {
          classifier?: string | null
          created_at?: string
          edu?: number
          family?: number
          financial?: number
          general?: number
          id?: number
          phone?: string | null
          rom?: number
          social?: number
          "total messages"?: number
          work?: number
        }
        Update: {
          classifier?: string | null
          created_at?: string
          edu?: number
          family?: number
          financial?: number
          general?: number
          id?: number
          phone?: string | null
          rom?: number
          social?: number
          "total messages"?: number
          work?: number
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          is_moderator: boolean | null
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_moderator?: boolean | null
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_moderator?: boolean | null
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "peer_support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          id: number
          message: string
          phone_number: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: string
          phone_number: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string
          phone_number?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          mood_value: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mood_value: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood_value?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      peer_support_groups: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_members: number | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_members?: number | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_members?: number | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_external: boolean | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_external?: boolean | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_external?: boolean | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      self_care_activities: {
        Row: {
          category: string
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          instructions: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          title?: string
        }
        Relationships: []
      }
      stud_in: {
        Row: {
          branch: string | null
          "college name": string | null
          created_at: string
          guardian: string | null
          "guardian phone": string | null
          id: number
          location: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          branch?: string | null
          "college name"?: string | null
          created_at?: string
          guardian?: string | null
          "guardian phone"?: string | null
          id?: number
          location?: string | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          branch?: string | null
          "college name"?: string | null
          created_at?: string
          guardian?: string | null
          "guardian phone"?: string | null
          id?: number
          location?: string | null
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      student_group_permissions: {
        Row: {
          granted_at: string | null
          group_id: string
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          granted_at?: string | null
          group_id: string
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          granted_at?: string | null
          group_id?: string
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "peer_support_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      student_info: {
        Row: {
          additional_info: Json | null
          attendance: string | null
          cgpa: string | null
          college_name: string | null
          course: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          first_name: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_pronouns: string | null
          profile_completed: string | null
          student_id: string | null
          updated_at: string
          user_id: string
          year_of_study: string | null
        }
        Insert: {
          additional_info?: Json | null
          attendance?: string | null
          cgpa?: string | null
          college_name?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_pronouns?: string | null
          profile_completed?: string | null
          student_id?: string | null
          updated_at?: string
          user_id: string
          year_of_study?: string | null
        }
        Update: {
          additional_info?: Json | null
          attendance?: string | null
          cgpa?: string | null
          college_name?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_pronouns?: string | null
          profile_completed?: string | null
          student_id?: string | null
          updated_at?: string
          user_id?: string
          year_of_study?: string | null
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          campus: string | null
          created_at: string
          department: string | null
          employee_id: string | null
          id: string
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campus?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          id?: string
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campus?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          id?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_student_relationships: {
        Row: {
          assigned_at: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          student_id: string
          student_phone: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          student_id: string
          student_phone: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          student_id?: string
          student_phone?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wellness_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          session_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          session_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          session_type?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
