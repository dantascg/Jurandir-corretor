# Melhorias para o site Jurandir Corretor de Imoveis

Dominio alvo: **jurandircorretordeimoveis.com**
Arquivo: `index.html` (pagina unica, HTML + CSS + JS inline)
Destinatario: Codex. As tarefas estao em ordem de prioridade e cada uma tem criterio de aceite.

Regras gerais para a execucao:

- Nao usar emojis nem simbolos decorativos em nenhum ponto (texto, CSS `content`, meta tags, JSON-LD). O HTML entregue ja teve os emojis e setas removidos (ver item 3.1), mas confirme com `grep -nP '[\x{2190}-\x{2BFF}\x{1F000}-\x{1FFFF}]'`.
- Nao inventar informacao do corretor. Onde faltar dado real, deixar um marcador `TODO:` visivel apenas no codigo e avisar o Leonardo.
- Manter o site leve: uma pagina, sem framework, sem bibliotecas externas.

---

## 0. Dados que precisam ser confirmados com o Jurandir antes de publicar

Sem estes dados, parte das melhorias abaixo fica incompleta.

| Dado | Por que importa |
|---|---|
| CRECI completo com UF e tipo (ex.: `CRECI-SP 130767-F`) | Exigencia do COFECI/CRECI em anuncios e sites de corretor |
| Nome completo e foto profissional | Confianca e SEO local; hoje so aparece um "J" em um quadrado |
| E-mail profissional (ex.: `contato@jurandircorretordeimoveis.com`) | Formulario, Google Business e confianca |
| Horario de atendimento | Schema, Google Business e FAQ |
| Confirmar que os 3 perfis abaixo sao os oficiais e estao atualizados (secao 2.7) | `sameAs` no schema e links no site |
| Construtoras e empreendimentos com os quais trabalha | Conteudo real no lugar de textos genericos |
| Depoimentos reais, com autorizacao e nome | Ver item 3.4 |
| Se atende como pessoa fisica ou tem imobiliaria (CNPJ) | Hoje o site mistura "Sou" e "nossa equipe" |

---

## 1. Seguranca

O site e estatico, entao o risco esta sobretudo na hospedagem, no dominio e nos recursos de terceiros.

### 1.1 HTTPS e dominio
- Forcar HTTPS e redirecionar `www` para o dominio sem `www` (ou o contrario, mas escolher um so).
- Ativar HSTS depois de confirmar que o HTTPS esta estavel.
- No registro do dominio: ativar bloqueio de transferencia (registrar lock), renovacao automatica e autenticacao em dois fatores na conta do registrador. Perder o dominio e o pior cenario para um corretor.
- Configurar SPF, DKIM e DMARC assim que o e-mail profissional existir, para ninguem falsificar e-mails com o dominio.

### 1.2 Cabecalhos de seguranca
Configurar no host (Vercel, Netlify, Cloudflare Pages, Nginx, etc.). Exemplo para Vercel (`vercel.json`):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src https://www.google.com https://maps.google.com; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" }
      ]
    }
  ]
}
```

Observacao: a CSP acima so funciona se o JavaScript sair do HTML para um arquivo externo (item 1.3) e se as fontes forem auto-hospedadas (item 1.4). Se nao for possivel, usar `script-src 'self' 'sha256-...'` com o hash do script inline.

### 1.3 Remover JavaScript e CSS inline
- O menu usa `onclick="..."` inline. Mover para um `<script src="/site.js" defer>` com `addEventListener`.
- Mover o `<script>` de animacao para o mesmo arquivo.
- Isso permite CSP sem `'unsafe-inline'` para scripts. O CSS pode ficar inline ou ir para `style.css`.
- Obs.: a entrega final e "so o HTML". Se o Leonardo preferir manter um unico arquivo, deixar o JS inline e usar o hash na CSP.

### 1.4 Fontes: parar de carregar do Google Fonts
- Hoje o navegador do visitante contata `fonts.googleapis.com` e `fonts.gstatic.com`, o que envia o IP do visitante a terceiros (ponto de atencao na LGPD) e atrasa a renderizacao.
- Baixar as fontes escolhidas (ver item 3.2), converter para `woff2`, hospedar em `/fonts/` e usar `@font-face` com `font-display: swap`.

### 1.5 Links externos
- Os links `target="_blank"` ja usam `rel="noopener"`. Trocar para `rel="noopener noreferrer"`.
- O link do Google Maps tem um parametro `g_mp=` longo e inutil. Usar a URL curta do local ou `https://maps.google.com/?cid=15768625798372535246`.

