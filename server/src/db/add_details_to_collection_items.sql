-- ========================================================
-- Migration: Bổ sung cột `details` kiểu JSONB cho `collection_items`
-- Cho phép lưu trữ phong phú: collocations, usage notes, synonyms, ví dụ mở rộng
-- ========================================================

-- 1. Thêm cột details vào bảng collection_items
ALTER TABLE public.collection_items 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Index GIN để tối ưu hóa truy vấn tìm kiếm dữ liệu JSONB (nếu cần tra cứu theo collocations / synonyms)
CREATE INDEX IF NOT EXISTS idx_collection_items_details ON public.collection_items USING gin (details);

-- ========================================================
-- 2. Dữ liệu mẫu minh họa: Cập nhật chi tiết cho từ "rollout"
-- ========================================================
UPDATE public.collection_items
SET details = '{
  "part_of_speech": "noun",
  "usage_note": "Thường dùng trong môi trường doanh nghiệp khi triển khai diện rộng một tính năng, dịch vụ hoặc quy trình mới.",
  "collocations": [
    "global rollout",
    "smooth rollout",
    "phased rollout",
    "product rollout"
  ],
  "synonyms": [
    "launch",
    "implementation",
    "deployment"
  ],
  "more_examples": [
    {
      "en": "The rollout of the new software is scheduled for next Monday.",
      "vi": "Việc triển khai phần mềm mới dự kiến diễn ra vào thứ Hai tới."
    },
    {
      "en": "We had a few minor issues during the initial rollout.",
      "vi": "Chúng tôi đã gặp vài trục trặc nhỏ trong đợt triển khai ban đầu."
    }
  ]
}'::jsonb
WHERE lower(english_text) = 'rollout';
