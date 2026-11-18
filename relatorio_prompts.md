# Relatório de prompts e verificação

## Escopo recebido

- Corrigir edição no Supabase para preservar o ID e usar `UPDATE ... eq('id')`, com teste mockado.
- Corrigir prévias, aumentar qualidade das fotos, reposicionar a vitrine, implementar carrossel/lightbox e manter CSP/scripts.
- Substituir a lista do painel pela referência visual de `/srcimov`, convertida para HTML/CSS/JS puro, sem React/Tailwind/dependências.
- Corrigir duplicação de imóveis no Supabase para copiar os arquivos de Storage para o novo ID.
- Consolidar `renderPhotos`, corrigir textos/regex quebrados e documentar o ciclo mock.

## Implementado

- Lista do painel com métricas, busca, chips de filtro, alternância lista/grade, capa, placeholder, ações e modal de exclusão.
- `openPreview(id)` foi exposta e abre o formulário de edição provisoriamente.
- Fluxo de edição mantém o ID no hidden/estado e nos dois saves.
- `api.duplicate` no Supabase cria o registro sem fotos, copia original e `_t.webp` para `imoveis/<novo-id>/<índice>`, salva somente URLs novas e remove registro/arquivos parciais se a cópia falhar.
- Há uma única `renderPhotos`; miniatura usa Data URL e o placeholder `Processando` evita previews quebradas.
- Ciclo mock cobre criar, editar sem aumentar contagem, duplicar com novo ID, editar cópia, excluir original e confirmar fotos preservadas.
- A seção pública recebeu o quarto card de Serviços e o marquee passou a usar margem por card, clones pares, faixa full-bleed no desktop e pausa/rolagem com `prefers-reduced-motion`.

## Verificações

- `node --test tests/data-save.supabase.test.js`.
- `node --check data.js`.
- `node --check painel/painel.js`.
- `node --check site.js`.
- `git diff --check`.

## Não foi possível testar

- Não foi feito login, upload, `storage.copy`, exclusão ou alteração contra o Supabase real.
- Não foi feita validação visual em navegador real nos breakpoints 390px/1440px.
- Não foi validada a compatibilidade de `storage.copy` com permissões específicas do bucket de produção.
