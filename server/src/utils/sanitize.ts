/**
 * Tiện ích làm sạch chuỗi đầu vào dùng trong các câu truy vấn PostgREST (Supabase)
 * Loại bỏ các ký tự đặc biệt có thể phá vỡ cú pháp truy vấn: , ( ) { } % \ " '
 */
export function sanitizePostgrestParam(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[,(){}%"'\\;]/g, '').trim();
}
