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
      action_notifications: {
        Row: {
          action_id: string
          created_at: string
          id: string
          is_read: boolean
          notify_date: string
          user_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          notify_date?: string
          user_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          notify_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_notifications_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "guanxin_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_draws: {
        Row: {
          compatibility_score: number | null
          cost: number
          created_at: string
          date: string
          draw_number: number
          id: string
          matched_user_id: string | null
          user_id: string
        }
        Insert: {
          compatibility_score?: number | null
          cost?: number
          created_at?: string
          date?: string
          draw_number: number
          id?: string
          matched_user_id?: string | null
          user_id: string
        }
        Update: {
          compatibility_score?: number | null
          cost?: number
          created_at?: string
          date?: string
          draw_number?: number
          id?: string
          matched_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          overall_comment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          overall_comment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          overall_comment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_habit_records: {
        Row: {
          completed: boolean
          created_at: string
          daily_entry_id: string
          habit_id: string
          id: string
          note: string | null
          score: number | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          daily_entry_id: string
          habit_id: string
          id?: string
          note?: string | null
          score?: number | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          daily_entry_id?: string
          habit_id?: string
          id?: string
          note?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_habit_records_daily_entry_id_fkey"
            columns: ["daily_entry_id"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_habit_records_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_matches: {
        Row: {
          compatibility_score: number
          created_at: string
          date: string
          id: string
          matched_user_id: string
          status: string
          user_id: string
        }
        Insert: {
          compatibility_score?: number
          created_at?: string
          date?: string
          id?: string
          matched_user_id: string
          status?: string
          user_id: string
        }
        Update: {
          compatibility_score?: number
          created_at?: string
          date?: string
          id?: string
          matched_user_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      declutter_actions: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string
          declutter_item_id: string | null
          id: string
          is_completed: boolean
          remind_at: string | null
          remind_days: number | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string
          declutter_item_id?: string | null
          id?: string
          is_completed?: boolean
          remind_at?: string | null
          remind_days?: number | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string
          declutter_item_id?: string | null
          id?: string
          is_completed?: boolean
          remind_at?: string | null
          remind_days?: number | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "declutter_actions_declutter_item_id_fkey"
            columns: ["declutter_item_id"]
            isOneToOne: false
            referencedRelation: "declutter_items"
            referencedColumns: ["id"]
          },
        ]
      }
      declutter_items: {
        Row: {
          category: string
          completed_at: string | null
          completion_reflection: string | null
          content: string
          created_at: string
          date: string
          id: string
          is_completed: boolean
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          completion_reflection?: string | null
          content: string
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          completion_reflection?: string | null
          content?: string
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_friends: {
        Row: {
          created_at: string
          favorited_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorited_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorited_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          habit_id: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          habit_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          habit_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_categories_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          category_id: string
          comment_count: number
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          like_count: number
          share_count: number
          source_id: string | null
          source_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          like_count?: number
          share_count?: number
          source_id?: string | null
          source_type?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          like_count?: number
          share_count?: number
          source_id?: string | null
          source_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_relationships: {
        Row: {
          chat_bg_color: string | null
          created_at: string
          friend_id: string
          id: string
          intimacy_score: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_bg_color?: string | null
          created_at?: string
          friend_id: string
          id?: string
          intimacy_score?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_bg_color?: string | null
          created_at?: string
          friend_id?: string
          id?: string
          intimacy_score?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      greetings: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean
          message: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean
          message?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean
          message?: string
          to_user_id?: string
        }
        Relationships: []
      }
      guanxin_actions: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string
          guanxin_entry_id: string | null
          id: string
          is_completed: boolean
          remind_at: string | null
          remind_days: number | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string
          guanxin_entry_id?: string | null
          id?: string
          is_completed?: boolean
          remind_at?: string | null
          remind_days?: number | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string
          guanxin_entry_id?: string | null
          id?: string
          is_completed?: boolean
          remind_at?: string | null
          remind_days?: number | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guanxin_actions_guanxin_entry_id_fkey"
            columns: ["guanxin_entry_id"]
            isOneToOne: false
            referencedRelation: "guanxin_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      guanxin_entries: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guanxin_leaves: {
        Row: {
          admin_note: string | null
          created_at: string
          date: string
          id: string
          reason: string | null
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          created_at: string
          default_order: number
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          default_order: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          default_order?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      interest_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      interest_tags: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "interest_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean
          to_user_id?: string
        }
        Relationships: []
      }
      mock_users: {
        Row: {
          created_at: string
          created_by: string | null
          handle: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          handle: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          handle?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_details: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          ideal_friend_type: string | null
          practice_goal: string | null
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          ideal_friend_type?: string | null
          practice_goal?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          ideal_friend_type?: string | null
          practice_goal?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          cost: number
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          stock: number | null
          type: string
        }
        Insert: {
          cost: number
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          stock?: number | null
          type?: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          stock?: number | null
          type?: string
        }
        Relationships: []
      }
      user_habits: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          is_enabled: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          is_enabled?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          is_enabled?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_habits_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_tag_id: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_tag_id: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_tag_id?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_tag_id_fkey"
            columns: ["interest_tag_id"]
            isOneToOne: false
            referencedRelation: "interest_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_items: {
        Row: {
          expires_at: string | null
          id: string
          purchased_at: string
          shop_item_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          purchased_at?: string
          shop_item_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          purchased_at?: string
          shop_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_keywords: {
        Row: {
          created_at: string
          id: string
          keyword: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          user_id?: string
        }
        Relationships: []
      }
      user_practice_preferences: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      admin_seed_mock_user: {
        Args: {
          _bio: string
          _habit_ids: string[]
          _handle: string
          _ideal_friend_type: string
          _keywords: string[]
          _practice_goal: string
          _region: string
        }
        Returns: string
      }
      award_energy_points: {
        Args: {
          _amount: number
          _description: string
          _source: string
          _user_id: string
        }
        Returns: undefined
      }
      calculate_compatibility: {
        Args: { _user_a: string; _user_b: string }
        Returns: number
      }
      complete_action: { Args: { _action_id: string }; Returns: Json }
      complete_declutter: {
        Args: { _item_id: string; _reflection?: string }
        Returns: Json
      }
      complete_declutter_action: { Args: { _action_id: string }; Returns: Json }
      get_draw_cost: { Args: { _draw_number: number }; Returns: number }
      get_my_conversations: {
        Args: never
        Returns: {
          last_at: string
          last_message: string
          partner_id: string
          partner_name: string
          unread_count: number
        }[]
      }
      get_my_notifications: { Args: never; Returns: Json }
      get_platform_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_forum_share: { Args: { _post_id: string }; Returns: undefined }
      perform_daily_draw: { Args: never; Returns: Json }
      send_greeting: {
        Args: { _message: string; _to_user: string }
        Returns: Json
      }
      spend_energy_points: {
        Args: {
          _amount: number
          _description: string
          _source: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
