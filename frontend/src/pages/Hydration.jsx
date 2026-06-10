import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Droplets, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { waterApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import { WaterBottle } from '../components/common/VoiceAssistant';
import { CardSkeleton } from '../components/common/LoadingScreen';
import EmptyState from '../components/common/EmptyState';

const quickAmounts = [250, 500, 750, 1000];

export default function Hydration() {
  const [customAmount, setCustomAmount] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['water-today'],
    queryFn: async () => {
      const { data } = await waterApi.getToday();
      return data.data;
    },
  });

  const { data: weekly } = useQuery({
    queryKey: ['water-weekly'],
    queryFn: async () => {
      const { data } = await waterApi.getWeekly();
      return data.data;
    },
  });

  const logMutation = useMutation({
    mutationFn: (amount) => waterApi.log({ amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-today'] });
      queryClient.invalidateQueries({ queryKey: ['water-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCustomAmount('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => waterApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (isLoading) return <CardSkeleton />;

  const percentage = data?.goal ? (data.total / data.goal) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Droplets className="w-8 h-8 text-cyan-400" /> Hydration
        </h1>
        <p className="text-gray-400 mt-1">Track your daily water intake</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1 flex flex-col items-center py-8">
          <WaterBottle percentage={percentage} />
          <p className="mt-10 text-2xl font-bold">{data?.total || 0}ml</p>
          <p className="text-gray-400 text-sm">of {data?.goal || 2500}ml goal</p>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Quick Add</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {quickAmounts.map((amount) => (
              <motion.button
                key={amount}
                whileTap={{ scale: 0.95 }}
                onClick={() => logMutation.mutate(amount)}
                disabled={logMutation.isPending}
                className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-center"
              >
                <Plus className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <span className="text-sm font-medium">{amount}ml</span>
              </motion.button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount (ml)"
              className="input-field flex-1"
            />
            <button
              onClick={() => customAmount && logMutation.mutate(+customAmount)}
              disabled={!customAmount || logMutation.isPending}
              className="btn-primary"
            >
              Add
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-4">Weekly Progress</h3>
          <div className="h-64">
            {weekly?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <XAxis dataKey="date" stroke="#666" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="amount" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Droplets} title="No data yet" description="Start logging water to see trends" />
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Today's Logs</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {data?.logs?.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium">{log.amount}ml</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(log.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!data?.logs || data.logs.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-8">No logs today</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
