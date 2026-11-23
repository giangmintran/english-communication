import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  MessageSquare,
  ArrowRight,
  BookOpen,
  Sun,
  HeartPulse,
  Lightbulb,
  GraduationCap,
  MessageCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Collection } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  BriefcaseBusiness: Briefcase,
  MessageSquare,
  MessagesSquare: MessageSquare,
  MessageCircle,
  Sun,
  HeartPulse,
  Lightbulb,
  GraduationCap,
  BookOpen,
};

interface ExploreCollectionsProps {
  isPage?: boolean;
}

export function ExploreCollections({ isPage = false }: ExploreCollectionsProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { collectionProgress } = useLearningStore();
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    async function loadCollections() {
      try {
        const data = await api.collections.getAll();
        if (mounted && data && data.length > 0) {
          setCollections(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách collections:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCollections();
    return () => {
      mounted = false;
    };
  }, []);

  // Quy tắc hiển thị:
  // - Tại trang chủ (!isPage - "Phần Khám phá bộ sưu tập"): chỉ hiển thị 5 bộ sưu tập có nhiều từ vựng nhất
  // - Tại trang /collections (isPage): hiển thị toàn bộ danh sách bộ sưu tập (khách được mở khóa 5 bộ đầu)
  const MAX_DASHBOARD_COLLECTIONS = 5;
  const MAX_GUEST_COLLECTIONS = 5;

  const displayedCollections = React.useMemo(() => {
    if (!isPage) {
      return [...collections]
        .sort((a, b) => {
          const countA = a.total_phrases ?? a.phrases?.length ?? a.items?.length ?? 0;
          const countB = b.total_phrases ?? b.phrases?.length ?? b.items?.length ?? 0;
          if (countB !== countA) {
            return countB - countA;
          }
          return (a.order_index ?? 0) - (b.order_index ?? 0);
        })
        .slice(0, MAX_DASHBOARD_COLLECTIONS);
    }
    return collections;
  }, [collections, isPage]);

  return (
    <div className="w-full">
      {!isPage && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('home.exploreCollections')}
            </h2>
          </div>
          {!user ? (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{t('home.seeAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/collections"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>{t('home.seeAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {loading && collections.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 shadow-card animate-pulse h-60"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {displayedCollections.map((col, idx) => {
            const Icon = iconMap[col.icon_name] || BookOpen;
            const progress = collectionProgress[col.id] || collectionProgress[col.slug];
            const hasStarted = Boolean(progress && progress.learned_count > 0);
            const isLocked = !user && isPage && idx >= MAX_GUEST_COLLECTIONS;

            if (isLocked) {
              return (
                <div
                  key={col.id}
                  onClick={() => setIsAuthModalOpen(true)}
                  className="group relative bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer opacity-85 hover:opacity-100 hover:border-amber-300 dark:hover:border-amber-700/60 hover:-translate-y-0.5"
                >
                  <div>
                    {/* Image Card with Lock Overlay */}
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3.5">
                      <img
                        src={col.image_url}
                        alt={col.title}
                        className="w-full h-full object-cover filter grayscale contrast-125"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center">
                        <div className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-amber-500 flex items-center justify-center shadow-lg">
                          <Lock className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Khóa</span>
                      </div>
                    </div>

                    {/* Category Icon & Title */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm tracking-tight truncate">
                        {col.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 px-1 line-clamp-1 mb-2">
                      {col.description}
                    </p>
                  </div>

                  {/* Bottom Unlock Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800 px-1">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Mở khóa
                    </span>
                    <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={col.id}
                to={`/collections/${col.slug || col.id}`}
                className="group bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-lg dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  {/* Image Card with Word count badge */}
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3.5">
                    <img
                      src={col.image_url}
                      alt={col.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Word count pill */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
                      {typeof col.total_phrases === 'number' ? col.total_phrases : (col.items?.length ?? col.phrases?.length ?? 0)} {t('common.words')}
                    </div>

                    {/* Progress indicator if started */}
                    {hasStarted && (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <div className="bg-slate-900/80 backdrop-blur-xs rounded-full p-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${progress.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-white">
                            {progress.progress_percent}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Icon & Title */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                      {col.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-1 line-clamp-1 mb-2">
                    {col.description}
                  </p>
                </div>

                {/* Bottom Arrow Action */}
                <div className="flex justify-end pt-2 border-t border-slate-50 dark:border-slate-800 px-1">
                  <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        feature="collection"
      />
    </div>
  );
}
