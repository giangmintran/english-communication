-- ========================================================
-- Script Xóa Bỏ Bảng Cũ: decks, items, reviews
-- SpeakUp Communication App
-- ========================================================
-- Chạy script này trong Supabase SQL Editor để xóa sạch hệ thống flashcard cũ.

-- 1. Xóa bảng reviews cũ (tiến trình học flashcard cũ của items)
DROP TABLE IF EXISTS public.reviews CASCADE;

-- 2. Xóa bảng items cũ
DROP TABLE IF EXISTS public.items CASCADE;

-- 3. Xóa bảng decks cũ
DROP TABLE IF EXISTS public.decks CASCADE;

-- 4. Xác nhận danh sách các bảng chuẩn còn lại
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
