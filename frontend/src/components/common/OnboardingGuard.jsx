import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { onboardingApi } from '../../services/api';
import LoadingScreen from './LoadingScreen';

/**
 * New signups must see Aurora intro first.
 * Returning users with incomplete onboarding skip intro.
 */
export default function OnboardingGuard({ children }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const { data } = await onboardingApi.getStatus();
      return data.data;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (isLoading) return;

    if (data?.onboardingDone) {
      if (!data.healthSetupDone) {
        sessionStorage.setItem('aurora_pending_health_setup', 'true');
        navigate('/health-setup', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    const isNewSignup = sessionStorage.getItem('aurora_new_signup') === 'true';
    const introSeen = sessionStorage.getItem('aurora_intro_seen') === 'true';

    if (isNewSignup && !introSeen) {
      navigate('/aurora-intro', { replace: true });
      return;
    }

    setReady(true);
  }, [data, isLoading, navigate]);

  if (isLoading || !ready) return <LoadingScreen />;

  return children;
}
