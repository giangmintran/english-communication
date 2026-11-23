import React, { useState, useEffect } from 'react';
import { X, Volume2, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { speakText } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { ItemDetails } from '@/types/database';

interface QuickDictionaryModalProps {
  word: string;
  vietnameseMeaning?: string;
  exampleSentence?: string;
  exampleMeaning?: string;
  details?: ItemDetails;
  isOpen: boolean;
  onClose: () => void;
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
    synonyms?: string[];
  }>;
  sourceUrls?: string[];
}

const PART_OF_SPEECH_MAP_VI: Record<string, string> = {
  noun: 'Danh từ (n.)',
  verb: 'Động từ (v.)',
  adjective: 'Tính từ (adj.)',
  adverb: 'Trạng từ (adv.)',
  pronoun: 'Đại từ',
  preposition: 'Giới từ',
  conjunction: 'Liên từ',
  interjection: 'Thán từ',
  phrase: 'Cụm từ / Thành ngữ',
  collocation: 'Cụm liên kết từ',
  sentence: 'Mẫu câu hoàn chỉnh',
};

export function QuickDictionaryModal({
  word,
  vietnameseMeaning: propVietnameseMeaning,
  exampleSentence: propExampleSentence,
  exampleMeaning: propExampleMeaning,
  details: propDetails,
  isOpen,
  onClose,
}: QuickDictionaryModalProps) {
  const { t, language } = useTranslation();
  const [data, setData] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackViMeaning, setFallbackViMeaning] = useState<string>('');

  const isVietnamese = language === 'vi';
  const viMeaning = propVietnameseMeaning || fallbackViMeaning;

  useEffect(() => {
    if (!isOpen || !word) return;

    // Lấy từ đơn đầu tiên nếu là cụm từ để tra cứu từ điển
    const cleanWord = word.trim().replace(/[^\w\s-]/gi, '').split(/\s+/)[0].toLowerCase();
    if (!cleanWord) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    // 1. Gọi Dictionary API
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(t('flashcards.dictionaryNotFound'));
        }
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        if (Array.isArray(json) && json.length > 0) {
          setData(json[0]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || t('flashcards.dictionaryNotFound'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Nếu người dùng dùng tiếng Việt và chưa có sẵn nghĩa tiếng Việt, tự động dịch
    if (isVietnamese && !propVietnameseMeaning) {
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`)
        .then((res) => res.json())
        .then((json) => {
          if (!isMounted) return;
          const translated = json?.responseData?.translatedText;
          if (translated && translated.toLowerCase() !== cleanWord) {
            setFallbackViMeaning(translated);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [word, isOpen, propVietnameseMeaning, isVietnamese, t]);

  if (!isOpen) return null;

  const playPronunciation = (textToPlay?: string) => {
    const target = textToPlay || data?.word || word;
    const audioUrl = data?.phonetics?.find((p) => p.audio && p.audio.trim().length > 0)?.audio;
    if (audioUrl && !textToPlay) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        speakText(target);
      });
    } else {
      speakText(target);
    }
  };

  const rawPartOfSpeech =
    propDetails?.part_of_speech ||
    (data?.meanings?.[0]?.partOfSpeech ? data.meanings[0].partOfSpeech : '');
  const partOfSpeechDisplay = isVietnamese
    ? (PART_OF_SPEECH_MAP_VI[rawPartOfSpeech.toLowerCase()] || rawPartOfSpeech)
    : rawPartOfSpeech;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('flashcards.dictionaryTitle')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('flashcards.dictionarySubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Word Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/60 dark:from-slate-800/60 dark:to-slate-800/40 p-4 rounded-2xl border border-blue-100/60 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {word}
                </h2>
                {partOfSpeechDisplay && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                    {partOfSpeechDisplay}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">
                {data?.phonetic || data?.phonetics?.find((p) => p.text)?.text || ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => playPronunciation()}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              title="Phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* CHẾ ĐỘ 1: TIẾNG VIỆT (Khi language === 'vi') */}
          {isVietnamese ? (
            <div className="space-y-3.5">
              {viMeaning ? (
                <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('flashcards.vietnameseMeaning')}
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {viMeaning}
                  </div>

                  {/* Ngữ cảnh sử dụng */}
                  {propDetails?.usage_note && (
                    <div className="flex items-start gap-1.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <span className="shrink-0 text-sm">💡</span>
                      <span className="font-medium leading-relaxed">{propDetails.usage_note}</span>
                    </div>
                  )}

                  {/* Collocations */}
                  {propDetails?.collocations && propDetails.collocations.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                        {t('flashcards.dictionaryCollocations')}:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {propDetails.collocations.map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => playPronunciation(col)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                          >
                            <Volume2 className="w-3 h-3 text-slate-400" />
                            <span>{col}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Từ đồng nghĩa */}
                  {propDetails?.synonyms && propDetails.synonyms.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-400">{t('flashcards.dictionarySynonyms')}: </span>
                      <span>{propDetails.synonyms.join(', ')}</span>
                    </div>
                  )}

                  {/* Câu ví dụ ngữ cảnh & bản dịch */}
                  {propExampleSentence && (
                    <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-400 uppercase text-[10px]">
                          {t('flashcards.dictionaryExample')}
                        </span>
                        <button
                          type="button"
                          onClick={() => playPronunciation(propExampleSentence)}
                          className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                        "{propExampleSentence}"
                      </p>
                      {propExampleMeaning && (
                        <p className="text-slate-500 dark:text-slate-400">
                          → {propExampleMeaning}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  {t('flashcards.dictionaryNotFound')}
                </div>
              )}
            </div>
          ) : (
            /* CHẾ ĐỘ 2: TIẾNG ANH (Khi language === 'en') */
            <div className="space-y-3.5">
              {loading && (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <p className="text-xs">{t('flashcards.dictionaryLoading')}</p>
                </div>
              )}

              {error && !loading && (
                <div className="py-6 text-center space-y-2">
                  <AlertCircle className="w-7 h-7 text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
                </div>
              )}

              {data && !loading && (
                <div className="space-y-3.5">
                  {data.meanings.map((meaning, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-3.5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-md uppercase tracking-wider">
                        {meaning.partOfSpeech}
                      </div>

                      <ul className="space-y-2 pl-2">
                        {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                          <li key={dIdx} className="text-xs space-y-1">
                            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                              • {def.definition}
                            </p>
                            {def.example && (
                              <p className="text-slate-500 dark:text-slate-400 italic pl-3 border-l-2 border-blue-400 dark:border-blue-500">
                                "{def.example}"
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>

                      {meaning.synonyms && meaning.synonyms.length > 0 && (
                        <div className="text-[11px] text-slate-500 pt-1">
                          <span className="font-semibold text-slate-400">{t('flashcards.dictionarySynonyms')}: </span>
                          <span>{meaning.synonyms.slice(0, 5).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            {t('flashcards.dictionaryClose')}
          </button>
        </div>
      </div>
    </div>
  );
}
