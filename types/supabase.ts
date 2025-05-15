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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          inventory_count: number
          category_id: string
          created_at: string
          updated_at: string
          slug: string
          featured: boolean
          discount_percent: number | null
          is_on_sale: boolean
          sale_start_date: string | null
          sale_end_date: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image_url: string
          inventory_count: number
          category_id: string
          created_at?: string
          updated_at?: string
          slug: string
          featured?: boolean
          discount_percent?: number | null
          is_on_sale?: boolean
          sale_start_date?: string | null
          sale_end_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          inventory_count?: number
          category_id?: string
          created_at?: string
          updated_at?: string
          slug?: string
          featured?: boolean
          discount_percent?: number | null
          is_on_sale?: boolean
          sale_start_date?: string | null
          sale_end_date?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total: number
          created_at: string
          updated_at: string
          address: string
          city: string
          state: string
          postal_code: string
          country: string
          payment_id?: string
          order_id?: string
          coupon_id?: string
          discount_amount?: number
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          total: number
          created_at?: string
          updated_at?: string
          address: string
          city: string
          state: string
          postal_code: string
          country: string
          payment_id?: string
          order_id?: string
          coupon_id?: string
          discount_amount?: number
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          total?: number
          created_at?: string
          updated_at?: string
          address?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
          payment_id?: string
          order_id?: string
          coupon_id?: string
          discount_amount?: number
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          address: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: string
          discount_value: number
          min_order_amount: number
          expiry_date: string | null
          is_active: boolean
          usage_limit: number | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: string
          discount_value: number
          min_order_amount?: number
          expiry_date?: string | null
          is_active?: boolean
          usage_limit?: number | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: string
          discount_value?: number
          min_order_amount?: number
          expiry_date?: string | null
          is_active?: boolean
          usage_limit?: number | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      coupon_usage: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          used_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id: string
          order_id: string
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string
          order_id?: string
          used_at?: string
        }
      }
    }
  }
}