### 1.6 Mapa embutido
- O iframe do Maps carrega codigo do Google ja no carregamento. Ja esta com `loading="lazy"`; adicionar `referrerpolicy="no-referrer-when-downgrade"` e `sandbox="allow-scripts allow-same-origin"`.
- Alternativa mais leve e privada: imagem estatica do mapa com link para o Google Maps.

### 1.7 LGPD
- Criar pagina simples `/privacidade` (ou secao no rodape) explicando: o site nao coleta dados proprios; o contato e feito via WhatsApp/telefone; o mapa e o WhatsApp sao servicos de terceiros.
- Se for adicionado formulario ou analytics no futuro, incluir aviso de cookies e consentimento.

### 1.8 Seguranca do contato
- Nao publicar e-mail em texto puro se for adicionado; usar formulario com protecao anti-spam (honeypot) ou link `mailto:` ofuscado.
- O link do WhatsApp deve ter mensagem pre-preenchida (tambem ajuda a medir origem):
  `https://wa.me/5511959003321?text=Ola%2C%20vim%20pelo%20site%20e%20gostaria%20de%20informacoes%20sobre%20imoveis.`

---

## 2. SEO

### 2.1 Erros de texto que afetam busca e credibilidade (corrigir primeiro)
O nome "Imoves" esta escrito errado em varios lugares. Para um corretor, isso e grave.

| Local | Atual | Correto |
|---|---|---|
| `<title>` | `Jurandir Corretor de Imovés, Creci 130767 \| Imobiliária` | ver 2.2 |
| `<meta name="description">` e `og:*` | `Imovés` | `Imóveis` |
| H2 "Sobre" | `Sobre a Jurandir Corretor de Imovés, Creci 130767` | `Sobre Jurandir, corretor de imóveis` |
| Rodape (copyright) | `Imovés` | `Imóveis` |
| Texto "Sobre" | `a 15 anos` | `há 15 anos` |
| Texto "Sobre" | `acessória` | `assessoria` |
| Texto "Sobre" | `médio é alto padrão` | `médio e alto padrão` |
| Texto "Sobre" | maiusculas aleatorias (`Atuando`, `Melhores`, `Pronto`) | caixa normal |
| Hero | `Praia Grande!.` | `Praia Grande.` |
| JSON-LD `name` | tem espaco sobrando no fim | remover |

### 2.2 Title, description e Open Graph
- Title (ate ~60 caracteres): `Corretor de Imóveis em Diadema | Jurandir - CRECI 130767`
- Description (ate ~155 caracteres): `Corretor de imóveis em Diadema com 15 anos de experiência. Imóveis prontos e na planta, Minha Casa Minha Vida e financiamento bancário. Fale pelo WhatsApp.`
- Adicionar: `<link rel="canonical" href="https://jurandircorretordeimoveis.com/">`
- Open Graph completo: `og:url`, `og:locale` (`pt_BR`), `og:site_name`, `og:image` (1200x630, foto real do corretor ou de um empreendimento) e `og:image:alt`.
- Adicionar `twitter:card` = `summary_large_image`.
- Adicionar `<meta name="theme-color">`.

### 2.3 Dados estruturados (JSON-LD)
O schema atual usa `LocalBusiness` com `description: "Imobiliária"` e endereco como texto corrido. Trocar por:

