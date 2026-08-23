import { supabase, getProfile, SupabaseProfile } from './supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  profile?: SupabaseProfile;
}

function friendlyError(err: unknown): string {
  if (!err) return 'An unknown error occurred.';
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('network request failed')) {
    return 'Connection error. Please check your internet and try again.';
  }
  if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  if (msg.toLowerCase().includes('too many requests')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  return msg;
}

export async function adminLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: friendlyError(error) };
    if (!data.user) return { success: false, error: 'Login failed. Please try again.' };

    const profile = await getProfile(data.user.id);
    if (!profile || profile.role !== 'admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied. This account does not have admin privileges.' };
    }
    return { success: true, profile };
  } catch (err) {
    return { success: false, error: friendlyError(err) };
  }
}

export async function playerLogin(emailOrUsername: string, password: string): Promise<AuthResult> {
  try {
    let email = emailOrUsername.trim();
    if (!email.includes('@')) {
      const { data } = await supabase
        .from('users')
        .select('email')
        .eq('username', emailOrUsername.trim())
        .single();
      if (!data?.email) {
        return { success: false, error: 'Username not found. Try logging in with your email.' };
      }
      email = data.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: 'Incorrect email or password.' };
    if (!data.user) return { success: false, error: 'Login failed. Please try again.' };

    const profile = await getProfile(data.user.id);
    return { success: true, profile: profile ?? undefined };
  } catch (err) {
    return { success: false, error: friendlyError(err) };
  }
}

export async function playerRegister(data: {
  email: string;
  password: string;
  username: string;
  uid: string;
  game: string;
  whatsapp: string;
  country: string;
}): Promise<AuthResult> {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username.trim())
      .single();
    if (existing) {
      return { success: false, error: 'Username already taken. Choose another.' };
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          uid: data.uid,
          game: data.game,
          whatsapp: data.whatsapp,
          country: data.country,
        },
      },
    });

    if (error) return { success: false, error: friendlyError(error) };
    if (!authData.user) return { success: false, error: 'Registration failed. Please try again.' };

    await supabase.from('users').upsert({
      id: authData.user.id,
      email: data.email,
      username: data.username.trim(),
      uid: data.uid.trim(),
      game: data.game,
      whatsapp: data.whatsapp.trim(),
      country: data.country.trim(),
      role: 'user',
    });

    const profile = await getProfile(authData.user.id);
    return { success: true, profile: profile ?? undefined };
  } catch (err) {
    return { success: false, error: friendlyError(err) };
  }
}

export async function googleLogin(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/player-dashboard` },
    });
    if (error) return { success: false, error: friendlyError(error) };
    return { success: true };
  } catch (err) {
    return { success: false, error: friendlyError(err) };
  }
}

export async function forgotPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, error: friendlyError(error) };
    return { success: true };
  } catch (err) {
    return { success: false, error: friendlyError(err) };
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const session = await getSession();
    return !!session;
  } catch {
    return false;
  }
}
