import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Droplets, Target, Watch, Smartphone, Activity, Check, Sparkles, Ruler
} from 'lucide-react';
import { onboardingApi } from '../services/api';

const TRACKING_METHODS = [
  { id: 'manual', label: 'Manual Entry', icon: Smartphone, desc: 'Log data yourself in Aurora' },
  { id: 'fitbit', label: 'Fitbit', icon: Watch, desc: 'Sync from Fitbit devices' },
  { id: 'apple_health', label: 'Apple Health', icon: Activity, desc: 'Connect Apple HealthKit' },
  { id: 'garmin', label: 'Garmin', icon: Watch, desc: 'Sync Garmin wearables' },
  { id: 'health_connect', label: 'Health Connect', icon: Activity, desc: 'Android Health Connect' },
];

const HABIT_SUGGESTIONS = ['Meditate', 'Morning Walk', 'Drink Water', 'Read', 'Stretch', 'Journal'];

export default function HealthDataSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    age: '',
    height: '',
    weight: '',
    dailyWaterGoal: 2500,
    dailySleepGoal: 8,
    dailyCalorieGoal: 2000,
    trackingMethod: 'manual',
    firstHabitName: '',
    firstHabitIcon: '✨',
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const { data } = await onboardingApi.getStatus();
      return data.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Pre-fill form from saved profile
  useEffect(() => {
    const profile = status?.profile;
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      age: profile.age ?? prev.age,
      height: profile.height ?? prev.height,
      weight: profile.weight ?? prev.weight,
      dailyWaterGoal: profile.dailyWaterGoal ?? prev.dailyWaterGoal,
      dailySleepGoal: profile.dailySleepGoal ?? prev.dailySleepGoal,
      dailyCalorieGoal: profile.dailyCalorieGoal ?? prev.dailyCalorieGoal,
      trackingMethod: profile.trackingMethod ?? prev.trackingMethod,
    }));
  }, [status?.profile]);

  // Only redirect during mandatory first-time signup flow — never block sidebar access
  useEffect(() => {
    if (statusLoading || !status) return;

    if (!status.onboardingDone) {
      navigate('/onboarding', { replace: true });
      return;
    }

    const pendingSetup = sessionStorage.getItem('aurora_pending_health_setup') === 'true';
    if (status.healthSetupDone && pendingSetup) {
      sessionStorage.removeItem('aurora_pending_health_setup');
      navigate('/dashboard', { replace: true });
    }
  }, [status, statusLoading, navigate]);

  const finish = async () => {
    setLoading(true);
    setError('');
    try {
      await onboardingApi.healthSetup({
        age: form.age ? parseInt(form.age, 10) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        dailyWaterGoal: form.dailyWaterGoal,
        dailySleepGoal: form.dailySleepGoal,
        dailyCalorieGoal: form.dailyCalorieGoal,
        trackingMethod: form.trackingMethod,
        ...(form.firstHabitName && {
          firstHabit: { name: form.firstHabitName, icon: form.firstHabitIcon },
        }),
      });
      sessionStorage.removeItem('aurora_new_signup');
      sessionStorage.removeItem('aurora_pending_health_setup');
      queryClient.setQueryData(['onboarding-status'], (prev) => ({
        ...prev,
        onboardingDone: true,
        healthSetupDone: true,
      }));
      await queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save health setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-xl aurora-bg animate-pulse" />
      </div>
    );
  }

  const isEditing = status?.healthSetupDone;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center sm:text-left"
      >
        <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
          <div className="w-12 h-12 rounded-2xl aurora-bg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Health Data Setup</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {isEditing ? 'Update your daily targets and tracking preferences' : 'Configure your wellness goals'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-purple-400" /> Body Metrics
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400">Age</label>
              <input
                type="number"
                min={1}
                max={120}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="25"
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Height (cm)</label>
              <input
                type="number"
                min={50}
                max={300}
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="170"
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Weight (kg)</label>
              <input
                type="number"
                min={20}
                max={500}
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="70"
                className="input-field mt-1"
              />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" /> Daily Goals
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400">Water (ml)</label>
              <input
                type="number"
                value={form.dailyWaterGoal}
                onChange={(e) => setForm({ ...form, dailyWaterGoal: +e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                value={form.dailySleepGoal}
                onChange={(e) => setForm({ ...form, dailySleepGoal: +e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Calories</label>
              <input
                type="number"
                value={form.dailyCalorieGoal}
                onChange={(e) => setForm({ ...form, dailyCalorieGoal: +e.target.value })}
                className="input-field mt-1"
              />
            </div>
          </div>
        </motion.div>

        {!isEditing && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Your First Habit
            </h3>
            <input
              value={form.firstHabitName}
              onChange={(e) => setForm({ ...form, firstHabitName: e.target.value })}
              placeholder="e.g. Meditate for 10 minutes"
              className="input-field mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {HABIT_SUGGESTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setForm({ ...form, firstHabitName: h })}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    form.firstHabitName === h
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-6">
          <h3 className="font-semibold mb-4">Preferred Tracking Method</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {TRACKING_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setForm({ ...form, trackingMethod: method.id })}
                  className={`p-4 rounded-xl text-left transition-all ${
                    form.trackingMethod === method.id
                      ? 'bg-aurora-500/20 border border-aurora-500/40 shadow-glow'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${form.trackingMethod === method.id ? 'text-aurora-400' : 'text-gray-400'}`} />
                  <p className="font-medium text-sm">{method.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                </button>
              );
            })}
          </div>
          {form.trackingMethod !== 'manual' && (
            <p className="text-xs text-amber-400/80 mt-3 p-3 rounded-lg bg-amber-500/10">
              Device sync coming soon — manual tracking is fully active now.
            </p>
          )}
        </motion.div>

        {error && (
          <p className="text-red-400 text-sm text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            {error}
          </p>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={finish}
          disabled={loading}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg"
        >
          {loading ? 'Saving...' : (
            <><Check className="w-5 h-5" /> {isEditing ? 'Save Changes' : 'Launch Dashboard'}</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
