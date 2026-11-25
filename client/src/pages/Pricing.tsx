import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useFeedbackModal } from '@/context/FeedbackModalContext';

export default function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openFeedback } = useFeedbackModal();
  const navigate = useNavigate();

  const [isYearly, setIsYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCheckoutNotice, setShowCheckoutNotice] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSelectPlan = (planKey: string) => {
    if (planKey === 'free') {
      navigate('/');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setShowCheckoutNotice(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50 rounded-full text-xs font-bold tracking-wide">
          <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{t('pricing.badge')}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t('pricing.title')}
        </h1>

        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('pricing.subtitle')}
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${!isYearly
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              {t('pricing.monthly')}
            </button>

            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isYearly
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <span>{t('pricing.yearly')}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-extrabold tracking-wide">
                {t('pricing.save30')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout notice modal / banner */}
      {showCheckoutNotice && (
        <div className="max-w-xl mx-auto p-5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-3xl text-center space-y-3 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
            {/* <Sparkles className="w-5 h-5" /> */}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('pricing.checkoutNoticeTitle')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('pricing.checkoutNoticeDesc')}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowCheckoutNotice(false);
                openFeedback();
              }}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {t('pricing.checkoutContactBtn')}
            </button>
            <button
              type="button"
              onClick={() => setShowCheckoutNotice(false)}
              className="py-2 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {t('pricing.checkoutCloseBtn')}
            </button>
          </div>
        </div>
      )}

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* Plan 1: Free */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between transition-colors">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('pricing.freeTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('pricing.freeDesc')}
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2 border-y border-slate-100 dark:border-slate-800">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {t('pricing.freePrice')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('pricing.freePeriod')}
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.freeBullet1')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.freeBullet2')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.freeBullet3')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.freeBullet4')}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan('free')}
            className="w-full mt-8 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer"
          >
            {t('pricing.freeCta')}
          </button>
        </div>

        {/* Plan 2: Pro (Featured) */}
        <div className="relative bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900 rounded-3xl p-6 sm:p-7 border-2 border-blue-600 shadow-xl shadow-blue-500/10 flex flex-col justify-between transition-colors">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm">
            {t('pricing.popularBadge')}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {t('pricing.proTitle')}
                </h3>
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('pricing.proDesc')}
              </p>
            </div>

            <div className="py-2 border-y border-blue-100 dark:border-blue-900/40">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                  {isYearly ? t('pricing.proPriceYearly') : t('pricing.proPriceMonthly')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('pricing.proPeriod')}
                </span>
              </div>
              {isYearly && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                  {t('pricing.proBilledYearly')}
                </p>
              )}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 pt-2 font-medium">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
                <span className="font-bold">{t('pricing.proBullet1')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
                <span className="font-bold">{t('pricing.proBullet2')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
                <span>{t('pricing.proBullet3')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
                <span>{t('pricing.proBullet4')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 stroke-[2.5]" />
                <span>{t('pricing.proBullet5')}</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-2">
            <button
              type="button"
              onClick={() => handleSelectPlan('pro')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 cursor-pointer hover:scale-[1.01]"
            >
              <Crown className="w-4 h-4 fill-white" />
              <span>{t('pricing.proCta')}</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('pricing.guarantee')}</span>
            </p>
          </div>
        </div>

        {/* Plan 3: Lifetime */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col justify-between transition-colors">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('pricing.lifetimeTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('pricing.lifetimeDesc')}
              </p>
            </div>

            <div className="flex items-baseline gap-1 py-2 border-y border-slate-100 dark:border-slate-800">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {t('pricing.lifetimePrice')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('pricing.lifetimePeriod')}
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">{t('pricing.lifetimeBullet1')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.lifetimeBullet2')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.lifetimeBullet3')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('pricing.lifetimeBullet4')}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan('lifetime')}
            className="w-full mt-8 py-3 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer"
          >
            {t('pricing.lifetimeCta')}
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card transition-colors space-y-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white text-center">
          {t('pricing.featureComparisonTitle')}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase text-[11px]">
                <th className="pb-3.5">{t('pricing.featureCol')}</th>
                <th className="pb-3.5 text-center">{t('pricing.freeCol')}</th>
                <th className="pb-3.5 text-center text-blue-600 dark:text-blue-400">{t('pricing.proCol')}</th>
                <th className="pb-3.5 text-center">{t('pricing.lifetimeCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3.5 font-medium">{t('pricing.featWordsPerDay')}</td>
                <td className="py-3.5 text-center text-slate-500">{t('pricing.featWordsLimitFree')}</td>
                <td className="py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{t('pricing.featWordsLimitPro')}</td>
                <td className="py-3.5 text-center font-bold">{t('pricing.featWordsLimitPro')}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">{t('pricing.featSpeakingAI')}</td>
                <td className="py-3.5 text-center text-slate-500">{t('pricing.featSpeakingLimitFree')}</td>
                <td className="py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{t('pricing.featSpeakingLimitPro')}</td>
                <td className="py-3.5 text-center font-bold">{t('pricing.featSpeakingLimitPro')}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">{t('pricing.featCollections')}</td>
                <td className="py-3.5 text-center text-slate-500">{t('pricing.featCollectionsLimitFree')}</td>
                <td className="py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{t('pricing.featCollectionsLimitPro')}</td>
                <td className="py-3.5 text-center font-bold">{t('pricing.featCollectionsLimitPro')}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">{t('pricing.featSRS')}</td>
                <td className="py-3.5 text-center text-slate-500">{t('pricing.featSRSStandard')}</td>
                <td className="py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{t('pricing.featSRSAdvanced')}</td>
                <td className="py-3.5 text-center font-bold">{t('pricing.featSRSAdvanced')}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">{t('pricing.featSupport')}</td>
                <td className="py-3.5 text-center text-slate-500">{t('pricing.featSupportStandard')}</td>
                <td className="py-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{t('pricing.featSupportPriority')}</td>
                <td className="py-3.5 text-center font-bold">{t('pricing.featSupportPriority')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white text-center mb-6">
          {t('pricing.faqTitle')}
        </h2>

        {[
          { q: t('pricing.faq1Q'), a: t('pricing.faq1A') },
          { q: t('pricing.faq2Q'), a: t('pricing.faq2A') },
          { q: t('pricing.faq3Q'), a: t('pricing.faq3A') },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleFaq(idx)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-bold text-sm text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span>{item.q}</span>
              {openFaq === idx ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>
            {openFaq === idx && (
              <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/60 animate-in fade-in duration-150">
                {item.a}
              </div>
            )}
          </div>
        ))}

        <div className="pt-2 text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>{t('about.quickFaqLink')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
