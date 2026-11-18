# Jurandir Corretor — cadastro de imóveis

Site estático em HTML/CSS/JS puro. O modo padrão é `mock`, sem servidor e sem credenciais. O painel fica em `/painel/` e a vitrine pública em `#imoveis`.

## Configuração do Supabase

1. Crie um projeto Supabase na região São Paulo.
2. No SQL Editor, execute `supabase/schema.sql`.
3. Em Authentication, desative o signup público e crie o usuário do corretor. Troque a senha no primeiro acesso por uma senha forte; habilite MFA para o admin quando disponível.
4. Copie o UUID do usuário criado e insira em `public.admins` conforme o comentário no final do schema.
5. Em Authentication > URL Configuration, defina Site URL e Redirect URLs somente para o domínio real e para o localhost usado no desenvolvimento.
6. Copie `config.example.js` para `config.js`, preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` em Supabase > Settings > API e altere `MODO` para `supabase`.

A anon key é pública por design e pode ir para o Git. Nunca use service_role, senha de banco ou senha do usuário em arquivos, commits, logs ou relatórios.

## Modo mock

Abra o site por um servidor estático, por exemplo `python -m http.server 8000`, e acesse `/` e `/painel/`. O login fake é `corretor@jurandir.local` / `mock-1234`; os dados ficam no `localStorage` e a sessão fake na `sessionStorage`. Em produção, mantenha `MODO: 'supabase'`.

## Fotos e segurança

Fotos são decodificadas no navegador, orientadas pelo EXIF quando a API suporta isso, redimensionadas sem ampliar, re-encodadas via canvas (removendo metadados), comprimidas e acompanhadas de miniatura. HEIC sem suporte nativo gera mensagem em português. O banco e o Storage continuam sendo a autoridade: as policies RLS e os CHECK constraints não confiam no front-end.

O projeto usa `data.js` como camada única entre vitrine/painel e mock/Supabase. `endereco` só é retornado ao painel; a view pública não o inclui. Revise manualmente `supabase/schema.sql` no projeto real antes de publicar.
