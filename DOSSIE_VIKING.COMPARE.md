# Dossiê Comparativo — Viking Bookings vs. Pico Base

**Alvo analisado:** Viking Bookings (`vikingbookings.com`) — software de gestão e reservas
para escolas de esportes aquáticos (kite, surf, SUP, windsurf, wing, sailing). Concorrente
direto de segmento: mesmo público-alvo (escolas sazonais de esporte na água), mesma dor
central (agendamento + gestão de operação).

**Fontes:** 11 screenshots de scroll completo (`viking-software/screenshots/`), CSS
computado real (`viking-software/css/original.css`, 9k linhas), paleta de cores extraída
por contagem de uso (`analysis/color-palette.json`), tipografia computada
(`analysis/typography.json`), grid/flex system (`analysis/grid-system.json`),
metadata de página (`metadata/page-info.json`). Site é Webflow (não React/Next), com
Tailwind, styled-components e Emotion detectados na página (provavelmente de um widget de
terceiros embutido, não da base do site).

**Projeto comparado:** Pico Base (`picobase-web/`, Next.js App Router + Tailwind v4
CSS-first). Leitura direta de `src/app/owner/page.tsx` (Base Camp — dashboard do dono),
`src/app/owner/payments/PaymentsClient.tsx`, `src/app/checkin/[school]/CheckinForm.tsx`,
`src/components/ui/Button.tsx`, `src/components/ui/Badge.tsx`, `src/app/tokens.css` e
`src/app/globals.css`, mais os dois documentos internos já existentes
(`DESIGN_SYSTEM.md`, `AUDITORIA_DASHBOARD.md`).

---

## 1. Dossiê de engenharia e UI/UX — Viking Bookings

### 1.1 Paleta de cores (por frequência real de uso, não por CSS declarado)

| Cor | Uso dominante | Contagem |
|---|---|---|
| `rgb(47, 50, 67)` — grafite azulado | texto principal, headings, fundo de seções escuras | 2713 |
| `rgb(0, 0, 0)` | sombras/overlays | 1966 |
| `rgb(51, 51, 51)` | texto secundário | 547 |
| `rgb(255, 255, 255)` | fundo, texto sobre escuro | 497 |
| `rgb(244, 244, 245)` | fundo neutro claro | 159 |
| **`rgb(1, 195, 207)` — teal vibrante** | **CTA, links, palavra-chave em destaque, ícones ativos** | **134** |
| `rgb(252, 191, 2)` — âmbar | selo/destaque pontual | 10 |

O dado mais relevante aqui não é a lista de cores — é a **proporção**. A página é ~95%
acromática (grafite/branco/cinza) e usa exatamente **uma** cor saturada (o teal) para tudo
que é acionável ou "isto está vivo/ativo agora": botão primário, links, palavra em destaque
dentro de um título ("works **perfectly** for"), indicador ativo. Nenhuma segunda cor
compete por atenção. O âmbar aparece 10 vezes só — reservado para um selo muito específico.

### 1.2 Tipografia

```json
h1/h2: 36px / peso 700 / line-height 46px — "Cera Pro"
h3:    30px / peso 700 / line-height 40px
body:  16px / peso 500 / line-height 26px
```

Salto de escala grande entre heading e corpo (36px → 16px, mais que o dobro) — hierarquia
lida em um piscar de olhos, sem precisar de cor ou peso para reforçar "isto é o título".
Peso 700 em todos os headings (nunca 600/500 fazendo o trabalho de um h1) e peso do corpo
mais alto que o comum (500, não 400) — o texto secundário nunca fica "fraco" na tela.

### 1.3 Arquitetura de layout e grid

- **29 seções** de página, largura máxima do container: `1268px`.
- Grid principal: `_2-column-grid` (596px/596px, gap 28px) e `_3-column-grid`
  (388px×3, gap 28px) — sempre múltiplos de um gap-base de 28px, nunca valores soltos.
- Breakpoints: `479 / 767 / 768 / 991 / 992px` — cobertura mobile → tablet → desktop em
  degraus pequenos (evita saltos bruscos de layout).
