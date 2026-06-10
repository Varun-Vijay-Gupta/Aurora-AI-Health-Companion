import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { sleepApi } from '../services/api';
import GlassCard, { ProgressRing } from '../components/common/GlassCard';
import { CardSkeleton } from '../components/common/LoadingScreen';

export default function Sleep() {
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(3);
  const queryClient = useQueryClient();

  const { data: today, isLoading } = useQuery({
    queryKey: ['sleep-today'],
    queryFn: async () => {
      const { data } = await sleepApi.getToday();
      return data.data;
    },
  });

  const { data: weekly } = useQuery({
    queryKey: ['sleep-weekly'],
    queryFn: async () => {
      const { data } = await sleepApi.getWeekly();
      return data.data;
    },
  });

  const { data: monthly } = useQuery({
    queryKey: ['sleep-monthly'],
    queryFn: async () => {
      const { data } = await sleepApi.getMonthly();
      return data.data;
    },
  });

  const logMutation = useMutation({
    mutationFn: (data) => sleepApi.log(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-today'] });
      queryClient.invalidateQueries({ queryKey: ['sleep-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['sleep-monthly'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setHours('');
    },
  });

  if (isLoading) return <CardSkeleton />;

  const weeklyChart = weekly?.map((s) => ({
    date: new Date(s.loggedAt).toLocaleDateString([], { weekday: 'short' }),
    hours: s.hours,
    quality: s.quality,
  })) || [];

  const sleepPct = today?.goal ? ((today?.log?.hours || 0) / today.goal) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Moon className="w-8 h-8 text-purple-400" /> Sleep Tracking
        </h1>
        <p className="text-gray-400 mt-1">Monitor your rest and recovery</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col items-center py-6">
          <ProgressRing progress={sleepPct} label="Tonight" sublabel={`${today?.log?.hours || 0}h / ${today?.goal || 8}h`} />
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Log Sleep</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400">Hours slept</label>
              <input
                type="number"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="7.5"
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Quality (1-5)</label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`p-2 rounded-lg transition-colors ${
                      quality >= q ? 'text-amber-400' : 'text-gray-600'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${quality >= q ? 'fill-amber-400' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => hours && logMutation.mutate({ hours: +hours, quality })}
            disabled={!hours || logMutation.isPending}
            className="btn-primary"
          >
            Log Sleep
          </button>
        </GlassCard>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-sm text-gray-400">Avg Hours (30d)</p>
          <p className="text-2xl font-bold mt-1">{monthly?.avgHours?.toFixed(1) || '—'}h</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400">Avg Quality</p>
          <p className="text-2xl font-bold mt-1">{monthly?.avgQuality?.toFixed(1) || '—'}/5</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400">Consistency Score</p>
          <p className="text-2xl font-bold mt-1 gradient-text">{monthly?.consistency || '—'}%</p>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-4">Weekly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChart}>
                <defs>
                  <linearGradient id="sleepArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} domain={[0, 12]} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fill="url(#sleepArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Quality Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChart}>
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} domain={[0, 5]} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="quality" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
