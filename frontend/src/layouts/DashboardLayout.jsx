import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Droplets, Moon, Target, Utensils, Bot,
  BarChart3, Trophy, Bell, Settings, LogOut, Menu, X, Sun, MoonStar, Brain, Sliders
} from 'lucide-react';
import { useAuthStore, useThemeStore, useNotificationStore } from '../store';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import AuroraBackground from '../components/common/AuroraBackground';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/hydration', icon: Droplets, label: 'Hydration' },
  { path: '/sleep', icon: Moon, label: 'Sleep' },
  { path: '/habits', icon: Target, label: 'Habits' },
  { path: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { path: '/ai', icon: Bot, label: 'AI Companion' },
  { path: '/aurora-knows-you', icon: Brain, label: 'Aurora Knows You' },
  { path: '/health-setup', icon: Sliders, label: 'Health Setup' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/achievements', icon: Trophy, label: 'Achievements' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { data } = await analyticsApi.getNotifications();
      const unread = data.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
      return unread;
    },
    refetchInterval: 60000,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-4'}`}>
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl aurora-bg flex items-center justify-center">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <div>
          <h1 className="font-bold text-lg gradient-text">Aurora</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Health Companion</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-aurora-500/20 text-aurora-400 shadow-glow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4 space-y-1">
        <NavLink
          to="/notifications"
          onClick={() => mobile && setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5"
        >
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-auto bg-aurora-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </NavLink>
        <NavLink
          to="/settings"
          onClick={() => mobile && setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5"
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <AuroraBackground />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col glass border-r border-white/10 fixed h-full z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-full w-72 glass z-50 lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 glass border-b border-white/10 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="font-semibold">{user?.name || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <MoonStar className="w-5 h-5" />}
              </button>
              <NavLink to="/notifications" className="relative p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-aurora-500 rounded-full text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aurora-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
