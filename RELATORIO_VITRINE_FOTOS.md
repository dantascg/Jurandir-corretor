# Relatório — vitrine de fotos

## Causa raiz do item 1

O caminho de persistência fica em `data.js:30-35`. O problema era a identidade da edição não estar protegida pelo fluxo do painel entre o primeiro save e o save posterior às fotos. O painel agora captura o ID existente do hidden/estado, força esse ID nos dois saves e valida que o Supabase devolveu o mesmo registro. Em modo Supabase, `data.js` normaliza o ID e faz `update(data).eq('id', propertyId)`; `insert` só é alcançado quando o ID está realmente vazio.

Foi adicionado `tests/data-save.supabase.test.js`, com cliente Supabase mockado: o teste confirma `update`, `eq('id')` e zero `insert`.

## O que mudou

- Prévias novas: placeholder `Processando`, leitura da miniatura WebP como Data URL e uma única definição de `renderPhotos`.
- Fotos: original WebP até lado maior de 2000 px, qualidade inicial 0.86, redução de 0.05 até cerca de 700 KB; miniatura WebP de até 800 px. O canvas remove EXIF/GPS ao re-encodar.
- Vitrine: seção Imóveis imediatamente após o Hero, menu atualizado e numeração das seções ajustada.
- Galeria: scroll-snap, swipe, setas, contador, bolinhas, teclado e lightbox com foco preso, fundo escuro e retorno de foco.
- Cards usam apenas a capa `_t` com lazy loading; modal/lightbox usam as URLs originais.

A CSP não foi alterada: `img-src` já continha `data:`, suficiente para a prévia. Não foi usado `blob:`.

## O que não foi testado

- Não foi executado nenhum request, login, upload ou alteração no Supabase real.
- Não foi feito teste visual em navegador real, em dispositivo touch ou com fotos reais de tamanhos variados.
- Não foi validado o comportamento de `createImageBitmap` em navegadores antigos nem decodificação HEIC.

## Checklist manual de 2 minutos

1. Abrir a vitrine e confirmar que “Imóveis” aparece logo abaixo do Hero e no menu.
2. Abrir um imóvel com várias fotos: testar arraste horizontal, setas, bolinhas, contador e setas do teclado.
3. Clicar na foto grande: confirmar lightbox, fechar com botão/Esc, setas, swipe e retorno do foco.
4. Em celular, confirmar que uma foto não mostra setas nem bolinhas quando houver apenas uma.
5. No painel, editar um imóvel existente, alterar título e salvar; confirmar que a lista mantém um único imóvel.
6. Adicionar uma foto: conferir “Processando”, prévia sem imagem quebrada e miniatura após concluir.
7. Confirmar que a capa do card é `_t`, enquanto modal e tela cheia exibem a original.
