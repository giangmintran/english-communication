-- ========================================================
-- Schema bảng Feedback & Góp ý người dùng (feedbacks)
-- SpeakUp Communication App - Hardened Security Version
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

-- Kích hoạt Row Level Security (RLS) bắt buộc
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Thu hồi toàn bộ quyền cũ để đảm bảo trạng thái sạch
REVOKE ALL ON public.feedbacks FROM anon, authenticated;

-- 2. Cấp quyền theo nguyên tắc đặc quyền tối thiểu (Least Privilege)
-- Cấp quyền INSERT theo từng cột cụ thể (Column-Level Grants):
-- Không cấp quyền INSERT trên cột id, admin_notes, created_at, updated_at
GRANT INSERT (
    user_id,
    user_email,
    user_name,
    category,
    rating,
    title,
    content,
    page_url,
    device_info,
    screenshot_url,
    status
) ON public.feedbacks TO anon, authenticated;

-- Chỉ người dùng đã đăng nhập (authenticated) mới được đọc (SELECT)
GRANT SELECT ON public.feedbacks TO authenticated;

-- Service role có toàn quyền quản trị nội bộ
GRANT ALL ON public.feedbacks TO service_role;

-- 3. Xóa các policy cũ để tránh xung đột
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.feedbacks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.feedbacks;

-- 4. RLS Policy 1: Bất kỳ ai (khách vãng lai lẫn user) đều có thể gửi góp ý
-- RÀNG BUỘC BẢO MẬT CHẶT CHẼ NGAY TẠI TẦNG DATABASE:
-- - status bắt buộc phải là 'pending' (ngăn chặn việc tự duyệt feedback)
-- - admin_notes bắt buộc phải là NULL (ngăn chặn việc chèn ghi chú của admin)
-- - content phải từ 5 đến 3000 ký tự (chống spam chuỗi rỗng hoặc payload khổng lồ)
CREATE POLICY "Anyone can insert feedback"
    ON public.feedbacks FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (
        (status IS NULL OR status = 'pending')
        AND admin_notes IS NULL
        AND length(trim(content)) >= 5
        AND length(content) <= 3000
    );

-- 5. RLS Policy 2: Chỉ người dùng đã đăng nhập mới được xem feedback của chính mình
CREATE POLICY "Users can view their own feedback"
    ON public.feedbacks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Indexes tối ưu hiệu năng tìm kiếm và sắp xếp
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_category ON public.feedbacks(category);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

-- 7. Báo cho PostgREST làm mới schema cache ngay lập tức
NOTIFY pgrst, 'reload schema';
