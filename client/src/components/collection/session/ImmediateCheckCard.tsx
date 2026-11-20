import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PenTool,
  RotateCcw,
  Sparkles,
  Layers,
  Headphones,
} from 'lucide-react';
import { LearningItem } from '@/types/database';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export type CheckQuestionType = 'en_to_vi' | 'vi_to_en' | 'listening';

interface ImmediateCheckCardProps {
  item: LearningItem;
  deckItems: LearningItem[];
  questionType?: CheckQuestionType;
  onResult: (isCorrect: boolean) => void;
  onNext: () => void;
  autoPlayAudio?: boolean;
}

const FALLBACK_VI_DISTRACTORS = [
  'Xin lỗi, bạn có thể nhắc lại được không?',
  'Tôi muốn thanh toán bằng thẻ tín dụng',
  'Làm ơn cho tôi hỏi đường đến ga tàu điện ngầm',
  'Tôi cần sự giúp đỡ của bạn một chút',
  'Hẹn gặp lại bạn vào tuần tới nhé',
  'Rất vui được gặp bạn hôm nay',
  'Cho tôi xin thêm một chút thời gian',
  'Bạn có gợi ý món nào ngon không?',
];

const FALLBACK_EN_DISTRACTORS = [
  'Could you please repeat that?',
  'I would like to pay by credit card',
  'Excuse me, where is the subway station?',
  'I need a little help from you',
  'See you next week',
  'Nice to meet you today',
  'Give me a moment, please',
  'Do you have any recommendations?',
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function cleanAnswer(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .trim();
}

export function ImmediateCheckCard({
  item,
  deckItems,
  questionType = 'en_to_vi',
  onResult,
  onNext,
  autoPlayAudio = true,
}: ImmediateCheckCardProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'choice' | 'typing'>('choice');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [typingInput, setTypingInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sinh 4 phương án trắc nghiệm tùy theo questionType
  const options = useMemo(() => {
    if (questionType === 'vi_to_en') {
      const correctEnglish = item.english_text;
      const otherEnglish = deckItems
        .filter((d) => d.id !== item.id && d.english_text !== correctEnglish)
        .map((d) => d.english_text);

      const pool = otherEnglish.length >= 3 ? otherEnglish : [...otherEnglish, ...FALLBACK_EN_DISTRACTORS];
      const uniquePool = Array.from(new Set(pool.filter((m) => m !== correctEnglish)));
      const chosenDistractors = shuffle(uniquePool).slice(0, 3);
      return shuffle([correctEnglish, ...chosenDistractors]);
    }

    // en_to_vi hoặc listening: Chọn nghĩa tiếng Việt
    const correctMeaning = item.vietnamese_meaning;
    const otherMeanings = deckItems
      .filter((d) => d.id !== item.id && d.vietnamese_meaning !== correctMeaning)
      .map((d) => d.vietnamese_meaning);

    const pool = otherMeanings.length >= 3 ? otherMeanings : [...otherMeanings, ...FALLBACK_VI_DISTRACTORS];
    const uniquePool = Array.from(new Set(pool.filter((m) => m !== correctMeaning)));
    const chosenDistractors = shuffle(uniquePool).slice(0, 3);
    return shuffle([correctMeaning, ...chosenDistractors]);
  }, [item.id, deckItems, questionType]);

  const correctIndex = useMemo(() => {
    const target = questionType === 'vi_to_en' ? item.english_text : item.vietnamese_meaning;
    return options.indexOf(target);
  }, [options, questionType, item.english_text, item.vietnamese_meaning]);

  const handlePlayAudio = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await speakText(item.english_text);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    setSelectedIdx(null);
    setTypingInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    // Ở câu hỏi listening hoặc en_to_vi có autoPlayAudio thì tự phát âm
    if (autoPlayAudio) {
      handlePlayAudio();
    }
  }, [item.id, questionType]);

  // Submit trắc nghiệm
  const handleSelectChoice = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    const correct = idx === correctIndex;
    setIsCorrect(correct);
    setIsAnswered(true);
    onResult(correct);
    if (correct || questionType === 'vi_to_en' || questionType === 'listening') {
      handlePlayAudio();
    }
  };

  // Submit gõ từ
  const handleSubmitTyping = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isAnswered || !typingInput.trim()) return;

    const userClean = cleanAnswer(typingInput);
    const targetClean = cleanAnswer(item.english_text);
    const correct = userClean === targetClean;

    setIsCorrect(correct);
    setIsAnswered(true);
    onResult(correct);
    handlePlayAudio();
  };

  // Gợi ý cho chế độ gõ
  const firstChar = item.english_text.charAt(0).toUpperCase();
  const hintText = `${firstChar}${' _'.repeat(Math.max(1, item.english_text.length - 1))}`;

  // Tiêu đề gợi ý câu hỏi
  let questionPrompt = t('collectionStudy.immediateCheckDesc');
  if (questionType === 'vi_to_en') {
    questionPrompt = t('collectionStudy.questionTypeViToEn');
  } else if (questionType === 'listening') {
    questionPrompt = t('collectionStudy.questionTypeListening');
  } else if (questionType === 'en_to_vi') {
    questionPrompt = t('collectionStudy.questionTypeEnToVi');
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-card space-y-6 transition-all duration-300">
      {/* Header Tag & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          {questionType === 'listening' ? (
            <Headphones className="w-3.5 h-3.5" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5" />
          )}
          <span>
            {questionType === 'listening'
              ? t('collectionStudy.questionTypeListening')
              : t('collectionStudy.stageImmediateCheck')}
          </span>
        </div>

        {/* Toggle between Choice & Typing */}
        {!isAnswered && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('choice')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                mode === 'choice'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>{t('collectionStudy.choiceMode')}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('typing')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer',
                mode === 'typing'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <span className="flex items-center gap-1">
                <PenTool className="w-3 h-3" />
                <span>{t('collectionStudy.typingMode')}</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Target Word Prompt Box */}
      <div className="text-center py-2 sm:py-3 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {mode === 'choice' ? questionPrompt : t('collectionStudy.typingPrompt')}
        </p>

        {mode === 'choice' ? (
          <div>
            {questionType === 'listening' ? (
              /* Dạng câu hỏi Nghe: Hiện nút phát âm lớn, ẩn text tiếng Anh cho đến khi trả lời */
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  disabled={isPlayingAudio}
                  className={cn(
                    'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all shadow-md cursor-pointer',
                    isPlayingAudio
                      ? 'bg-blue-600 text-white animate-pulse ring-4 ring-blue-400/30'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                  )}
                  title={t('collectionStudy.playListeningPrompt')}
                >
                  <Volume2 className={cn('w-7 h-7 sm:w-9 sm:h-9', isPlayingAudio && 'animate-bounce')} />
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isPlayingAudio ? t('speaking.listening') : t('collectionStudy.playListeningPrompt')}
                </p>

                {isAnswered && (
                  <div className="animate-fadeIn mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {item.english_text}
                    </h3>
                    {item.phonetic_ipa && (
                      <p className="text-xs font-mono text-slate-400">/{item.phonetic_ipa}/</p>
                    )}
                  </div>
                )}
              </div>
            ) : questionType === 'vi_to_en' ? (
              /* Dạng câu hỏi Ngược: Hiện nghĩa tiếng Việt nổi bật */
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 inline-block max-w-lg">
                  <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {item.vietnamese_meaning}
                  </p>
                </div>
                {isAnswered && (
                  <p className="text-xs font-mono text-slate-400 animate-fadeIn">
                    /{item.phonetic_ipa}/
                  </p>
                )}
              </div>
            ) : (
              /* Dạng câu hỏi Xuôi: Hiện cụm tiếng Anh + IPA */
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {item.english_text}
                </h3>
                {item.phonetic_ipa && (
                  <p className="text-xs font-mono text-slate-400">/{item.phonetic_ipa}/</p>
                )}
                <div>
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t('collectionStudy.listenAudio')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Typing Mode */
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {item.vietnamese_meaning}
            </p>
          </div>
        )}
      </div>

      {/* Choice Mode: 4 Options Grid */}
      {mode === 'choice' && (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
          {options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isAnswerOptionCorrect = idx === correctIndex;

            let buttonStyle =
              'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 text-slate-800 dark:text-slate-200';

            if (isAnswered) {
              if (isAnswerOptionCorrect) {
                buttonStyle =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30';
              } else if (isSelected && !isAnswerOptionCorrect) {
                buttonStyle =
                  'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/30';
              } else {
                buttonStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectChoice(idx)}
                className={cn(
                  'w-full text-left p-3.5 sm:p-4 rounded-2xl border font-semibold text-sm sm:text-base transition-all flex items-center justify-between gap-3 cursor-pointer',
                  buttonStyle
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-700/70 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>

                {isAnswered && isAnswerOptionCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswered && isSelected && !isAnswerOptionCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Typing Mode: Input Form */}
      {mode === 'typing' && (
        <form onSubmit={handleSubmitTyping} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={typingInput}
              disabled={isAnswered}
              onChange={(e) => setTypingInput(e.target.value)}
              placeholder={t('collectionStudy.typePlaceholder')}
              className={cn(
                'w-full px-4 py-3.5 rounded-2xl border text-sm sm:text-base font-semibold transition-all focus:outline-none focus:ring-2',
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200'
                    : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500/20 focus:border-blue-500'
              )}
            />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            {t('collectionStudy.hintLabel')} <span className="font-bold text-slate-600 dark:text-slate-300">{hintText}</span>
          </p>

          {!isAnswered && (
            <button
              type="submit"
              disabled={!typingInput.trim()}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm transition-all cursor-pointer shadow-xs"
            >
              {t('collectionStudy.submitAnswer')}
            </button>
          )}
        </form>
      )}

      {/* Answer Feedback Banner & Next CTA */}
      {isAnswered && (
        <div
          className={cn(
            'p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn',
            isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
          )}
        >
          <div className="flex items-center gap-2.5">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-bold">
                {isCorrect
                  ? t('collectionStudy.correctFeedback')
                  : t('collectionStudy.wrongFeedback')}
              </p>
              {!isCorrect && (
                <p className="text-xs mt-0.5 opacity-90">
                  {t('collectionStudy.standardAnswer')} <strong className="underline">{item.english_text}</strong> ({item.vietnamese_meaning})
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            autoFocus
            onClick={onNext}
            className={cn(
              'w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0',
              isCorrect
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            )}
          >
            <span>{t('collectionStudy.nextWord')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
