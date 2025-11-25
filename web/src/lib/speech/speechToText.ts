/**
 * Speech-to-Text (STT) Service
 *
 * Provides speech recognition for pronunciation practice
 * using Web Speech API.
 *
 * @module lib/speech/speechToText
 */

export interface STTOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

type STTCallback = (result: STTResult) => void;
type STTErrorCallback = (error: string) => void;

class SpeechToTextService {
  private recognition: any = null; // SpeechRecognition
  private isAvailable: boolean = false;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.isAvailable = true;
      }
    }
  }

  /**
   * Check if STT is available
   */
  isSTTAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Start recognition
   */
  start(
    onResult: STTCallback,
    onError?: STTErrorCallback,
    options: STTOptions = {}
  ): void {
    if (!this.isAvailable) {
      const error = 'Speech recognition not available';
      console.warn(error);
      if (onError) onError(error);
      return;
    }

    // Configure recognition
    this.recognition.lang = options.lang || 'en-US';
    this.recognition.continuous = options.continuous || false;
    this.recognition.interimResults = options.interimResults || true;
    this.recognition.maxAlternatives = options.maxAlternatives || 3;

    // Event handlers
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      onResult({
        transcript,
        confidence,
        isFinal,
      });
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error;
      console.error('Speech recognition error:', error);
      this.isListening = false;

      if (onError) {
        onError(error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    // Start
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.isListening = false;
      if (onError) onError(String(error));
    }
  }

  /**
   * Stop recognition
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort recognition
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Check if listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Recognize word pronunciation
   */
  async recognizeWord(
    targetWord: string,
    lang: string = 'en-US',
    timeout: number = 5000
  ): Promise<{
    recognized: string;
    isCorrect: boolean;
    confidence: number;
    similarity: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      let timeoutId: NodeJS.Timeout;
      const recognized: string[] = [];

      const onResult: STTCallback = (result) => {
        if (result.isFinal) {
          recognized.push(result.transcript);
          clearTimeout(timeoutId);
          this.stop();

          const bestMatch = this.findBestMatch(targetWord, recognized);
          resolve(bestMatch);
        }
      };

      const onError: STTErrorCallback = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(error));
      };

      // Start recognition
      this.start(onResult, onError, {
        lang,
        continuous: false,
        interimResults: true,
      });

      // Timeout
      timeoutId = setTimeout(() => {
        this.stop();
        if (recognized.length === 0) {
          reject(new Error('No speech detected'));
        } else {
          const bestMatch = this.findBestMatch(targetWord, recognized);
          resolve(bestMatch);
        }
      }, timeout);
    });
  }

  /**
   * Find best match from recognized words
   */
  private findBestMatch(
    target: string,
    recognized: string[]
  ): {
    recognized: string;
    isCorrect: boolean;
    confidence: number;
    similarity: number;
  } {
    if (recognized.length === 0) {
      return {
        recognized: '',
        isCorrect: false,
        confidence: 0,
        similarity: 0,
      };
    }

    // Find most similar recognized word
    let bestMatch = recognized[0];
    let bestSimilarity = this.calculateSimilarity(target, recognized[0]);

    for (let i = 1; i < recognized.length; i++) {
      const similarity = this.calculateSimilarity(target, recognized[i]);
      if (similarity > bestSimilarity) {
        bestMatch = recognized[i];
        bestSimilarity = similarity;
      }
    }

    const isCorrect = bestSimilarity > 0.7; // 70% similarity threshold

    return {
      recognized: bestMatch,
      isCorrect,
      confidence: 1, // Web Speech API doesn't provide confidence for final results
      similarity: bestSimilarity,
    };
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 || len2 === 0) return 0;

    // Levenshtein distance
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    const similarity = 1 - distance / maxLen;

    return Math.max(0, similarity);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    // Web Speech API supports many languages
    // This is a subset of common languages
    return [
      'en-US',
      'en-GB',
      'ko-KR',
      'ja-JP',
      'zh-CN',
      'zh-TW',
      'es-ES',
      'fr-FR',
      'de-DE',
      'it-IT',
      'pt-BR',
      'ru-RU',
      'ar-SA',
      'hi-IN',
    ];
  }
}

// Singleton instance
export const stt = new SpeechToTextService();

export default stt;
