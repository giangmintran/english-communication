import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import path from 'path';

// Polyfill native WebSocket cho môi trường Node.js < 22 (trên Render hoặc container)
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

// Nạp file .env từ cả thư mục hiện tại lẫn thư mục server
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Cảnh báo: SUPABASE_URL hoặc SUPABASE_ANON_KEY chưa được cấu hình đầy đủ trong server/.env');
}

/**
 * Standard Supabase client (sử dụng ANON_KEY, tuân thủ Row Level Security - RLS).
 * Mọi truy vấn mặc định chạy dưới quyền của anon / public role.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: WebSocket as any,
  },
});

/**
 * Admin client có quyền bypass RLS (Service Role).
 * Chỉ sử dụng cho các tác vụ quản trị máy chủ đặc biệt, KHÔNG dùng làm client mặc định cho API routes.
 */
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      realtime: {
        transport: WebSocket as any,
      },
    })
  : null;

/**
 * Trả về Supabase client có quyền truy cập phù hợp theo ngữ cảnh người dùng.
 * Nếu có Bearer token của user, tạo client scoped truyền Authorization header
 * để Supabase PostgREST xác thực đúng auth.uid() theo cơ chế Row Level Security (RLS).
 */
export function getScopedSupabaseClient(token?: string): SupabaseClient {
  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        transport: WebSocket as any,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  return supabase;
}
