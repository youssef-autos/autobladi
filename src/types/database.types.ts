export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType = "gratuit" | "pro" | "admin"
export type FuelType = "essence" | "diesel" | "hybrid" | "electric" | "lpg"
export type Transmission = "manuelle" | "automatique"
export type ConditionType = "neuf" | "occasion"
export type AnnonceStatus =
  | "draft"
  | "pending"
  | "active"
  | "sold"
  | "rejected"
  | "expired"
export type RequestStatus = "pending" | "approved" | "rejected"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          whatsapp: string | null
          avatar_url: string | null
          account_type: AccountType
          is_verified: boolean
          city: string | null
          newsletter_subscribed: boolean
          email_unsubscribe_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          account_type?: AccountType
          is_verified?: boolean
          city?: string | null
          newsletter_subscribed?: boolean
          email_unsubscribe_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          is_active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>
      }
      car_models: {
        Row: {
          id: string
          brand_id: string
          name: string
          slug: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          slug: string
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["car_models"]["Insert"]>
      }
      cities: {
        Row: {
          id: string
          name_ar: string
          name_fr: string
          slug: string
          region: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_fr: string
          slug: string
          region?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["cities"]["Insert"]>
      }
      secteurs: {
        Row: {
          id: string
          city_id: string
          name_ar: string
          name_fr: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          city_id: string
          name_ar: string
          name_fr: string
          slug: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["secteurs"]["Insert"]>
      }
      ad_events: {
        Row: {
          id: string
          ad_id: string
          event_type: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          ad_id: string
          event_type: string
          source?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ad_events"]["Insert"]>
      }
      annonces: {
        Row: {
          id: string
          user_id: string
          slug: string
          title: string
          description: string | null
          brand_id: string | null
          model_id: string | null
          city_id: string | null
          secteur_id: string | null
          year: number | null
          mileage: number | null
          price: number | null
          fuel_type: FuelType | null
          transmission: Transmission | null
          body_type: string | null
          color: string | null
          doors: number | null
          seats: number | null
          engine_power: number | null
          engine_size: string | null
          origine: string | null
          first_owner: boolean | null
          accident_free: boolean | null
          condition: ConditionType | null
          options: Json
          contact_phone: string | null
          contact_whatsapp: string | null
          video_url: string | null
          status: AnnonceStatus
          rejection_reason: string | null
          views_count: number
          featured: boolean
          featured_until: string | null
          expires_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug?: string
          title: string
          description?: string | null
          brand_id?: string | null
          model_id?: string | null
          city_id?: string | null
          secteur_id?: string | null
          year?: number | null
          mileage?: number | null
          price?: number | null
          fuel_type?: FuelType | null
          transmission?: Transmission | null
          body_type?: string | null
          color?: string | null
          doors?: number | null
          seats?: number | null
          engine_power?: number | null
          engine_size?: string | null
          origine?: string | null
          first_owner?: boolean | null
          accident_free?: boolean | null
          condition?: ConditionType | null
          options?: Json
          contact_phone?: string | null
          contact_whatsapp?: string | null
          video_url?: string | null
          status?: AnnonceStatus
          rejection_reason?: string | null
          views_count?: number
          featured?: boolean
          featured_until?: string | null
          expires_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["annonces"]["Insert"]>
      }
      annonce_images: {
        Row: {
          id: string
          annonce_id: string
          url: string
          thumbnail_url: string | null
          order_index: number
          is_main: boolean
          created_at: string
        }
        Insert: {
          id?: string
          annonce_id: string
          url: string
          thumbnail_url?: string | null
          order_index?: number
          is_main?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["annonce_images"]["Insert"]>
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          annonce_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          annonce_id: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>
      }
      conversations: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          annonce_id: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          annonce_id?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          annonce_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          annonce_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
      }
      professionnels: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_url: string | null
          address: string | null
          city_id: string | null
          secteur_id: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          website: string | null
          facebook: string | null
          instagram: string | null
          youtube: string | null
          tiktok: string | null
          linkedin: string | null
          opening_hours: Json | null
          rating: number
          reviews_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          address?: string | null
          city_id?: string | null
          secteur_id?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          website?: string | null
          facebook?: string | null
          instagram?: string | null
          youtube?: string | null
          tiktok?: string | null
          linkedin?: string | null
          opening_hours?: Json | null
          rating?: number
          reviews_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["professionnels"]["Insert"]>
      }
      professionnel_reviews: {
        Row: {
          id: string
          professionnel_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          professionnel_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["professionnel_reviews"]["Insert"]
        >
      }
      verification_requests: {
        Row: {
          id: string
          user_id: string
          company_name: string
          manager_name: string | null
          rc_number: string | null
          rc_document_url: string | null
          id_card_url: string | null
          professional_phone: string | null
          address: string | null
          status: RequestStatus
          rejection_reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          manager_name?: string | null
          rc_number?: string | null
          rc_document_url?: string | null
          id_card_url?: string | null
          professional_phone?: string | null
          address?: string | null
          status?: RequestStatus
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["verification_requests"]["Insert"]
        >
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          price: number
          original_price: number
          duration_days: number
          max_annonces: number
          features: Json
          features_ar: Json
          tagline: string | null
          tagline_ar: string | null
          is_popular: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ar?: string | null
          price: number
          original_price?: number
          duration_days: number
          max_annonces: number
          features?: Json
          features_ar?: Json
          tagline?: string | null
          tagline_ar?: string | null
          is_popular?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["subscription_plans"]["Insert"]
        >
      }
      subscription_requests: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          amount: number
          receipt_url: string | null
          status: RequestStatus
          bank_reference: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          starts_at: string | null
          ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          amount: number
          receipt_url?: string | null
          status?: RequestStatus
          bank_reference?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["subscription_requests"]["Insert"]
        >
      }
      estimations: {
        Row: {
          id: string
          user_id: string | null
          brand_id: string | null
          model_id: string | null
          year: number | null
          mileage: number | null
          condition: ConditionType | null
          city_id: string | null
          fuel_type: FuelType | null
          estimated_price_min: number | null
          estimated_price_max: number | null
          gemini_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          brand_id?: string | null
          model_id?: string | null
          year?: number | null
          mileage?: number | null
          condition?: ConditionType | null
          city_id?: string | null
          fuel_type?: FuelType | null
          estimated_price_min?: number | null
          estimated_price_max?: number | null
          gemini_response?: Json | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["estimations"]["Insert"]>
      }
      pages: {
        Row: {
          id: string
          slug: string
          title_fr: string
          title_ar: string
          content_fr: string | null
          content_ar: string | null
          is_published: boolean
          show_in_footer: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title_fr: string
          title_ar: string
          content_fr?: string | null
          content_ar?: string | null
          is_published?: boolean
          show_in_footer?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["pages"]["Insert"]>
      }
      blog_categories: {
        Row: {
          id: string
          name_ar: string
          name_fr: string
          slug: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_fr: string
          slug: string
          order_index?: number
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["blog_categories"]["Insert"]
        >
      }
      blog_posts: {
        Row: {
          id: string
          category_id: string | null
          author_id: string | null
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          title_fr: string | null
          excerpt_fr: string | null
          content_fr: string | null
          cover_image: string | null
          is_published: boolean
          published_at: string | null
          views_count: number
          tags: string[]
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          author_id?: string | null
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          title_fr?: string | null
          excerpt_fr?: string | null
          content_fr?: string | null
          cover_image?: string | null
          is_published?: boolean
          published_at?: string | null
          views_count?: number
          tags?: string[]
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>
      }
      blog_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_id: string | null
          content: string
          is_approved: boolean
          likes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_id?: string | null
          content: string
          is_approved?: boolean
          likes_count?: number
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["blog_comments"]["Insert"]>
      }
      reports: {
        Row: {
          id: string
          annonce_id: string
          reporter_id: string | null
          reason: string
          description: string | null
          status: RequestStatus
          created_at: string
        }
        Insert: {
          id?: string
          annonce_id: string
          reporter_id?: string | null
          reason: string
          description?: string | null
          status?: RequestStatus
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject?: string | null
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["contact_messages"]["Insert"]
        >
      }
      ad_placements: {
        Row: {
          id: string
          name: string
          slug: string
          width: number | null
          height: number | null
          width_mobile: number | null
          height_mobile: number | null
          description: string | null
          is_active: boolean
          device: "mobile" | "desktop" | "both"
          default_provider: "adsense" | "direct" | null
          adsense_slot_id: string | null
          lazy: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          width?: number | null
          height?: number | null
          width_mobile?: number | null
          height_mobile?: number | null
          description?: string | null
          is_active?: boolean
          device?: "mobile" | "desktop" | "both"
          default_provider?: "adsense" | "direct" | null
          adsense_slot_id?: string | null
          lazy?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ad_placements"]["Insert"]>
      }
      advertisements: {
        Row: {
          id: string
          placement_id: string
          title: string
          image_url: string
          link_url: string | null
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          clicks: number
          impressions: number
          created_at: string
        }
        Insert: {
          id?: string
          placement_id: string
          title: string
          image_url: string
          link_url?: string | null
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          clicks?: number
          impressions?: number
          created_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["advertisements"]["Insert"]
        >
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>
      }
      ai_settings: {
        Row: {
          id: boolean
          provider: string
          gemini_key: string
          openai_key: string
          openai_model: string
          qwen_key: string
          qwen_model: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          provider?: string
          gemini_key?: string
          openai_key?: string
          openai_model?: string
          qwen_key?: string
          qwen_model?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["ai_settings"]["Insert"]>
      }
      app_secrets: {
        Row: {
          id: boolean
          resend_key: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          resend_key?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["app_secrets"]["Insert"]>
      }
      social_login_settings: {
        Row: {
          provider: string
          enabled: boolean
          client_id: string
          secret: string
          redirect_url: string
          updated_at: string
        }
        Insert: {
          provider: string
          enabled?: boolean
          client_id?: string
          secret?: string
          redirect_url?: string
          updated_at?: string
        }
        Update: Partial<
          Database["public"]["Tables"]["social_login_settings"]["Insert"]
        >
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      slugify: { Args: { value: string }; Returns: string }
      increment_ad_click: { Args: { p_ad_id: string }; Returns: void }
      increment_ad_impression: { Args: { p_ad_id: string }; Returns: void }
      increment_blog_view: { Args: { p_post_id: string }; Returns: void }
      expire_annonces: { Args: Record<string, never>; Returns: number }
    }
    Enums: {
      account_type: AccountType
      fuel_type: FuelType
      transmission_type: Transmission
      condition_type: ConditionType
      annonce_status: AnnonceStatus
      request_status: RequestStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
