import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { ConversationItem } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    async function loadConversations() {
      try {
        const data = await api.conversations.getAll();
        if (mounted && data && data.length > 0) {
          setConversations(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách hội thoại:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadConversations();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-4 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2 sm:gap-2.5">
          <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('conversations.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          {t('conversations.subtitle')}
        </p>
      </div>

      {loading && conversations.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card animate-pulse h-48"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {conversations.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all"
            >
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs mb-3 border border-blue-100 dark:border-blue-900/40">
                  {t('conversations.level')} {item.level}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3">
                  {item.scenario}
                </p>
              </div>

              <Link
                to={`/conversations/${item.deckId}`}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t('conversations.startConversation')}</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
