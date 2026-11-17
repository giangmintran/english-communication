Checklist nhanh trước khi lên production
[ ] Mọi bảng đã bật RLS, có policy đủ 4 thao tác, đã test chéo giữa 2 user
[ ] service_role key không xuất hiện trong bundle client hay repo
[ ] Server dùng getUser(), mọi Server Action đều kiểm tra auth và validate input
[ ] Next.js đã cập nhật bản vá mới nhất
[ ] SM-2 tính ở server, DB có CHECK constraint
[ ] Đã cấu hình security header, rate limit, CAPTCHA
[ ] Redirect URL của OAuth chỉ gồm domain cần thiết
[ ] Preview deployment được bảo vệ, có 2FA cho các tài khoản quản trị