import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Clock, Activity, Target, Brain, ArrowRight, Bell, Watch
} from 'lucide-react';
import GlassCard, { ProgressRing } from '../common/GlassCard';

const TRACKING_LABELS = {
  manual: 'Manual Entry',
  fitbit: 'Fitbit',
  apple_health: 'Apple Health',
  garmin: 'Garmin',
  health_connect: 'Health Connect',
};

export function ProfileCompletionWidget({ completion, breakdown }) {
  return (
    <GlassCard>
      <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Profile Completion</h3>
      <div className="flex items-center gap-6">
        <ProgressRing progress={completion || 0} size={100} strokeWidth={6} label="Complete" />
        <div className="flex-1 space-y-1.5">
          {breakdown && Object.entries(breakdown).slice(0, 5).map(([key, done]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${done ? 'bg-emerald-400' : 'bg-white/20'}`} />
              <span className={done ? 'text-gray-300' : 'text-gray-600'}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              </span>
            </div>
          ))}
          {(completion || 0) < 100 && (
            <Link to="/settings" className="text-aurora-400 text-xs flex items-center gap-1 mt-2 hover:text-aurora-300">
              Complete profile <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export function HealthProfileWidget({ profile }) {
  const hp = profile?.healthProfile;
  if (!hp) return null;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-aurora-400" /> Health Profile
        </h3>
        <Link to="/health-setup" className="text-aurora-400 text-xs flex items-center gap-1 hover:text-aurora-300">
          Edit <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-gray-500 text-xs">Age</p>
          <p className="font-medium">{hp.age ?? '—'}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-gray-500 text-xs">Gender</p>
          <p className="font-medium">{hp.gender || '—'}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-gray-500 text-xs">Height</p>
          <p className="font-medium">{hp.height ? `${hp.height} cm` : '—'}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-gray-500 text-xs">Weight</p>
          <p className="font-medium">{hp.weight ? `${hp.weight} kg` : '—'}</p>
        </div>
      </div>
    </GlassCard>
  );
}

export function LifestyleWidget({ lifestyle }) {
  if (!lifestyle) return null;

  return (
    <GlassCard>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-400" /> Lifestyle
      </h3>
      <div className="space-y-3 text-sm">
        {lifestyle.wakeTime && (
          <div className="flex justify-between p-3 rounded-xl bg-white/5">
            <span className="text-gray-400">Wake-up</span>
            <span className="font-medium">{lifestyle.wakeTime}</span>
          </div>
        )}
        {lifestyle.bedTime && (
          <div className="flex justify-between p-3 rounded-xl bg-white/5">
            <span className="text-gray-400">Bedtime</span>
            <span className="font-medium">{lifestyle.bedTime}</span>
          </div>
        )}
        {lifestyle.activityLevel && (
          <div className="flex justify-between p-3 rounded-xl bg-white/5">
            <span className="text-gray-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Activity</span>
            <span className="font-medium text-right text-xs">{lifestyle.activityLevel}</span>
          </div>
        )}
        {lifestyle.trackingMethod && (
          <div className="flex justify-between p-3 rounded-xl bg-white/5">
            <span className="text-gray-400 flex items-center gap-1"><Watch className="w-3 h-3" /> Tracking</span>
            <span className="font-medium text-xs">{TRACKING_LABELS[lifestyle.trackingMethod] || lifestyle.trackingMethod}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function HealthGoalsWidget({ goals }) {
  if (!goals?.length) return null;

  return (
    <GlassCard>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-emerald-400" /> Health Goals
      </h3>
      <div className="flex flex-wrap gap-2">
        {goals.map((goal) => (
          <span
            key={goal}
            className="px-3 py-1.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          >
            {goal}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

export function MemoryHighlightsWidget({ memories }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-500/5 to-purple-500/5" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-aurora-400" /> AI Memory Highlights
          </h3>
          <Link to="/aurora-knows-you" className="text-aurora-400 text-xs hover:text-aurora-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {(memories || []).slice(0, 3).map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <p className="text-xs font-medium text-aurora-300">{m.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{m.content}</p>
            </motion.div>
          ))}
          {(!memories || memories.length === 0) && (
            <p className="text-gray-500 text-xs text-center py-4">
              Aurora is learning your patterns. <Link to="/aurora-knows-you" className="text-aurora-400">Explore insights</Link>
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export function NotificationPrefsWidget({ notifications }) {
  if (!notifications) return null;

  const items = [
    { key: 'hydration', label: 'Hydration', on: notifications.hydration },
    { key: 'sleep', label: 'Sleep', on: notifications.sleep },
    { key: 'habits', label: 'Habits', on: notifications.habits },
    { key: 'aiInsights', label: 'AI Insights', on: notifications.aiInsights },
  ];

  return (
    <GlassCard>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Bell className="w-4 h-4 text-gray-400" /> Notifications Active
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.key}
            className={`px-2.5 py-1 rounded-full text-[10px] ${
              item.on ? 'bg-aurora-500/15 text-aurora-400' : 'bg-white/5 text-gray-600'
            }`}
          >
            {item.label} {item.on ? '✓' : '✗'}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
