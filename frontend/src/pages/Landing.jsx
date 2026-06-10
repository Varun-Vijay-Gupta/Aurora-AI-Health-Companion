import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Droplets, Moon, Target, Bot, BarChart3,
  ArrowRight, Star, Users, Shield, Zap, ChevronRight
} from 'lucide-react';
import AuroraBackground from '../components/common/AuroraBackground';

const features = [
  { icon: Bot, title: 'AI Health Companion', desc: 'Personalized AI that understands your health and takes action automatically.' },
  { icon: Droplets, title: 'Smart Hydration', desc: 'Track water intake with animated visualizations and intelligent reminders.' },
  { icon: Moon, title: 'Sleep Analytics', desc: 'Deep sleep insights with consistency scoring and trend analysis.' },
  { icon: Target, title: 'Habit Tracking', desc: 'Build lasting habits with streaks, rewards, and progress reports.' },
  { icon: BarChart3, title: 'Health Analytics', desc: 'Beautiful charts showing your wellness journey over time.' },
  { icon: Sparkles, title: 'Achievement System', desc: 'Earn badges and milestones as you reach your health goals.' },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '2M+', label: 'Health Logs' },
  { value: '98%', label: 'Satisfaction' },
  { value: '4.9', label: 'App Rating' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Fitness Enthusiast', text: 'Aurora transformed how I track my health. The AI companion feels like having a personal wellness coach.', avatar: 'SC' },
  { name: 'Marcus Johnson', role: 'Software Engineer', text: 'The design is stunning and the AI actually understands when I say "I drank 500ml water". Game changer.', avatar: 'MJ' },
  { name: 'Emily Rodriguez', role: 'Health Coach', text: 'I recommend Aurora to all my clients. The analytics and habit tracking are best-in-class.', avatar: 'ER' },
];

function HealthVisualization() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="glass p-6 absolute top-0 left-0 w-48"
      >
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-gray-400">Hydration</span>
        </div>
        <p className="text-2xl font-bold">1,850ml</p>
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-aurora-500 rounded-full" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="glass p-6 absolute top-20 right-0 w-44"
      >
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-400">Sleep</span>
        </div>
        <p className="text-2xl font-bold">7.5h</p>
        <p className="text-xs text-emerald-400 mt-1">+12% this week</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="glass p-6 absolute bottom-0 left-1/4 w-52"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-aurora-400" />
          <span className="text-xs text-gray-400">Health Score</span>
        </div>
        <p className="text-3xl font-bold gradient-text">87</p>
        <p className="text-xs text-gray-500 mt-1">Excellent progress!</p>
      </motion.div>

      <div className="h-80" />
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <AuroraBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl aurora-bg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl gradient-text">Aurora</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">AI Demo</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aurora-500/10 border border-aurora-500/20 text-aurora-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Health Intelligence
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Your Personal{' '}
              <span className="gradient-text">AI Health</span>{' '}
              Companion
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-lg">
              Track hydration, sleep, habits, and nutrition with an intelligent AI that understands you.
              Just say "I drank 500ml water" and Aurora handles the rest.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary flex items-center gap-2">
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#demo" className="btn-secondary flex items-center gap-2">
                See AI Demo <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Secure</span>
              <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Free AI</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 50K+ Users</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <HealthVisualization />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass p-6 text-center"
            >
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need for <span className="gradient-text">better health</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">A complete wellness platform powered by AI intelligence and beautiful design.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6 card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-aurora-500/10 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="w-6 h-6 text-aurora-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Demo */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass p-8 lg:p-12">
          <div className="text-center mb-8">
            <Bot className="w-12 h-12 text-aurora-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Meet Aurora AI</h2>
            <p className="text-gray-400">Natural language health tracking with automatic actions</p>
          </div>
          <div className="space-y-4 max-w-lg mx-auto">
            {[
              { user: 'I drank 500ml water', ai: 'Logged 500ml of water 💧 You\'re at 74% of your daily goal!' },
              { user: 'I slept 7 hours last night', ai: 'Logged 7 hours of sleep 🌙 Great rest! Your consistency score improved.' },
              { user: 'Create a habit to meditate daily', ai: 'Created "Meditate daily" habit ✨ Starting your streak today!' },
            ].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-end mb-2">
                  <div className="bg-aurora-500/20 px-4 py-2 rounded-2xl rounded-br-md text-sm max-w-xs">
                    {msg.user}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/5 px-4 py-2 rounded-2xl rounded-bl-md text-sm max-w-xs border border-white/10">
                    {msg.ai}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by <span className="gradient-text">health enthusiasts</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center glass p-12 relative overflow-hidden">
          <div className="absolute inset-0 aurora-bg opacity-10" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4">Start your wellness journey today</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join thousands who've transformed their health with Aurora's AI-powered companion.</p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg aurora-bg flex items-center justify-center text-sm font-bold">A</div>
            <span className="font-semibold gradient-text">Aurora Health</span>
          </div>
          <p className="text-sm text-gray-500">&copy; 2026 Aurora AI Health Companion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
