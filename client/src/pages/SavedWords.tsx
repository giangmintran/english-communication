import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Search,
  Volume2,
  Mic,
  ArrowLeft,
  Sparkles,
  BookOpen,
  LayoutGrid,
  RotateCcw,
  CheckCircle2,
  Trash2,
  X,
  Play,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useLearningStore } from '@/lib/store';
import { loadDailyWordsFromCollectionItems } from '@/lib/dailyWordSelector';
import { LearningItem } from '@/types/database';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { cn } from '@/lib/utils';

export default function SavedWordsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addSpeakingTime } = useLearningStore();

  const [allItems, setAllItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('starred_phrases');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore
    }
    return new Set<string>();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'word' | 'phrase' | 'sentence'>('all');

  // Flashcard review modal for saved words
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Speaking test state
  const [speakingItemId, setSpeakingItemId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; spoken: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const items = await loadDailyWordsFromCollectionItems();
        if (mounted && items) {
          setAllItems(items);
        }
      } catch (err) {
        console.warn('Lỗi khi tải từ vựng cho sổ tay:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter items that are starred
  const savedItems = useMemo(() => {
    return allItems.filter((item) => starredIds.has(item.id));
  }, [allItems, starredIds]);

  // Filter by search & type
  const filteredItems = useMemo(() => {
    return savedItems.filter((item) => {
      // Type filter
      if (typeFilter !== 'all') {
        const wordsCount = item.english_text.trim().split(/\s+/).length;
        if (typeFilter === 'word' && wordsCount > 1) return false;
        if (typeFilter === 'phrase' && (wordsCount <= 1 || wordsCount >= 5)) return false;
        if (typeFilter === 'sentence' && wordsCount < 5) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.english_text.toLowerCase().includes(q) ||
        item.vietnamese_meaning.toLowerCase().includes(q) ||
        (item.phonetic_ipa && item.phonetic_ipa.toLowerCase().includes(q))
      );
    });
  }, [savedItems, searchQuery, typeFilter]);

  const handleToggleStar = (itemId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem('starred_phrases', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleStartSpeaking = (item: LearningItem) => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('conversationPractice.micError'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setSpeakingItemId(item.id);
      setIsRecording(true);
      setSpeechResult(null);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const score = calculateSimilarity(spoken, item.english_text);
        setSpeechResult({ score, spoken });
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

  const activeFlashcardItem = filteredItems[flashcardIndex];

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50 rounded-full text-xs font-bold mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{t('savedWords.countBadge', { count: savedItems.length })}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('savedWords.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('savedWords.subtitle')}
          </p>
        </div>

        {savedItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setFlashcardIndex(0);
              setIsCardFlipped(false);
              setIsFlashcardOpen(true);
            }}
            className="self-start sm:self-auto py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-2xl flex items-center gap-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{t('savedWords.practiceFlashcards')}</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      {savedItems.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('savedWords.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: t('savedWords.filterAll') },
              { id: 'word', label: t('savedWords.filterWord') },
              { id: 'phrase', label: t('savedWords.filterPhrase') },
              { id: 'sentence', label: t('savedWords.filterSentence') },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTypeFilter(f.id as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0',
                  typeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : savedItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
            <Star className="w-8 h-8 fill-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('savedWords.emptyTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('savedWords.emptyDesc')}
            </p>
          </div>
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{t('savedWords.exploreBtn')}</span>
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
          Không tìm thấy từ vựng phù hợp với từ khóa "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {item.english_text}
                    </h3>
                    {item.phonetic_ipa && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        {item.phonetic_ipa}
                      </p>
                    )}
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStar(item.id)}
                    className="p-1.5 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer shrink-0"
                    title={t('savedWords.unstarTooltip')}
                  >
                    <Star className="w-4 h-4 fill-amber-500" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {item.vietnamese_meaning}
                </p>

                {item.example_sentence && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mb-3 space-y-0.5">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      "{item.example_sentence}"
                    </p>
                    {item.example_meaning && (
                      <p className="italic text-slate-400 dark:text-slate-500">
                        {item.example_meaning}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => speakText(item.english_text)}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartSpeaking(item)}
                    className={cn(
                      'p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium',
                      speakingItemId === item.id && isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                    title={t('savedWords.practiceSpeaking')}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Luyện phát âm</span>
                  </button>
                </div>

                {speakingItemId === item.id && speechResult && (
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-md',
                      speechResult.score >= 80
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {speechResult.score}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flashcard Review Modal */}
      {isFlashcardOpen && activeFlashcardItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thẻ {flashcardIndex + 1} / {filteredItems.length}
              </span>
              <button
                type="button"
                onClick={() => setIsFlashcardOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Card */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="min-h-56 p-6 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 dark:hover:border-slate-600 transition-all select-none"
            >
              {!isCardFlipped ? (
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {activeFlashcardItem.english_text}
                  </h3>
                  {activeFlashcardItem.phonetic_ipa && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {activeFlashcardItem.phonetic_ipa}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 pt-3">
                    (Nhấn để lật xem nghĩa tiếng Việt)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Nghĩa tiếng Việt:</p>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    {activeFlashcardItem.vietnamese_meaning}
                  </h4>
                  {activeFlashcardItem.example_sentence && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-2">
                      "{activeFlashcardItem.example_sentence}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => speakText(activeFlashcardItem.english_text)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={flashcardIndex === 0}
                  onClick={() => {
                    setIsCardFlipped(false);
                    setFlashcardIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="py-2 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Trước
                </button>

                <button
                  type="button"
                  disabled={flashcardIndex === filteredItems.length - 1}
                  onClick={() => {
                    setIsCardFlipped(false);
                    setFlashcardIndex((prev) => Math.min(filteredItems.length - 1, prev + 1));
                  }}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs font-semibold rounded-xl text-white cursor-pointer shadow-xs"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
