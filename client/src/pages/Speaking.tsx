import React, { useState, useEffect } from 'react';
import { Mic, Volume2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { SpeakingItem } from '@/types/database';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export default function SpeakingPracticePage() {
  const [items, setItems] = useState<SpeakingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<{ score: number; spoken: string } | null>(null);

  const { addSpeakingTime } = useLearningStore();
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    async function loadSpeakingItems() {
      try {
        const data = await api.speaking.getItems(50);
        if (mounted && data && data.length > 0) {
          setItems(data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải câu luyện nói:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSpeakingItems();
    return () => {
      mounted = false;
    };
  }, []);

  const currentItem = items[currentIndex];

  const handleListen = () => {
    if (currentItem) {
      speakText(currentItem.english_text);
    }
  };

  const handleStartSpeaking = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('speaking.micError'));
      return;
    }

    if (!currentItem) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setIsRecording(true);
      setResult(null);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const score = calculateSimilarity(spoken, currentItem.english_text);
        setResult({ score, spoken });
        setIsRecording(false);
        addSpeakingTime(1);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-4 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2 sm:gap-2.5">
          <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('speaking.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          {t('speaking.subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-5 sm:space-y-6 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-semibold">
          <span>{currentItem.difficulty_level ? `Level ${currentItem.difficulty_level}` : 'Everyday Speaking'}</span>
          <span>
            {currentIndex + 1} / {items.length}
          </span>
        </div>

        <div className="py-2 sm:py-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight break-words">
            "{currentItem.english_text}"
          </h2>
          {currentItem.phonetic_ipa && (
            <p className="text-xs sm:text-sm font-mono text-slate-400 dark:text-slate-500 mb-2">
              {currentItem.phonetic_ipa}
            </p>
          )}
          <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
            {currentItem.vietnamese_meaning}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={handleListen}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t('speaking.listenNative')}</span>
          </button>

          <button
            onClick={handleStartSpeaking}
            disabled={isRecording}
            className={cn(
              'w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs',
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
            )}
          >
            <Mic className="w-4 h-4" />
            <span>{isRecording ? t('speaking.listening') : t('speaking.startSpeaking')}</span>
          </button>
        </div>

        {/* Score Card */}
        {result && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('speaking.youSaid')}:
              </span>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold text-white',
                  result.score >= 80 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                )}
              >
                {result.score}% {t('speaking.matchScore')}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              "{result.spoken}"
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex((c) => c - 1);
                setResult(null);
              }
            }}
            disabled={currentIndex === 0}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
          >
            ← {t('speaking.prevSentence')}
          </button>

          <button
            onClick={() => {
              if (currentIndex < items.length - 1) {
                setCurrentIndex((c) => c + 1);
                setResult(null);
              }
            }}
            disabled={currentIndex >= items.length - 1}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-30 cursor-pointer"
          >
            {t('speaking.nextSentence')} →
          </button>
        </div>
      </div>
    </div>
  );
}
