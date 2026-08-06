# GP:OBRA — Sistema de Gestão de Obras

Painel para acompanhamento de obras de construção/reforma, do engenheiro ao
cliente: planta 2D e 3D, cronograma, financeiro, diário de obra, pedidos de
material e chat em tempo real.

## Funcionalidades

- **Projeto** — Planta 2D com camadas de raio-X (hidráulica, elétrica,
  climatização) e pontos de foto por cômodo. **Vista 3D** navegável com a
  *linha do tempo da obra* (9 fases, da fundação ao acabamento) que reflete o
  progresso real do cronograma. **Casa Realista**: tour imersivo (dia/noite,
  clima, iluminação). O engenheiro pode subir o **modelo 3D real** (`.glb`).
- **Cronograma** — etapas com progresso; alimenta automaticamente a Vista 3D.
- **Financeiro** — lançamentos, comprovantes e relatório em PDF.
- **Diário de obra** — relatos com foto.
- **Materiais** — pedidos com urgência; aprovação lança no financeiro.
- **Chat** — canal geral + conversas privadas entre os perfis, em tempo real.

## Perfis de acesso (RBAC)

| Ação | Engenheiro | Mestre de Obras | Cliente |
|---|:--:|:--:|:--:|
| Ver tudo | ✅ | ✅ | ✅ |
| Diário, materiais, cronograma, raio-X | ✅ | ✅ | — |
| Aprovar compras / excluir pedidos | ✅ | — | — |

## Modo de execução

O app roda em **Modo Demo** por padrão (dados no navegador, sem servidor) —
ideal para apresentar. Para ligar o backend real (dados na nuvem, login e
permissões de verdade), siga [`supabase/COMO-LIGAR.md`](supabase/COMO-LIGAR.md).

## Stack

React 19 · Vite · Tailwind · Three.js / React Three Fiber (3D) · Supabase
(auth, banco, realtime, storage) · jsPDF.

## Rodar localmente

**Pré-requisito:** Node.js

```bash
npm install
npm run dev
```

Opcional (backend real): copie `.env.example` para `.env` e preencha as
credenciais do Supabase — veja o guia em `supabase/COMO-LIGAR.md`.
