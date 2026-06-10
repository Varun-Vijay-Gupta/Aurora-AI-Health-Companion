import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import { CardSkeleton } from '../components/common/LoadingScreen';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await analyticsApi.get();
      return data.data;
    },
  });

  const handleDownload = async () => {
    try {
      const response = await analyticsApi.downloadReport();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aurora-health-report.pdf';
      link.click();
    } catch {
      alert('Failed to download report');
    }
  };

  if (isLoading) return <CardSkeleton />;

  const hydrationChart = data?.hydration?.map((d) => ({
    date: d.date.slice(5),
    amount: d.value / 1000,
  })) || [];

  const sleepChart = data?.sleep || [];
  const nutritionChart = data?.nutrition?.map((d) => ({
    date: d.date.slice(5),
    calories: d.value,
  })) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-aurora-400" /> Analytics
          </h1>
          <p className="text-gray-400 mt-1">Your health data visualized</p>
        </div>
        <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-sm text-gray-400">Health Score</p>
          <p className="text-3xl font-bold gradient-text mt-1">{data?.healthScore || 75}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400">Habit Completions (30d)</p>
          <p className="text-3xl font-bold mt-1">{data?.habits?.totalCompletions || 0}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400">This Week</p>
          <p className="text-3xl font-bold mt-1">{data?.habits?.weeklyCompletions || 0}</p>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-4">Hydration Trends (Liters)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hydrationChart}>
                <defs>
                  <linearGradient id="hydGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" fill="url(#hydGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Sleep Patterns</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepChart}>
                <XAxis dataKey="date" stroke="#666" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#666" fontSize={12} domain={[0, 12]} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} name="Hours" dot={false} />
                <Line type="monotone" dataKey="quality" stroke="#f59e0b" strokeWidth={2} name="Quality" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Nutrition (Calories)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nutritionChart}>
                <XAxis dataKey="date" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="calories" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
