-- ========================================================
-- Schema bảng Kết quả Kiểm tra Trình độ (placement_test_results)
-- SpeakUp Communication App - Placement Test
-- ========================================================

CREATE TABLE IF NOT EXISTS public.placement_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_level TEXT NOT NULL CHECK (overall_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    overall_score NUMERIC NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 30,
    percentage INTEGER NOT NULL DEFAULT 0,
    skill_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_collection_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE public.placement_test_results ENABLE ROW LEVEL SECURITY;

-- Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Users can view own placement results" ON public.placement_test_results;
DROP POLICY IF EXISTS "Users can insert own placement results" ON public.placement_test_results;
DROP POLICY IF EXISTS "Users can delete own placement results" ON public.placement_test_results;

-- 1. Người dùng chỉ xem được các bài test của chính mình
CREATE POLICY "Users can view own placement results"
    ON public.placement_test_results FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Người dùng chỉ được lưu kết quả test cho tài khoản của chính mình
CREATE POLICY "Users can insert own placement results"
    ON public.placement_test_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Cho phép xóa lịch sử test nếu muốn làm mới
CREATE POLICY "Users can delete own placement results"
    ON public.placement_test_results FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_placement_tests_user_date ON public.placement_test_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placement_tests_level ON public.placement_test_results(overall_level);

-- Báo cho PostgREST làm mới schema cache
NOTIFY pgrst, 'reload schema';
