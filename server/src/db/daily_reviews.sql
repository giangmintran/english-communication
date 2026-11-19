-- ========================================================
-- Bảng lưu tiến trình ôn tập 20 từ (60 câu) hàng ngày
-- SpeakUp Communication App - Daily Review Progress
-- ========================================================

CREATE TABLE IF NOT EXISTS public.daily_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    deck_id TEXT NOT NULL DEFAULT 'daily',
    word_ids JSONB DEFAULT '[]'::jsonb,
    current_index INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 60,
    answered_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    results JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_daily_review UNIQUE (user_id, review_date)
);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép xem tiến trình của chính mình
CREATE POLICY "Users can view own daily reviews"
    ON public.daily_reviews FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Cho phép tạo mới tiến trình của chính mình
CREATE POLICY "Users can insert own daily reviews"
    ON public.daily_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Cho phép cập nhật tiến trình của chính mình
CREATE POLICY "Users can update own daily reviews"
    ON public.daily_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Cho phép xóa tiến trình khi làm lại từ đầu
CREATE POLICY "Users can delete own daily reviews"
    ON public.daily_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Index tăng tốc truy vấn theo user_id và review_date
CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date ON public.daily_reviews (user_id, review_date);
