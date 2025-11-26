/**
 * Text-to-Speech (TTS) Service
 *
 * Provides pronunciation support for vocabulary learning using
 * Web Speech API and cloud TTS services.
 *
 * @module lib/speech/textToSpeech
 */

export interface TTSOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;  // 0.1 - 10 (default: 1)
  pitch?: number; // 0 - 2 (default: 1)
  volume?: number; // 0 - 1 (default: 1)
  lang?: string;
}

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isAvailable: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isAvailable = true;
      this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  private loadVoices() {
    if (!this.synth) return;

    // Load voices
    this.voices = this.synth.getVoices();

    // Chrome loads voices asynchronously
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth!.getVoices();
      };
    }
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.voices.length > 0 ? this.voices : this.synth.getVoices();
  }

  /**
   * Get voices by language
   */
  getVoicesByLang(lang: string): SpeechSynthesisVoice[] {
    const voices = this.getVoices();
    return voices.filter(voice => voice.lang.startsWith(lang));
  }

  /**
   * Get best voice for language
   */
  getBestVoice(lang: string = 'en-US'): SpeechSynthesisVoice | null {
    const voices = this.getVoicesByLang(lang);

    // Prefer high-quality voices
    const qualityVoice = voices.find(v =>
      v.localService === false || // Cloud voices are usually better
      v.name.includes('Premium') ||
      v.name.includes('Enhanced')
    );

    return qualityVoice || voices[0] || null;
  }

  /**
   * Speak text
   */
  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable || !this.synth) {
        console.warn('Text-to-Speech not available');
        reject(new Error('TTS not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        const bestVoice = this.getBestVoice(options.lang);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      // Set parameters
      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume !== undefined ? options.volume : 1;

      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      // Speak
      this.synth.speak(utterance);
    });
  }

  /**
   * Speak word with pronunciation
   */
  async speakWord(word: string, lang: string = 'en-US'): Promise<void> {
    await this.speak(word, {
      lang,
      rate: 0.9, // Slightly slower for clarity
    });
  }

  /**
   * Speak example sentence
   */
  async speakSentence(sentence: string, lang: string = 'en-US'): Promise<void> {
    await this.speak(sentence, {
      lang,
      rate: 1,
    });
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  /**
   * Check if speaking
   */
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    const voices = this.getVoices();
    const langs = new Set(voices.map(v => v.lang));
    return Array.from(langs).sort();
  }
}

// Singleton instance
export const tts = new TextToSpeechService();

export default tts;
