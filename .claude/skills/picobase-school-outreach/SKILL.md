---
name: picobase-school-outreach

description: >
  Generates personalized outreach for a specific seasonal sports school.
  Produces an Instagram DM, a WhatsApp message, an email, and a demo angle
  tailored to that school's specific situation, sport, and visible pain points.
  Trigger when the user says "outreach", "contact this school", "DM",
  "mensagem para essa escola", or provides a school name/website/Instagram
  and asks how to approach them. Also triggers for "falar com escola",
  "como abordo essa escola", "draft a message for".
---

# Pico Base — School Outreach Generator

Produces personalized outreach for a specific seasonal sports school.
Based on proven message templates — adapted to each school's specific context.

---

## Canonical message templates

These are the founder's approved messages. Always adapt from these —
never start from scratch.

### Instagram DM — Version A (WhatsApp angle)

PT:
```
Ei [nome] — quantos grupos de WhatsApp você usa pra gerenciar a escola agora?

Tô construindo exatamente o que eu precisaria se fosse dono de escola de kite.
Check-in digital, comissão automática dos instrutores, e um painel que mostra
se a temporada foi suficiente pra sobreviver o ano.

10 vagas pra escolas fundadoras. Quer ser uma delas?
```

EN:
```
Hey [name] — how many WhatsApp groups are you using to manage your school right now?

I'm building exactly what I'd want if I were a kite school owner.
Digital check-in, automatic instructor commissions, and a dashboard
that tells you if this season was enough to survive the year.

10 spots for founding schools. Want to be one of them?
```

### Instagram DM — Version B (runway angle)

PT:
```
Oi [nome], vi a escola de você no Instagram — trabalho com gestão de escolas
de kite e wingfoil.

Uma pergunta direta: você sabe exatamente quantos meses a próxima temporada
vai cobrir?

Criei um sistema que responde isso em tempo real — além de automatizar check-in,
comissões de instrutores e parceiros.

Estou abrindo 10 vagas fundadoras antes do lançamento oficial.
Posso te mostrar em 15 minutos?
```

EN:
```
Hey [name], I came across your school on Instagram — I work with management
for kite and wingfoil schools.

One direct question: do you know exactly how many months your next season will cover?

I built a system that answers that in real time — plus automates check-in,
instructor commissions, and partner payouts.

I'm opening 10 founding spots before the official launch.
Can I show you in 15 minutes?
```

### Email — Version A (full feature list)

Subject PT: Pico Base — vaga fundadora para escolas de kite
Subject EN: Pico Base — founding school spot for kite schools

PT:
```
Oi [nome],

Criei o Pico Base: um sistema de gestão feito especificamente pra escolas
sazonais de kitesurf e wingfoil.

O que ele resolve:
• Check-in por QR code — aluno preenche e assina waiver digital em 2 minutos
• Comissões de instrutores calculadas automaticamente por aula confirmada
• Parceiros e pousadas que indicam alunos recebem comissão rastreada
• Pacotes de horas com controle de saldo por aluno
• Runway da temporada: quanto tempo o lucro atual sustenta a escola sem receita

Esse último número é o mais importante. A maioria das escolas sabe quanto fez.
Ninguém sabe por quanto tempo isso vai durar.

Estou abrindo 10 vagas pra escolas fundadoras antes do lançamento oficial.
R$ 497 de setup + R$ 997 por temporada. Tudo incluído, sem tier, sem limite.

Se fizer sentido, posso te mostrar em 15 minutos como funciona na prática.

[seu nome]
Pico Base
picobase.com.br
```

EN:
```
Hi [name],

I built Pico Base: a management system made specifically for seasonal
kitesurf and wingfoil schools.

What it solves:
• QR code check-in — student fills in details and signs a digital waiver in under 2 minutes
• Instructor commissions calculated automatically per confirmed lesson
• Partners and hotels that refer students get tracked commissions alongside instructor payroll
• Hour packages with per-student balance tracking
• Season Runway: how long your current profit sustains the school without revenue

That last number is the most important one.
Most schools know how much they made. Nobody knows how long it will last.

I'm opening 10 spots for founding schools before the official launch.
R$ 497 setup + R$ 997 per season. Everything included. No tiers. No limits.

If this makes sense, I can show you how it works in practice in 15 minutes.

[your name]
Pico Base
picobase.com.br
```

### Email — Version B (runway hook, shorter)

Subject PT: uma pergunta sobre a sua temporada
Subject EN: a question about your season

PT:
```
Oi [nome],

Uma pergunta direta: você sabe exatamente quantos meses a próxima temporada
vai cobrir?

Criei o Pico Base pra responder exatamente isso — em tempo real, todo dia,
baseado nas aulas confirmadas e nos custos fixos da escola.

Além disso: check-in digital, comissões automáticas, pagamento de instrutores
em um clique.

Estou buscando 10 escolas fundadoras.
Condição especial, acesso direto a mim durante o desenvolvimento.

Vale 15 minutos?

[seu nome]
```

