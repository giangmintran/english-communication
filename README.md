# SpeakUp English (Monorepo)

Dự án luyện tập tiếng Anh giao tiếp và phản xạ từ vựng với mô hình Monorepo:
* **Frontend (`/client`):** React 19 + Vite + TypeScript + Tailwind CSS + React Router + Lucide Icons + Framer Motion.
* **Backend (`/server`):** Node.js + Express + TypeScript + Supabase Auth / PostgreSQL.
* **Database & Auth:** Supabase Cloud.

---

## 🚀 Khởi chạy dự án (Local Development)

### 1. Cài đặt dependencies
Cài đặt cho toàn bộ các workspace từ thư mục gốc:
```bash
npm install
```

### 2. Thiết lập Biến môi trường

#### Cho Server (`server/.env`):
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### Cho Client (`client/.env`):
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Khởi chạy đồng thời Client & Server

Tại thư mục gốc của dự án:
```bash
npm run dev
```
* **Frontend Vite:** chạy tại [http://localhost:5173](http://localhost:5173)
* **Backend Server:** chạy tại [http://localhost:5000](http://localhost:5000)

Hoặc chạy riêng lẻ từng phần:
* `npm run dev:client` (chỉ chạy Frontend Vite)
* `npm run dev:server` (chỉ chạy Backend Express với `tsx watch`)

---

### 4. Build sản phẩm (Production)
```bash
npm run build
```
Lệnh này sẽ chạy TypeScript compile và bundle Vite cho cả `server` và `client`.
