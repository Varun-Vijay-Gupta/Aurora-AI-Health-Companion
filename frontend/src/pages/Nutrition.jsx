import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Utensils, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { nutritionApi } from '../services/api';
import GlassCard, { ProgressRing } from '../components/common/GlassCard';
import { CardSkeleton } from '../components/common/LoadingScreen';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MACRO_COLORS = ['#6366f1', '#06b6d4', '#f59e0b'];

export default function Nutrition() {
  const [form, setForm] = useState({
    mealName: '', mealType: 'lunch', calories: '', protein: '', carbs: '', fat: '',
  });
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-today'],
    queryFn: async () => {
      const { data } = await nutritionApi.getToday();
      return data.data;
    },
  });

  const { data: weekly } = useQuery({
    queryKey: ['nutrition-weekly'],
    queryFn: async () => {
      const { data } = await nutritionApi.getWeekly();
      return data.data;
    },
  });

  const logMutation = useMutation({
    mutationFn: (d) => nutritionApi.log({
      ...d,
      calories: +d.calories || 0,
      protein: +d.protein || 0,
      carbs: +d.carbs || 0,
      fat: +d.fat || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-today'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setForm({ mealName: '', mealType: 'lunch', calories: '', protein: '', carbs: '', fat: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => nutritionApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition-today'] }),
  });

  if (isLoading) return <CardSkeleton />;

  const macroData = [
    { name: 'Protein', value: data?.totals?.protein || 0 },
    { name: 'Carbs', value: data?.totals?.carbs || 0 },
    { name: 'Fat', value: data?.totals?.fat || 0 },
  ];

  const calPct = data?.goal ? ((data?.totals?.calories || 0) / data.goal) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Utensils className="w-8 h-8 text-amber-400" /> Nutrition
          </h1>
          <p className="text-gray-400 mt-1">Track meals and macros</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Meal
        </button>
      </div>

      {showForm && (
        <GlassCard>
          <form onSubmit={(e) => { e.preventDefault(); logMutation.mutate(form); }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.mealName} onChange={(e) => setForm({ ...form, mealName: e.target.value })} placeholder="Meal name" className="input-field" required />
            <select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })} className="input-field">
              {MEAL_TYPES.map((t) => <option key={t} value={t} className="bg-surface-100">{t}</option>)}
            </select>
            <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="Calories" className="input-field" />
            <input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} placeholder="Protein (g)" className="input-field" />
            <input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} placeholder="Carbs (g)" className="input-field" />
            <input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} placeholder="Fat (g)" className="input-field" />
            <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-3">Log Meal</button>
          </form>
        </GlassCard>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <GlassCard className="flex flex-col items-center py-6">
          <ProgressRing progress={calPct} label="Calories" sublabel={`${data?.totals?.calories || 0}/${data?.goal || 2000}`} />
        </GlassCard>

        <GlassCard className="lg:col-span-1">
          <h3 className="font-semibold mb-4 text-sm">Macros</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={4}>
                  {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
            {macroData.map((m, i) => (
              <span key={m.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[i] }} />
                {m.name}: {Math.round(m.value)}g
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Today's Meals</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {data?.logs?.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium text-sm">{log.mealName}</p>
                  <p className="text-xs text-gray-500 capitalize">{log.mealType} · {log.calories} cal · P:{log.protein}g C:{log.carbs}g F:{log.fat}g</p>
                </div>
                <button onClick={() => deleteMutation.mutate(log.id)} className="p-2 text-gray-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!data?.logs || data.logs.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-8">No meals logged today</p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-4">Weekly Calories</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly || []}>
              <XAxis dataKey="date" stroke="#666" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Bar dataKey="calories" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
