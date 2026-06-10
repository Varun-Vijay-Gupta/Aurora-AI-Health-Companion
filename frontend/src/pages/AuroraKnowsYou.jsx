import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Brain, RefreshCw, Droplets, Moon, Target, Utensils, Sparkles, TrendingUp
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { healthMemoryApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import { CardSkeleton } from '../components/common/LoadingScreen';

const CATEGORY_ICONS = {
  hydration: Droplets,
  sleep: Moon,
  habits: Target,
  nutrition: Utensils,
  general: Brain,
};

const CATEGORY_COLORS = {
  hydration: '#06b6d4',
  sleep: '#8b5cf6',
  habits: '#10b981',
  nutrition: '#f59e0b',
  general: '#6366f1',
};

export default function AuroraKnowsYou() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['health-memory-insights'],
    queryFn: async () => {
      const { data } = await healthMemoryApi.getInsights();
      return data.data;
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => healthMemoryApi.refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-memory-insights'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (isLoading) return <CardSkeleton />;

  const chartData = (data?.memories || [])
    .filter((m) => m.metricValue != null)
    .map((m) => ({
      name: m.title.slice(0, 12),
      value: m.metricValue,
      fill: CATEGORY_COLORS[m.category] || '#6366f1',
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-aurora-400" />
            Aurora Knows You
          </h1>
          <p className="text-gray-400 mt-1">Personalized insights from your health behavior patterns</p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh Memories
        </button>
      </div>

      {/* Personalized insights hero */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.personalized?.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard className="h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-aurora-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.content}</p>
                {item.metric != null && (
                  <p className="text-2xl font-bold gradient-text mt-3">
                    {Math.round(item.metric)}{item.unit}
                  </p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Memory chart */}
        <GlassCard className="lg:col-span-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-aurora-400" /> Health Metrics
          </h3>
          {chartData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="#666" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#666" fontSize={10} width={80} />
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">Log more health data to unlock charts</p>
          )}
        </GlassCard>

        {/* All memories */}
        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Health Memory Bank
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
            {(data?.memories || []).map((memory, i) => {
              const Icon = CATEGORY_ICONS[memory.category] || Brain;
              const color = CATEGORY_COLORS[memory.category] || '#6366f1';
              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{memory.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-500 capitalize">
                        {memory.period}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{memory.content}</p>
                    {memory.metricValue != null && (
                      <p className="text-sm font-semibold mt-2" style={{ color }}>
                        {Math.round(memory.metricValue * 10) / 10}{memory.metricUnit}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-600 shrink-0">
                    {memory.confidence}/5
                  </div>
                </motion.div>
              );
            })}
            {(!data?.memories || data.memories.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-12">
                Aurora is learning about you. Keep tracking to build your health memory.
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
