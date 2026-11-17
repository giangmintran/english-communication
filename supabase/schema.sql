-- =========================================================================
-- SPEAKUP ENGLISH - SUPABASE FULL-STACK DATABASE SCHEMA
-- Chạy script này trên Supabase SQL Editor để khởi tạo toàn bộ Database
-- =========================================================================

-- 1. Kích hoạt extension hỗ trợ sinh UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Bảng Hồ sơ người dùng (PROFILES) liên kết với auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Learner',
    avatar_url TEXT,
    streak_count INTEGER DEFAULT 1,
    last_active_date DATE DEFAULT CURRENT_DATE,
    daily_goal_words INTEGER DEFAULT 10,
    current_level TEXT DEFAULT 'A2',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Bộ thẻ chủ đề (DECKS)
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    icon_name TEXT DEFAULT 'BookOpen',
    image_url TEXT,
    total_words INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Từ vựng & Mẫu câu (ITEMS)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('word', 'collocation', 'phrase', 'sentence')),
    english_text TEXT NOT NULL,
    phonetic_ipa TEXT,
    vietnamese_meaning TEXT NOT NULL,
    example_sentence TEXT,
    example_meaning TEXT,
    audio_url TEXT,
    difficulty_level TEXT DEFAULT 'A2' CHECK (difficulty_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Tiến độ Lặp lại ngắt quãng SM-2 (REVIEWS)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    repetitions INTEGER DEFAULT 0,
    interval_days REAL DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    last_quality INTEGER DEFAULT 0,
    UNIQUE(user_id, item_id)
);

-- 6. Bảng Nhật ký học tập hàng ngày (DAILY_LOGS)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE DEFAULT CURRENT_DATE,
    words_learned INTEGER DEFAULT 0,
    speaking_minutes INTEGER DEFAULT 0,
    goal_reached BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, log_date)
);

-- =========================================================================
-- BẢO MẬT & ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Cho phép mọi người (kể cả khách anon) đọc danh sách decks & items
CREATE POLICY "Public decks are viewable by everyone" ON public.decks FOR SELECT USING (true);
CREATE POLICY "Public items are viewable by everyone" ON public.items FOR SELECT USING (true);

-- User chỉ xem, thêm và sửa profile của chính mình
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User chỉ xem và quản lý review của chính mình
CREATE POLICY "Users can view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- User chỉ quản lý daily logs của mình
CREATE POLICY "Users can view own daily logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update own daily logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);

-- =========================================================================
-- TRIGGER TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ USER MỚI
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Learner'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- DỮ LIỆU MẪU (SEED DATA) CHO 5 CHỦ ĐỀ CHUẨN MOCKUP
-- =========================================================================
INSERT INTO public.decks (id, title, slug, description, category, icon_name, image_url, total_words, order_index)
VALUES 
    ('a0000001-0000-0000-0000-000000000001', 'Restaurant', 'restaurant', 'Order, ask, and enjoy!', 'Daily Life', 'Utensils', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80', 120, 1),
    ('a0000001-0000-0000-0000-000000000002', 'Travel', 'travel', 'Explore the world', 'Travel', 'Plane', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80', 140, 2),
    ('a0000001-0000-0000-0000-000000000003', 'Shopping', 'shopping', 'Shop with confidence', 'Daily Life', 'ShoppingBag', 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80', 110, 3),
    ('a0000001-0000-0000-0000-000000000004', 'Workplace', 'workplace', 'Speak like a pro', 'Business', 'Briefcase', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', 130, 4),
    ('a0000001-0000-0000-0000-000000000005', 'Daily Conversations', 'daily-conversations', 'Talk about everyday life', 'Social', 'MessageSquare', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', 100, 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed mẫu câu cho Restaurant
INSERT INTO public.items (deck_id, type, english_text, phonetic_ipa, vietnamese_meaning, example_sentence, example_meaning, difficulty_level)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'phrase', 'Could we have a table for two, please?', '/kʊd wiː hæv ə ˈteɪbl fɔː tuː pliːz/', 'Cho chúng tôi xin bàn 2 người được không?', 'Excuse me, could we have a table for two by the window, please?', 'Xin lỗi, cho chúng tôi bàn 2 người cạnh cửa sổ được không?', 'A2'),
    ('a0000001-0000-0000-0000-000000000001', 'collocation', 'What do you recommend?', '/wɒt duː juː ˌrekəˈmend/', 'Bạn gợi ý món nào ngon / đặc trưng ở đây?', 'It is my first time here, what do you recommend?', 'Đây là lần đầu tôi đến đây, bạn gợi ý món gì ngon?', 'A2'),
    ('a0000001-0000-0000-0000-000000000001', 'phrase', 'Could I get the check, please?', '/kʊd aɪ ɡet ðə tʃek pliːz/', 'Làm ơn cho tôi xin hóa đơn thanh toán.', 'We are ready to leave, could I get the check, please?', 'Chúng tôi xong rồi, làm ơn cho xin hóa đơn tính tiền nhé.', 'A2'),
    ('a0000001-0000-0000-0000-000000000001', 'collocation', 'I am allergic to peanuts', '/aɪ æm əˈlɜːdʒɪk tuː ˈpiːnʌts/', 'Tôi bị dị ứng với đậu phộng.', 'Does this dish contain nuts? I am allergic to peanuts.', 'Món này có đậu phộng không? Tôi bị dị ứng lạc.', 'B1'),
    ('a0000001-0000-0000-0000-000000000001', 'phrase', 'Can we split the bill?', '/kæn wiː splɪt ðə bɪl/', 'Chúng tôi có thể chia đôi tiền hóa đơn không?', 'Is it possible for us to split the bill between three cards?', 'Có thể chia hóa đơn thanh toán qua ba thẻ khác nhau không?', 'A2');

-- Seed mẫu câu cho Travel
INSERT INTO public.items (deck_id, type, english_text, phonetic_ipa, vietnamese_meaning, example_sentence, example_meaning, difficulty_level)
VALUES
    ('a0000001-0000-0000-0000-000000000002', 'phrase', 'Where is the baggage claim area?', '/weər ɪz ðə ˈbæɡɪdʒ kleɪm ˈeəriə/', 'Khu vực nhận hành lý ở đâu vậy?', 'Excuse me, I just landed on flight VN123, where is the baggage claim area?', 'Xin lỗi, tôi vừa đáp chuyến bay VN123, khu nhận hành lý ở đâu vậy?', 'A2'),
    ('a0000001-0000-0000-0000-000000000002', 'phrase', 'I would like to check in for my flight', '/aɪ wʊd laɪk tuː tʃek ɪn fɔː maɪ flaɪt/', 'Tôi muốn làm thủ tục lên máy bay', 'Good morning, I would like to check in for my flight to London.', 'Chào buổi sáng, tôi muốn làm thủ tục cho chuyến bay đi Luân Đôn.', 'A2'),
    ('a0000001-0000-0000-0000-000000000002', 'collocation', 'Boarding pass', '/ˈbɔːdɪŋ pɑːs/', 'Thẻ lên máy bay', 'Please have your passport and boarding pass ready.', 'Vui lòng chuẩn bị sẵn hộ chiếu và thẻ lên máy bay.', 'A2'),
    ('a0000001-0000-0000-0000-000000000002', 'phrase', 'How much is the fare to downtown?', '/haʊ mʌtʃ ɪz ðə feər tuː ˈdaʊntaʊn/', 'Giá vé vào trung tâm thành phố là bao nhiêu?', 'Hi driver, how much is the taxi fare to downtown?', 'Chào bác tài, giá taxi vào trung tâm là bao nhiêu?', 'A2');
