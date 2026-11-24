import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, Eye, Database, Mic, UserCheck, Mail } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useFeedbackModal } from '@/context/FeedbackModalContext';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const { openFeedback } = useFeedbackModal();

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('common.backHome')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('privacy.title')}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('privacy.lastUpdated')}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('privacy.subtitle')}
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2>{t('privacy.section1Title')}</h2>
          </div>
          <p>{t('privacy.section1Text')}</p>
          <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>{t('privacy.section1Item1')}</li>
            <li>{t('privacy.section1Item2')}</li>
            <li className="font-medium text-slate-800 dark:text-slate-200">
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold mr-1">
                <Mic className="w-3.5 h-3.5 inline" /> Quan trọng:
              </span>
              {t('privacy.section1Item3')}
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2>{t('privacy.section2Title')}</h2>
          </div>
          <p>{t('privacy.section2Text')}</p>
          <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>{t('privacy.section2Item1')}</li>
            <li>{t('privacy.section2Item2')}</li>
            <li>{t('privacy.section2Item3')}</li>
            <li>{t('privacy.section2Item4')}</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2>{t('privacy.section3Title')}</h2>
          </div>
          <p>{t('privacy.section3Text')}</p>
        </div>

        {/* Section 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2>{t('privacy.section4Title')}</h2>
          </div>
          <p>{t('privacy.section4Text')}</p>
          <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>{t('privacy.section4Item1')}</li>
            <li>{t('privacy.section4Item2')}</li>
          </ul>
        </div>

        {/* Section 5: Contact */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2>{t('privacy.section5Title')}</h2>
          </div>
          <p>{t('privacy.section5Text')}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openFeedback()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Gửi yêu cầu bảo mật / hỗ trợ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
