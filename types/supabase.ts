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
    }
  }
}