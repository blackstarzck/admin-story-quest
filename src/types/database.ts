export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AssetMetadata {
  scale?: number
  rotation?: [number, number, number]
  position?: [number, number, number]
}

export interface CameraConfig {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}

export interface Asset {
  id: string
  name: string
  storage_url: string
  category: string // 'environment' | 'character' | 'prop' | 'general'
  metadata: AssetMetadata
  created_at: string
}

export interface Book {
  id: string
  title: string
  manuscript: string
  author: string
  created_at: string
  // Optional: Chapter status for UI
  chapter_status?: {
    total: number
    completed: number // chapters with at least 1 model
  }
}

export interface Scene {
  id: string
  book_id: string
  trigger_text: string
  asset_id: string
  animation_key: string
  camera_config: CameraConfig
  created_at: string
}

export interface Chapter {
  id: string
  book_id: string
  title: string
  order_index: number
  content: string
  environment_asset_id: string | null
  created_at: string
  // Joined data
  environment_asset?: Asset
  placed_models_count?: number
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export type TriggerType = 'enter' | 'click' | 'proximity'

// Legacy: TriggerZone (for backwards compatibility)
export interface TriggerZone {
  id: string
  chapter_id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
  asset_id: string | null
  animation_key: string
  display_text: string
  text_position: [number, number, number]
  camera_config: CameraConfig
  trigger_type: TriggerType
  trigger_radius: number
  is_active: boolean
  created_at: string
}

// New: PlacedModel - 챕터 환경에 배치된 3D 모델
export interface PlacedModel {
  id: string
  chapter_id: string
  asset_id: string
  name: string
  // Position
  position_x: number
  position_y: number
  position_z: number
  // Rotation (radians)
  rotation_x: number
  rotation_y: number
  rotation_z: number
  // Scale
  scale_x: number
  scale_y: number
  scale_z: number
  // Trigger settings
  trigger_radius: number
  animation_key: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Joined data
  asset?: Asset
}

// Helper type for creating new placed models
export type PlacedModelCreate = Omit<PlacedModel, 'id' | 'created_at' | 'updated_at' | 'asset'>

// Helper type for updating placed models
export type PlacedModelUpdate = Partial<Omit<PlacedModel, 'id' | 'chapter_id' | 'created_at' | 'updated_at' | 'asset'>>

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string
          name: string
          storage_url: string
          category: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          storage_url: string
          category: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          storage_url?: string
          category?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          title: string
          manuscript: string
          author: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          manuscript?: string
          author?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          manuscript?: string
          author?: string
          created_at?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          id: string
          book_id: string
          trigger_text: string
          asset_id: string
          animation_key: string
          camera_config: Json
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          trigger_text: string
          asset_id: string
          animation_key?: string
          camera_config?: Json
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          trigger_text?: string
          asset_id?: string
          animation_key?: string
          camera_config?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          }
        ]
      }
      chapters: {
        Row: {
          id: string
          book_id: string
          title: string
          order_index: number
          content: string
          environment_asset_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          title: string
          order_index?: number
          content?: string
          environment_asset_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          title?: string
          order_index?: number
          content?: string
          environment_asset_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_environment_asset_id_fkey"
            columns: ["environment_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          }
        ]
      }
      trigger_zones: {
        Row: {
          id: string
          chapter_id: string
          name: string
          position: Json
          size: Json
          asset_id: string | null
          animation_key: string
          display_text: string
          text_position: Json
          camera_config: Json
          trigger_type: string
          trigger_radius: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          name: string
          position?: Json
          size?: Json
          asset_id?: string | null
          animation_key?: string
          display_text?: string
          text_position?: Json
          camera_config?: Json
          trigger_type?: string
          trigger_radius?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          name?: string
          position?: Json
          size?: Json
          asset_id?: string | null
          animation_key?: string
          display_text?: string
          text_position?: Json
          camera_config?: Json
          trigger_type?: string
          trigger_radius?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trigger_zones_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trigger_zones_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          }
        ]
      }
      placed_models: {
        Row: {
          id: string
          chapter_id: string
          asset_id: string
          name: string
          position_x: number
          position_y: number
          position_z: number
          rotation_x: number
          rotation_y: number
          rotation_z: number
          scale_x: number
          scale_y: number
          scale_z: number
          trigger_radius: number
          animation_key: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          asset_id: string
          name: string
          position_x?: number
          position_y?: number
          position_z?: number
          rotation_x?: number
          rotation_y?: number
          rotation_z?: number
          scale_x?: number
          scale_y?: number
          scale_z?: number
          trigger_radius?: number
          animation_key?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          asset_id?: string
          name?: string
          position_x?: number
          position_y?: number
          position_z?: number
          rotation_x?: number
          rotation_y?: number
          rotation_z?: number
          scale_x?: number
          scale_y?: number
          scale_z?: number
          trigger_radius?: number
          animation_key?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placed_models_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placed_models_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          }
        ]
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
