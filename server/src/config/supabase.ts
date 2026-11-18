import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Nạp file .env từ cả thư mục hiện tại lẫn thư mục server
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Cảnh báo: SUPABASE_URL hoặc SUPABASE_KEY chưa được cấu hình đầy đủ trong server/.env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Trả về Supabase client có quyền truy cập phù hợp.
 * Nếu đã cấu hình SUPABASE_SERVICE_ROLE_KEY, client mặc định sẽ có quyền bypass RLS.
 * Nếu dùng SUPABASE_ANON_KEY và có Bearer token của user, tạo client scoped truyền Authorization header
 * để Supabase PostgREST xác thực đúng auth.uid() theo cơ chế Row Level Security (RLS).
 */
export function getScopedSupabaseClient(token?: string): SupabaseClient {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabase;
  }

  if (token) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
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