EN:
```
Hi [name],

One direct question: do you know exactly how many months your next season will cover?

I built Pico Base to answer exactly that — in real time, every day,
based on confirmed lessons and the school's fixed costs.

On top of that: digital check-in, automatic commissions, instructor payroll in one click.

I'm looking for 10 founding schools.
Special pricing, direct access to me throughout development.

Worth 15 minutes?

[your name]
```

---

## Step 1 — Collect school info

```
SCHOOL_NAME       Name of the school
SPORT             Main sport (kitesurf, wingfoil, ski, surf, etc.)
COUNTRY           Country / region  
LANGUAGE          PT or EN (default: PT for Brazil)
INSTAGRAM         @handle if provided
NOTES             Anything known about the school
HAS_PARTNERS      Do they visibly work with hotels/agencies? (yes/no/unknown)
SCHOOL_SIZE       Small (1-2 instructors) / Medium (3-5) / Large (6+)
```

---

## Step 2 — Select and adapt template

**Which DM to use:**
- Owner seems operational-focused (posts about daily lessons, instructors) → Version A (WhatsApp angle)
- Owner seems financially-aware (posts about seasons, growth, business) → Version B (runway angle)
- Unknown → Version A (broader appeal)

**Which email to use:**
- School has visible partners (hotel tags, agency mentions) → Version A (includes partner commissions)
- School appears simpler / smaller → Version B (shorter, runway focus)
- International school → always EN versions

**Personalization rules:**
1. Replace [nome] with the owner's first name if known
2. Replace "kite e wingfoil" with their actual sport(s)
3. Add ONE specific observation about their school if visible:
   - "Vi que vocês operam em [location]..."
   - "Vi que a temporada de vocês começa em [month]..."
   - "Vi que vocês têm instrutores internacionais..."
4. Never invent details you can't verify

---

## Step 3 — Demo angle

Based on school profile:

```
DEMO ANGLE FOR [SCHOOL_NAME]

Lead with:
[Most relevant pain — commissions / check-in / runway / partners]

Show first:
[The one screen that will land hardest]

Key moment:
[The specific interaction that closes the conversation]

Skip:
[Features less relevant for this school]

Closing question:
[What to ask at end of demo to advance the sale]
```

Examples:

**Small kitesurf school, Brazil, 1-2 instructors, no visible partners:**
```
Lead with:    Instructor commission calculation — they do this manually
Show first:   Confirm lesson → commission updates instantly
Key moment:   Month close → PIX CSV in one click
Skip:         Partner commissions, packages (probably not relevant yet)
Close with:   "O que você usa hoje pra calcular o repasse do instrutor?"
```

**Medium kitesurf school, Brazil, hotel partnerships visible:**
```
Lead with:    Partner commission tracking — hotels get paid by memory
Show first:   Repasses page — instructors AND partners in one list
Key moment:   Runway number updating as lessons are confirmed
Skip:         Waiver languages (they probably only need PT)
Close with:   "Quanto você paga pro [hotel name] por aluno indicado hoje?"
```

**International school, English-speaking:**
```
Lead with:    Multi-language check-in + Wise CSV export
Show first:   Check-in in EN/FR/ES → lesson confirms → Wise export
Key moment:   Off-season runway — very tangible for ski/international schools
Skip:         PIX (not relevant)
Close with:   "How do you currently handle end-of-month payroll for international staff?"
```

---

## Step 4 — Likely objections

Always include these 3 + any sport/size specific ones:

```
OBJECTION: "Já uso [sistema X]"
RESPONSE:  "Esse sistema calcula a Reserva de Baixa Temporada?
            Mostra quantos meses a temporada vai durar em tempo real?
            Se não, complementamos — não substituímos."

OBJECTION: "Sou pequeno, não preciso de sistema"
RESPONSE:  "Escolas pequenas perdem mais porque não têm visibilidade.
            Setup em uma semana. Você usa desde o primeiro dia da temporada."

OBJECTION: "Não tenho tempo pra aprender coisa nova"
RESPONSE:  "O workflow tem 3 passos: aluno chega → você confirma →
            comissão atualiza. 20 minutos de treinamento, zero curva de aprendizado."

OBJECTION: "O preço está alto"
RESPONSE:  "Uma comissão calculada errada por temporada já cobre o custo anual.
            E você tem acesso direto a mim durante o desenvolvimento."

OBJECTION: "Posso fazer isso no Excel"
RESPONSE:  "O Excel não te diz se essa temporada vai ser suficiente.
            Esse número é o que o Pico Base faz em tempo real."
```

---

## Output format

Deliver in this order:
1. **School read** — one paragraph: what you inferred about the school
2. **Instagram DM** — chosen version, personalized, PT + EN
3. **Email** — chosen version with subject line, PT + EN
4. **Demo angle** — what to show, what to skip, closing question
5. **Top 3 objections** — the ones most likely for this school

Keep it tight. The owner will send the message, not read an analysis.

---

## What NOT to include in messages

❌ "abandono de pacotes" — doesn't apply to how kitesurf schools operate
❌ Feature lists longer than 5 bullets — too much
❌ Pricing in DMs — introduce after demo
❌ Links in first DM — kills reach on Instagram
❌ "revolucionário" / "incrível" / "único" — sounds like marketing
