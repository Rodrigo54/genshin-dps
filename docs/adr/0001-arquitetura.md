# ADR-0001: Arquitetura do site de ranking de DPS de times do Genshin Impact

**Status:** Aceito
**Data:** 2026-09-23 (revisado em 2026-09-25: catálogo de personagens e nível por membro)
**Decisor:** Rodrigo

## Contexto

Site-infográfico que reúne benchmarks de DPS de times do Genshin Impact, em português e inglês.

- **"Meta"** é o **melhor desempenho medido**. Toda entrada aponta para uma fonte verificável (`ref`).
- **Qualquer personagem pode ser DPS principal** (uma Barbara DPS é uma entrada válida). A tabela por
  constelação mostra onde o investimento vira ponto de virada, sem impor regra de "quem é DPS".
- **Métrica:** DPS do time (soma dos 4 personagens na rotação). O site é um **agregador**: aceita medições
  no boneco de DPS do Miliastra, simulações e outros métodos, sem padronizá-los. A metodologia de cada número é
  responsabilidade da fonte e fica descrita na `ref` do benchmark.
- **Restrições:** projeto pessoal com 1 mantenedor, custo próximo de zero, SEO importante e volume
  pequeno (centenas de times), atualizado a cada patch.

## Decisões

### Produto

- **Home:** ranking geral, com uma linha por DPS principal mostrando o melhor time dele dentro do filtro.
- **Filtro de investimento**, com dois estados, cada um numa rota própria para o prerender:
  - **Baseline** (padrão): o time inteiro respeita a regra abaixo.
    - Todo personagem até o **nível 90**, o máximo por ascensão. 95 e 100 são investimento extra, com qualquer
      raridade.
    - Personagem 5★ (limitado ou permanente) em **C0**.
    - Personagem 4★ em **C6**.
    - Arma 5★ em **R1**.
    - Arma 4★ ou 3★ em **R5**.
    - Exceções pelo que o jogo dá de graça: **C1** dos 5★ do evento "Controlar-se e Viajar Para Longe"
      ("To Temper Thyself and Journey Far", 鍛錬の道), qualquer constelação da Viajante e armas 5★
      gratuitas (Exaiphanes Blade) em qualquer refinamento.
  - **Sem baseline:** qualquer investimento.
- **Página do personagem:**
  - **Times:** a tabela de progressão com todos os benchmarks em que ele é DPS principal, ordenados
    por DPS do time. Cada linha mostra os 4 membros com C/R, o DPS do time e o tempo de rotação.
  - **Overview:** ficha de wiki com ascensão (nível, Vida, ATQ, DEF e o atributo de ascensão),
    materiais, livros de talento, material de chefe, descrições do personagem, dos talentos e das
    constelações, primeiro banner e reruns.
  - **Detalhe de cada time:** rota própria, com cards de build no estilo Artifacter, rotação e `ref`.
- **Patch:** é só um selo. O benchmark continua valendo entre versões e só sai do ranking com
  `obsolete: true`, marcado à mão.
- **Notas:** `notes: { pt, en }` é opcional, com fallback para o outro idioma e selo "original em X".
  Usar só como exceção.

### Dados

- **YAML versionado no git**, com um arquivo por DPS principal em `data/benchmarks/`. Não há backend
  nem banco.
- **Validação** com Zod (`packages/schema`) num script de build que gera o JSON consumido pelo app.
  O JSON gerado não é versionado e nunca é editado à mão.
- **Campos obrigatórios:** `teamDps`, `patch`, `ref` (`author` e `url`, com `tool` e `notes` opcionais), `main`
  (constelação, arma e refinamento do DPS principal, que vem do nome do arquivo) e `supports` (os outros 3 membros,
  cada um com personagem, constelação, arma e refinamento). Nos suportes, a arma é opcional porque as fontes da
  comunidade às vezes a omitem, e arma ausente não tira o time do Baseline; arma informada sempre leva refinamento.
