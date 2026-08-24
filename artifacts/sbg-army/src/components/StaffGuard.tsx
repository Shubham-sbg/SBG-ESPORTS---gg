import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiUrl } from '@/lib/api';

export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/admin/verify'), { credentials: 'include' });
        if (!res.ok) {
          setIsAuthenticated(false);
          return;
        }
        const data = await res.json();
        if (data.success && ['super_admin', 'admin', 'staff', 'tournament_admin', 'media_admin', 'content_editor', 'moderator'].includes(data.role)) {
          setIsAuthenticated(true);
          setSession({ email: data.email, name: data.name, role: data.role, allowedModules: data.allowedModules });
          if (typeof window !== 'undefined') {
            (window as unknown as Record<string, unknown>).__sbgStaffSession = { email: data.email, name: data.name, role: data.role, allowedModules: data.allowedModules };
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/staff');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return null;

  return <>{children}</>;
}
