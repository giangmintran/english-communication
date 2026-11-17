# Kế hoạch website ôn luyện tiếng Anh giao tiếp

## 1. Mục tiêu và đối tượng

- **Đối tượng:** người đi làm hoặc sinh viên trình độ A2-B2, cần nói và phản xạ nhanh hơn là học ngữ pháp hàn lâm.
- **Giá trị cốt lõi:**
  - Ôn đúng lúc sắp quên (lặp lại ngắt quãng).
  - Học từ và cấu trúc theo *tình huống thực tế*.
  - Mỗi ngày chỉ cần 10-15 phút. (Có thể điều chỉnh)

## 2. Tính năng chính

### 2.1. Ôn từ vựng

- Flashcard có phát âm, nghĩa, ví dụ, hình ảnh. Mỗi thẻ có nút "Nhớ / Mơ hồ / Quên".
- Thuật toán lặp lại ngắt quãng (SM-2 hoặc Leitner) quyết định thẻ nào hiện hôm nay.
- Bộ từ theo chủ đề (công sở, du lịch, ăn uống, mua sắm...) và theo cụm từ (collocations), không chỉ từ đơn lẻ.

### 2.2. Ôn cấu trúc giao tiếp

- Mẫu câu theo chức năng: xin phép, từ chối lịch sự, đề nghị, bày tỏ ý kiến, phàn nàn...
- Mỗi mẫu có: giải thích ngắn, ví dụ ở nhiều mức độ trang trọng, và lỗi thường gặp của người Việt.
- Hội thoại mẫu theo tình huống, kèm audio.

### 2.3. Dạng bài tập

- Trắc nghiệm và điền từ vào chỗ trống.
- Sắp xếp từ thành câu hoàn chỉnh.
- Nghe rồi chọn hoặc gõ lại câu.
- Hoàn thành hội thoại (chọn câu đáp phù hợp nhất).
- Dịch Việt → Anh theo ngữ cảnh.

### 2.4. Luyện nói

- Phát âm mẫu bằng Text-to-Speech.
- Ghi âm và so sánh (Web Speech API cho nhận diện giọng nói).

### 2.5. Động lực và theo dõi

- Streak, mục tiêu hằng ngày, huy hiệu.
- Thống kê: số từ đã thuộc, độ chính xác theo chủ đề, từ hay sai.
- Nhắc học qua email hoặc thông báo.

## 3. Trải nghiệm người dùng

| Màn hình | Nội dung |
|---|---|
| Trang chủ | Việc cần ôn hôm nay, streak, nút "Bắt đầu" |
| Thư viện | Duyệt theo chủ đề / cấp độ / loại (từ vựng, cấu trúc) |
| Phiên ôn tập | Thẻ hoặc bài tập, phản hồi tức thì |
| Tiến độ | Biểu đồ, danh sách từ yếu |
| Hồ sơ | Mục tiêu, trình độ, cài đặt nhắc nhở |

**Luồng chính:** vào → ôn thẻ đến hạn → làm bài củng cố → xem kết quả → học mục mới.

## 4. Mô hình dữ liệu (rút gọn)

- **User:** mục tiêu, trình độ, streak.
- **Item** (từ hoặc mẫu câu): nội dung, nghĩa, ví dụ, audio, chủ đề, cấp độ.
- **Deck:** nhóm item theo chủ đề.
- **Review:** user, item, thời điểm, kết quả, khoảng cách ôn lần sau.
- **Exercise:** loại bài, đề, đáp án, item liên quan.
- **Dialogue:** các lượt thoại, audio.

## 5. Công nghệ gợi ý

- **Frontend:** React hoặc Next.js + Tailwind, thiết kế ưu tiên di động.
- **Backend:** Node.js hoặc Supabase/Firebase (đăng nhập, cơ sở dữ liệu).
- **Âm thanh:** Web Speech API (TTS và nhận diện) ở giai đoạn đầu, sau đó có thể dùng dịch vụ TTS chất lượng cao hơn.
- **Triển khai:** Vercel hoặc Netlify.
- **Nội dung:** quản lý bằng file JSON/CSV hoặc trang quản trị đơn giản.

## 6. Lộ trình triển khai

### Giai đoạn 1: MVP (2-4 tuần)

Flashcard + lặp lại ngắt quãng, 3-5 chủ đề mẫu (~200 mục), quiz trắc nghiệm và điền từ, lưu tiến độ cơ bản.

### Giai đoạn 2: Giao tiếp (3-4 tuần)

Thư viện mẫu câu, hội thoại mẫu có audio, bài sắp xếp câu và hoàn thành hội thoại, thống kê chi tiết.

### Giai đoạn 3: Luyện nói và động lực (3-4 tuần)

Ghi âm và chấm phát âm, huy hiệu, thông báo nhắc học, chia sẻ bộ thẻ.

### Giai đoạn 4: Mở rộng

Chatbot AI nhập vai theo tình huống và sửa lỗi câu, bộ thẻ do người dùng tự tạo, gói trả phí.

## 7. Chỉ số đo lường

- Tỷ lệ quay lại sau 7 ngày.
- Số phiên ôn mỗi tuần.
- Tỷ lệ nhớ đúng sau 7 và 30 ngày.
- Thời gian học trung bình mỗi ngày.

## 8. Rủi ro cần lưu ý

- **Nội dung là phần tốn công nhất.** Nên bắt đầu nhỏ nhưng chất lượng, ví dụ tự nhiên, đúng văn phong giao tiếp.
- **Bản quyền:** tự biên soạn hoặc dùng nguồn mở (như Tatoeba, CC-licensed).
- **Chấm phát âm** của trình duyệt chưa hoàn hảo, nên đặt là tính năng bổ trợ.

## 9. Bước tiếp theo

- Thiết kế chi tiết các màn hình.
- Soạn bộ nội dung mẫu cho một chủ đề.
- Dựng bản demo flashcard chạy được.
