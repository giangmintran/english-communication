# SpeakUp English (Monorepo)

Dự án luyện tập tiếng Anh giao tiếp và phản xạ từ vựng với mô hình Monorepo:
* **Frontend (`/client`):** React 19 + Vite 6 + TypeScript + Tailwind CSS + React Router 7 + Lucide Icons + Framer Motion.
* **Backend (`/server`):** Node.js + Express + TypeScript + Supabase Auth / PostgreSQL.
* **Database & Auth:** Supabase Cloud.

---

## 📋 Yêu cầu hệ thống (Prerequisites)

Để đảm bảo dự án chạy mượt mà và không gặp lỗi xung đột phiên bản khi mang sang máy khác, môi trường cần đáp ứng:

| Công cụ | Phiên bản yêu cầu | Khuyến nghị |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.18.0` | **`v20.x LTS`** hoặc **`v22.x LTS`** |
| **npm** | `>= 9.0.0` | **`10.x`** trở lên |

> **Lưu ý:** Vite 6, React 19 và React Router 7 yêu cầu Node.js tối thiểu từ bản 18.18.0 trở lên. Khuyến nghị tốt nhất là sử dụng Node.js 20 LTS.

### Kiểm tra phiên bản hiện tại trên máy:
```bash
node -v
npm -v
```

### (Tùy chọn) Chuyển phiên bản Node với NVM:
Nếu máy đã cài đặt [NVM](https://github.com/nvm-sh/nvm) (hoặc nvm-windows):
```bash
# Dự án đã có sẵn file .nvmrc trỏ tới Node 20
nvm install 20
nvm use 20
```

---

## 🚀 Khởi chạy dự án (Local Development)

### 1. Cài đặt dependencies

Dự án được cấu trúc dạng Monorepo, bạn cần cài đặt thư viện cho cả thư mục gốc (quản lý lệnh đồng thời) và 2 thư mục con `client`, `server`.

**Cách nhanh nhất (tại thư mục gốc):**
```bash
npm install && npm run install:all
```

*Hoặc cài đặt thủ công từng thư mục:*
```bash
# 1. Cài đặt gói công cụ tại root (concurrently)
npm install

# 2. Cài đặt dependencies cho Frontend (Client)
npm install --prefix client

# 3. Cài đặt dependencies cho Backend (Server)
npm install --prefix server
```

---

### 2. Thiết lập Biến môi trường (.env)

Trước khi khởi chạy, copy các file mẫu `.env.example` sang `.env`:

#### Cho Server (`server/.env`):
Tạo file `server/.env` (hoặc copy từ `server/.env.example`):
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ENABLE_CACHE=true
```

#### Cho Client (`client/.env`):
Tạo file `client/.env` (hoặc copy từ `client/.env.example`):
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Khởi chạy ứng dụng

Tại thư mục gốc của dự án:
```bash
npm run dev
```

Lệnh trên sẽ chạy đồng thời cả 2 dịch vụ:
* **Frontend (Vite):** [http://localhost:5173](http://localhost:5173)
* **Backend (Express):** [http://localhost:5000](http://localhost:5000)

#### Hoặc chạy riêng biệt từng dịch vụ:
* `npm run dev:client` — Chỉ chạy Frontend Vite
* `npm run dev:server` — Chỉ chạy Backend Express (với `tsx watch`)

---

### 4. Build sản phẩm (Production)

```bash
# Build cả Backend và Frontend
npm run build

# Khởi chạy Backend sau khi build
npm run start
```

---

## 🛠 Xử lý lỗi thường gặp (Troubleshooting)

1. **Lỗi phiên bản Node (`Unsupported engine` hoặc lỗi cú pháp khi build Vite/React 19):**
   * Đảm bảo Node.js của máy đang từ `v18.18.0` trở lên (tốt nhất là `v20.x`). Dùng `nvm use 20` để chuyển.
2. **Lỗi `Cannot find module ...` khi chạy `npm run dev`:**
   * Do chưa cài đặt dependencies ở thư mục `client` hoặc `server`. Hãy chạy lại: `npm run install:all`.
3. **Lỗi không kết nối được Supabase:**
   * Kiểm tra xem các file `client/.env` và `server/.env` đã được điền đúng thông tin `SUPABASE_URL` và `SUPABASE_ANON_KEY` hay chưa.
