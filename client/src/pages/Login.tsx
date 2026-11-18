import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Flame, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
        <div className="w-8 h-8 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-5 transition-colors">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 dark:ring-emerald-900/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('login.alreadyLoggedIn')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t('login.loggedInAs')}{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {user.email}
            </span>
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <span>{t('common.backHome')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-full text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('login.badge')}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('login.welcome')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-card space-y-6 transition-colors">
        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <GoogleIcon className="w-5 h-5" />
          <span>{isSubmitting ? t('login.redirecting') : t('login.continueWithGoogle')}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-100 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">
            {t('login.benefitsTitle')}
          </span>
        </div>

        {/* Value Propositions */}
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t('login.benefit1Title')}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {t('login.benefit1Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t('login.benefit2Title')}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {t('login.benefit2Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t('login.benefit3Title')}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {t('login.benefit3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
