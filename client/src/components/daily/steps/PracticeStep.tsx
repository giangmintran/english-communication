import React, { useState } from 'react';
import { Trophy, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { PracticeQuizItem } from '@/types/database';
import { VocabQuizCard } from '@/components/daily/quiz/VocabQuizCard';
import { GrammarQuizCard } from '@/components/daily/quiz/GrammarQuizCard';
import { SentenceBuildingCard } from '@/components/daily/quiz/SentenceBuildingCard';
import { TranslationCard } from '@/components/daily/quiz/TranslationCard';
import { SpeakingChallengeCard } from '@/components/daily/quiz/SpeakingChallengeCard';
import { useTranslation } from '@/context/LanguageContext';

interface PracticeStepProps {
  practice: PracticeQuizItem[];
  onScoreUpdate?: (score: number, total: number) => void;
}

export function PracticeStep({ practice, onScoreUpdate }: PracticeStepProps) {
  const [answeredMap, setAnsweredMap] = useState<Record<number, boolean>>({});
  const { t } = useTranslation();

  const handleItemAnswer = (idx: number, isCorrect: boolean) => {
    setAnsweredMap((prev) => {
      const next = { ...prev, [idx]: isCorrect };
      const correctCount = Object.values(next).filter(Boolean).length;
      onScoreUpdate?.(correctCount, practice.length);
      return next;
    });
  };

  const answeredCount = Object.keys(answeredMap).length;
  const correctCount = Object.values(answeredMap).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>07 · {t('dailyLesson.practiceStep')}</span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('dailyLesson.practiceSubtitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {practice.length} {t('common.actions').toLowerCase()}
          </p>
        </div>

        {/* Live Score Tracker */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 self-start sm:self-center">
          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-slate-500 dark:text-slate-400">
              {t('dailyLesson.scoreSummary')}
            </p>
            <p className="font-extrabold text-base text-slate-900 dark:text-white">
              {correctCount} / {practice.length}
            </p>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-6">
        {practice.map((item, idx) => {
          if (item.type === 'vocabulary_quiz') {
            return (
              <VocabQuizCard
                key={idx}
                question={item.question}
                options={item.options}
                correctAnswer={item.correct_answer}
                explanation={item.explanation}
                onAnswer={(isCorrect) => handleItemAnswer(idx, isCorrect)}
              />
            );
          }

          if (item.type === 'grammar_quiz') {
            return (
              <GrammarQuizCard
                key={idx}
                question={item.question}
                options={item.options}
                correctAnswer={item.correct_answer}
                explanation={item.explanation}
                onAnswer={(isCorrect) => handleItemAnswer(idx, isCorrect)}
              />
            );
          }

          if (item.type === 'sentence_building') {
            return (
              <SentenceBuildingCard
                key={idx}
                vietnamese={item.vietnamese}
                scrambledWords={item.scrambled_words}
                correctOrder={item.correct_order}
                hint={item.hint}
                onAnswer={(isCorrect) => handleItemAnswer(idx, isCorrect)}
              />
            );
          }

          if (item.type === 'translation') {
            return (
              <TranslationCard
                key={idx}
                sourceText={item.source_text}
                sourceLang={item.source_lang}
                correctAnswer={item.correct_answer}
                acceptAnswers={item.accept_answers}
                hint={item.hint}
                onAnswer={(isCorrect) => handleItemAnswer(idx, isCorrect)}
              />
            );
          }

          if (item.type === 'speaking_challenge') {
            return (
              <SpeakingChallengeCard
                key={idx}
                prompt={item.prompt}
                sampleAnswer={item.sample_answer}
                vietnameseHint={item.vietnamese_hint}
                onAnswer={(isCorrect) => handleItemAnswer(idx, isCorrect)}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
