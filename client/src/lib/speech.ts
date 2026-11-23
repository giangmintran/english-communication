/**
 * Text-to-Speech (TTS) using Web Speech API
 */
let currentUtteranceId = 0;

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
}

export function speakText(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    const thisId = ++currentUtteranceId;
    // Cancel any ongoing speech immediately
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}

    // A tiny 20ms timeout prevents Chrome from ignoring consecutive speak() calls
    setTimeout(() => {
      if (thisId !== currentUtteranceId) {
        resolve();
        return;
      }

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

      utterance.onend = () => {
        if (thisId === currentUtteranceId) {
          resolve();
        }
      };

      utterance.onerror = (e) => {
        // e.error can be 'canceled' or 'interrupted' when replaced by newer audio
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis error:', e);
        }
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Failed to speak:', err);
        resolve();
      }
    }, 20);
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
