-- ========================================================
-- Schema & Row Level Security (RLS) cho Bảng Profiles
-- SpeakUp Communication App
-- ========================================================
-- Chạy script này trong Supabase SQL Editor để đảm bảo bảng profiles
-- được bảo vệ chặt chẽ và không ai có thể can thiệp dữ liệu người khác.

-- 1. Tạo bảng profiles (nếu chưa tồn tại)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    streak_count INTEGER DEFAULT 1,
    daily_goal_words INTEGER DEFAULT 10,
    current_level TEXT DEFAULT 'A2',
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Kích hoạt Row Level Security (BẮT BUỘC để bảo mật)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Xóa các policy cũ nếu có để tránh xung đột
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 4. Policy: Ai cũng có thể xem thông tin cơ bản (phục vụ hiển thị leaderboard và avatar)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- 5. Policy: Người dùng chỉ được tạo profile mang ID của chính mình
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 6. Policy: Người dùng chỉ được sửa profile mang ID của chính mình
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 7. Index tăng tốc truy vấn cho bảng xếp hạng (Leaderboard)
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON public.profiles(streak_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_date);
