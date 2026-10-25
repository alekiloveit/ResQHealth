import { useState, useEffect, useRef, useCallback } from 'react';

// Define SpeechRecognition interface for TypeScript
interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

export function useVoiceTrigger(onTriggerAlert: (keyword: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const [matchedKeyword, setMatchedKeyword] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldRestartRef = useRef(false);

  const TRIGGER_KEYWORDS = ['help', 'emergency', 'call 911', 'call 112', 'sos', 'cpr alert', 'save me'];

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if user hasn't explicitly disabled it
        if (shouldRestartRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore restart collision
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error === 'not-allowed') {
          shouldRestartRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            fullTranscript += ' ' + res[0].transcript;
          }
        }

        const normalized = fullTranscript.toLowerCase().trim();
        setLastTranscript(normalized);

        for (const kw of TRIGGER_KEYWORDS) {
          if (normalized.includes(kw)) {
            setMatchedKeyword(kw);
            onTriggerAlert(kw);
            break;
          }
        }
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
    }

    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [onTriggerAlert]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldRestartRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // already active
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    lastTranscript,
    matchedKeyword,
    startListening,
    stopListening,
    triggerKeywords: TRIGGER_KEYWORDS,
  };
}
