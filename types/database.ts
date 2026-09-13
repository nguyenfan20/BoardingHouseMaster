export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bank_info: {
        Row: {
          account_name: string
          account_no: string
          bank_code: string
          id: string
          is_active: boolean
        }
        Insert: {
          account_name: string
          account_no: string
          bank_code: string
          id?: string
          is_active?: boolean
        }
        Update: {
          account_name?: string
          account_no?: string
          bank_code?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      billing_config: {
        Row: {
          allow_tenant_meter_input: boolean
          billing_day: number
          dual_meter_surcharge_percent: number
          electricity_rate: number
          electricity_tax_percent: number
          has_dual_meter: boolean
          other_fees: Json
          room_id: string
          updated_at: string
          water_calc_type: string
          water_rate: number
        }
        Insert: {
          allow_tenant_meter_input?: boolean
          billing_day?: number
          dual_meter_surcharge_percent?: number
          electricity_rate?: number
          electricity_tax_percent?: number
          has_dual_meter?: boolean
          other_fees?: Json
          room_id: string
          updated_at?: string
          water_calc_type: string
          water_rate: number
        }
        Update: {
          allow_tenant_meter_input?: boolean
          billing_day?: number
          dual_meter_surcharge_percent?: number
          electricity_rate?: number
          electricity_tax_percent?: number
          has_dual_meter?: boolean
          other_fees?: Json
          room_id?: string
          updated_at?: string
          water_calc_type?: string
          water_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_config_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_fees: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          fee_name: string
          id: string
          invoice_id: string | null
          month: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_id: string
          status: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          fee_name: string
          id?: string
          invoice_id?: string | null
          month: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id: string
          status?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          fee_name?: string
          id?: string
          invoice_id?: string | null
          month?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_fees_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          breakdown: Json
          created_at: string
          id: string
          month: string
          qr_url: string | null
          room_id: string
          status: string
          total_amount: number
        }
        Insert: {
          breakdown: Json
          created_at?: string
          id?: string
          month: string
          qr_url?: string | null
          room_id: string
          status?: string
          total_amount: number
        }
        Update: {
          breakdown?: Json
          created_at?: string
          id?: string
          month?: string
          qr_url?: string | null
          room_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          created_at: string
          id: string
          meter_type: string
          month: string
          new_index: number
          old_index: number
          recorded_by: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meter_type: string
          month: string
          new_index: number
          old_index: number
          recorded_by: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meter_type?: string
          month?: string
          new_index?: number
          old_index?: number
          recorded_by?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_table?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parking_requests: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          plate_number: string
          room_id: string
          scheduled_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          plate_number: string
          room_id: string
          scheduled_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          plate_number?: string
          room_id?: string
          scheduled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          room_id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          room_id: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          room_id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_invites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          base_price: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          num_occupants: number
          room_type: string
        }
        Insert: {
          base_price: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          num_occupants?: number
          room_type: string
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          num_occupants?: number
          room_type?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          room_id: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role: string
          room_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      water_readings: {
        Row: {
          created_at: string
          id: string
          month: string
          new_index: number
          old_index: number
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          new_index: number
          old_index: number
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          new_index?: number
          old_index?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_readings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      my_room_id: { Args: never; Returns: string }
      room_allows_tenant_input: {
        Args: { p_room_id: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


// ── Custom type aliases (hand-maintained, not generated) ─────────────────────
export type UserRole = "admin" | "tenant";
export type RoomType = "normal" | "dual_meter" | "mat_bang";
export type WaterCalcType = "per_person" | "fixed" | "per_m3";
export type MeterType = "single" | "indoor" | "outdoor";
export type RecordedBy = "admin" | "tenant";
export type ExtraFeeStatus = "declared" | "pending" | "approved" | "rejected";
export type InvoiceStatus = "unpaid" | "paid";
// Khớp đúng check constraint của notifications.type trong 0001_init.sql.
export type NotificationType =
  | "extra_fee_approved"
  | "extra_fee_rejected"
  | "invoice_created"
  | "invoice_paid"
  | "general";
export type InviteStatus = "active" | "used" | "revoked" | "expired";
