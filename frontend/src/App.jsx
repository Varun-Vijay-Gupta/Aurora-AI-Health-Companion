import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/common/ProtectedRoute';
import SetupGuard from './components/common/SetupGuard';
import OnboardingGuard from './components/common/OnboardingGuard';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AuroraIntro = lazy(() => import('./pages/AuroraIntro'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const HealthDataSetup = lazy(() => import('./pages/HealthDataSetup'));
const AuroraKnowsYou = lazy(() => import('./pages/AuroraKnowsYou'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Hydration = lazy(() => import('./pages/Hydration'));
const Sleep = lazy(() => import('./pages/Sleep'));
const Habits = lazy(() => import('./pages/Habits'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const AICompanion = lazy(() => import('./pages/AICompanion'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/aurora-intro" element={<ProtectedRoute><AuroraIntro /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingGuard><Onboarding /></OnboardingGuard></ProtectedRoute>} />
        <Route element={<ProtectedRoute><SetupGuard><DashboardLayout /></SetupGuard></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/health-setup" element={<HealthDataSetup />} />
          <Route path="/hydration" element={<Hydration />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/ai" element={<AICompanion />} />
          <Route path="/aurora-knows-you" element={<AuroraKnowsYou />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
