import type { UserState } from '../types';

export interface Participant {
  email: string;
  nome: string;
  role: UserState['role'];
}

/**
 * Participantes conhecidos da obra (modo demo).
 * Com backend real, esta lista viria da tabela `profiles`.
 */
export const PARTICIPANTS: Participant[] = [
  { email: 'eng.ricardo@gpobra.com', nome: 'Eng. Ricardo', role: 'ADMIN' },
  { email: 'mestre.jose@gpobra.com', nome: 'Mestre José', role: 'MESTRE' },
  { email: 'cliente@gpobra.com', nome: 'Cliente', role: 'CLIENTE' },
];

export function nomeDe(email: string): string {
  return PARTICIPANTS.find((p) => p.email === email)?.nome ?? email.split('@')[0];
}

/** Outros participantes com quem o usuário atual pode conversar em privado. */
export function outros(email: string): Participant[] {
  return PARTICIPANTS.filter((p) => p.email !== email);
}
