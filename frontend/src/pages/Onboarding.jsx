import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Heart, Ruler, Clock, Activity, Target, Bell,
  ArrowRight, ArrowLeft, Check, Home
} from 'lucide-react';
import { onboardingApi } from '../services/api';
import { useAuthStore } from '../store';
import AuroraBackground from '../components/common/AuroraBackground';

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
  { id: 'active', label: 'Very Active', desc: '6-7 days/week' },
  { id: 'athlete', label: 'Athlete', desc: 'Intense daily training' },
];

const HEALTH_GOALS = [
  'Lose Weight', 'Build Muscle', 'Better Sleep', 'Stay Hydrated',
  'Reduce Stress', 'Eat Healthier', 'Build Habits', 'General Wellness',
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const STEP_META = [
  { icon: User, title: 'About You', subtitle: 'Tell us your name' },
  { icon: Heart, title: 'Basic Info', subtitle: 'Age and gender' },
  { icon: Ruler, title: 'Body Metrics', subtitle: 'Height and weight' },
  { icon: Clock, title: 'Sleep Schedule', subtitle: 'When do you wake and sleep?' },
  { icon: Activity, title: 'Activity Level', subtitle: 'How active are you?' },
  { icon: Target, title: 'Health Goals', subtitle: 'What do you want to achieve?' },
  { icon: Bell, title: 'Notifications', subtitle: 'Stay on track with reminders' },
];

export default function Onboarding() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    wakeTime: '07:00',
    bedTime: '23:00',
    activityLevel: '',
    healthGoals: [],
    notifyHydration: true,
    notifySleep: true,
    notifyHabits: true,
    notifyAiInsights: true,
  });

  const totalSteps = STEP_META.length;
  const isLast = step === totalSteps - 1;

  const toggleGoal = (goal) => {
    setForm((f) => ({
      ...f,
      healthGoals: f.healthGoals.includes(goal)
        ? f.healthGoals.filter((g) => g !== goal)
        : [...f.healthGoals, goal],
    }));
  };

  const canContinue = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return form.age && form.gender;
      case 2: return form.height && form.weight;
      case 3: return form.wakeTime && form.bedTime;
      case 4: return !!form.activityLevel;
      case 5: return form.healthGoals.length > 0;
      default: return true;
    }
  };

  const finish = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await onboardingApi.complete({
        ...form,
        age: parseInt(form.age, 10),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
      });
      if (data.data?.user) {
        updateUser({ ...user, ...data.data.user });
      }
      sessionStorage.setItem('aurora_intro_seen', 'true');
      sessionStorage.removeItem('aurora_new_signup');
      sessionStorage.setItem('aurora_pending_health_setup', 'true');
      queryClient.setQueryData(['onboarding-status'], (prev) => ({
        ...prev,
        onboardingDone: true,
        healthSetupDone: prev?.healthSetupDone ?? false,
      }));
      await queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      navigate('/health-setup', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  const exitToHome = () => {
    sessionStorage.setItem('aurora_skip_onboarding', 'true');
    sessionStorage.removeItem('aurora_new_signup');
    sessionStorage.removeItem('aurora_pending_health_setup');
    navigate('/dashboard', { replace: true });
  };

  const Meta = STEP_META[step];
  const Icon = Meta.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <AuroraBackground />
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            type="button"
            onClick={exitToHome}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </button>
          <span className="text-sm gradient-text font-medium">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-sm text-gray-500">Step {step + 1} of {totalSteps}</span>
          <button
            type="button"
            onClick={exitToHome}
            className="text-xs text-gray-500 hover:text-aurora-400 transition-colors"
          >
            Skip for now
          </button>
        </div>
        <div className="flex gap-1.5 mb-8">
          {STEP_META.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-gradient-to-r from-aurora-500 to-cyan-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="glass p-6 sm:p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-aurora-500/15 flex items-center justify-center">
                <Icon className="w-6 h-6 text-aurora-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{Meta.title}</h2>
                <p className="text-sm text-gray-400">{Meta.subtitle}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="min-h-[200px]">
              {step === 0 && (
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="input-field text-lg"
                  autoFocus
                />
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Age</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      placeholder="25"
                      className="input-field mt-1"
                      min={1}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm({ ...form, gender: g })}
                          className={`p-3 rounded-xl text-sm transition-all ${
                            form.gender === g
                              ? 'bg-aurora-500/20 border border-aurora-500/40 text-aurora-300'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Height (cm)</label>
                    <input
                      type="number"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                      placeholder="170"
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Weight (kg)</label>
                    <input
                      type="number"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      placeholder="70"
                      className="input-field mt-1"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Wake-up Time</label>
                    <input
                      type="time"
                      value={form.wakeTime}
                      onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Bedtime</label>
                    <input
                      type="time"
                      value={form.bedTime}
                      onChange={(e) => setForm({ ...form, bedTime: e.target.value })}
                      className="input-field mt-1"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setForm({ ...form, activityLevel: level.label })}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        form.activityLevel === level.label
                          ? 'bg-aurora-500/20 border border-aurora-500/40'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <p className="font-medium text-sm">{level.label}</p>
                      <p className="text-xs text-gray-500">{level.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-wrap gap-2">
                  {HEALTH_GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        form.healthGoals.includes(goal)
                          ? 'bg-aurora-500/25 border border-aurora-500/50 text-aurora-300'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3">
                  {[
                    { key: 'notifyHydration', label: 'Hydration Reminders', desc: 'Gentle nudges to drink water' },
                    { key: 'notifySleep', label: 'Sleep Reminders', desc: 'Wind-down alerts before bedtime' },
                    { key: 'notifyHabits', label: 'Habit Reminders', desc: 'Daily habit check-in prompts' },
                    { key: 'notifyAiInsights', label: 'AI Insights', desc: 'Personalized health tips from Aurora' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={form[item.key]}
                        onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                        className="w-5 h-5 rounded accent-aurora-500"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="btn-secondary !px-4 !py-2 text-sm flex items-center gap-2 disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!canContinue() || loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? 'Saving...' : isLast ? (
                  <><Check className="w-4 h-4" /> Complete</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
