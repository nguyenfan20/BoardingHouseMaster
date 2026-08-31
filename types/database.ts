// Kiểu dữ liệu DB viết tay, khớp supabase/migrations/0001_init.sql / docs/SCHEMA.md.
// TODO: khi đã có Supabase project thật, thay bằng `supabase gen types typescript --linked`
// và giữ nguyên format `Database` này để không phải sửa lib/supabase/*.ts.

export type UserRole = "admin" | "tenant";
export type RoomType = "normal" | "dual_meter" | "mat_bang";
export type WaterCalcType = "per_person" | "fixed" | "per_m3";
export type MeterType = "single" | "indoor" | "outdoor";
export type RecordedBy = "admin" | "tenant";
export type ExtraFeeStatus = "pending" | "approved" | "rejected";
export type InvoiceStatus = "unpaid" | "paid";
export type NotificationType =
  | "extra_fee_approved"
  | "extra_fee_rejected"
  | "invoice_created"
  | "invoice_paid"
  | "general";

export type InviteStatus = "active" | "used" | "revoked" | "expired";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: UserRole;
          room_id: string | null;
          full_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; role: UserRole };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          room_type: RoomType;
          base_price: number;
          num_occupants: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rooms"]["Row"]> & {
          name: string;
          room_type: RoomType;
          base_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Relationships: [];
      };
      billing_config: {
        Row: {
          room_id: string;
          electricity_rate: number;
          electricity_tax_percent: number;
          has_dual_meter: boolean;
          dual_meter_surcharge_percent: number;
          water_calc_type: WaterCalcType;
          water_rate: number;
          allow_tenant_meter_input: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["billing_config"]["Row"]> & {
          room_id: string;
          water_calc_type: WaterCalcType;
          water_rate: number;
        };
        Update: Partial<Database["public"]["Tables"]["billing_config"]["Row"]>;
        Relationships: [];
      };
      meter_readings: {
        Row: {
          id: string;
          room_id: string;
          month: string;
          meter_type: MeterType;
          old_index: number;
          new_index: number;
          recorded_by: RecordedBy;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["meter_readings"]["Row"]> & {
          room_id: string;
          month: string;
          meter_type: MeterType;
          old_index: number;
          new_index: number;
          recorded_by: RecordedBy;
        };
        Update: Partial<Database["public"]["Tables"]["meter_readings"]["Row"]>;
        Relationships: [];
      };
      water_readings: {
        Row: {
          id: string;
          room_id: string;
          month: string;
          old_index: number;
          new_index: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["water_readings"]["Row"]> & {
          room_id: string;
          month: string;
          old_index: number;
          new_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["water_readings"]["Row"]>;
        Relationships: [];
      };
      extra_fees: {
        Row: {
          id: string;
          room_id: string;
          month: string;
          fee_name: string;
          amount: number;
          note: string | null;
          status: ExtraFeeStatus;
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["extra_fees"]["Row"]> & {
          room_id: string;
          month: string;
          fee_name: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["extra_fees"]["Row"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          room_id: string;
          month: string;
          breakdown: unknown;
          total_amount: number;
          qr_url: string | null;
          status: InvoiceStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          room_id: string;
          month: string;
          breakdown: unknown;
          total_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [];
      };
      bank_info: {
        Row: {
          id: string;
          bank_code: string;
          account_no: string;
          account_name: string;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["bank_info"]["Row"]> & {
          bank_code: string;
          account_no: string;
          account_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_info"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          related_table: string | null;
          related_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: NotificationType;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      room_invites: {
        Row: {
          id: string;
          room_id: string;
          token: string;
          created_by: string | null;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["room_invites"]["Row"]> & {
          room_id: string;
          token: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_invites"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
