import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Volume2, Loader2 } from 'lucide-react';
import { speakText } from '@/lib/speech';
import { api } from '@/lib/api';
import { DictionaryItem } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';

export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.dictionary.search(query.trim(), 30);
        if (active) {
          setResults(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tìm kiếm từ điển:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2.5">
          <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span>{t('dictionary.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('dictionary.subtitle')}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('dictionary.searchPlaceholder')}
          className="w-full pl-12 pr-10 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs transition-colors"
        />
        {loading && (
          <div className="absolute right-4 top-3.5">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>

      {/* Word list */}
      <div className="space-y-3">
        {results.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t('dictionary.notFound')} "{query}".
            </p>
          </div>
        ) : (
          results.map((item, index) => (
            <div
              key={item.id || `${item.word}-${index}`}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-card flex items-start justify-between gap-4 hover:border-blue-100 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.word}</h3>
                  {item.ipa && (
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {item.ipa}
                    </span>
                  )}
                  <button
                    onClick={() => speakText(item.word)}
                    className="p-1 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                    title={t('dictionary.listenPronunciation')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                  {item.meaning}
                </p>
                {item.example && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{item.example}"
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
