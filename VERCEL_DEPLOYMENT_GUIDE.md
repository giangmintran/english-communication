# Hướng dẫn Deploy SpeakUp lên Vercel & Kết nối Supabase

Ứng dụng **SpeakUp** đã được thiết lập sẵn sàng tối đa cho môi trường serverless và edge của Vercel. Dưới đây là 3 bước đơn giản để đưa website lên online 24/7.

---

## Bước 1: Khởi tạo Cơ sở dữ liệu Supabase (Miễn phí 100%)

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập (hoặc tạo tài khoản miễn phí).
2. Nhấn nút **New Project**, đặt tên dự án (ví dụ: `speakup-english`), chọn mật khẩu Database và chọn khu vực (Region) gần Việt Nam như **Singapore (ap-southeast-1)**.
3. Chờ 1-2 phút để Supabase tạo Database xong.
4. Mở tab **SQL Editor** ở thanh menu bên trái:
   - Nhấn **New Query**.
   - Mở file `supabase/schema.sql` trong dự án này, copy toàn bộ nội dung và dán vào SQL Editor.
   - Nhấn nút **Run** (chạy script).
   - *Kết quả:* Tất cả các bảng `profiles`, `decks`, `items`, `reviews`, `daily_logs`, cấu hình bảo mật RLS và 5 chủ đề dữ liệu mẫu đã được nạp tự động vào Supabase.
5. Lấy API Keys:
   - Vào mục **Project Settings** (biểu tượng bánh răng) -> Chọn **API**.
   - Copy 2 giá trị:
     - **Project URL** (dạng `https://xyzcompany.supabase.co`)
     - **anon / public key** (chuỗi ký tự dài)

---

## Bước 2: Đẩy mã nguồn lên GitHub

Mở terminal tại thư mục dự án và chạy:
```bash
git add .
git commit -m "feat: complete SpeakUp app with Supabase and Vercel ready"
git branch -M main
git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO.git
git push -u origin main
```

---

## Bước 3: Deploy lên Vercel (1-Click)

1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Nhấn nút **Add New...** -> chọn **Project**.
3. Chọn Repository `english-communication` (hoặc tên bạn đã đặt) và nhấn **Import**.
4. Tại mục **Environment Variables**, thêm 2 biến môi trường lấy từ Bước 1:
   - `NEXT_PUBLIC_SUPABASE_URL` = `<Project URL của bạn>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<anon key của bạn>`
5. Nhấn nút **Deploy**.
6. Vercel sẽ tự động build Next.js 15 trong khoảng 1 phút và cấp cho bạn một domain trực tiếp (ví dụ: `speakup-english.vercel.app`)!

---

## Chạy thử cục bộ trên máy tính (Local Development)

```bash
# Cài đặt thư viện (nếu chưa có)
yarn install

# Chạy server phát triển
yarn dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000) để trải nghiệm ngay.
