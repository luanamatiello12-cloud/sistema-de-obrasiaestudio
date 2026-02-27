export interface UserState {
  email: string;
  role: 'ADMIN' | 'CLIENTE';
  avatar: string | null;
}

export interface ChatMessage {
  id?: number;
  autor: string;
  mensagem?: string;
  midia_url?: string;
  created_at?: string;
  isOptimistic?: boolean;
}

export interface CronogramaItem {
  id: number;
  etapa: string;
  progresso: number;
  ordem: number;
}

export interface FinanceiroItem {
  id: number;
  descricao: string;
  valor_pago: number;
  cupom_url: string;
  created_at: string;
}

export interface DiarioItem {
  id: number;
  autor: string;
  descricao: string;
  midia_url?: string;
  created_at: string;
}

export interface PedidoMaterial {
  id: number;
  material: string;
  quantidade: string;
  urgencia: 'critica' | 'media' | 'planeada';
  status: 'pendente' | 'aprovado';
  created_at: string;
}

export interface Hotspot {
  id: number;
  nome_comodo: string;
  url_foto_interna: string;
  pos_x: string;
  pos_y: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