- Tipo: `RealEstateAgent` (subtipo de `LocalBusiness`).
- `address` como `PostalAddress` com `streetAddress`, `addressLocality` (Diadema), `addressRegion` (SP), `postalCode` (09941-202), `addressCountry` (BR).
- `areaServed`: Diadema, Sao Paulo, Santo Andre, Sao Bernardo do Campo, Sao Caetano do Sul, Praia Grande.
- `url`, `image`, `logo`, `sameAs` (Instagram, YouTube, Facebook e perfil do Google; URLs na secao 2.7), `openingHoursSpecification`, `priceRange` apenas se for real.
- NAO incluir `aggregateRating` nem `review` enquanto nao houver avaliacoes reais e verificaveis; o Google penaliza marcacao falsa.
- Validar em https://validator.schema.org e no Teste de Resultados Aprimorados do Google.

### 2.4 Estrutura e conteudo
- Hoje o site e uma pagina de ~150 palavras com conteudo generico. Isso rende pouco no Google. Meta: 600 a 900 palavras uteis.
- H1 com a palavra-chave e a cidade: `Corretor de imóveis em Diadema e região`. Hoje o H1 e so o nome.
- Remover o FAQ generico ("Como faco para agendar?" / "Quais formas de pagamento? Aceitamos Pix, dinheiro e cartoes"). A segunda pergunta nao faz sentido para corretagem. Trocar por perguntas reais, por exemplo:
  - Quem pode usar o Minha Casa Minha Vida e qual a renda maxima?
  - Quanto tempo leva a aprovacao do financiamento?
  - Quais documentos preciso para comprar um imovel?
  - Voces atendem em quais cidades?
  - Qual a diferenca entre imovel na planta e pronto?
  - Cobram algo do comprador?
  Marcar o FAQ com `FAQPage` em JSON-LD somente com respostas reais e revisadas pelo Jurandir.
- Criar secoes (ou paginas futuras) por regiao e tipo de imovel: "Imoveis em Diadema", "Apartamentos na planta em Sao Paulo", "Imoveis em Praia Grande", "Minha Casa Minha Vida".
- Citar nomes reais de construtoras e empreendimentos (com autorizacao), com foto, bairro, faixa de preco e link.
- Exibir o CRECI completo com UF perto do topo e no rodape.

### 2.5 Tecnico
- Criar `robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://jurandircorretordeimoveis.com/sitemap.xml
  ```
- Criar `sitemap.xml` com a home (e demais paginas quando existirem).
- Criar favicon (`favicon.ico` 32x32, `apple-touch-icon` 180x180, icone SVG). Hoje nao ha nenhum.
- Imagens (quando forem adicionadas): `alt` descritivo, `width` e `height`, `loading="lazy"`, formato `webp` ou `avif`.
- Acessibilidade tambem conta: adicionar link "Pular para o conteudo", rotulos no iframe (hoje `title="Mapa"` generico: `Mapa com a localizacao do escritorio de Jurandir`), contraste minimo AA.
- `<html lang="pt-BR">` ja esta correto.
- Remover `.ticker` com `aria-hidden` (ver 3.3): texto repetido e escondido nao ajuda SEO.

### 2.6 Google Business Profile e off-page
- Reivindicar e preencher o perfil do Google (o link `cid` do site indica que ja existe uma ficha). Usar exatamente o mesmo nome, endereco e telefone do site (NAP consistente).
- Pedir avaliacoes reais a clientes e colocar link para o perfil no site.
- Cadastrar o site no Google Search Console e no Bing Webmaster Tools; enviar o sitemap.
- Instalar uma analise de acessos que respeite a LGPD (Plausible, Umami ou GA4 com consentimento).

### 2.7 Redes sociais: Instagram, YouTube e Facebook

Perfis informados pelo Leonardo (usar exatamente estas URLs, sem parametros de rastreio):

| Rede | URL |
|---|---|
| Instagram | `https://www.instagram.com/jurandirdasilvasousa/` |
| YouTube | `https://www.youtube.com/@jurandirconsultor2626` |
| Facebook | `https://www.facebook.com/profile.php?id=100000658406769` |

A URL original do Facebook tinha parametros (`ref`, `target`, `hpir`, `http_ref`) que sao de rastreio e nao devem ir para o site. Se o Jurandir tiver uma URL curta (`facebook.com/nome`), preferir ela.

