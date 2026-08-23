import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key';

export const supabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'admin' | 'user';

export interface SupabaseProfile {
  id: string;
  email: string;
  username?: string;
  uid?: string;
  game?: string;
  whatsapp?: string;
  country?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export async function getProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as SupabaseProfile;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<SupabaseProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getProfile(user.id);
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
}

export async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBase64(bucket: string, path: string, base64: string): Promise<string | null> {
  const response = await fetch(base64);
  const blob = await response.blob();
  const file = new File([blob], path.split('/').pop() || 'file', { type: blob.type });
  return uploadFile(bucket, path, file);
}
