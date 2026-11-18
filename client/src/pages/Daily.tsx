import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { TodaysGoalCard } from '@/components/dashboard/TodaysGoalCard';
import { api } from '@/lib/api';
import { Deck } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';

export default function DailyLearningPage() {
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
        console.warn('Lỗi khi tải decks trong DailyLearningPage:', err);
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
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2.5">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span>{t('daily.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('daily.subtitle')}
        </p>
      </div>

      <TodaysGoalCard />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-4 transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('daily.tasksByTopic')}
        </h2>
        {loading && decks.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {decks.map((deck, idx) => (
              <div
                key={deck.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {deck.description}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/learn/${deck.slug || deck.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>{t('daily.startReview')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
