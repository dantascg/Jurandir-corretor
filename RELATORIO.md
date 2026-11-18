# Relatório — painel e vitrine de imóveis

## Entregue

- `index.html`, `style.css` e `site.js`: seção pública de imóveis, filtros, cards responsivos, modal, WhatsApp codificado e link secundário para o catálogo.
- `config.js`, `config.example.js` e `data.js`: configuração pública e camada única com modos `mock` e `supabase`.
- `painel/index.html`, `painel/painel.js` e `painel/painel.css`: login, sessão, CRUD, rascunho, destaque, status, duplicação, busca, fotos com preview, remoção, capa e ordenação.
- `supabase/schema.sql`: tabela, view sem endereço, trigger de atualização/código, RLS e policies do Storage.
- `supabase/testes_seguranca.sql`: roteiro de revisão e tentativas de constraints.
- `_headers`, `vercel.json`, `robots.txt`, `.gitignore` e `README.md`.

## Decisões de segurança

RLS está habilitado em `admins` e `imoveis`; a tabela `admins` não tem acesso direto pela API. A função `is_admin()` é `security definer` com `search_path` fixo. A vitrine consulta a view sem `endereco`, e o filtro `publicado = true` permanece na policy/tabela. Uploads exigem usuário autenticado em `admins`, caminho UUID sob `imoveis/`, MIME permitido e limite de 5 MB do bucket. O front não usa `innerHTML` com dados dinâmicos.

## Testes realizados

- Revisão estática de paths, ausência de `innerHTML`/`insertAdjacentHTML`, uso de `encodeURIComponent` no WhatsApp e não exposição de `endereco` na view.
- Revisão linha a linha das policies e do roteiro `supabase/testes_seguranca.sql`.
- Modo mock: a estrutura de login, lista, formulário, rascunho, filtros, estados vazio/erro e regras de limite foi implementada para execução em servidor estático.

## Não foi possível verificar

Não foi possível executar navegador automatizado nem conectar ao Supabase neste ambiente. Portanto não houve teste real de RLS, Storage, login Auth, responsividade visual ou upload real. A compressão usa canvas e mostra tamanho antes/depois no painel, mas não foi possível medir uma foto real aqui.

## Revisão humana necessária

1. Execute o SQL em um projeto de teste e valide anon, usuário autenticado não-admin e admin com clientes separados.
2. Confirme que a política de leitura pública do Storage não permite listagem via API; URLs conhecidas continuam públicas por desenho.
3. Confirme o domínio real em `connect-src`/`img-src` e o valor SRI do CDN antes de produção. O script do Supabase está pinado em `2.45.4`, mas o hash SRI precisa ser preenchido com o hash oficial do arquivo exato distribuído pelo CDN.
4. Rode `supabase/testes_seguranca.sql` e registre evidências de cada resultado.

## Configuração manual pendente

Criar projeto São Paulo, executar schema, desativar signup, criar usuário, inserir UUID em `admins`, configurar URLs do Auth, copiar URL/chave anon para `config.js`, mudar `MODO` para `supabase`, conferir CSP/SRI e publicar na Cloudflare Pages.