- **Cortes diagonais entre seções** (`clip-path`/`transform: skew` no CSS original) em vez
  de divisores retos — visível nos screenshots 000→010 (a seção escura do hero termina em
  diagonal, não em linha reta) e 060→070. Efeito: a página nunca lê como "pilha de
  retângulos empilhados", que é o antipadrão mais comum em landing pages de SaaS genérico.

### 1.4 Padrão de hero e conversão

Screenshot `checkpoint-030.png` (hero real, acima da dobra):

- Título de duas linhas + subtítulo de uma frase + **checklist de 3 USPs** (palavra em
  negrito + explicação curta) — não é um parágrafo de marketing, é uma lista escaneável.
- **CTA duplo**: botão sólido teal ("Book a free demo") + botão outline ("See our
  solutions") lado a lado — ação primária clara, mas sem forçar quem só quer explorar.
- Microcopy de confiança logo abaixo dos botões, tamanho reduzido, cor neutra: "✓ Talk to
  an expert · ✓ No strings attached · ✓ Premium support" — objeções resolvidas antes de
  serem levantadas, sem gritar.
- **Mockup do produto flutuando em camadas**: um card "Customer Portal" com uma tabela de
  agendamentos, sobreposto por um segundo card menor "Your booking" e um terceiro card de
  calendário — três `z-index` diferentes, sombras suaves, levemente deslocados entre si.
  O visitante vê a interface real do produto nos primeiros 2 segundos de página, não uma
  ilustração genérica de estoque.

### 1.5 Componentes recorrentes

- **Card de feature-nav** (`checkpoint-040.png`): ícone de linha fina + título bicolor
  (primeira palavra branca, palavra-chave em teal) + link "Learn more →". Repetido 4x em
  grid, sobre fundo escuro.
- **Card de persona** (`checkpoint-060.png`, "for who"): mesmo esqueleto (ícone + título +
  corpo + link), mas em cards com fundo semi-translúcido sobre gradiente azul — "glassmorphism"
  discreto (não um vidro borrado pesado, só uma superfície ligeiramente elevada).
- **Testimonial card** (`checkpoint-050.png`): aspas gigantes em outline teal + avatar
  circular + manchete em negrito (a citação vira um "título", não um bloco de texto corrido)
  + corpo de apoio. Fundo cinza claro, sem borda.
- **Marquee horizontal de features** (`checkpoint-050.png`, topo): dezenas de recursos
  específicos ("Release courses", "QR code waivers", "Change pre-filled templates") como
  chips roláveis horizontalmente — comunica profundidade de produto sem exigir uma seção
  gigante de features detalhadas.
- **Prova social concreta** (`checkpoint-080.png`): "Trusted by 250+ companies", contagem
  real de reviews do Google (38, com estrelas), e um card de depoimento com **logo real de
  cliente**, não um placeholder.
- **Toque humano** (`checkpoint-090.png`): foto real de uma pessoa da equipe ("Book your
  call with Dirk") antes do formulário de agendamento — o CTA de conversão final não fala
  com "a empresa", fala com uma pessoa nomeada.
- **Navbar flutuante**: barra branca em pílula, com margem do topo/laterais da viewport
  (não colada nas bordas), pousada sobre o hero escuro — lê como um elemento de UI "sobre"
  a página, não como parte do fundo.

### 1.6 Micro-interações (extraídas do CSS computado real)

```css
/* Botões e cards — transições combinadas, nunca só opacity */
transition: box-shadow 0.3s, transform 0.3s;
transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);   /* back-ease: overshoot sutil */
transition: transform 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);

/* Sombras — sempre baixa opacidade + blur grande, nunca offset duro */
box-shadow: rgba(0, 0, 0, 0.15) 0px 0px 10px;
box-shadow: rgba(7, 19, 59, 0.25) 0px 0px 20px;
box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 6px;
```

O padrão: hover em card/botão anima **transform + box-shadow juntos**, com uma curva de
easing que "estoura" ligeiramente antes de assentar (`cubic-bezier(0.175, 0.885, 0.32,
1.275)` tem overshoot > 1). Resultado perceptível: o elemento parece fisicamente reagir ao
cursor, não só mudar de cor. Nenhuma sombra no CSS inteiro usa offset duro tipo
`4px 4px 0px #000` — é sempre halo suave e centralizado.

---

## 2. Gap analysis — onde o Pico Base fica atrás (e onde já está à frente)

### 2.1 Visão geral

| Dimensão | Viking Bookings | Pico Base hoje | Gap |
|---|---|---|---|
| Paleta | 1 cor saturada (teal) contra grafite/branco | Repintura recente para grafite + rosa quase monocromática (`tokens.css`) — **nenhuma cor saturada de "marca" sobrevivendo consistentemente** | 🔴 Alto |
| Micro-interação hover | `transform` + `box-shadow`, easing com overshoot | `Button.tsx`: só `hover:opacity-90` | 🔴 Alto |
| Consistência de tokens | N/A (Webflow, CSS único) | Sistema de design (`pb-*`) existe mas só está em 3 telas; resto do app duplica hex à mão (`DESIGN_SYSTEM.md` mesmo documenta isso) | 🟡 Médio — já mapeado internamente |
| Sombras/raio | Halos suaves, blur grande | Tokens `--shadow-sm/md/lg` e `--radius-*` **já existem e já são igualmente suaves** — fundação boa, só subutilizada | 🟢 Baixo |
| Hero/prova social | Mockup flutuante + reviews reais + foto humana | Site de marketing (`(marketing)/page.tsx`) já tem estrutura equivalente (comparação, tabs, ticker) — ver 2.4 | 🟢 Já competitivo |
| Arquitetura de informação | 29 seções, hero → prova → objeção → CTA nomeado | Fluxo de check-in já é wizard por etapas com progresso — ver 2.3 | 🟢 Já competitivo |

### 2.2 Dashboard — Base Camp (`src/app/owner/page.tsx`)

Esta é a tela que o dono da escola olha o dia inteiro. Ela é **funcionalmente** sofisticada
— dados de ocupação de equipe, comparação mês a mês, presença "na água agora" calculada por
janela de horário — mas visualmente ela não usa nenhum dos recursos que a Viking usa para
guiar o olho:

- Toda a hierarquia visual depende de `font-size` + `color: var(--mist)` (linha 268-346).
  Não há nenhum estado de hover em card, nenhuma elevação diferenciando "isto é a métrica
  principal" de "isto é secundário" além do grid 2 colunas (linha 147-155).
- O único acento de cor "vivo" da tela é o pill "na água agora" (linha 251-265), que usa
  `var(--glacial-light)` / `var(--glacial-dark)` — **a mesma família de cor usada em botões,
  links e qualquer outro elemento "neutro-ativo" do app**. Não existe hoje nenhuma cor que
  signifique especificamente "isto está acontecendo agora em tempo real", que é
  exatamente o tipo de sinal que a Viking reserva exclusivamente para o teal.
- Tabela de sessões recentes (linha 405-479): puro `<table>` com bordas `0.5px`, sem
  nenhuma transição além do `background` no hover de linha (`tbl-row:hover`, linha 144).
  Funciona, mas não há nenhum feedback de profundidade — comparar com os cards da Viking,
  que sempre respondem ao cursor com sombra + leve translação.

### 2.3 Check-in do aluno (`src/app/checkin/[school]/CheckinForm.tsx`)

Esta é, das três telas pedidas, a que mais se aproxima da "vitrine" pública da Viking —
é a primeira tela que um cliente do seu cliente (o aluno da escola) vê. E já está bem
resolvida em termos de fluxo:

- Wizard de 4 passos com barra de progresso animada (linha 476-507) — mesmo princípio de
  "reduzir a decisão de uma vez" que a Viking usa no formulário de agendamento de demo.
  Inputs grandes (padding `16px 18px`, `border-radius: 14px`, fonte `17px` — linha
  211-223), pensados para toque em celular na recepção.
- Tela de sucesso com ícone circular, resumo dos dados e branding (linha 823-881) — mesma
  estrutura de "confirmação com identidade" que fecha o funil da Viking.

O que falta, comparado ao vocabulário visual da Viking:

- **Nenhum estado de hover/press com profundidade** nos botões de seleção (nacionalidade,
  atividade, parceiro — linhas 979-998, 1197-1210): todos usam só troca de `background`/
  `border-color` na seleção, sem transição de `transform`. Em um fluxo tocado em tablet na
  recepção, isso é pouco perceptível — mas no desktop (ex.: recepcionista preenchendo por
  um aluno que dita os dados por telefone) o feedback de clique é seco.
- **Zero camada de confiança**: a Viking nunca deixa o visitante sem um sinal de "isto é
  usado por gente de verdade" (rating, logo de cliente, foto). O check-in do Pico Base tem
  o inverso — é 100% formulário, sem nenhum elemento que comunique "sua escola está usando
  o mesmo sistema que N outras escolas" ou similar. Não é uma crítica de UX (o check-in não
  precisa vender nada, o aluno já está na escola), mas é uma oportunidade perdida na tela
  de sucesso, que hoje só mostra "Powered by Pico Base" em cinza claro (linha 873-879) —
  poderia ser o único lugar do funil do Pico Base onde a marca aparece para o consumidor
  final, e hoje ela é a coisa mais discreta da tela.

### 2.4 Pagamentos (`src/app/owner/payments/PaymentsClient.tsx`)

Este é o exemplo mais concreto de dívida de design system já mapeada, mas ainda não paga:

```ts
// PaymentsClient.tsx:87-92 — cores reimplementadas na mão
const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: 'Pendente',  bg: '#FFF8E8', color: '#8A5E00' },
  approved: { label: 'Aprovado',  bg: '#E0F8F5', color: '#007868' },
  paid:     { label: 'Pago',      bg: '#E8F5E9', color: '#2E7D32' },
  overdue:  { label: 'Atrasado',  bg: '#FEE2E2', color: '#DC2626' },
}
```

Comparando com `src/components/ui/Badge.tsx` (o componente que o próprio
`DESIGN_SYSTEM.md` documenta como a fonte única para esse padrão):

| Status em Payments | Hex usado | Variant equivalente em `Badge.tsx` | Hex do Badge |
|---|---|---|---|
| `pending` | `#FFF8E8` / `#8A5E00` | `warning` | `bg-amber-50` / `amber-700` — **quase idêntico, redefinido do zero** |
| `approved` | `#E0F8F5` / `#007868` | `success` | `#ECFDF5` / `#047857` — **verde diferente do "success" oficial** |
| `paid` | `#E8F5E9` / `#2E7D32` | `success` | idem acima — **um terceiro verde, nenhum dos três igual** |
| `overdue` | `#FEE2E2` / `#DC2626` | `danger` | `bg-pb-signal-light` / `pb-signal` — **um quarto vermelho** |

E o badge renderizado (linha 733-740) usa `border-radius: 99px` (pílula), enquanto
`Badge.tsx` usa `rounded-[6px]` — ou seja, além da cor, **o formato também diverge** entre
a tela de pagamentos e o resto do app. Três variações de verde e duas formas de badge
coexistindo é exatamente o tipo de inconsistência que o `DESIGN_SYSTEM.md` já sinaliza
("77 raw-hex/`bg-green-*` occurrences across 27 files"), só que aqui documentado com o
diff exato.

### 2.5 Nota à parte — o site de marketing já está no nível certo

`src/app/(marketing)/page.tsx` já reproduz boa parte da arquitetura de conversão da Viking:
hero com proposta de valor + CTA duplo, ticker de dores do cliente, tabela comparativa
("Pico Base vs. Planilha vs. SaaS genérico" — o mesmo tipo de tabela que a Viking usa em
`/compare`), seção "para quem é / não é para você", tabs de produto. **Isso não precisa de
gap analysis** — a estrutura já está no nível de mercado. O gap real do Pico Base não está
na página de vendas, está no **produto logado** (Base Camp, Pagamentos), que é onde o dono
da escola passa a maior parte do tempo depois de assinar.

---

## 3. Três melhorias de alto impacto (prontas para aplicar)

### 3.1 Micro-interação de hover/press em `Button.tsx` e cards do dashboard

**Por quê primeiro:** é a mudança de menor risco e maior alcance — um componente
compartilhado, usado em todo o app. Hoje `Button.tsx` só anima opacidade; a Viking anima
`transform` + `box-shadow` juntos com leve overshoot, e isso é a diferença perceptual mais
barata entre "parece um protótipo" e "parece um produto pago".

```diff
--- a/src/components/ui/Button.tsx
+++ b/src/components/ui/Button.tsx
@@
     <button
       className={`inline-flex items-center justify-center gap-2 rounded-[8px] whitespace-nowrap
-        transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
+        transition-[transform,box-shadow,opacity] duration-150 ease-out
+        hover:-translate-y-px hover:shadow-[var(--shadow-sm)]
+        active:translate-y-0 active:shadow-none
+        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none
         ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
```

`var(--shadow-sm)` já existe em `globals.css:53` — não é um token novo, é reutilizar o que
já foi definido e está subusado. `-translate-y-px` é 1px, deliberadamente sutil (a Viking
usa a mesma amplitude — o efeito é sentido, não visto).

O mesmo princípio vale para os cards de métrica do Base Camp (`owner/page.tsx:243-368`) e
para as linhas da tabela de pagamentos: hoje elas só têm `.tbl-row:hover { background:
var(--powder) }` (linha 144). Um utilitário compartilhado evita repetir a regra:

```css
/* globals.css — novo utilitário, mesma família de --shadow-* já existente */
.pb-card-interactive {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.pb-card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

Aplicar em `className="pb-card-interactive"` nos cards de `owner/page.tsx` e em qualquer
card clicável do Payments/Checkins. Custo: uma classe CSS. Efeito: toda a superfície
clicável do app passa a "responder" ao cursor, igual à Viking.

### 3.2 Uma cor de acento deliberada para "isto está ao vivo agora"

**Por quê:** `tokens.css` documenta explicitamente que o app migrou de uma paleta
teal/coral saturada para uma repintura "grafite + rosa" mais neutra — decisão deliberada,
não bug, e não é o que este dossiê está propondo reverter. O problema é um efeito colateral
não intencional dessa migração: **hoje não existe nenhuma cor no app reservada
exclusivamente para "isto é um evento acontecendo em tempo real"**. O pill "na água agora"
(`owner/page.tsx:251-265`) usa `var(--glacial-light)`/`var(--glacial-dark)` — a mesma dupla
usada em botões primários, links e qualquer estado "ativo" genérico. Comparado à Viking, que
reserva seu único teal saturado só para ação/estado-ativo e nunca o usa para texto comum,
o Pico Base tem zero de "cor exclusiva de sinal ao vivo" — todo mundo divide a mesma cor.

Proposta mínima — um único token novo, semântico, não estético:

```css
/* tokens.css — adição, não substituição de nenhum token existente */
@theme {
  /* ...tokens existentes... */
  --color-pb-live: #00A896; /* teal original do app, hoje sem uso — reservado
                                exclusivamente para "acontecendo agora": alunos
                                na água, modo recepção ativo, clima ao vivo */
  --color-pb-live-bg: #E0F8F5;
}
```

E aplicar só nos 2-3 lugares que hoje competem pelo mesmo `--glacial-*` por acidente, não
por escolha (o pill "na água agora" em `owner/page.tsx:254-265`, o indicador ativo de
`ReceptionModeToggle`). Isso não é "adicionar mais cor" ao app — é dar um significado único
a uma cor que hoje é reaproveitada sem intenção, exatamente a disciplina que faz o único
teal da Viking parecer proposital em vez de decorativo.

### 3.3 Consolidar os badges de status em `Badge.tsx` (finish, não redesign)

**Por quê:** este item já está mapeado como dívida no `DESIGN_SYSTEM.md` — a proposta aqui
é só o primeiro caso concreto para pagar essa dívida, com o diff pronto. `PaymentsClient.tsx`
redefine 4 pares de cor que já existem (com valores ligeiramente diferentes) em `Badge.tsx`,
e usa `border-radius: 99px` onde `Badge.tsx` usa `6px` — dois sistemas visuais coexistindo
na mesma tela de produto.

Passo 1 — estender `Badge.tsx` com os dois variants que faltam (`pending` já mapeia para
`warning`, `overdue` já mapeia para `danger`; só falta nomear `paid` explicitamente em vez
de reusar `success` para dois conceitos: "aprovado, aguardando pagamento" e "efetivamente
pago" não deveriam ser visualmente idênticos):

```diff
--- a/src/components/ui/Badge.tsx
+++ b/src/components/ui/Badge.tsx
@@
-export type BadgeVariant = 'success' | 'danger' | 'neutral' | 'warning'
+export type BadgeVariant = 'success' | 'danger' | 'neutral' | 'warning' | 'paid'
@@
   warning: 'bg-amber-50 text-amber-700',
+  // "Pago", distinto de "success" genérico (ex.: "Termo assinado") — mesma
+  // família emerald, um tom mais forte de bg pra diferenciar de "aprovado".
+  paid:    'bg-emerald-100 text-emerald-800',
 }
```

Passo 2 — em `PaymentsClient.tsx`, trocar o `STATUS` local e o `<span>` manual (linhas
733-740 e 886-892) por:

```diff
--- a/src/app/owner/payments/PaymentsClient.tsx
+++ b/src/app/owner/payments/PaymentsClient.tsx
@@
 import ReceivablesView from '@/components/ReceivablesView'
+import Badge from '@/components/ui/Badge'
+import type { BadgeVariant } from '@/components/ui/Badge'
 import { formatCurrency } from '@/lib/currency'
@@
-const STATUS: Record<string, { label: string; bg: string; color: string }> = {
-  pending:  { label: 'Pendente',  bg: '#FFF8E8', color: '#8A5E00' },
-  approved: { label: 'Aprovado',  bg: '#E0F8F5', color: '#007868' },
-  paid:     { label: 'Pago',      bg: '#E8F5E9', color: '#2E7D32' },
-  overdue:  { label: 'Atrasado',  bg: '#FEE2E2', color: '#DC2626' },
-}
+const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
+  pending:  { label: 'Pendente',  variant: 'warning' },
+  approved: { label: 'Aprovado',  variant: 'success' },
+  paid:     { label: 'Pago',      variant: 'paid'    },
+  overdue:  { label: 'Atrasado',  variant: 'danger'  },
+}
@@
-                          <span style={{
-                            display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
-                            fontSize: '11px', fontWeight: '500',
-                            background: st.bg, color: st.color, whiteSpace: 'nowrap',
-                          }}>
-                            {st.label}
-                          </span>
+                          <Badge variant={st.variant}>{st.label}</Badge>
```

Efeito imediato: as 4 cores de status do app inteiro passam a vir de **uma** fonte, os dois
bugs de contraste AA já documentados em `DESIGN_SYSTEM.md` (`Badge neutral` 2.88:1,
`Badge danger` 3.52:1) ficam corrigíveis num único arquivo em vez de N, e a forma do badge
(pílula vs. retângulo arredondado) para de divergir entre telas.

---

## 4. Conclusão

O Pico Base não está atrás da Viking em **arquitetura de produto** — o dashboard calcula
coisas que a Viking nem tenta (reserva de baixa temporada, ocupação de equipe em tempo
real), e o site de marketing já usa a mesma gramática de conversão (comparação, tabs,
prova por dor). O gap real está em **acabamento de superfície** e está concentrado em três
pontos mecânicos e de baixo risco: interações sem `transform`, uma paleta que perdeu sua
única cor de assinatura no meio de uma repintura deliberada, e um componente de badge que
já existe mas ainda não foi adotado em todo o app. As três propostas acima atacam
exatamente esses três pontos, nessa ordem de esforço crescente — nenhuma delas exige
redesenhar uma tela inteira.
