import React from 'react';
import { Sparkles, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { ReviewQuestion } from '@/types/quiz';
import { SRSItemState } from '@/lib/srs';
import { ListeningQuizCard } from '@/components/daily/review/ListeningQuizCard';
import { WritingQuizCard } from '@/components/daily/review/WritingQuizCard';
import { TranslationQuizCard } from '@/components/daily/review/TranslationQuizCard';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface SRSReviewCardProps {
  question: ReviewQuestion;
  reviewState?: SRSItemState;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  onNext: () => void;
  autoPlayAudio?: boolean;
}

export function SRSReviewCard({
  question,
  reviewState,
  onAnswer,
  onNext,
  autoPlayAudio = true,
}: SRSReviewCardProps) {
  const { t } = useTranslation();

  const repetitions = reviewState?.repetitions || 0;
  const interval = reviewState?.interval_days || 1;

  return (
    <div className="space-y-3">
      {/* SRS Repetition Info Pill */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">
            <Clock className="w-3 h-3" />
            <span>{t('collectionStudy.stageDueReview')}</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            {t('collectionStudy.reviewRound', { round: repetitions + 1, days: interval })}
          </span>
        </div>

        {repetitions >= 2 && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1">
            {/* <Sparkles className="w-3 h-3" /> */}
            <span>{t('collectionStudy.almostMastered')}</span>
          </span>
        )}
      </div>

      {/* Dynamic Quiz Card based on question type */}
      {question.type === 'listening_choice' && (
        <ListeningQuizCard
          key={question.id}
          question={question}
          onAnswer={onAnswer}
          onNext={onNext}
          autoPlayAudio={autoPlayAudio}
        />
      )}

      {question.type === 'writing_input' && (
        <WritingQuizCard
          key={question.id}
          question={question}
          onAnswer={onAnswer}
          onNext={onNext}
          autoPlayAudio={autoPlayAudio}
        />
      )}

      {question.type === 'translation_choice' && (
        <TranslationQuizCard
          key={question.id}
          question={question}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      )}
    </div>
  );
}