Tarefas:
- **Schema:** adicionar no JSON-LD
  ```json
  "sameAs": [
    "https://www.instagram.com/jurandirdasilvasousa/",
    "https://www.youtube.com/@jurandirconsultor2626",
    "https://www.facebook.com/profile.php?id=100000658406769"
  ]
  ```
- **Links no site:** adicionar uma coluna "Redes" no rodape (hoje ha Navegacao e Contato) e uma linha na secao de contato, com texto simples ("Instagram", "YouTube", "Facebook"). Sem emojis e sem icones de letra; se usar icone, SVG inline simples com `aria-hidden="true"` e o nome da rede em texto ao lado.
- **Atributos dos links:** `target="_blank" rel="noopener noreferrer me"` (o valor `me` ajuda a ligar o site aos perfis). Texto acessivel claro, por exemplo `aria-label="Instagram de Jurandir (abre em nova aba)"`.
- **Conteudo:** se o canal do YouTube tiver videos de empreendimentos ou dicas de financiamento, incorporar 1 ou 2 videos na home com facade leve (imagem de capa que so carrega o player ao clicar, `youtube-nocookie.com`), para nao pesar a pagina nem expor o visitante ao rastreamento. Se for usar o feed do Instagram, preferir 3 a 6 imagens proprias com link ao perfil, e nao o script de incorporacao do Instagram.
- **Reciprocidade:** colocar a URL `https://jurandircorretordeimoveis.com` na bio do Instagram, na descricao do canal do YouTube e na secao Sobre do Facebook, e usar o mesmo nome, telefone e CRECI nos tres perfis (consistencia NAP).
- **Compartilhamento:** `og:image` (1200x630) deve ser a mesma foto profissional usada nos perfis.
- **Seguranca:** ativar autenticacao em dois fatores nas tres contas; elas sao a vitrine do corretor e alvo comum de golpes de clonagem de WhatsApp e perfil.
- **Verificar antes de publicar:** o handle do Instagram (`jurandirdasilvasousa`) usa o nome completo e o do YouTube (`jurandirconsultor2626`) usa "consultor"; confirmar que os nomes de exibicao seguem o padrao do site ("Jurandir, corretor de imoveis").

---

## 3. Aparencia: menos cara de gerado por IA

O visual atual segue uma receita muito comum de templates automaticos: fundo preto com dourado, fonte serifada fina com sans moderna, vidro fosco, brilho radial, grade no fundo, numeracao "01 02 03 04", botoes em pilula e tudo aparecendo com animacao ao rolar. Um corretor de imoveis precisa passar proximidade, confianca e fotos reais, nao um visual de landing page de startup.

### 3.1 Emojis e simbolos (ja removidos no HTML entregue; confirmar)
Removidos: o losango decorativo do ticker (trocado por ponto CSS), as setas nos links "Solicitar", as estrelas do depoimento e a seta em "Voltar ao topo". Verificar que nenhum voltou e nao adicionar icones em texto (usar SVG inline simples se necessario, com `aria-hidden="true"`).

### 3.2 Direcao visual sugerida
- **Paleta**: trocar o preto e dourado por algo mais proprio de imobiliario: fundo claro (branco quente `#faf8f4`), texto grafite `#1f2933`, uma cor de acento sobria (azul petroleo `#1f4e5f` ou verde escuro `#2f5d50`) e um segundo tom neutro. Dourado so como detalhe, se for.
- **Tipografia**: uma unica familia bem escolhida (ex.: Source Sans 3, Inter ou IBM Plex Sans) com serifada apenas nos titulos se fizer sentido (ex.: Source Serif 4). Auto-hospedar (item 1.4). Remover o multiplicador `--tscale: 1.15` e tamanhos calculados com `calc(clamp() * var())`; usar uma escala simples.
- **Fotos reais**: foto do Jurandir no topo (hero lado a lado com o texto), fotos de empreendimentos e da regiao. Esse e o ganho mais forte contra o aspecto "gerado". Sem foto, o site continua parecendo modelo.
- **Cartoes de imoveis**: secao "Imoveis em destaque" com foto, tipo, bairro, metragem, quartos e faixa de preco, e botao "Pedir detalhes" que abre o WhatsApp com a mensagem ja citando o imovel.

