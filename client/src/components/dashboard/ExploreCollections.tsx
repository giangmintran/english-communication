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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Deck } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';

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

export function ExploreCollections() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    async function loadDecks() {
      try {
        const data = await api.decks.getAll();
        if (mounted && data && data.length > 0) {
          setDecks(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách decks:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDecks();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('home.exploreCollections')}
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

      {loading && decks.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 shadow-card animate-pulse h-60"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {decks.map((deck) => {
            const Icon = iconMap[deck.icon_name] || BookOpen;

            return (
              <Link
                key={deck.id}
                to={`/learn/${deck.slug || deck.id}`}
                className="group bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-lg dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Image Card with Word count badge */}
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3.5">
                    <img
                      src={deck.image_url}
                      alt={deck.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Word count pill */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
                      {deck.total_words || 100} words
                    </div>
                  </div>

                  {/* Category Icon & Title */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                      {deck.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-1 line-clamp-1 mb-2">
                    {deck.description}
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
    </div>
  );
}
