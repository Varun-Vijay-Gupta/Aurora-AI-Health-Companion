import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Droplets, Moon, Target, Bot, Trophy } from 'lucide-react';
import { analyticsApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/LoadingScreen';

const typeIcons = {
  HYDRATION: Droplets,
  SLEEP: Moon,
  HABIT: Target,
  AI_INSIGHT: Bot,
  ACHIEVEMENT: Trophy,
  SYSTEM: Bell,
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await analyticsApi.getNotifications();
      return data.data;
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => analyticsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => analyticsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  if (isLoading) return <CardSkeleton />;

  const unread = notifications?.filter((n) => !n.read) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8 text-aurora-400" /> Notifications
          </h1>
          <p className="text-gray-400 mt-1">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {!notifications?.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <GlassCard
                key={n.id}
                className={`!p-4 cursor-pointer ${!n.read ? 'border-aurora-500/20' : 'opacity-60'}`}
                onClick={() => !n.read && markReadMutation.mutate(n.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${!n.read ? 'bg-aurora-500/10' : 'bg-white/5'}`}>
                    <Icon className={`w-5 h-5 ${!n.read ? 'text-aurora-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{n.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-aurora-500 mt-2" />}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
