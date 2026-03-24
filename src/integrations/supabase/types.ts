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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      after_sales: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string
          id: string
          priority: string
          resolution: string | null
          resolved_at: string | null
          sale_id: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description: string
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          sale_id?: string | null
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          sale_id?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "after_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "after_sales_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_compatibility_results: {
        Row: {
          compatible_machines: string[] | null
          id: string
          maintenance_tips: string | null
          material: string
          model_used: string | null
          part_id: string
          probable_function: string | null
          related_parts: string[] | null
          researched_at: string
          technical_description: string | null
          technical_specs: string[] | null
        }
        Insert: {
          compatible_machines?: string[] | null
          id?: string
          maintenance_tips?: string | null
          material: string
          model_used?: string | null
          part_id: string
          probable_function?: string | null
          related_parts?: string[] | null
          researched_at?: string
          technical_description?: string | null
          technical_specs?: string[] | null
        }
        Update: {
          compatible_machines?: string[] | null
          id?: string
          maintenance_tips?: string | null
          material?: string
          model_used?: string | null
          part_id?: string
          probable_function?: string | null
          related_parts?: string[] | null
          researched_at?: string
          technical_description?: string | null
          technical_specs?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_compatibility_results_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          cnpj_cpf: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          segment: string | null
          source: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj_cpf?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          segment?: string | null
          source?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj_cpf?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          segment?: string | null
          source?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      market_research: {
        Row: {
          availability: string | null
          created_at: string
          delivery_days: number | null
          distributor_name: string
          id: string
          notes: string | null
          part_id: string
          payment_terms: string | null
          price_found: number
          researched_at: string
          researched_by: string | null
          source_url: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string
          delivery_days?: number | null
          distributor_name: string
          id?: string
          notes?: string | null
          part_id: string
          payment_terms?: string | null
          price_found?: number
          researched_at?: string
          researched_by?: string | null
          source_url?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string
          delivery_days?: number | null
          distributor_name?: string
          id?: string
          notes?: string | null
          part_id?: string
          payment_terms?: string | null
          price_found?: number
          researched_at?: string
          researched_by?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_research_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          compatible_models: string[] | null
          created_at: string
          description: string
          estimated_price: number
          id: string
          is_caminhao_eletrico: boolean
          is_guindaste: boolean
          is_linha_amarela: boolean
          is_mineracao: boolean
          is_perfuratriz: boolean
          last_entry_time: string | null
          machine_model: string | null
          manufacturer: string | null
          material: string
          stock: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          compatible_models?: string[] | null
          created_at?: string
          description: string
          estimated_price?: number
          id?: string
          is_caminhao_eletrico?: boolean
          is_guindaste?: boolean
          is_linha_amarela?: boolean
          is_mineracao?: boolean
          is_perfuratriz?: boolean
          last_entry_time?: string | null
          machine_model?: string | null
          manufacturer?: string | null
          material: string
          stock?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          compatible_models?: string[] | null
          created_at?: string
          description?: string
          estimated_price?: number
          id?: string
          is_caminhao_eletrico?: boolean
          is_guindaste?: boolean
          is_linha_amarela?: boolean
          is_mineracao?: boolean
          is_perfuratriz?: boolean
          last_entry_time?: string | null
          machine_model?: string | null
          manufacturer?: string | null
          material?: string
          stock?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospection_campaigns: {
        Row: {
          converted: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          target_country: string
          target_segments: string[] | null
          target_states: string[] | null
          total_prospects: number | null
        }
        Insert: {
          converted?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          target_country?: string
          target_segments?: string[] | null
          target_states?: string[] | null
          total_prospects?: number | null
        }
        Update: {
          converted?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          target_country?: string
          target_segments?: string[] | null
          target_states?: string[] | null
          total_prospects?: number | null
        }
        Relationships: []
      }
      prospects: {
        Row: {
          ai_summary: string | null
          city: string | null
          cnpj_cpf: string | null
          company: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          matched_parts: string[] | null
          name: string
          notes: string | null
          phone: string | null
          score: number | null
          segment: string | null
          source: string
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          city?: string | null
          cnpj_cpf?: string | null
          company?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          matched_parts?: string[] | null
          name: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          segment?: string | null
          source?: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          city?: string | null
          cnpj_cpf?: string | null
          company?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          matched_parts?: string[] | null
          name?: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          segment?: string | null
          source?: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          part_id: string | null
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          part_id?: string | null
          quantity?: number
          sale_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          part_id?: string | null
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: string | null
          payment_terms: string | null
          sale_date: string
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          payment_terms?: string | null
          sale_date?: string
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          payment_terms?: string | null
          sale_date?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_import_items: {
        Row: {
          created_at: string
          description: string
          estimated_price: number | null
          id: string
          import_id: string
          is_caminhao_eletrico: boolean | null
          is_guindaste: boolean | null
          is_linha_amarela: boolean | null
          is_mineracao: boolean | null
          is_perfuratriz: boolean | null
          last_entry_time: string | null
          machine_model: string | null
          manufacturer: string | null
          material: string
          stock: number | null
          supplier: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          estimated_price?: number | null
          id?: string
          import_id: string
          is_caminhao_eletrico?: boolean | null
          is_guindaste?: boolean | null
          is_linha_amarela?: boolean | null
          is_mineracao?: boolean | null
          is_perfuratriz?: boolean | null
          last_entry_time?: string | null
          machine_model?: string | null
          manufacturer?: string | null
          material: string
          stock?: number | null
          supplier?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          estimated_price?: number | null
          id?: string
          import_id?: string
          is_caminhao_eletrico?: boolean | null
          is_guindaste?: boolean | null
          is_linha_amarela?: boolean | null
          is_mineracao?: boolean | null
          is_perfuratriz?: boolean | null
          last_entry_time?: string | null
          machine_model?: string | null
          manufacturer?: string | null
          material?: string
          stock?: number | null
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_import_items_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "stock_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_imports: {
        Row: {
          created_at: string
          file_name: string
          id: string
          imported_at: string
          source_label: string | null
          status: string
          total_rows: number | null
          total_stock: number | null
          total_value: number | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          imported_at?: string
          source_label?: string | null
          status?: string
          total_rows?: number | null
          total_stock?: number | null
          total_value?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          imported_at?: string
          source_label?: string | null
          status?: string
          total_rows?: number | null
          total_stock?: number | null
          total_value?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: { Args: never; Returns: Json }
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
