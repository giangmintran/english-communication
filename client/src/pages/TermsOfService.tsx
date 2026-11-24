import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Shield, Scale, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useFeedbackModal } from '@/context/FeedbackModalContext';

export default function TermsOfServicePage() {
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('terms.title')}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('terms.lastUpdated')}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('terms.subtitle')}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{t('terms.section1Title')}</span>
          </h2>
          <p>{t('terms.section1Text')}</p>
        </div>

        {/* Section 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{t('terms.section2Title')}</span>
          </h2>
          <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>{t('terms.section2Item1')}</li>
            <li>{t('terms.section2Item2')}</li>
            <li>{t('terms.section2Item3')}</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{t('terms.section3Title')}</span>
          </h2>
          <p>{t('terms.section3Text')}</p>
        </div>

        {/* Section 4: Pro subscriptions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('terms.section4Title')}</span>
          </h2>
          <ul className="space-y-2 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>{t('terms.section4Item1')}</li>
            <li className="font-semibold text-slate-800 dark:text-slate-200">{t('terms.section4Item2')}</li>
            <li>{t('terms.section4Item3')}</li>
          </ul>
        </div>

        {/* Section 5: Limitation */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{t('terms.section5Title')}</span>
          </h2>
          <p>{t('terms.section5Text')}</p>
        </div>

        {/* Section 6: Changes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{t('terms.section6Title')}</span>
          </h2>
          <p>{t('terms.section6Text')}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openFeedback()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Có thắc mắc về điều khoản? Gửi phản hồi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
