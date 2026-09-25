# genshin-dps

Site-infográfico estático (PT/EN) com o ranking de DPS de times do Genshin Impact. As decisões de arquitetura e o
porquê de cada uma estão em [docs/adr/0001-arquitetura.md](docs/adr/0001-arquitetura.md).

## Comandos

Sempre Bun, nunca npm/yarn/pnpm.

| Comando                                                       | O que faz                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `bun install`                                                 | instala o monorepo inteiro                                    |
| `bun run data`                                                | valida `data/**/*.yaml` e gera `apps/web/public/data/*.json`  |
| `bun run images`                                              | baixa só os ícones que faltam (Enka e Project Amber), em WebP |
| `bun run characters`                                          | a cada patch: regera `data/characters/*.yaml` do jogo         |
| `bun run start`                                               | dados + ícones + `ng serve`                                   |
| `bun run build`                                               | dados + ícones + `ng build` com prerender                     |
| `bun run check:i18n`                                          | depois do build: falha se algum HTML tiver chave sem tradução |
| `bun run test`                                                | `bun test` em `packages/` e `scripts/`, e Vitest no app       |
| `bun run lint` / `bun run format:check` / `bun run typecheck` | o que o CI roda antes dos testes                              |

## Mapa do monorepo

- `data/benchmarks/<id-do-personagem>.yaml`: benchmarks de um DPS principal (fonte da verdade).
- `data/characters/<id>.yaml`: catálogo de personagens, gerado por `bun run characters` a partir das tabelas do jogo
  (Dimbreath/animegamedata2). Não edite à mão; regras próprias (regiões, Viajante) ficam em `scripts/src/characters/`.
- `data/catalog-overrides.yaml`: aliases e entradas que a fonte ainda não tem.
- `packages/schema`: schemas Zod da entrada e tipos do JSON gerado. O app importa só `@genshin-dps/schema/site-data`,
  que não puxa o Zod para o bundle.
- `scripts/`: `build-data.ts`, `build-images.ts`, `build-characters.ts` e `check-i18n.ts`, com a lógica testável em
  `scripts/src/`.
- `apps/web`: Angular com `outputMode: 'static'`.
- `.github/workflows/ci.yml`: lint → testes → dados → ícones → build → i18n → deploy na Netlify.

## Fluxo de dados

YAML → Zod + catálogo (personagens de `data/characters`, armas e sets do `genshin-db`, + overrides) → JSON em
`apps/web/public/data/` → app.

- **Nunca editar o JSON gerado.** `apps/web/public/data/` e `apps/web/public/images/` ficam fora do git.
- **Nomes são exatos:** PT ou EN, ignorando só caixa e espaços. O `genshin-db` faz busca aproximada e esse
  comportamento é bloqueado de propósito. Nome desconhecido quebra o build; resolva com alias no overrides.
- **Arquivos:** o nome do arquivo (`mavuika.yaml`) define o DPS principal. Cada benchmark tem `main`, só com
  C/R e build dele, e `supports`, com os outros 3 membros. Nome de arquivo que não é id de personagem, ou personagem
  repetido no time, quebra o build.
- **Elemento:** vem do catálogo. Quem não tem elemento fixo (Viajante, Manequins) exige `element` na build
  (ex.: `element: cryo`); em quem tem, o campo quebra o build. O elemento entra no id do time.
- **Dado ausente na fonte:** nos suportes, `weapon` é opcional (a UI mostra "arma não informada") e não tira o time
  do Baseline, mas arma informada sempre leva `refinement`. A constelação é sempre obrigatória: quando a fonte
  omite, transcreva C0 e registre o critério no comentário do YAML. O DPS principal exige tudo.
- **Nível:** `level` por membro aceita 90, 95 ou 100; ausente vale 90. O card de personagem mostra os status desse
  nível.
- **Id do time:** hash do DPS principal e dos outros três membros, sem importar a ordem, com C/R, armas e o nível
  quando não é 90. DPS,
  patch e `ref` ficam de fora, então uma nova medição do mesmo time mantém a URL. O mesmo time com o mesmo
  investimento só pode aparecer uma vez: o build recusa a duplicata.