### 3.3 O que remover ou simplificar no CSS e HTML
| Elemento | Acao |
|---|---|
| `.hero:before` (grade de linhas no fundo) e `.hero:after` (brilho radial) | Remover |
| `.v-hero-vitrine .hero-copy` (cartao de vidro com `backdrop-filter`) | Remover; hero simples, alinhado a esquerda |
| `.ticker` (faixa de texto correndo) | Remover |
| `.trust` com "3 Servicos oferecidos" | Remover; dado sem valor. Se houver, usar numeros reais: "15 anos de experiencia", "CRECI 130767" |
| `.kicker` com numeros "01", "02", "03", "04" e tracinho | Remover numeracao e linha; titulos de secao diretos |
| `.svc-icon` com letras "C", "L", "A" | Remover (icones de letra sao placeholder) |
| `.scroll-hint` (mouse animado) | Remover |
| `.eyebrow` em pilula com letras espacadas | Trocar por texto simples ou remover |
| Botoes `border-radius: 999px` | Usar raio pequeno (4 a 8 px) |
| Cabecalho em pilula flutuante com blur | Trocar por barra simples fixa, fundo solido |
| `.reveal`, `.grid .card` com fade/translate ao rolar, `lh-rise`, `lh-fade` | Remover; conteudo visivel de imediato |
| `.card:hover { translateY(-4px) }`, `.svc:after` linha animada, hover com `scale(1.02)` | Remover |
| Sombras grandes (`--shadow`, `0 34px 80px`) e `.v-contact-flutuante` (cartao "flutuante") | Remover |
| Raio `20px` em tudo | Reduzir para 6 a 10 px |
| Regras mortas: `.menu-*`, `.gallery*`, `.schedule*`, `.hour-row`, `.booking`, `.v-menu-*`, `.v-gallery-*`, `.v-schedule-*`, `.v-testimonials-slider/marquee`, `.hero-badge`, `.hero-media-fallback`, `v-hero-split`, `v-hero-minimal`, `v-services-lista/horizontal`, `font-family:"var-display"` | Apagar (cerca de metade do CSS nao e usada; e sinal de template gerado) |
| Classes tipo `v-hero-vitrine`, `v-services-grandes`, `data-area`, `sec sec-hero` | Renomear para nomes simples e semanticos |

### 3.4 Textos que soam genericos
Reescrever com a voz real do Jurandir, em primeira pessoa (ele mesmo diz "Sou Consultor de Negocios Imobiliario").

| Atual | Problema | Sugestao |
|---|---|---|
| "Imobiliária com atendimento próximo... Fale com a nossa equipe e descubra por que tantos clientes voltam sempre." | Frase de template; ele nao e imobiliaria, e corretor | "Ha 15 anos ajudo familias a comprar o primeiro imovel e investidores a encontrar boas oportunidades em Diadema, Sao Paulo, ABC e Praia Grande." |
| "Locação sem dor de cabeça" | Chavao | "Locacao" com descricao concreta |
| "Curadoria de imóveis e negociação transparente do início ao fim" | Linguagem de IA | "Ajudo voce a escolher o imovel, negociar com a construtora e fechar a compra." |
| "Precificação baseada em dados reais da região" | Promessa sem prova | So manter se o Jurandir fizer isso de fato e explicar como |
| "Resposta rápida pelo WhatsApp, sem compromisso" / "Vamos conversar?" | Generico | "Chame no WhatsApp: respondo em ate X horas" (so se for verdade) |
| Servicos: "Compra e venda", "Locacao", "Avaliacao" | Nao refletem o que ele realmente vende (planta, Minha Casa Minha Vida, medio e alto padrao, financiamento) | Reorganizar os servicos conforme o texto "Sobre": Imoveis na planta, Imoveis prontos, Minha Casa Minha Vida, Assessoria de financiamento |
| Depoimento "Cliente satisfeito, Google" com 5 estrelas | Parece inventado e nao tem nome nem fonte; pode configurar propaganda enganosa | Remover ate haver depoimentos reais com nome (ou iniciais) e autorizacao, ou link direto para as avaliacoes do Google |
| Misto de "Sou" (singular) e "equipe/Trabalhamos" (plural) | Incoerencia | Escolher uma voz e manter |
| Rodape: "Imobiliária em Diadema - SP" | Incorreto, ele e corretor autonomo | "Corretor de imoveis em Diadema - SP. CRECI-SP 130767" |

