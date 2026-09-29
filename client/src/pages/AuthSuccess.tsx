import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { tokenStore } from '../lib/api/client';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { reconnectWithToken } from '../lib/socket';

export default function AuthSuccess() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken) {
      tokenStore.set(accessToken, refreshToken || undefined);
      reconnectWithToken();
      
      refresh().then(() => {
        // Clear params from URL for security
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/browse');
      }).catch(() => {
        navigate('/login?error=Authentication failed');
      });
    } else {
      navigate('/login?error=Invalid authentication response');
    }
  }, [navigate, refresh]);

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center">
      <Loader2 size={40} className="animate-spin text-primary mb-4" />
      <h2 className="text-xl font-bold font-headings text-primary">Completing sign in...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we set up your session.</p>
    </div>
  );
}
