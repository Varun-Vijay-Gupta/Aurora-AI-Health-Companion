import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, Zap } from 'lucide-react';
import { aiApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import { VoiceInput, TextToSpeech } from '../components/common/VoiceAssistant';

const suggestions = [
  'I drank 500ml water',
  'I slept 7 hours last night',
  'Create a habit to meditate daily',
  'How am I doing today?',
  'Give me a health tip',
];

export default function AICompanion() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ['ai-history'],
    queryFn: async () => {
      const { data } = await aiApi.getHistory();
      return data.data;
    },
  });

  useEffect(() => {
    if (history?.length) {
      setMessages(history.filter((m) => m.role !== 'system'));
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (msg) => aiApi.chat(msg),
    onSuccess: (response) => {
      const { message: reply, actions } = response.data.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, actions, id: Date.now() },
      ]);
      if (actions?.length) {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['water-today'] });
        queryClient.invalidateQueries({ queryKey: ['sleep-today'] });
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      }
    },
  });

  const sendMessage = (text) => {
    if (!text.trim() || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: text, id: Date.now() }]);
    setMessage('');
    chatMutation.mutate(text);
  };

  const handleVoiceResult = (transcript) => {
    setMessage(transcript);
    sendMessage(transcript);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="w-8 h-8 text-aurora-400" /> AI Companion
        </h1>
        <p className="text-gray-400 mt-1">Your intelligent health assistant with voice support</p>
      </div>

      <GlassCard className="flex-1 flex flex-col overflow-hidden !p-0">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl aurora-bg mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hi, I'm Aurora!</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Tell me about your health activities and I'll track them automatically.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-aurora-500/20 rounded-br-md'
                      : 'bg-white/5 border border-white/10 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-aurora-400" />
                      <span className="text-xs text-aurora-400 font-medium">Aurora</span>
                      <TextToSpeech text={msg.content} />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.actions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.actions.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">
                          <Zap className="w-3 h-3" /> {a.action.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-md border border-white/10">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-aurora-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <VoiceInput onResult={handleVoiceResult} disabled={chatMutation.isPending} />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(message)}
              placeholder="Tell Aurora about your health..."
              className="input-field flex-1"
              disabled={chatMutation.isPending}
            />
            <button
              onClick={() => sendMessage(message)}
              disabled={!message.trim() || chatMutation.isPending}
              className="btn-primary !px-4"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
