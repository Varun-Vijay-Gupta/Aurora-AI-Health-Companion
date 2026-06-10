import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets, Moon, Target, Utensils, Bot, Trophy, Sparkles, ArrowRight, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../services/api';
import GlassCard, { StatCard, ProgressRing } from '../components/common/GlassCard';
import { CardSkeleton } from '../components/common/LoadingScreen';
import {
  ProfileCompletionWidget, HealthProfileWidget, LifestyleWidget,
  HealthGoalsWidget, MemoryHighlightsWidget, NotificationPrefsWidget
} from '../components/dashboard/ProfileWidgets';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await dashboardApi.get();
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const chartData = data?.weeklyTrends?.sleep?.map((s, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || `D${i + 1}`,
    sleep: s.hours,
    water: data?.weeklyTrends?.water?.[i]?._sum?.amount / 100 || Math.random() * 30,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-bold"
        >
          {data?.greeting}, {data?.user?.name?.split(' ')[0]} 👋
        </motion.h1>
        <p className="text-gray-400 mt-1">Here's your health overview for today</p>
      </div>

      {/* AI Insight Banner */}
      {data?.aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 flex items-center gap-4 border-aurora-500/20"
        >
          <div className="p-2 rounded-xl bg-aurora-500/10">
            <Sparkles className="w-5 h-5 text-aurora-400" />
          </div>
          <p className="text-sm flex-1">{data.aiInsight}</p>
          <Link to="/ai" className="text-aurora-400 text-sm flex items-center gap-1 hover:text-aurora-300">
            Ask Aurora <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Profile & Memory Widgets */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProfileCompletionWidget
          completion={data?.profile?.completion}
          breakdown={data?.profile?.breakdown}
        />
        <HealthProfileWidget profile={data?.profile} />
        <LifestyleWidget lifestyle={data?.profile?.lifestyle} />
        <HealthGoalsWidget goals={data?.profile?.goals} />
        <MemoryHighlightsWidget memories={data?.memoryHighlights} />
        <NotificationPrefsWidget notifications={data?.profile?.notifications} />
      </div>

      {/* Health Score + Stats */}
      <div className="grid lg:grid-cols-5 gap-6">
        <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center">
          <ProgressRing
            progress={data?.healthScore?.score || 0}
            label="Health Score"
            sublabel={`${data?.healthScore?.score || 0}/100`}
          />
          <div className="grid grid-cols-2 gap-2 mt-4 w-full text-center text-xs">
            {Object.entries(data?.healthScore?.breakdown || {}).map(([key, val]) => (
              <div key={key} className="p-2 rounded-lg bg-white/5">
                <p className="text-gray-500 capitalize">{key}</p>
                <p className="font-semibold">{val}%</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="lg:col-span-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Droplets}
            label="Hydration"
            value={`${data?.hydration?.current || 0}ml`}
            subValue={`${Math.round(data?.hydration?.percentage || 0)}% of goal`}
            color="cyan"
          />
          <StatCard
            icon={Moon}
            label="Sleep"
            value={`${data?.sleep?.hours || 0}h`}
            subValue={`Goal: ${data?.sleep?.goal || 8}h`}
            color="purple"
          />
          <StatCard
            icon={Target}
            label="Habits"
            value={`${data?.habits?.completed || 0}/${data?.habits?.total || 0}`}
            subValue={`${data?.habits?.rate || 0}% complete`}
            color="emerald"
          />
          <StatCard
            icon={Utensils}
            label="Nutrition"
            value={`${data?.nutrition?.calories || 0}`}
            subValue={`/ ${data?.nutrition?.goal || 2000} cal`}
            color="amber"
          />
        </div>
      </div>

      {/* Chart + Habits */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-aurora-400" /> Weekly Trends
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="sleep" stroke="#8b5cf6" fill="url(#sleepGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Today's Habits</h3>
          <div className="space-y-3">
            {data?.habits?.items?.slice(0, 5).map((habit) => (
              <div
                key={habit.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  habit.completedToday ? 'bg-emerald-500/10' : 'bg-white/5'
                }`}
              >
                <span className="text-lg">{habit.icon}</span>
                <span className="flex-1 text-sm">{habit.name}</span>
                {habit.completedToday && (
                  <span className="text-emerald-400 text-xs">Done</span>
                )}
              </div>
            ))}
            {(!data?.habits?.items || data.habits.items.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No habits yet</p>
            )}
          </div>
          <Link to="/habits" className="btn-secondary w-full mt-4 text-sm py-2 text-center block">
            Manage Habits
          </Link>
        </GlassCard>
      </div>

      {/* Achievements + AI CTA */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">Recent Achievements</h3>
          </div>
          <div className="space-y-3">
            {data?.achievements?.slice(0, 3).map((ua) => (
              <div key={ua.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="text-2xl">{ua.achievement.icon}</span>
                <div>
                  <p className="text-sm font-medium">{ua.achievement.name}</p>
                  <p className="text-xs text-gray-500">{ua.achievement.description}</p>
                </div>
              </div>
            ))}
            {(!data?.achievements || data.achievements.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Complete activities to earn badges!</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="absolute inset-0 aurora-bg opacity-5" />
          <div className="relative">
            <Bot className="w-10 h-10 text-aurora-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Talk to Aurora AI</h3>
            <p className="text-gray-400 text-sm mb-6">
              "I drank 500ml water" — Aurora understands and logs it automatically.
            </p>
            <Link to="/ai" className="btn-primary inline-flex items-center gap-2">
              Open AI Companion <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
