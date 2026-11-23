-- ========================================================
-- Script: Xóa toàn bộ dữ liệu bảng collection_items
-- Chạy script này trong Supabase Dashboard > SQL Editor
-- ========================================================

-- Cách 1: Chỉ xóa toàn bộ từ vựng trong collection_items
TRUNCATE TABLE public.collection_items CASCADE;

-- Cách 2 (Khuyên dùng nếu muốn làm sạch triệt để):
-- Xóa toàn bộ từ vựng, đồng thời reset đếm số từ trong collections và xóa review cũ

-- 1. Xóa toàn bộ từ vựng
-- TRUNCATE TABLE public.collection_items CASCADE;

-- 2. Đặt lại số lượng từ trong bảng collections về 0
-- UPDATE public.collections SET total_phrases = 0;

-- 3. Xóa lịch sử tiến độ ôn tập (reviews) cũ gắn với các từ vựng này
-- TRUNCATE TABLE public.collection_reviews CASCADE;
