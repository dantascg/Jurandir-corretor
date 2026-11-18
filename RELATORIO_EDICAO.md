# Relatório — correção de edição de imóvel

Branch: `fix/editar-imovel`  
Base: `main` local atualizada  
Commit final: `fix: editar imovel atualiza o registro existente`

## Causa raiz

- `painel/painel.js:15` (`resetForm`) executa `form.reset()` e limpa `#property-id`.
- `painel/painel.js:16` guardava o imóvel em `state.editing`, mas não repunha seu `id` no campo hidden.
- `painel/painel.js:17` coletava o id somente de `$('property-id').value`, portanto a edição enviava `id` vazio/undefined.
- `data.js:37` decidia o caminho com `if (!data.id)`: id vazio entrava em `insert`; id presente entrava em `update(...).eq('id', ...)`.
- O caminho de duplicação (`data.js:39`) já removia `id` e `codigo` antes de chamar `save`, portanto continua criando novo registro.
- `renderPhotos` aparece três vezes em `painel/painel.js` (`22`, `25`, `33`). A última definição, na linha 33, é a efetiva por hoisting; ela não zera `state.editing` nem `state.photos`. Não foi consolidada nesta correção porque as três versões têm diferenças de controles/semântica e a remoção segura exigiria teste visual do upload.

## O que mudou

- `openForm(item)` repõe `#property-id` com `item.id` e `collect()` usa também `state.editing.id` como fallback.
- `resetForm()` limpa `state.editing`, `state.photos` e o hidden para garantir que o formulário seguinte seja novo.
- `save()` bloqueia segundo envio com `state.saving`, desabilita os botões e restaura o estado em `finally`.
- Ao salvar edição, o mesmo id é enviado; `loadList()` volta a mostrar o registro atualizado e o estado de edição é limpo.
- `data.js:37` separa insert/update por `propertyId`, nunca envia `codigo`, preserva `created_at` em update e mantém o `codigo` existente no mock.
- Fotos existentes são mantidas por URL; somente fotos novas são enviadas. O Storage recebe remoção apenas das URLs que saíram explicitamente da edição, via `removeExplicitFiles`.
- Novas fotos usam slots de Storage livres para não sobrescrever fotos existentes durante reordenação/adição.
- Duplicar continua usando `data.js:39`, que remove `id`/`codigo` e cria registro novo.

## Teste mock executado

Foi executado um script Node em memória, sem rede, carregando `data.js` em modo `mock`:

```text
initial: 5
editar registro existente: 5 imóveis, mesmo id, mesmo codigo, created_at preservado
criar novo: 6 imóveis
duplicar: 7 imóveis, id diferente
editar a cópia: 7 imóveis, mesmo id da cópia
```

Também foi validada a sintaxe com `vm.Script` para `painel/painel.js` e `data.js`.

## Não testado

- Não foi executado nada contra Supabase real, Storage real ou banco remoto.
- Não foi usado navegador: fluxo visual completo de login, clique em Editar, upload, reordenação, remoção, foco e feedback não foi testado manualmente.
- Não foi possível testar upload real e remoção seletiva de arquivos no Storage.
- `node --check` direto foi bloqueado pelo ambiente com `EPERM` ao resolver o caminho; a compilação via `vm.Script` passou.

## Checagem estática

- Nenhum `innerHTML` novo.
- Nenhum `style=""` novo.
- `config.js`, `supabase/`, `vercel.json`, `_headers` e `schema.sql` não foram alterados.
- A ordem e os atributos dos `<script>` não foram alterados.
- A CSP não foi alterada.

## Checklist manual de 1 minuto

1. Entrar no painel em modo mock e anotar a quantidade de imóveis.
2. Clicar em **Editar**, mudar o título e salvar; confirmar mesma quantidade e mesmo código.
3. Criar um imóvel novo; confirmar que a quantidade aumenta em 1.
4. Editar o novo imóvel; confirmar que a quantidade não aumenta.
5. Duplicar um imóvel; confirmar novo código/registro; editar a cópia e confirmar que ela não gera terceira linha.
6. Em uma edição, manter uma foto, adicionar outra e remover uma terceira; confirmar que existentes permanecem e que só a removida é marcada para remoção.
7. Clicar duas vezes rapidamente em salvar; confirmar um único salvamento e botão desabilitado durante a operação.
