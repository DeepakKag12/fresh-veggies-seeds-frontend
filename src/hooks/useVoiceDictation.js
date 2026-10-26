import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * YouTube / WhatsApp-Grade Voice Dictation Hook
 * Powered by browser native Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 */
export const useVoiceDictation = ({ onTranscript, onInterim } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported by your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // If already listening, stop
    if (isListening) {
      stopListening();
      return;
    }

    try {
      isManuallyStoppedRef.current = false;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Default to Indian English / browser locale
      recognition.lang = navigator.language || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript && typeof onTranscript === 'function') {
          onTranscript(finalTranscript);
        }
        if (interimTranscript && typeof onInterim === 'function') {
          onInterim(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning/error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast.error('Microphone access needed for voice typing. Please check browser permissions.');
        } else if (event.error === 'no-speech') {
          // Silent timeout
        } else if (event.error !== 'aborted') {
          toast.error(`Voice dictation error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      toast.error('Could not activate microphone. Please try again.');
      setIsListening(false);
    }
  }, [isListening, onTranscript, onInterim, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
};

export default useVoiceDictation;
