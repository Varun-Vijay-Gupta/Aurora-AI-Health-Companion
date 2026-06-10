import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { analyticsApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import { CardSkeleton } from '../components/common/LoadingScreen';

export default function Achievements() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data } = await analyticsApi.getAchievements();
      return data.data;
    },
  });

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" /> Achievements
        </h1>
        <p className="text-gray-400 mt-1">
          {data?.earned?.length || 0} of {(data?.earned?.length || 0) + (data?.locked?.length || 0)} unlocked
        </p>
      </div>

      {data?.earned?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Earned</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.earned.map((ua, i) => (
              <motion.div
                key={ua.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="border-amber-500/20">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{ua.achievement.icon}</div>
                    <div>
                      <h3 className="font-semibold">{ua.achievement.name}</h3>
                      <p className="text-xs text-gray-400">{ua.achievement.description}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(ua.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {data?.locked?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-400">Locked</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.locked.map((ach) => (
              <GlassCard key={ach.id} className="opacity-50">
                <div className="flex items-center gap-4">
                  <div className="text-4xl grayscale">{ach.icon}</div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {ach.name} <Lock className="w-3 h-3" />
                    </h3>
                    <p className="text-xs text-gray-500">{ach.description}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
