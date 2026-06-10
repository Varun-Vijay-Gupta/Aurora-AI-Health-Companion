import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { onboardingApi } from '../../services/api';
import LoadingScreen from './LoadingScreen';

const SKIP_PATHS = ['/aurora-intro', '/onboarding', '/health-setup', '/settings'];

export default function SetupGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isSkippedPath = SKIP_PATHS.some((p) => location.pathname.startsWith(p));

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const { data } = await onboardingApi.getStatus();
      return data.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });

  useEffect(() => {
    if (isSkippedPath || isLoading || isFetching || !data) return;
    if (sessionStorage.getItem('aurora_skip_onboarding') === 'true') return;

    if (!data.onboardingDone) {
      const isNewSignup = sessionStorage.getItem('aurora_new_signup') === 'true';
      const introSeen = sessionStorage.getItem('aurora_intro_seen') === 'true';
      if (isNewSignup && !introSeen) navigate('/aurora-intro', { replace: true });
      else navigate('/onboarding', { replace: true });
    } else if (!data.healthSetupDone) {
      sessionStorage.setItem('aurora_pending_health_setup', 'true');
      navigate('/health-setup', { replace: true });
    }
  }, [data, isLoading, isFetching, location.pathname, navigate, isSkippedPath]);

  if ((isLoading || isFetching) && !isSkippedPath) {
    return <LoadingScreen />;
  }

  return children;
}
