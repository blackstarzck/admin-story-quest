-- StoryQuest Admin CMS Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assets table (3D models, textures, etc.)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'environment', 'character', 'prop', 'general'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table (manuscripts and content)
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  manuscript TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters table (도서 챕터 관리)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  environment_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Placed Models table (3D 모델 배치)
-- 각 챕터의 환경(floor plan) 위에 배치된 캐릭터/소품 모델들
CREATE TABLE IF NOT EXISTS placed_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- 위치 (Position)
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  position_z FLOAT DEFAULT 0,
  -- 회전 (Rotation in radians)
  rotation_x FLOAT DEFAULT 0,
  rotation_y FLOAT DEFAULT 0,
  rotation_z FLOAT DEFAULT 0,
  -- 크기 (Scale)
  scale_x FLOAT DEFAULT 1,
  scale_y FLOAT DEFAULT 1,
  scale_z FLOAT DEFAULT 1,
  -- 트리거 설정
  trigger_radius FLOAT DEFAULT 2.0,
  animation_key TEXT DEFAULT 'Idle',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy: Trigger Zones table (기존 호환성 유지 - 추후 마이그레이션 후 제거)
CREATE TABLE IF NOT EXISTS trigger_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- 3D 공간 좌표 및 크기
  position JSONB DEFAULT '[0, 0, 0]',
  size JSONB DEFAULT '[2, 2, 2]',
  -- 트리거 설정
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  animation_key TEXT NOT NULL DEFAULT 'Idle',
  -- 공간 내 텍스트 설정
  display_text TEXT DEFAULT '',
  text_position JSONB DEFAULT '[0, 1, 0]',
  -- 카메라 설정
  camera_config JSONB DEFAULT '{"position": [0, 2, 5], "target": [0, 0, 0], "fov": 75}',
  -- 트리거 조건
  trigger_type TEXT NOT NULL DEFAULT 'enter', -- 'enter', 'click', 'proximity'
  trigger_radius FLOAT DEFAULT 1.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy: Scenes table (interaction mappings) - 기존 유지
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  trigger_text TEXT NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  animation_key TEXT NOT NULL DEFAULT 'Idle',
  camera_config JSONB DEFAULT '{"position": [0, 2, 5], "target": [0, 0, 0], "fov": 75}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scenes_book_id ON scenes(book_id);
CREATE INDEX IF NOT EXISTS idx_scenes_asset_id ON scenes(asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_environment ON chapters(environment_asset_id);
CREATE INDEX IF NOT EXISTS idx_trigger_zones_chapter_id ON trigger_zones(chapter_id);
CREATE INDEX IF NOT EXISTS idx_placed_models_chapter_id ON placed_models(chapter_id);
CREATE INDEX IF NOT EXISTS idx_placed_models_asset_id ON placed_models(asset_id);

-- Enable Row Level Security (RLS) - but allow all operations for prototype
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE placed_models ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for prototype (no auth required)
DROP POLICY IF EXISTS "Allow all operations on assets" ON assets;
DROP POLICY IF EXISTS "Allow all operations on books" ON books;
DROP POLICY IF EXISTS "Allow all operations on scenes" ON scenes;
DROP POLICY IF EXISTS "Allow all operations on chapters" ON chapters;
DROP POLICY IF EXISTS "Allow all operations on trigger_zones" ON trigger_zones;
DROP POLICY IF EXISTS "Allow all operations on placed_models" ON placed_models;

CREATE POLICY "Allow all operations on assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on books" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on scenes" ON scenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chapters" ON chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trigger_zones" ON trigger_zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on placed_models" ON placed_models FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for 3D assets (run only once)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'assets');
CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets');
CREATE POLICY "Allow updates" ON storage.objects FOR UPDATE USING (bucket_id = 'assets');
CREATE POLICY "Allow deletes" ON storage.objects FOR DELETE USING (bucket_id = 'assets');

-- Delete sample data (run this to clean up old samples)
DELETE FROM assets WHERE storage_url LIKE '/sample/%';

-- Migration: Add environment_asset_id to existing chapters table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'environment_asset_id'
  ) THEN
    ALTER TABLE chapters ADD COLUMN environment_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
  END IF;
END $$;
