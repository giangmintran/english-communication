import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Lỗi khi lấy session tại callback:', error.message);
      }
      navigate('/', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-600 text-sm font-medium">Đang hoàn tất đăng nhập...</p>
    </div>
  );
}
