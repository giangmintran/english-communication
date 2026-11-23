-- ========================================================
-- Schema bảng dữ liệu gốc cho Bộ sưu tập (Collections & Collection Items)
-- SpeakUp Communication App
-- ========================================================

-- 1. BẢNG DANH MỤC BỘ SƯU TẬP (Collections)
CREATE TABLE IF NOT EXISTS public.collections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    icon_name TEXT DEFAULT 'BookOpen',
    image_url TEXT,
    total_phrases INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt RLS cho collections (Ai cũng có thể xem danh mục công khai)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view collections"
    ON public.collections FOR SELECT
    USING (true);


-- 2. BẢNG CHI TIẾT TỪ VỰNG / CÂU TRONG BỘ SƯU TẬP (Collection Items)
-- Hỗ trợ phân đoạn Thematic Sprint (Ngày 1, 2, 3 trong chu kỳ chuyên đề)
CREATE TABLE IF NOT EXISTS public.collection_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    collection_id TEXT NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'word', -- 'word', 'phrase', 'collocation', 'sentence'
    english_text TEXT NOT NULL,
    phonetic_ipa TEXT,
    vietnamese_meaning TEXT NOT NULL,
    example_sentence TEXT,
    example_meaning TEXT,
    difficulty_level TEXT DEFAULT 'A2', -- 'A1', 'A2', 'B1', 'B2', 'C1'
    audio_url TEXT,
    sprint_day INTEGER DEFAULT 1 CHECK (sprint_day BETWEEN 1 AND 3), -- Ngày 1 (Nền tảng), Ngày 2 (Tương tác), Ngày 3 (Xử lý tình huống)
    order_index INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb, -- Dữ liệu phong phú: part_of_speech, collocations, usage_note, synonyms, more_examples
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt RLS cho collection_items (Ai cũng có thể xem từ vựng công khai)
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view collection_items"
    ON public.collection_items FOR SELECT
    USING (true);

-- Index tối ưu tìm kiếm theo collection_id và sprint_day
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_sprint ON public.collection_items(collection_id, sprint_day);
CREATE INDEX IF NOT EXISTS idx_collection_items_order ON public.collection_items(collection_id, order_index);
CREATE INDEX IF NOT EXISTS idx_collection_items_english ON public.collection_items(english_text);
