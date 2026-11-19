import React, { useState } from 'react';
import { Volume2, BookOpen, ChevronDown, ChevronUp, Sparkles, Check } from 'lucide-react';
import { LessonVocabItem } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface VocabularyStepProps {
  vocabulary: LessonVocabItem[];
}

export function VocabularyStep({ vocabulary }: VocabularyStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(vocabulary[0]?.id || null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set([vocabulary[0]?.id]));
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setViewedIds((prev) => new Set(prev).add(id));
  };

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlayingWord(text);
    await speakText(text);
    setPlayingWord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>02 · {t('dailyLesson.vocabularyStep')}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('dailyLesson.vocabCount', { count: vocabulary.length })}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('dailyLesson.vocabLearnedNotice')}
          </p>
        </div>

        {/* Progress Counter */}
        <div className="flex items-center gap-2.5 self-start sm:self-center px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {viewedIds.size} / {vocabulary.length} {t('common.words')}
          </span>
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="space-y-3">
        {vocabulary.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const isViewed = viewedIds.has(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleToggleExpand(item.id)}
              className={cn(
                'rounded-3xl border transition-all cursor-pointer select-none overflow-hidden',
                isExpanded
                  ? 'bg-white dark:bg-slate-900 border-blue-500/50 dark:border-blue-500/50 shadow-md ring-2 ring-blue-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
              )}
            >
              {/* Collapsed Bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 transition-colors',
                      isViewed
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    )}
                  >
                    {idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {item.word}
                      </span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {item.phonetic_ipa}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium uppercase">
                        {item.part_of_speech}
                      </span>
                    </div>

                    {!isExpanded && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">
                        {item.vietnamese_meaning}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handlePlayAudio(item.word, e)}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                    title={t('dailyLesson.listenWord')}
                  >
                    <Volume2 className={cn('w-4 h-4', playingWord === item.word && 'animate-pulse text-indigo-600')} />
                  </button>

                  <div className="p-1 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs animate-in fade-in duration-200">
                  {/* Vietnamese Meaning */}
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      {t('flashcards.vietnameseMeaning')}
                    </span>
                    <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {item.vietnamese_meaning}
                    </p>
                  </div>

                  {/* Collocations */}
                  {item.collocations && item.collocations.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                        {t('dailyLesson.collocations')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {item.collocations.map((col, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium border border-slate-100 dark:border-slate-700/80"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example Context */}
                  {item.example_sentence && (
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                          {t('dailyLesson.example')}
                        </span>
                        <button
                          onClick={(e) => handlePlayAudio(item.example_sentence, e)}
                          className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t('dailyLesson.listenExample')}</span>
                        </button>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {item.example_sentence}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs italic">
                        {item.example_meaning}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
