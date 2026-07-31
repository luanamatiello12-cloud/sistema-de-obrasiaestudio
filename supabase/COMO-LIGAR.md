# Como ligar o backend real (sair do Modo Demo)

Hoje o app funciona em **Modo Demo**: os dados ficam no navegador (localStorage).
Para os dados passarem a ser reais, na nuvem e compartilhados entre todos os
usuários, siga os passos abaixo. Leva ~10 minutos e é feito uma única vez.

## 1. Criar o projeto Supabase
1. Acesse https://supabase.com e crie uma conta (grátis).
2. **New project** → dê um nome (ex.: `gp-obra`), defina uma senha de banco e a região (South America / São Paulo).
3. Aguarde ~2 minutos até o projeto ficar pronto.

## 2. Criar as tabelas e a segurança
No painel do Supabase, abra **SQL Editor** e rode, nesta ordem:
1. Cole todo o conteúdo de [`schema.sql`](./schema.sql) → **Run**.
2. Cole todo o conteúdo de [`setup.sql`](./setup.sql) → **Run**.

Isso cria as tabelas, ativa o tempo real, o armazenamento de imagens, a
autenticação e as regras de permissão (RLS) — inclusive o perfil **Mestre de
Obras** e a privacidade das mensagens.

## 3. Criar os usuários e seus papéis
1. Em **Authentication → Users → Add user**, crie cada pessoa (e-mail + senha).
2. Volte ao **SQL Editor** e defina o papel de cada um (o padrão é `CLIENTE`):
   ```sql
   update public.profiles set role = 'ADMIN'  where email = 'engenheiro@exemplo.com';
   update public.profiles set role = 'MESTRE' where email = 'mestre@exemplo.com';
   ```

## 4. Conectar o app
1. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
2. Na raiz do projeto, crie um arquivo `.env` (baseado no `.env.example`):
   ```
   VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
   VITE_SUPABASE_ANON_KEY="cole-a-chave-anon-aqui"
   ```
3. Reinicie o servidor (`npm run dev`) ou refaça o build (`npm run build`).

Pronto. O app detecta as credenciais, some o selo **"Modo Demo"** e passa a
usar o banco real. O login agora exige e-mail/senha de verdade, os papéis vêm
do banco e cada permissão é imposta pelo próprio Supabase (não só pela tela).

## Observações
- **Fotos**: no backend real as imagens vão para o Storage (bucket
  `projeto-arquivos`), não mais como base64 no banco.
- **Plantas da Vista 3D**: o modelo 3D é gerado pelo app; as etapas do
  cronograma (Contrapiso, Elétrica, Marcenaria, Pintura) controlam os
  acabamentos automaticamente.
- **Modo Demo continua disponível**: basta não preencher o `.env` — útil para
  demonstrações sem depender de servidor.
