import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export function VoiceInput({ onResult, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [onResult]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`p-3 rounded-xl transition-all ${
        listening
          ? 'bg-red-500/20 text-red-400 animate-pulse'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}

export function TextToSpeech({ text, autoPlay = false }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!window.speechSynthesis) setSupported(false);
  }, []);

  useEffect(() => {
    if (autoPlay && text && supported) speak();
    return () => window.speechSynthesis?.cancel();
  }, [text, autoPlay]);

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  if (!supported || !text) return null;

  return (
    <button
      type="button"
      onClick={speaking ? stop : speak}
      className="p-1.5 rounded-lg text-gray-500 hover:text-aurora-400 transition-colors"
      title={speaking ? 'Stop' : 'Listen'}
    >
      {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}

export function WaterBottle({ percentage }) {
  const fillHeight = Math.min(percentage, 100);

  return (
    <div className="relative w-24 h-40 mx-auto">
      <div className="absolute inset-0 border-2 border-white/20 rounded-b-3xl rounded-t-lg overflow-hidden bg-white/5">
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/80 to-aurora-500/60"
          initial={{ height: 0 }}
          animate={{ height: `${fillHeight}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      </div>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 border-2 border-white/20 rounded-t-lg bg-white/5" />
      <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-cyan-400">
        {Math.round(fillHeight)}%
      </p>
    </div>
  );
}
