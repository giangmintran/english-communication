/**
 * Text-to-Speech (TTS) using Web Speech API
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
}

export function speakText(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clear English learners' comprehension
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Calculate similarity between spoken text and target text (Levenshtein distance based)
 */
export function calculateSimilarity(spoken: string, target: string): number {
  const cleanSpoken = spoken.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const cleanTarget = target.toLowerCase().replace(/[^\w\s]/g, '').trim();

  if (cleanSpoken === cleanTarget) return 100;
  if (!cleanSpoken || !cleanTarget) return 0;

  const targetWords = cleanTarget.split(/\s+/);
  const spokenWords = cleanSpoken.split(/\s+/);

  let matchedWords = 0;
  for (const word of spokenWords) {
    if (targetWords.includes(word)) {
      matchedWords++;
    }
  }

  const wordScore = (matchedWords / Math.max(targetWords.length, spokenWords.length)) * 100;
  return Math.min(100, Math.round(wordScore));
}
