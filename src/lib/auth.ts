import { sb } from './supabase';
import { setMode } from './data';
import type { UserState } from '../types';

const SESSION_KEY = 'gp_obra_session';

export interface LoginResult {
  user: UserState;
  demo: boolean; // true = caiu no modo demo (Supabase Auth não configurado / credenciais não existem)
}

function demoUser(email: string): UserState {
  return {
    email,
    role: email.includes('eng') || email.includes('mestre') ? 'ADMIN' : 'CLIENTE',
    avatar: `https://ui-avatars.com/api/?background=ffb7c5&color=000&name=${encodeURIComponent(email[0])}`,
    demo: true,
  };
}

/**
 * Tenta autenticação real no Supabase Auth. Se a conta existir, o papel (role)
 * vem da tabela `profiles` do banco — nunca do e-mail digitado.
 * Se o Auth não estiver configurado ainda, cai no modo DEMO (comportamento
 * antigo), sinalizado visualmente na interface.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (!error && data.user) {
    let role: UserState['role'] = 'CLIENTE';
    let avatar: string | null = null;

    const { data: profile } = await sb
      .from('profiles')
      .select('role, avatar_url')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.role === 'ADMIN') role = 'ADMIN';
    if (profile?.avatar_url) avatar = profile.avatar_url;

    const user: UserState = {
      email: data.user.email ?? email,
      role,
      avatar:
        avatar ??
        `https://ui-avatars.com/api/?background=ffb7c5&color=000&name=${encodeURIComponent(email[0])}`,
      demo: false,
    };
    setMode('supabase');
    storeSession(user);
    return { user, demo: false };
  }

  // Fallback: modo demo (mantém o sistema utilizável enquanto o Auth não é configurado)
  setMode('local');
  const user = demoUser(email);
  storeSession(user);
  return { user, demo: true };
}

export function getStoredSession(): UserState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserState) : null;
  } catch {
    return null;
  }
}

export function storeSession(user: UserState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  await sb.auth.signOut().catch(() => {});
}

export async function resetPassword(email: string): Promise<string | null> {
  const { error } = await sb.auth.resetPasswordForEmail(email);
  return error ? error.message : null;
}

export async function updatePassword(newPassword: string): Promise<string | null> {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    return 'Troca de senha disponível apenas com autenticação real ativada (veja supabase/setup.sql).';
  }
  const { error } = await sb.auth.updateUser({ password: newPassword });
  return error ? error.message : null;
}
