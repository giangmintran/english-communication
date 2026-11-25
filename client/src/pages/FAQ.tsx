import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ArrowLeft,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Mic,
  Crown,
  Rocket,
  Mail,
  MessageSquareHeart,
  ArrowRight,
  ChevronsUpDown,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useFeedbackModal } from '@/context/FeedbackModalContext';
import { cn } from '@/lib/utils';

type FaqCategory = 'all' | 'start' | 'learning' | 'speaking' | 'account';

interface FaqItemConfig {
  id: number;
  category: Exclude<FaqCategory, 'all'>;
  qKey: string;
  aKey: string;
}

const FAQ_ITEMS: FaqItemConfig[] = [
  { id: 1, category: 'start', qKey: 'faq.q1', aKey: 'faq.a1' },
  { id: 2, category: 'start', qKey: 'faq.q2', aKey: 'faq.a2' },
  { id: 3, category: 'start', qKey: 'faq.q3', aKey: 'faq.a3' },
  { id: 4, category: 'learning', qKey: 'faq.q4', aKey: 'faq.a4' },
  { id: 5, category: 'learning', qKey: 'faq.q5', aKey: 'faq.a5' },
  { id: 6, category: 'learning', qKey: 'faq.q6', aKey: 'faq.a6' },
  { id: 7, category: 'speaking', qKey: 'faq.q7', aKey: 'faq.a7' },
  { id: 8, category: 'speaking', qKey: 'faq.q8', aKey: 'faq.a8' },
  { id: 9, category: 'speaking', qKey: 'faq.q9', aKey: 'faq.a9' },
  { id: 10, category: 'account', qKey: 'faq.q10', aKey: 'faq.a10' },
  { id: 11, category: 'account', qKey: 'faq.q11', aKey: 'faq.a11' },
  { id: 12, category: 'account', qKey: 'faq.q12', aKey: 'faq.a12' },
];

export default function FAQPage() {
  const { t } = useTranslation();
  const { openFeedback } = useFeedbackModal();

  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<number[]>([1]);

  const categories: { id: FaqCategory; label: string; icon: typeof HelpCircle }[] = [
    { id: 'all', label: t('faq.catAll'), icon: Sparkles },
    { id: 'start', label: t('faq.catStart'), icon: Rocket },
    { id: 'learning', label: t('faq.catLearning'), icon: BookOpen },
    { id: 'speaking', label: t('faq.catSpeaking'), icon: Mic },
    { id: 'account', label: t('faq.catAccount'), icon: Crown },
  ];

  const categoryBadgeLabels: Record<Exclude<FaqCategory, 'all'>, string> = {
    start: t('faq.catStart'),
    learning: t('faq.catLearning'),
    speaking: t('faq.catSpeaking'),
    account: t('faq.catAccount'),
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const question = t(item.qKey).toLowerCase();
      const answer = t(item.aKey).toLowerCase();
      return question.includes(query) || answer.includes(query);
    });
  }, [selectedCategory, searchQuery, t]);

  const toggleItem = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allFilteredOpen =
    filteredItems.length > 0 && filteredItems.every((item) => openIds.includes(item.id));

  const handleToggleAll = () => {
    if (allFilteredOpen) {
      const filteredSet = new Set(filteredItems.map((i) => i.id));
      setOpenIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setOpenIds((prev) => Array.from(new Set([...prev, ...filteredItems.map((i) => i.id)])));
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('common.backHome')}</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t('faq.badge')}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('faq.title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 mt-0.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('faq.searchPlaceholder')}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t('faq.clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Expand/Collapse All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              {t('faq.resultCount', { count: filteredItems.length })}
            </span>
            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer shrink-0"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span>{allFilteredOpen ? t('faq.collapseAll') : t('faq.expandAll')}</span>
            </button>
          </div>
        )}
      </div>

      {/* FAQ Accordion List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('faq.emptyTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('faq.emptyDesc')}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('faq.resetFilterBtn')}
            </button>
            <Link
              to="/contact"
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              {t('faq.ctaContactBtn')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isOpen = openIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  'bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden shadow-2xs',
                  isOpen
                    ? 'border-blue-200 dark:border-blue-900/60 shadow-card'
                    : 'border-slate-100 dark:border-slate-800'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {categoryBadgeLabels[item.category]}
                    </span>
                    <h2 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug">
                      {t(item.qKey)}
                    </h2>
                  </div>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      isOpen
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                    )}
                  >
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
                    {t(item.aKey)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Help CTA Card */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 rounded-3xl p-6 sm:p-8 border border-blue-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {t('faq.ctaTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('faq.ctaDesc')}
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
          >
            <span>{t('faq.pricingLink')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>{t('faq.ctaContactBtn')}</span>
          </Link>
          <button
            type="button"
            onClick={() => openFeedback()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <MessageSquareHeart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t('faq.ctaFeedbackBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