- **Campos opcionais:** `rotationTime`, `rotation`, `notes`, `obsolete`, e por membro `level`, `sets`, `talents`,
  `stats` e `mainStats`.
  - `level` aceita 90, 95 ou 100, com 90 quando ausente. Fora do 90, entra no id do time; no 90, não, para os times
    anteriores ao campo manterem a URL.
  - `mainStats` guarda os principais de relógio, cálice e tiara, validados contra uma lista fechada por peça.
  - A recomendação do personagem sai do melhor time medido, não de um arquivo de opinião.
  - Substatus peça a peça ficam de fora até existir o card estilo Artifacter, porque o `genshin-db` só cataloga
    os sets.
- **Catálogo de personagens:** `data/characters/<id>.yaml`, um por personagem jogável já lançado, gerado por
  `bun run characters` a partir das tabelas do jogo (Dimbreath/animegamedata2) e nunca editado à mão.
  - Traz nome, raridade, elemento, ícone, região, tipo de arma, a aba Perfil (título, constelação, rótulo do
    elemento, afiliação e descrição, no estado depois da revelação da história) e os status nos níveis 90, 95 e 100. É a base da aba Overview.
  - A Viajante é uma entrada só, a do Aether (ícone e texto no masculino), com afiliação "Melhor amigo de Paimon".
  - Roda à mão a cada patch; o diff do commit mostra o que o patch mudou.
- **Catálogo de armas e sets:** vem do pacote `genshin-db`, consumido no build, com nomes em PT e EN.
- **Overrides:** `data/catalog-overrides.yaml` acrescenta entradas que a fonte ainda não tem e aliases (ex.: `Bennet`
  → `Bennett`, `Lumine` → `Traveler`). O build avisa quando um override ficou redundante.
- **Banners:** `data/banners.yaml`, com seed inicial por script a partir de uma fonte pública, revisado
  no commit e mantido à mão depois.
- **Imagens:** um script baixa no build só os ícones usados, converte para WebP com `sharp` e o próprio
  site as serve. No CI, ficam em cache via `actions/cache`. Créditos e o aviso da Fan Content Policy da
  HoYoverse ficam na página Sobre.
- **Contribuição:** Issue Form no GitHub. O mantenedor transcreve para o YAML e credita quem enviou.

### Frontend

- **Angular com prerender** (`outputMode: 'static'`), hidratação e navegação como SPA depois da primeira
  carga. Zoneless, com componentes standalone de arquivo único.
- **i18n com Transloco:**
  - Rotas em inglês com o idioma como prefixo (`/pt/...` e `/en/...`), num único build.
  - Os dois idiomas são prerenderizados via `getPrerenderParams`.
  - hreflang recíproco, com `x-default` apontando para a URL sem prefixo.
  - Um teste falha se o HTML prerenderizado contiver chave sem tradução.
- **Estilo:** Tailwind CSS v4 com tokens próprios de elemento e raridade (`--color-pyro` etc.). Sem Angular
  Material.
- **Fontes:** todas servidas pelo próprio site.
  - Texto em Zen Kaku Gothic New (OFL, via `@fontsource`, só latin), que tem pesos de verdade e lê bem em tamanho
    pequeno.
  - Títulos e números na HYWenHei, a fonte do jogo, como fazem Akasha e Enka. O arquivo é o corte latino em WOFF2
    (44 KB) do akasha.cv, que já traz os acentos do português. A fonte é proprietária (Hanyi, licenciada à
    HoYoverse), então é usada só nos destaques, no mesmo espírito do conteúdo de fã.
- **Overlays:** tooltips e popovers sobre o Angular CDK (Overlay) com signals.
- **Gráficos:** Apache ECharts via `ngx-echarts`, importando de `echarts/core` para o tree-shaking.
  Carregam só no cliente, com um placeholder dimensionado no prerender e `@defer (on viewport)`.

### Hospedagem e entrega

