import { PlayerUser } from './database';

export async function registerPlayer(data: {
  username: string; password: string; name: string; uid: string;
  preferredGame: string; whatsapp: string; country: string; email?: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const res = await fetch('/api/player-auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Network error.' };
  }
}

export async function loginPlayer(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/player-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Network error.' };
  }
}

export async function logoutPlayer(): Promise<void> {
  await fetch('/api/player-auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  if (typeof window !== 'undefined') {
    (window as any).__sbgPlayerSession = null;
  }
}

export async function verifyPlayerSession(): Promise<PlayerUser | null> {
  try {
    const res = await fetch('/api/player-auth/verify', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      if (typeof window !== 'undefined') (window as any).__sbgPlayerSession = data.user;
      return data.user;
    }
  } catch {}
  return null;
}

export function getPlayerSession(): PlayerUser | null {
  return (typeof window !== 'undefined' && (window as any).__sbgPlayerSession) || null;
}

export function getPlayerSessionId(): string | null {
  return getPlayerSession()?.id || null;
}

export function updatePlayerProfile(id: string, updates: Partial<PlayerUser>): void {
  // Can be left as is if the component makes an API call or uses wsClient
}
