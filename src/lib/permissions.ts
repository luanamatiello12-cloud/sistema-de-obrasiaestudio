import type { UserState } from '../types';

/** Ações controladas por perfil (RBAC). Mapeia 1:1 com as políticas do banco (RLS) quando o backend real for ligado. */
export type Action =
  | 'manage_hotspots' // criar/remover pontos de raio-X
  | 'edit_cronograma' // atualizar progresso das etapas
  | 'new_relato' // publicar no diário de obra
  | 'request_material' // solicitar material
  | 'approve_purchase' // aprovar compra (lança no financeiro)
  | 'delete_pedido'; // excluir pedido

type Role = UserState['role'];

const MATRIX: Record<Role, Action[]> = {
  // Engenheiro / gestor: controle total
  ADMIN: ['manage_hotspots', 'edit_cronograma', 'new_relato', 'request_material', 'approve_purchase', 'delete_pedido'],
  // Mestre de obras: executa e registra em campo, mas não decide o financeiro
  MESTRE: ['manage_hotspots', 'edit_cronograma', 'new_relato', 'request_material'],
  // Cliente: apenas acompanha
  CLIENTE: [],
};

export function can(user: Pick<UserState, 'role'> | null, action: Action): boolean {
  if (!user) return false;
  return MATRIX[user.role]?.includes(action) ?? false;
}

export function roleLabel(role: Role): string {
  return role === 'ADMIN' ? 'Engenheiro' : role === 'MESTRE' ? 'Mestre de Obras' : 'Cliente';
}
