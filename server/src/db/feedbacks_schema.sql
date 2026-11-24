-- ========================================================
-- Schema bảng Feedback & Góp ý người dùng (feedbacks)
-- SpeakUp Communication App
-- ========================================================

CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'content', 'general')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT NOT NULL,
    page_url TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Bất kỳ ai (đã đăng nhập hoặc khách) đều có thể gửi feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedbacks;
CREATE POLICY "Anyone can insert feedback"
    ON public.feedbacks FOR INSERT
    WITH CHECK (true);

-- 2. Người dùng chỉ xem được các feedback do chính mình gửi
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedbacks;
CREATE POLICY "Users can view their own feedback"
    ON public.feedbacks FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Indexes tối ưu tìm kiếm và sắp xếp
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_category ON public.feedbacks(category);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

-- 4. Báo cho PostgREST làm mới schema cache ngay lập tức
NOTIFY pgrst, 'reload schema';
