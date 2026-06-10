import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Check, Trash2, Edit2, X, Flame } from 'lucide-react';
import { habitsApi } from '../services/api';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/LoadingScreen';

const icons = ['✨', '🧘', '🏃', '📚', '💪', '🎯', '🌅', '💊', '🥗', '🧠'];
const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function Habits() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '✨', color: '#6366f1' });
  const queryClient = useQueryClient();

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data } = await habitsApi.getAll();
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => habitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => habitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => habitsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => habitsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', icon: '✨', color: '#6366f1' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-400" /> Habits
          </h1>
          <p className="text-gray-400 mt-1">Build consistency with daily habits</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editId ? 'Edit Habit' : 'Create Habit'}</h3>
                <button onClick={resetForm}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Habit name"
                  className="input-field"
                  required
                />
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="input-field"
                />
                <div className="flex gap-2 flex-wrap">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`p-2 rounded-lg text-lg ${form.icon === icon ? 'bg-aurora-500/20 ring-2 ring-aurora-500' : 'bg-white/5'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button type="submit" className="btn-primary">
                  {editId ? 'Update' : 'Create'} Habit
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {habits?.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No habits yet"
          description="Create your first habit to start building consistency"
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Create Habit</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits?.map((habit) => (
            <motion.div key={habit.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassCard className={`relative ${habit.completedToday ? 'border-emerald-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      {habit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{habit.name}</h3>
                      {habit.description && <p className="text-xs text-gray-500">{habit.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditId(habit.id); setForm(habit); setShowForm(true); }}
                      className="p-1.5 text-gray-500 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(habit.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {habit.streak && (
                  <div className="flex items-center gap-1 text-sm text-amber-400 mb-4">
                    <Flame className="w-4 h-4" />
                    {habit.streak.currentStreak} day streak
                  </div>
                )}

                <button
                  onClick={() => toggleMutation.mutate(habit.id)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    habit.completedToday
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {habit.completedToday ? (
                    <><Check className="w-4 h-4" /> Completed</>
                  ) : (
                    'Mark Complete'
                  )}
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
