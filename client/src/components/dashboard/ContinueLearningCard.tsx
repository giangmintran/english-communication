import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { Deck } from '@/types/database';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';

export function ContinueLearningCard() {
  const { user } = useAuth();
  const { reviews } = useLearningStore();
  const { t } = useTranslation();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDecks() {
      try {
        const data = await api.decks.getAll();
        if (mounted && data && data.length > 0) {
          setDecks(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải decks cho ContinueLearningCard:', err);
      }
    }
    loadDecks();
    return () => {
      mounted = false;
    };
  }, []);

  const activeDeck = React.useMemo(() => {
    if (decks.length === 0) {
      return null;
    }

    if (!user) {
      // Guest demo view
      const demoDeck = decks[1] || decks[0];
      return {
        deck: demoDeck,
        progress: 60,
        hasStarted: true,
      };
    }

    // Với user đã đăng nhập, tính toán tiến độ dựa trên reviews
    const inProgressDeck = decks[0];
    const totalWords = inProgressDeck.total_words || 20;
    const reviewedCount = Object.keys(reviews).length;
    const pct = totalWords > 0 ? Math.min(100, Math.round((reviewedCount / totalWords) * 100)) : 0;

    return {
      deck: inProgressDeck,
      progress: pct,
      hasStarted: reviewedCount > 0,
    };
  }, [user, reviews, decks]);

  if (!activeDeck) {
    return null;
  }

  const { deck, progress, hasStarted } = activeDeck;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('home.continueLearningTitle')}
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-6 transition-colors">
        {/* Media Thumbnail with Play Overlay */}
        <Link
          to={`/learn/${deck.slug || deck.id}`}
          className="relative w-full md:w-64 lg:w-72 h-40 sm:h-44 rounded-2xl overflow-hidden shrink-0 group cursor-pointer shadow-inner block"
        >
          <img
            src={deck.image_url}
            alt={deck.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-blue-600 dark:fill-blue-400 ml-0.5" />
            </div>
          </div>
        </Link>

        {/* Content details */}
        <div className="flex-1 w-full flex flex-col justify-between py-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2.5 sm:mb-3 border border-blue-100/60 dark:border-blue-900/40">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{deck.category}</span>
              <span>•</span>
              <span>Level A2</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
              {deck.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2">
              {deck.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="w-full sm:w-64">
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{progress}%</span>
            </div>

            <Link
              to={`/learn/${deck.slug || deck.id}`}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
            >
              <span>{hasStarted ? t('home.resumeLesson') : t('home.startLesson')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
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
