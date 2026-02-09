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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      application_history: {
        Row: {
          applied_date: string
          candidate_id: string
          created_at: string
          furthest_stage: Database["public"]["Enums"]["pipeline_status"] | null
          historical_notes: string | null
          id: string
          jo_number: string | null
          jo_title: string | null
          job_order_id: string | null
          outcome: string | null
        }
        Insert: {
          applied_date: string
          candidate_id: string
          created_at?: string
          furthest_stage?: Database["public"]["Enums"]["pipeline_status"] | null
          historical_notes?: string | null
          id?: string
          jo_number?: string | null
          jo_title?: string | null
          job_order_id?: string | null
          outcome?: string | null
        }
        Update: {
          applied_date?: string
          candidate_id?: string
          created_at?: string
          furthest_stage?: Database["public"]["Enums"]["pipeline_status"] | null
          historical_notes?: string | null
          id?: string
          jo_number?: string | null
          jo_title?: string | null
          job_order_id?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_history_job_order_id_fkey"
            columns: ["job_order_id"]
            isOneToOne: false
            referencedRelation: "job_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_job_applications: {
        Row: {
          applied_date: string
          candidate_id: string
          created_at: string
          id: string
          job_order_id: string
          match_score: number | null
          pipeline_status: Database["public"]["Enums"]["pipeline_status"]
          remarks: string | null
          status_changed_date: string
          tech_interview_result:
            | Database["public"]["Enums"]["tech_interview_result"]
            | null
          updated_at: string
          working_conditions: string | null
        }
        Insert: {
          applied_date?: string
          candidate_id: string
          created_at?: string
          id?: string
          job_order_id: string
          match_score?: number | null
          pipeline_status?: Database["public"]["Enums"]["pipeline_status"]
          remarks?: string | null
          status_changed_date?: string
          tech_interview_result?:
            | Database["public"]["Enums"]["tech_interview_result"]
            | null
          updated_at?: string
          working_conditions?: string | null
        }
        Update: {
          applied_date?: string
          candidate_id?: string
          created_at?: string
          id?: string
          job_order_id?: string
          match_score?: number | null
          pipeline_status?: Database["public"]["Enums"]["pipeline_status"]
          remarks?: string | null
          status_changed_date?: string
          tech_interview_result?:
            | Database["public"]["Enums"]["tech_interview_result"]
            | null
          updated_at?: string
          working_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_applications_job_order_id_fkey"
            columns: ["job_order_id"]
            isOneToOne: false
            referencedRelation: "job_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_timeline: {
        Row: {
          application_id: string
          candidate_id: string
          changed_by: string | null
          changed_date: string
          created_at: string
          duration_days: number | null
          from_status: Database["public"]["Enums"]["pipeline_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["pipeline_status"]
        }
        Insert: {
          application_id: string
          candidate_id: string
          changed_by?: string | null
          changed_date?: string
          created_at?: string
          duration_days?: number | null
          from_status?: Database["public"]["Enums"]["pipeline_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["pipeline_status"]
        }
        Update: {
          application_id?: string
          candidate_id?: string
          changed_by?: string | null
          changed_date?: string
          created_at?: string
          duration_days?: number | null
          from_status?: Database["public"]["Enums"]["pipeline_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["pipeline_status"]
        }
        Relationships: [
          {
            foreignKeyName: "candidate_timeline_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_timeline_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_work_experience: {
        Row: {
          candidate_id: string
          company_name: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          job_title: string
          start_date: string | null
        }
        Insert: {
          candidate_id: string
          company_name: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title: string
          start_date?: string | null
        }
        Update: {
          candidate_id?: string
          company_name?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_work_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applicant_type: Database["public"]["Enums"]["applicant_type"]
          availability: string | null
          created_at: string
          cv_filename: string | null
          cv_url: string | null
          earliest_start_date: string | null
          educational_background: string | null
          email: string | null
          expected_salary: string | null
          full_name: string
          id: string
          phone: string | null
          positions_fit_for: string[] | null
          preferred_work_setup: string | null
          skills: string[] | null
          updated_at: string
          uploaded_by: string | null
          uploaded_by_user_id: string | null
          years_of_experience: number | null
        }
        Insert: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          availability?: string | null
          created_at?: string
          cv_filename?: string | null
          cv_url?: string | null
          earliest_start_date?: string | null
          educational_background?: string | null
          email?: string | null
          expected_salary?: string | null
          full_name: string
          id?: string
          phone?: string | null
          positions_fit_for?: string[] | null
          preferred_work_setup?: string | null
          skills?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_user_id?: string | null
          years_of_experience?: number | null
        }
        Update: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          availability?: string | null
          created_at?: string
          cv_filename?: string | null
          cv_url?: string | null
          earliest_start_date?: string | null
          educational_background?: string | null
          email?: string | null
          expected_salary?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          positions_fit_for?: string[] | null
          preferred_work_setup?: string | null
          skills?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_user_id?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      cv_uploaders: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      hr_interviews: {
        Row: {
          application_id: string
          availability: string | null
          candidate_id: string
          communication_rating: number | null
          concerns: string | null
          created_at: string
          cultural_fit_rating: number | null
          expected_salary: string | null
          id: string
          interview_date: string | null
          interview_mode: string | null
          interviewer_name: string | null
          motivation_rating: number | null
          notice_period: string | null
          preferred_work_setup: string | null
          professionalism_rating: number | null
          strengths: string | null
          updated_at: string
          verdict: Database["public"]["Enums"]["hr_verdict"] | null
          verdict_rationale: string | null
        }
        Insert: {
          application_id: string
          availability?: string | null
          candidate_id: string
          communication_rating?: number | null
          concerns?: string | null
          created_at?: string
          cultural_fit_rating?: number | null
          expected_salary?: string | null
          id?: string
          interview_date?: string | null
          interview_mode?: string | null
          interviewer_name?: string | null
          motivation_rating?: number | null
          notice_period?: string | null
          preferred_work_setup?: string | null
          professionalism_rating?: number | null
          strengths?: string | null
          updated_at?: string
          verdict?: Database["public"]["Enums"]["hr_verdict"] | null
          verdict_rationale?: string | null
        }
        Update: {
          application_id?: string
          availability?: string | null
          candidate_id?: string
          communication_rating?: number | null
          concerns?: string | null
          created_at?: string
          cultural_fit_rating?: number | null
          expected_salary?: string | null
          id?: string
          interview_date?: string | null
          interview_mode?: string | null
          interviewer_name?: string | null
          motivation_rating?: number | null
          notice_period?: string | null
          preferred_work_setup?: string | null
          professionalism_rating?: number | null
          strengths?: string | null
          updated_at?: string
          verdict?: Database["public"]["Enums"]["hr_verdict"] | null
          verdict_rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "candidate_job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_orders: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          department_name: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          hired_count: number
          id: string
          jo_number: string
          level: Database["public"]["Enums"]["job_level"]
          quantity: number
          requestor_name: string | null
          required_date: string | null
          status: Database["public"]["Enums"]["job_order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          department_name?: string | null
          description?: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          hired_count?: number
          id?: string
          jo_number: string
          level: Database["public"]["Enums"]["job_level"]
          quantity?: number
          requestor_name?: string | null
          required_date?: string | null
          status?: Database["public"]["Enums"]["job_order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          department_name?: string | null
          description?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          hired_count?: number
          id?: string
          jo_number?: string
          level?: Database["public"]["Enums"]["job_level"]
          quantity?: number
          requestor_name?: string | null
          required_date?: string | null
          status?: Database["public"]["Enums"]["job_order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_orders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          application_id: string
          candidate_id: string
          created_at: string
          id: string
          offer_amount: string | null
          offer_date: string | null
          position: string | null
          remarks: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"] | null
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          created_at?: string
          id?: string
          offer_amount?: string | null
          offer_date?: string | null
          position?: string | null
          remarks?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          created_at?: string
          id?: string
          offer_amount?: string | null
          offer_date?: string | null
          position?: string | null
          remarks?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "candidate_job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tech_interviews: {
        Row: {
          application_id: string
          areas_for_improvement: string | null
          candidate_id: string
          code_quality_rating: number | null
          coding_challenge_notes: string | null
          coding_challenge_score: number | null
          created_at: string
          id: string
          interview_date: string | null
          interview_mode: string | null
          interviewer_name: string | null
          problem_solving_rating: number | null
          system_design_rating: number | null
          technical_knowledge_rating: number | null
          technical_strengths: string | null
          updated_at: string
          verdict: Database["public"]["Enums"]["tech_verdict"] | null
          verdict_rationale: string | null
        }
        Insert: {
          application_id: string
          areas_for_improvement?: string | null
          candidate_id: string
          code_quality_rating?: number | null
          coding_challenge_notes?: string | null
          coding_challenge_score?: number | null
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_mode?: string | null
          interviewer_name?: string | null
          problem_solving_rating?: number | null
          system_design_rating?: number | null
          technical_knowledge_rating?: number | null
          technical_strengths?: string | null
          updated_at?: string
          verdict?: Database["public"]["Enums"]["tech_verdict"] | null
          verdict_rationale?: string | null
        }
        Update: {
          application_id?: string
          areas_for_improvement?: string | null
          candidate_id?: string
          code_quality_rating?: number | null
          coding_challenge_notes?: string | null
          coding_challenge_score?: number | null
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_mode?: string | null
          interviewer_name?: string | null
          problem_solving_rating?: number | null
          system_design_rating?: number | null
          technical_knowledge_rating?: number | null
          technical_strengths?: string | null
          updated_at?: string
          verdict?: Database["public"]["Enums"]["tech_verdict"] | null
          verdict_rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "candidate_job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hr" | "recruiter" | "hiring_manager"
      applicant_type: "internal" | "external"
      employment_type: "consultant" | "project-based" | "regular"
      hr_verdict: "proceed_to_tech" | "hold" | "reject"
      job_level: "L1" | "L2" | "L3" | "L4" | "L5"
      job_order_status: "draft" | "in-progress" | "fulfilled" | "closed"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "negotiating"
        | "unresponsive"
      pipeline_status:
        | "new"
        | "screening"
        | "for_hr_interview"
        | "for_tech_interview"
        | "offer"
        | "hired"
        | "rejected"
        | "withdrawn"
      tech_interview_result: "pending" | "passed" | "failed"
      tech_verdict: "recommend_hire" | "consider" | "do_not_hire"
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
      app_role: ["admin", "hr", "recruiter", "hiring_manager"],
      applicant_type: ["internal", "external"],
      employment_type: ["consultant", "project-based", "regular"],
      hr_verdict: ["proceed_to_tech", "hold", "reject"],
      job_level: ["L1", "L2", "L3", "L4", "L5"],
      job_order_status: ["draft", "in-progress", "fulfilled", "closed"],
      offer_status: [
        "pending",
        "accepted",
        "rejected",
        "negotiating",
        "unresponsive",
      ],
      pipeline_status: [
        "new",
        "screening",
        "for_hr_interview",
        "for_tech_interview",
        "offer",
        "hired",
        "rejected",
        "withdrawn",
      ],
      tech_interview_result: ["pending", "passed", "failed"],
      tech_verdict: ["recommend_hire", "consider", "do_not_hire"],
    },
  },
} as const
