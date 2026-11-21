-- ========================================================
-- Bảng lưu tiến trình học theo Bộ sưu tập (Collection Progress / Reviews)
-- ĐỘC LẬP HOÀN TOÀN với bảng decks và items của Daily Lesson
-- SpeakUp Communication App
-- ========================================================

CREATE TABLE IF NOT EXISTS public.collection_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL,
    phrase_id TEXT NOT NULL,
    repetitions INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 1,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_quality INTEGER NOT NULL DEFAULT 0,
    is_mastered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_collection_phrase UNIQUE (user_id, collection_id, phrase_id)
);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE public.collection_reviews ENABLE ROW LEVEL SECURITY;

-- Đảm bảo tương thích nếu có truy vấn theo item_id
ALTER TABLE public.collection_reviews ADD COLUMN IF NOT EXISTS item_id TEXT;

-- Xóa policy cũ nếu có để tránh lỗi khi chạy lại
DROP POLICY IF EXISTS "Users can view own collection reviews" ON public.collection_reviews;
DROP POLICY IF EXISTS "Users can insert own collection reviews" ON public.collection_reviews;
DROP POLICY IF EXISTS "Users can update own collection reviews" ON public.collection_reviews;
DROP POLICY IF EXISTS "Users can delete own collection reviews" ON public.collection_reviews;

-- 1. Cho phép xem tiến độ collection của chính mình
CREATE POLICY "Users can view own collection reviews"
    ON public.collection_reviews FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Cho phép thêm tiến độ collection của chính mình
CREATE POLICY "Users can insert own collection reviews"
    ON public.collection_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Cho phép cập nhật tiến độ collection của chính mình
CREATE POLICY "Users can update own collection reviews"
    ON public.collection_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Cho phép xóa tiến độ collection của chính mình
CREATE POLICY "Users can delete own collection reviews"
    ON public.collection_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Index tăng tốc truy vấn theo user_id và collection_id
CREATE INDEX IF NOT EXISTS idx_collection_reviews_user_col ON public.collection_reviews (user_id, collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_reviews_phrase ON public.collection_reviews (phrase_id);
