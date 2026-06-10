import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { onboardingApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Bot, Droplets, Moon, Target, ArrowRight, ArrowLeft, Home
} from 'lucide-react';
import AuroraBackground from '../components/common/AuroraBackground';

const INTRO_SLIDES = [
  {
    icon: Sparkles,
    title: 'Meet Aurora',
    headline: 'Your AI Health Companion',
    description:
      'Aurora is an intelligent wellness platform that understands you — tracking hydration, sleep, habits, and nutrition while learning your unique patterns over time.',
    gradient: 'from-aurora-500 to-purple-600',
  },
  {
    icon: Bot,
    title: 'AI That Acts',
    headline: 'Just Say It, Aurora Logs It',
    description:
      'Tell Aurora "I drank 500ml water" or "I slept 7 hours" and it automatically updates your records. No taps, no forms — just natural conversation.',
    gradient: 'from-purple-500 to-cyan-500',
    demo: [
      { user: 'I drank 500ml water', ai: 'Logged 500ml 💧 You\'re at 74% of your goal!' },
      { user: 'Create a habit to meditate', ai: 'Created "Meditate" habit ✨' },
    ],
  },
  {
    icon: Droplets,
    title: 'Track Everything',
    headline: 'One Dashboard, Complete Picture',
    description:
      'Beautiful analytics for hydration, sleep quality, habit streaks, and nutrition — all powered by real-time health scoring and weekly trend insights.',
    gradient: 'from-cyan-500 to-aurora-500',
    features: ['Hydration tracking', 'Sleep analytics', 'Habit streaks', 'Nutrition macros'],
  },
  {
    icon: Target,
    title: 'Built For You',
    headline: 'Personalized From Day One',
    description:
      'Next, we\'ll ask a few quick questions to tailor Aurora to your body, schedule, and goals. It only takes a minute — and you can change everything later.',
    gradient: 'from-emerald-500 to-aurora-500',
    cta: true,
  },
];

export default function AuroraIntro() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  const { data: status } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const { data } = await onboardingApi.getStatus();
      return data.data;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (status?.onboardingDone) {
      if (!status.healthSetupDone) {
        sessionStorage.setItem('aurora_pending_health_setup', 'true');
        navigate('/health-setup', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [status, navigate]);
  const current = INTRO_SLIDES[slide];
  const Icon = current.icon;
  const isLast = slide === INTRO_SLIDES.length - 1;

  const goToOnboarding = () => {
    sessionStorage.setItem('aurora_intro_seen', 'true');
    navigate('/onboarding');
  };

  const exitToHome = () => {
    sessionStorage.setItem('aurora_skip_onboarding', 'true');
    sessionStorage.removeItem('aurora_new_signup');
    sessionStorage.removeItem('aurora_pending_health_setup');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <AuroraBackground />

      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={exitToHome}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {INTRO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === slide ? 'w-8 bg-aurora-500' : i < slide ? 'w-4 bg-aurora-500/50' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="glass p-8 sm:p-10 text-center relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${current.gradient} opacity-5`} />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${current.gradient} mx-auto mb-6 flex items-center justify-center shadow-glow`}
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>

              <p className="text-aurora-400 text-sm font-medium mb-2">{current.title}</p>
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">{current.headline}</h1>
              <p className="text-gray-400 leading-relaxed mb-8 max-w-md mx-auto">{current.description}</p>

              {current.demo && (
                <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
                  {current.demo.map((msg, i) => (
                    <div key={i}>
                      <div className="flex justify-end mb-1.5">
                        <span className="px-3 py-1.5 rounded-2xl rounded-br-md bg-aurora-500/20 text-xs">{msg.user}</span>
                      </div>
                      <div className="flex justify-start">
                        <span className="px-3 py-1.5 rounded-2xl rounded-bl-md bg-white/5 border border-white/10 text-xs text-gray-300">{msg.ai}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {current.features && (
                <div className="grid grid-cols-2 gap-2 mb-8 max-w-xs mx-auto">
                  {current.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs text-gray-300">
                      <Moon className="w-3.5 h-3.5 text-aurora-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setSlide((s) => Math.max(0, s - 1))}
                  disabled={slide === 0}
                  className="btn-secondary !px-4 !py-2 text-sm flex items-center gap-2 disabled:opacity-30"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    onClick={goToOnboarding}
                    className="btn-primary flex items-center gap-2"
                  >
                    Personalize Aurora <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSlide((s) => s + 1)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isLast && (
                <button
                  type="button"
                  onClick={goToOnboarding}
                  className="mt-4 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Skip intro
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
