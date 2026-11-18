# Relatório de conexão com Supabase

Auditoria feita somente por leitura local do código. Não houve conexão de rede, acesso ao Supabase ou execução contra banco.

## Investigação

1. **Ordem e carregamento — PROBLEMA corrigido.**

   - `index.html:486` não carregava `supabase-js`; carregava apenas `config.js`, `data.js` e `site.js`.
   - `painel/index.html:7-8` carregava o CDN antes de `../config.js` e `../data.js`, com caminhos relativos corretos para `/painel/`, mas o SRI inválido podia impedir a execução.
   - O CDN agora é carregado antes da configuração e da camada de dados nas duas páginas.

2. **SRI — PROBLEMA corrigido com pendência.**

   - `painel/index.html:7` continha `integrity="sha384-REPLACE_WITH_SRI_HASH"`, que era um placeholder e bloqueava o script.
   - `integrity` e `crossorigin` foram removidos nas duas páginas. O CDN continua fixado em `@supabase/supabase-js@2.45.4`.
   - Pendência: calcular e reintroduzir o SRI oficial do arquivo exato do CDN antes da publicação.

3. **CSP — PROBLEMA corrigido.**

   - `vercel.json:1` e `_headers:2` já permitiam `https://cdn.jsdelivr.net`, mas usavam apenas curingas Supabase; não explicitavam WebSocket.
   - Ambos agora incluem o projeto lido de `config.js` em `connect-src`, incluindo `wss://`, e em `img-src` para o Storage. Não há meta CSP adicional no HTML.

4. **Decisão de modo e fallback — PROBLEMA corrigido.**

   - Antes, `data.js` usava `if (!supabaseReady())` em todas as operações. Assim, `MODO: 'supabase'` com CDN ausente, config incompleta ou erro de inicialização caía silenciosamente para `localStorage`/`sessionStorage`.
   - Agora somente `MODO: 'mock'` chama dados locais. Em Supabase, `requireSupabase()` lança erro claro para config incompleta ou CDN ausente; erros das chamadas são propagados e exibidos.
   - O fallback de configuração ausente também passou a ser Supabase incompleto, e não mock silencioso (`data.js:3,21-25`).

5. **Nomes e URL — OK/corrigido.**

   - `config.js:2-5` usa `MODO`, `SUPABASE_URL` e `SUPABASE_ANON_KEY`, exatamente os nomes lidos por `data.js:3,23`.
   - `getClient()` remove uma barra final da URL e não acrescenta `/rest/v1`; o cliente Supabase recebe a Project URL diretamente (`data.js:23`). A chave não foi reproduzida neste relatório.

6. **Auth — OK/corrigido.**

   - Em Supabase, `data.js:40` usa `getClient().auth.signInWithPassword`.
   - A senha local `corretor@jurandir.local` / `mock-1234` continua somente dentro do ramo explícito `MODO: 'mock'`; nunca é aceita em Supabase.
   - O painel agora mostra faixa de modo/conexão e erro de configuração/conexão sem exibir credenciais (`painel/painel.js:11,31`).

7. **Consultas e schema — OK.**

   - A vitrine consulta exclusivamente `imoveis_publicos` (`data.js:26,34`). O painel administrativo consulta `imoveis` (`data.js:27,35`) após Auth.
   - Os campos usados pelos cards e formulário correspondem às colunas de `supabase/schema.sql`: `titulo`, `codigo`, `bairro`, `cidade`, `preco`, `quartos`, `suites`, `banheiros`, `vagas`, `area_util_m2`, `fotos`, `destaque`, `publicado` e demais campos do formulário.

8. **Upload — OK com observação de compatibilidade.**

   - `data.js:43` gera `imoveis/<uuid>/<n>.webp` e `imoveis/<uuid>/<n>_t.webp`. O campo `fotos` salva somente a URL completa; as miniaturas são derivadas pela vitrine.
   - O CHECK de URLs completas e as policies do Storage estão consistentes com esse uso. O `encode()` do painel (`painel/painel.js:30`) detecta quando `canvas.toBlob('image/webp')` retorna outro MIME e usa JPEG como fallback para a foto principal.
   - HEIC é rejeitado com mensagem clara (`painel/painel.js:27`). A miniatura ainda depende do MIME retornado por `canvas.toBlob`; isso não foi alterado nesta correção porque não impede a conexão e exige uma decisão separada sobre o formato da miniatura.

9. **Dados mock persistidos — OK/corrigido.**

   - As chaves locais são `jurandir_imoveis_mock_v1` e `jurandir_mock_session` (`data.js:4-5,18`).
   - Como todas as operações usam `usingMock()`, em Supabase nenhuma leitura ou escrita nessas chaves ocorre. Dados antigos no navegador não interferem no modo Supabase.

## Causa raiz

O site público não carregava o SDK do Supabase e o painel tinha um hash SRI placeholder. Como `data.js` tratava SDK ausente como `!supabaseReady()`, o `MODO: 'supabase'` acabava executando o ramo mock silenciosamente e usando armazenamento local.

## Alterações adicionais

- Erros da vitrine agora aparecem como estado visível com a causa sanitizada.
- Erros de sessão/listagem do painel aparecem na faixa de conexão e na área de status.
- O painel mostra `MODO MOCK (dados locais)` no modo mock e `Conectando ao Supabase`/`Conectado ao Supabase` no modo Supabase.
- Cards públicos usam flex column para que o botão fique no fim e não haja faixa cinza sobrando no rodapé.
- Nenhum `style=""` ou `innerHTML` dinâmico foi adicionado.

## Não foi possível testar sem rede/navegador

- Carregamento real do CDN e criação do cliente Supabase.
- Login Auth, consulta da view, RLS, Storage e upload real.
- Validação visual em navegador desktop/mobile e WebSocket de sessão.
- SRI real do arquivo distribuído pelo CDN.

## Checklist manual

1. Abrir o domínio real e confirmar no painel a faixa `Conectado ao Supabase`.
2. Fazer login com o usuário criado no Supabase Auth; confirmar que a senha mock não funciona.
3. Criar um imóvel com foto, verificar compressão, preview, upload dos dois arquivos e registro da URL em `fotos`.
4. Editar, reordenar, definir capa, remover foto e excluir o imóvel; confirmar remoção no Storage.
5. Abrir a vitrine em aba anônima e confirmar somente imóveis publicados, sem `endereco`.
6. Salvar um rascunho e confirmar que ele não aparece na vitrine pública.
7. Alternar status/destaque e confirmar os badges e a ordenação pública.
8. Simular CDN/config ausente e confirmar erro visível, sem criação/leitura das chaves mock.
