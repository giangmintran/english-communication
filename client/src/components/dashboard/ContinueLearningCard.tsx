import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, BookOpen, Clock, Star, Sparkles, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { Collection } from '@/types/database';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';

// Helper định dạng thời gian học lần cuối
function formatRelativeTime(dateStr: string | null | undefined, language: string): string | null {
  if (!dateStr) return null;
  const studiedDate = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - studiedDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (language === 'vi') {
    if (diffHours < 1) return 'Vừa mới học';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return `${studiedDate.getDate()}/${studiedDate.getMonth() + 1}`;
  }

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${studiedDate.getMonth() + 1}/${studiedDate.getDate()}`;
}

export function ContinueLearningCard() {
  const { user } = useAuth();
  const { collectionProgress } = useLearningStore();
  const { t, language } = useTranslation();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCollections() {
      try {
        const data = await api.collections.getAll();
        if (mounted && data && data.length > 0) {
          setCollections(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải collections cho ContinueLearningCard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCollections();
    return () => {
      mounted = false;
    };
  }, []);

  const activeCollectionData = useMemo(() => {
    if (collections.length === 0) {
      return null;
    }

    // 1. Quét collectionProgress để tìm bộ sưu tập có last_studied_at gần đây nhất
    const activeProgressList = Object.entries(collectionProgress)
      .map(([id, p]) => ({ id, ...p }))
      .filter((p) => p && (p.learned_count > 0 || p.mastered_count > 0 || p.last_studied_at))
      .sort(
        (a, b) =>
          new Date(b.last_studied_at || 0).getTime() - new Date(a.last_studied_at || 0).getTime()
      );

    let targetCol: Collection | null = null;
    let targetProgress = activeProgressList[0] || null;

    if (targetProgress) {
      targetCol =
        collections.find(
          (c) =>
            c.id === targetProgress.collection_id ||
            c.slug === targetProgress.collection_id.replace(/^col-/, '')
        ) || null;
    }

    // 2. Nếu người dùng chưa học bộ nào: Mặc định chọn bộ đầu tiên (hoặc 1000 từ thông dụng)
    if (!targetCol) {
      targetCol =
        collections.find((c) => c.slug?.includes('common') || c.id?.includes('common')) ||
        collections[0] ||
        null;
    }

    if (!targetCol) return null;

    const targetSlug = targetCol.slug || targetCol.id;
    const colId = targetCol.id;
    const progress =
      collectionProgress[colId] || collectionProgress[targetSlug] || targetProgress;

    const totalPhrases = Math.max(
      targetCol.total_phrases || 0,
      progress?.total_phrases || 0,
      (targetCol as any).total_words || 0
    ) || 20;
    const learnedCount = progress?.learned_count || 0;
    const masteredCount = progress?.mastered_count || 0;
    // Tiến độ collection tính chính xác theo: Số từ đã học được / tổng số từ của collection
    const progressPercent =
      totalPhrases > 0 ? Math.min(100, Math.round((learnedCount / totalPhrases) * 100)) : 0;
    const hasStarted = learnedCount > 0;
    const lastStudiedAt = progress?.last_studied_at || null;

    return {
      collection: targetCol,
      targetSlug,
      totalPhrases,
      learnedCount,
      masteredCount,
      progressPercent,
      hasStarted,
      lastStudiedAt,
    };
  }, [collections, collectionProgress]);

  if (loading && collections.length === 0) {
    return (
      <div className="w-full h-48 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 animate-pulse" />
    );
  }

  if (!activeCollectionData) {
    return null;
  }

  const {
    collection,
    targetSlug,
    totalPhrases,
    learnedCount,
    masteredCount,
    progressPercent,
    hasStarted,
    lastStudiedAt,
  } = activeCollectionData;

  const relativeTimeStr = formatRelativeTime(lastStudiedAt, language);

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('home.continueLearningTitle')}
          </h2>
        </div>

        <Link
          to="/collections"
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          <span>{t('home.seeAll')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-6 transition-all hover:shadow-lg">
        {/* Media Thumbnail with Play Overlay */}
        <Link
          to={`/collections/${targetSlug}/learn`}
          className="relative w-full md:w-64 lg:w-72 h-40 sm:h-44 rounded-2xl overflow-hidden shrink-0 group cursor-pointer shadow-inner block"
        >
          <img
            src={collection.image_url}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-blue-600 dark:fill-blue-400 ml-0.5" />
            </div>
          </div>

          {/* Badge: Tổng số cụm từ */}
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-[11px] font-bold text-white shadow-xs">
            {totalPhrases} {t('common.words')}
          </div>
        </Link>

        {/* Content Details */}
        <div className="flex-1 w-full flex flex-col justify-between py-1 space-y-3">
          <div>
            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100/60 dark:border-blue-900/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{collection.category || 'General'}</span>
              </span>

              {relativeTimeStr && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{relativeTimeStr}</span>
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-1 mb-1">
              {collection.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-2">
              {collection.description}
            </p>
          </div>

          {/* Progress & Actions Section */}
          <div className="space-y-3 pt-1">
            {/* Detailed Progress Stats */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1.5">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">{learnedCount}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t('collections.learnedWords') || 'từ đã học'}</span>
                </span>
                <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">{progressPercent}%</span>
              </div>

              {/* Progress Bar with Dual Mastery Indicator */}
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {masteredCount > 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  <span>{masteredCount} {t('collections.mastered')} (SRS)</span>
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <Link
                to={`/collections/${targetSlug}/learn`}
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>{hasStarted ? t('home.continueLearning') : t('home.startLesson')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={`/collections/${targetSlug}`}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>{t('collections.viewDetails')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        feature="collection"
      />
    </div>
  );
}
