import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, User, Target, Save, Ruler } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, aiApi } from '../services/api';
import { useAuthStore, useThemeStore } from '../store';
import GlassCard from '../components/common/GlassCard';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const profile = user?.healthProfile || {};

  const [form, setForm] = useState({
    name: user?.name || '',
    age: profile.age || '',
    gender: profile.gender || '',
    height: profile.height || '',
    weight: profile.weight || '',
    wakeTime: profile.wakeTime || '',
    bedTime: profile.bedTime || '',
    activityLevel: profile.activityLevel || '',
    dailyWaterGoal: profile.dailyWaterGoal || 2500,
    dailySleepGoal: profile.dailySleepGoal || 8,
    dailyCalorieGoal: profile.dailyCalorieGoal || 2000,
    trackingMethod: profile.trackingMethod || 'manual',
    notifyHydration: profile.notifyHydration ?? true,
    notifySleep: profile.notifySleep ?? true,
    notifyHabits: profile.notifyHabits ?? true,
    notifyAiInsights: profile.notifyAiInsights ?? true,
  });

  const [weeklySummary, setWeeklySummary] = useState(null);

  const updateMutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const summaryMutation = useMutation({
    mutationFn: () => aiApi.getWeeklySummary(),
    onSuccess: (response) => setWeeklySummary(response.data.data),
  });

  const handleSave = () => {
    updateMutation.mutate({
      ...form,
      age: form.age ? parseInt(form.age, 10) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-gray-400" /> Settings
        </h1>
        <p className="text-gray-400 mt-1">Manage your profile and preferences</p>
      </div>

      <GlassCard>
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-aurora-400" /> Profile
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <input value={user?.email || ''} disabled className="input-field mt-1 opacity-50" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Gender</label>
            <input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Wake-up</label>
              <input type="time" value={form.wakeTime} onChange={(e) => setForm({ ...form, wakeTime: e.target.value })} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Bedtime</label>
              <input type="time" value={form.bedTime} onChange={(e) => setForm({ ...form, bedTime: e.target.value })} className="input-field mt-1" />
            </div>
          </div>
          {profile.profileCompletion != null && (
            <p className="text-sm text-aurora-400">Profile {profile.profileCompletion}% complete</p>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Ruler className="w-5 h-5 text-purple-400" /> Body Metrics
        </h3>
        <p className="text-xs text-gray-500 mb-4">Update your age, height, and weight anytime.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400">Age</label>
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
            <label className="text-sm text-gray-400">Height (cm)</label>
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
            <label className="text-sm text-gray-400">Weight (kg)</label>
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
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-emerald-400" /> Daily Goals
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400">Water (ml)</label>
            <input
              type="number"
              value={form.dailyWaterGoal}
              onChange={(e) => setForm({ ...form, dailyWaterGoal: +e.target.value })}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Sleep (hours)</label>
            <input
              type="number"
              step="0.5"
              value={form.dailySleepGoal}
              onChange={(e) => setForm({ ...form, dailySleepGoal: +e.target.value })}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Calories</label>
            <input
              type="number"
              value={form.dailyCalorieGoal}
              onChange={(e) => setForm({ ...form, dailyCalorieGoal: +e.target.value })}
              className="input-field mt-1"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold mb-4">Appearance</h3>
        <div className="flex gap-3">
          {['dark', 'light'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-xl capitalize transition-colors ${
                theme === t ? 'bg-aurora-500/20 text-aurora-400 border border-aurora-500/30' : 'bg-white/5 text-gray-400'
              }`}
            >
              {t} mode
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold mb-4">AI Weekly Summary</h3>
        <button
          onClick={() => summaryMutation.mutate()}
          disabled={summaryMutation.isPending}
          className="btn-secondary text-sm mb-4"
        >
          {summaryMutation.isPending ? 'Generating...' : 'Generate Summary'}
        </button>
        {weeklySummary && (
          <p className="text-sm text-gray-300 p-4 rounded-xl bg-white/5">{weeklySummary.summary}</p>
        )}
      </GlassCard>

      <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