- **Sem dados fictícios:** todo benchmark precisa de uma `ref` real e verificável: `{ author, url, tool?, notes? }`,
  com o crédito a quem publicou, o link https e, em `notes`, a metodologia e as observações da fonte.

## Metodologia (regra de produto)

- **Agregador:** o site reúne benchmarks da comunidade (medição no boneco, simulação etc.) e não padroniza o método.
  O número é sempre o DPS do time (soma dos 4 na rotação), e a metodologia é responsabilidade da fonte, descrita
  em `ref.notes`. Não há campo de método nem selo por método.
- **Baseline é um teto de investimento:** todo personagem até o nível 90, personagem 5★ até C0 e arma 5★ até R1,
  mais o que o jogo dá de graça:
  - C1 dos 5★ do evento "Controlar-se e Viajar Para Longe" (EN: "To Temper Thyself and Journey Far", JP: 鍛錬の道);
  - qualquer constelação da Viajante;
  - armas 5★ gratuitas (Exaiphanes Blade) em qualquer refinamento;
  - personagens 4★ e armas 4★/3★ em qualquer constelação e refinamento.

  A regra e as listas ficam em `packages/schema/src/baseline.ts`.

- **Home:** o melhor time de cada DPS principal por filtro, em `/:lang` (Baseline) e `/:lang/all` (Sem baseline).
- **Ordenação e selos:** a tabela do personagem ordena pelo DPS do time. O patch é só um selo, e `obsolete: true`
  tira o time do ranking, mas não da tabela.
- **Notas (`notes: { pt, en }`):** são exceção, e basta um idioma.

## Convenções do Angular

- **Componentes:** standalone e em arquivo único, com template e estilos inline, sem `.html`/`.css` separados.
  `ChangeDetectionStrategy.OnPush` sempre.
- **Estado e reatividade:** zoneless, com signals (`input()`, `computed`, `effect`, `httpResource`).
- **Injeção e templates:** `inject()` em vez de construtor com parâmetros, e control flow `@if`/`@for`/`@let` em vez
  de `*ngIf`/`*ngFor`.
- **Estilo:** só classes do Tailwind v4. Os tokens (superfícies, elementos, raridades) ficam em
  `apps/web/src/styles.css`. Classe dinâmica vem de mapa com o nome completo (ex.: `shared/ui/game-colors.ts`),
  nunca de interpolação como `bg-rarity-${n}`.
- **Fontes:** servidas pelo próprio site, nada de fonte externa por link. Zen Kaku Gothic New no texto (`font-sans`),
  via `@fontsource` (só `latin-*.css`), e a HYWenHei do jogo em títulos e números (`font-display`), em
  `apps/web/public/fonts/genshin.woff2`, declarada com `@font-face` em `styles.css`.
- **Textos:** só via chaves do Transloco em `apps/web/public/i18n/{pt,en}.json`, sempre nos dois arquivos.
  Nenhum texto de UI fica fixo no template.
- **Overlays** (tooltip, popover): só sobre o Angular CDK. O tooltip de texto está em `shared/ui/tooltip.ts`.
  O de arma, no visual do tooltip do Project Amber (Ambr), está em `shared/ui/weapon-tooltip.ts`, com os dados
  gerados no build a partir do `genshin-db`.
- **Rotas:** em inglês, sob `/:lang`. Rota nova precisa de entrada em `app.routes.server.ts` com
  `getPrerenderParams` para os dois idiomas.
- **Dados no app:** caminhos a partir da raiz (`/data/...`, `/images/...`), montados por `SITE_DATA_PATHS`.
- **Título e descrição:** via `syncPageMeta`. hreflang e canonical são automáticos em `AlternateLinks`.

## Hospedagem

- **Deploy:** Netlify, pela CLI no GitHub Actions: preview em PR e produção em push na `main`. Os secrets são
  `NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID`.
- **`apps/web/public/_redirects`:** a URL sem idioma redireciona pelo cookie `nf_lang` ou pelo `Accept-Language`,
  e cada idioma tem o próprio 404.
- **Domínio:** o domínio de produção fica em `apps/web/src/app/core/seo/site-origin.ts`.