- **Netlify.**
  - A URL sem prefixo redireciona pelo `_redirects` com a condição `Language`, e o seletor de idioma
    grava o cookie `nf_lang`.
  - Há um 404 por idioma para não gerar `/pt/pt/...`.
- **Pipeline no GitHub Actions:** lint → format:check → testes → dados → imagens → build → deploy com
  a Netlify CLI.
  - Preview em PR e produção na `main`.
  - Secrets: `NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID`.
- **Monorepo com workspaces do Bun:**

```
genshin-dps/
├── apps/web/            # Angular (prerender)
├── packages/schema/     # Zod e tipos compartilhados
├── scripts/             # build de dados, imagens e seeds
├── data/                # YAML, fonte da verdade
└── docs/adr/
```

- **Testes:** `bun test` para os pacotes e os scripts, e Vitest para o app. Não há e2e por enquanto.
- **Lint e formatação:** ESLint (`angular-eslint`) e Prettier com `prettier-plugin-tailwindcss`.

## Opções consideradas

### Estático com YAML no git (escolhida)

- **Prós:**
  - Histórico e revisão via git.
  - O CI valida os dados.
  - SEO excelente.
  - Nada para operar, com custo zero.
- **Contras:**
  - Atualizar exige commit e build.
  - A contribuição de leigos passa por issue.

### Angular com API e Postgres

- **Prós:** envio direto pelo site, moderação e atualização sem deploy.
- **Contras:** autenticação, moderação, migrações e hospedagem para um volume que não precisa disso.

### Planilha ou headless CMS como fonte

- **Prós:** edição amigável.
- **Contras:**
  - Builds aninhadas ficam ruins em planilha.
  - A validação é fraca.
  - Cria dependência externa e não tem histórico por PR.

### Outras escolhas

- **Astro com ilhas Angular:** descartado para manter uma stack só. O prerender do Angular já cobre o SEO.
- **`@angular/localize`:** descartado porque exige um build por idioma. O Transloco serve os dois num build
  só.
- **Idioma sem prefixo na rota** (por cookie ou subdomínio, como no Enka): descartado porque o prefixo dá
  URLs indexáveis por idioma com hreflang simples.
- **Cloudflare Pages:** trocado pela Netlify, que resolve o redirecionamento por idioma de forma nativa no
  `_redirects`.
- **Condições estruturadas** (Abismo, multialvo, modos): descartadas. Cada fonte descreve o próprio cenário
  em `ref.notes`.
- **Campo de método com selo** (`simulation` / `dummy`): descartado porque os métodos tendem a se multiplicar.
- **Cadastro central de fontes:** descartado porque qualquer perfil da comunidade é uma fonte em potencial; cada
  benchmark carrega a própria `ref`.
- **Personagens do `genshin-db`:** trocado pelas tabelas do jogo. O pacote não tem o rótulo do elemento da aba
  Perfil (Visão, Gnosis, Eixo Estelar…), deixa sem região os tipos de afiliação novos e demora a receber os
  personagens novos. As tabelas também guardam alguns campos com nome ofuscado, que podem mudar a cada versão; o
  gerador falha com a causa em vez de gravar dado errado.

## Consequências

- **Fica mais fácil:**
  - Revisar e reverter dados pelo git.
  - Garantir consistência com Zod no CI.
  - O SEO nos dois idiomas.
  - Custo zero.
- **Fica mais difícil:** a contribuição de quem não é dev, e a atualização instantânea.
- **Quando revisitar:**
  - Backend, se os envios da comunidade crescerem.
  - Filtros além de Baseline e Sem baseline, se a demanda aparecer.

## Fora do boilerplate inicial

- **Páginas e visual:** Overview completo, gráficos, cards estilo Artifacter e design visual.
- **Scripts de entrada:** o seed de banners, o Issue Form, a importação da planilha da comunidade, o
  snapshot da Enka, a extração a partir de prints e a exportação do card em PNG.
- **Testes de interface:** e2e com Playwright.