### 3.5 Layout sugerido (ordem das secoes)
1. Cabecalho simples: nome, CRECI, links, botao WhatsApp.
2. Hero: foto do corretor + H1 + 2 linhas de texto + botao WhatsApp + telefone.
3. O que eu faco (4 itens reais, lista simples, sem icones de letra).
4. Imoveis ou empreendimentos em destaque (fotos reais).
5. Sobre mim (foto, 15 anos, construtoras, areas de atuacao).
6. Como funciona o financiamento / Minha Casa Minha Vida (3 a 5 passos).
7. FAQ real.
8. Contato: WhatsApp, telefone, endereco, horario, mapa.
9. Rodape: nome, CRECI-SP completo, privacidade, copyright.

### 3.6 Mobile e desempenho
- A maior parte dos visitantes vem do celular: botao de WhatsApp fixo no rodape (ja existe, manter, mas com a cor e o raio coerentes com o novo estilo) e botao de ligar.
- Alvo: Lighthouse acima de 90 em Desempenho, Acessibilidade, Boas praticas e SEO.
- Respeitar `prefers-reduced-motion` (mais facil depois de remover as animacoes).

---

## 4. Hospedagem e dominio

- Registrar `jurandircorretordeimoveis.com` em um registrador conhecido (o Registro.br so registra `.br`). Avaliar tambem registrar `jurandircorretordeimoveis.com.br` e redirecionar para o `.com` (ou o contrario), pois o publico brasileiro costuma digitar `.com.br`.
- O dominio e longo; considerar registrar uma versao curta como redirecionamento (ex.: `jurandircorretor.com.br`), se disponivel.
- Hospedagem sugerida para site estatico: Vercel, Netlify ou Cloudflare Pages (gratuito, HTTPS automatico, CDN). O arquivo deve ser servido como `index.html` na raiz.
- Apos o deploy: testar em https://securityheaders.com, https://pagespeed.web.dev e https://search.google.com/test/rich-results.
- Depois de publicar: enviar o sitemap no Search Console e atualizar o site no perfil do Google Business.

---

## 5. Checklist final para o Codex

- [ ] Nenhum emoji ou simbolo decorativo no arquivo
- [ ] "Imovés" corrigido para "Imóveis" em todos os pontos
- [ ] Erros de portugues do texto "Sobre" corrigidos
- [ ] Title, description, canonical e Open Graph atualizados
- [ ] JSON-LD trocado para `RealEstateAgent` com `PostalAddress`, sem avaliacao falsa
- [ ] Depoimento placeholder e FAQ generico removidos ou trocados por conteudo real
- [ ] Fontes auto-hospedadas, sem chamadas ao Google Fonts
- [ ] JavaScript sem `onclick` inline
- [ ] CSS limpo (regras nao usadas apagadas) e sem efeitos de vidro, brilho, ticker, numeracao e animacoes de entrada
- [ ] Nova paleta, tipografia e raios de borda conforme item 3.2
- [ ] `robots.txt`, `sitemap.xml`, favicon e `vercel.json` (ou equivalente) criados
- [ ] CRECI completo com UF visivel no topo e no rodape
- [ ] Pagina de privacidade
- [ ] Instagram, YouTube e Facebook no rodape, na secao de contato e em `sameAs` (secao 2.7)
- [ ] Lighthouse acima de 90 e `securityheaders.com` com nota A ou melhor
