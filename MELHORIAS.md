# Melhorias aplicadas (branch `melhorias-teste`)

Versão de teste para aprovação. Nada foi enviado ao GitHub — tudo está local nesta branch.

## ⭐ Refinamento profissional (2ª rodada)
Como o backend Supabase original está morto, o sistema agora funciona **100% em modo demonstração**, sem depender de servidor nenhum — pronto para apresentar a clientes:

- **Banco de dados local com dados realistas de uma obra**: cronograma (8 etapas com % real), financeiro (R$ 15 mil em compras), diário, materiais, chat com histórico e 4 pontos de raio-X. Tudo persiste no navegador e pode ser resetado.
- **"Tempo real" funciona no modo demo**: publicar um relato, aprovar uma compra ou enviar mensagem atualiza a tela na hora (eventos locais simulando o realtime do Supabase).
- **Planta baixa e raio-X profissionais em SVG próprio**: apartamento com cômodos cotados e 3 camadas técnicas (hidráulica, elétrica, climatização) que acendem sobre a planta com efeito de brilho. Substituem as imagens mortas do Supabase.
- **Camada de dados única (`src/lib/data.ts`)**: todo o app fala com um único módulo que decide sozinho entre Supabase real e modo demo. Trocar para o backend real não exige mexer em componente nenhum.
- **Compressão de imagens**: fotos são redimensionadas (máx. 1280px, JPEG) antes de salvar — nada de fotos de 5 MB travando o banco.
- **Acessos de demonstração no login**: botões "Entrar como Engenheiro" (ADMIN) e "Entrar como Cliente" (visão restrita).
- **Polimento visual**: tela de carregamento inicial com logo, favicon próprio, título e descrição da página, fonte Montserrat otimizada, barra de rolagem temática, esqueletos de carregamento, telas de "vazio" e tela amigável de erro (ErrorBoundary) no lugar de página em branco.
- **Performance**: relatórios PDF (jsPDF) carregam sob demanda — o pacote inicial caiu de 986 kB para 560 kB.

## Segurança
- **Login real via Supabase Auth**: o app agora tenta `signInWithPassword` primeiro. Se a conta existir, o papel (ADMIN/CLIENTE) vem da tabela `profiles` do banco — não mais do e-mail digitado.
- **Modo Demo sinalizado**: enquanto o Auth não for configurado no Supabase, o app cai no comportamento antigo, mas mostra um selo "MODO DEMO" no cabeçalho e um aviso no login. Assim o sistema continua utilizável durante a transição.
- **Script `supabase/setup.sql`**: cria a tabela `profiles`, ativa RLS em todas as tabelas com políticas por papel, cria a função atômica `finalizar_compra` e libera upload no Storage. **Este script precisa ser executado no painel do Supabase para a segurança valer de verdade.**

## Correções de bugs
- Fotos (chat, cupom fiscal, diário, hotspots) agora sobem para o **Supabase Storage** e só a URL vai para o banco. Se o Storage recusar (política ainda não aplicada), cai no base64 antigo com aviso — o app nunca trava.
- Todos os inserts agora **tratam erro** e avisam o usuário (antes diário e pedidos mostravam "sucesso" mesmo falhando).
- "Finalizar compra" agora lança o financeiro **antes** de aprovar o pedido (ordem segura); a versão definitiva atômica está no `setup.sql` (função `finalizar_compra`).
- IDs de mensagens otimistas usam `crypto.randomUUID()` (sem colisão) e as keys do React não são mais aleatórias a cada render.
- Realtime agora cobre **todas** as tabelas (financeiro e diário atualizavam só com F5) e cada evento recarrega **apenas a tabela afetada** (antes recarregava as 6).
- Valores em reais aceitam formato brasileiro ("1.500,50") no lançamento de compra.

## Funcionalidades novas
- **"Novo Ponto Raio-X" funciona**: clique no botão, depois clique na posição desejada da planta, preencha nome do cômodo e foto.
- **"Alterar Foto" funciona** (avatar do perfil).
- **Diário aceita foto** no novo relato.
- **Contador real de mensagens não lidas** no botão do chat (a bolinha antiga era decorativa).
- Modais próprios de confirmação (sem `confirm()`/`prompt()` do navegador).
- Relatórios PDF com cabeçalho, data de geração e linha de total.

## Limpeza e arquitetura
- `App.tsx` foi dividido: de 1.184 linhas para ~15 arquivos (`components/`, `hooks/`, `lib/`).
- Removidas dependências não usadas: `express`, `better-sqlite3`, `dotenv`, `@google/genai`, `tsx`, `@types/express`.
- URL/chave do Supabase agora podem vir de `.env` (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), com fallback para os valores atuais.
- Avatares falsos (pravatar.cc) removidos do chat.
- Acessibilidade: `alt` nas imagens e `aria-label` nos botões de ícone.

## ⚠️ Descoberta importante durante o teste
O projeto Supabase original (`exvsnqybuvkabavwyrsu.supabase.co`) **não existe mais** — o domínio nem resolve em DNS. Projetos gratuitos do Supabase são pausados por inatividade e depois removidos. Ou seja, a versão original do GitHub também está sem backend: nenhum dado carrega em nenhuma das duas versões.

## O que ainda depende de você (ao aprovar)
1. Criar um projeto novo (gratuito) em https://supabase.com.
2. Rodar `supabase/schema.sql` no SQL Editor (cria as tabelas, realtime e bucket).
3. Rodar `supabase/setup.sql` (segurança: profiles, RLS, função atômica).
4. Criar os usuários reais em Authentication > Users.
5. Promover os admins: `update public.profiles set role = 'ADMIN' where email = '...';`
6. Colocar a URL e a chave anon do projeto novo no arquivo `.env` (modelo em `.env.example`).
7. Subir de novo as imagens da planta (`planta base.png`, `hidraulica (2).jpg`, `eletrica.jpg`, `climatizaca.jpg`) no bucket `projeto-arquivos`.
