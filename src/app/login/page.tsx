'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageCircle, CheckCircle2, ShieldCheck, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-100 shadow-card text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bạn đã đăng nhập!</h2>
          <p className="text-slate-500 text-sm mt-1">
            Đang đăng nhập với email <span className="font-semibold text-slate-700">{user.email}</span>
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <span>Về trang chủ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SpeakUp English</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Chào mừng bạn trở lại!
        </h1>
        <p className="text-slate-500 text-sm">
          Đăng nhập để đồng bộ tiến độ học từ vựng, chuỗi streak và luyện phản xạ mỗi ngày.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card space-y-6">
        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <GoogleIcon className="w-5 h-5" />
          <span>{isSubmitting ? 'Đang chuyển hướng sang Google...' : 'Tiếp tục với Google'}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-100 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 uppercase font-semibold">
            Lợi ích khi đăng nhập
          </span>
        </div>

        {/* Value Propositions */}
        <div className="space-y-3.5 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Bảo lưu chuỗi Streak</p>
              <p className="text-slate-500">Không bao giờ bị mất chuỗi ngày học ngay cả khi đổi máy tính hay điện thoại.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Thuật toán SM-2 cá nhân hóa</p>
              <p className="text-slate-500">Lưu chính xác thời điểm ôn tập từng từ theo đường cong trí nhớ của bạn.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Đăng nhập nhanh & Bảo mật</p>
              <p className="text-slate-500">Xác thực 1 chạm với Google OAuth 2.0, không lo quên mật khẩu.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            ← Tiếp tục trải nghiệm với tư cách Khách
          </Link>
        </div>
      </div>
    </div>
  );
}
