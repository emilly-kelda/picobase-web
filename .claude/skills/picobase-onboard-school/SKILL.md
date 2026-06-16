---
name: picobase-onboard-school

description: >
  Runs the full Pico Base Season Launch Process for a new school.
  Goes beyond SQL generation to produce a complete onboarding package:
  discovery call summary, checklist, QR check-in URL, season economics,
  and a ready-to-send setup brief for the owner.
  Trigger when the user says "onboard", "launch", "configurar escola",
  "nova escola", "season launch", or provides a school name and asks
  what to do next. Works alongside picobase-new-client for SQL generation.
---

# Pico Base — Season Launch Process

Produces the complete onboarding package for a new school.
Not just SQL — the full launch workflow from first call to first lesson.

---

## What gets produced

| Output | What it is |
|---|---|
| Launch checklist | Ordered task list with owner and Pico Base responsibilities |
| Check-in URL + QR note | Ready to generate and print |
| Season economics summary | Runway target based on season dates |
| Owner setup brief | WhatsApp-ready message to send after the call |
| SQL reminder | Link to picobase-new-client for database setup |

---

## Step 1 — Collect school profile

Extract from conversation. Ask only for what's missing.

### Required
```
SCHOOL_NAME       Full school name
SPORT             Main sport(s) — kitesurf, ski, surf, wingfoil, etc.
COUNTRY           Country (Brazil, France, Spain, etc.)
SEASON_START      Month when season starts (e.g. November)
SEASON_END        Month when season ends (e.g. March)
INSTRUCTORS       Number of instructors (approximate is fine)
OWNER_NAME        First name of the owner
OWNER_WHATSAPP    WhatsApp number for setup brief
```

### Optional
```
MONTHLY_COSTS     Monthly operating costs during off-season
LANGUAGES         Which languages students speak
PARTNERS          Any hotels/agencies/operators who refer students
PACKAGES          Types of lesson packages sold
```

---

## Step 2 — Calculate season economics

```
SEASON_LENGTH     = months from SEASON_START to SEASON_END
OFF_SEASON_LENGTH = 12 - SEASON_LENGTH
RUNWAY_TARGET     = OFF_SEASON_LENGTH  (months to survive)
```

Examples:
- Kitesurf Ceará (Nov→Mar = 5 months) → target: 7 months
- Ski Alps (Dec→Mar = 4 months)       → target: 8 months  
- Surf Portugal (May→Oct = 6 months)  → target: 6 months

If MONTHLY_COSTS provided:
```
MINIMUM_PROFIT_TARGET = RUNWAY_TARGET × MONTHLY_COSTS
```

Present as:
```
Para atravessar a baixa temporada, essa temporada precisa gerar:
R$ [MINIMUM_PROFIT_TARGET] de lucro líquido
([RUNWAY_TARGET] meses × R$ [MONTHLY_COSTS]/mês)
```

---

## Step 3 — Generate slug and URLs

```
SLUG = school name → lowercase → spaces to hyphens → remove accents
       "Vila do Vento" → "vila-do-vento"
       "Escola Kite Taíba" → "escola-kite-taiba"

CHECK_IN_URL = https://picobase.com.br/checkin/[SLUG]
OWNER_URL    = https://picobase.com.br/owner
```

---

## Step 4 — Generate launch checklist

Format as two columns: Pico Base (us) and Escola (owner).

```
SEASON LAUNCH CHECKLIST
[SCHOOL_NAME]
Target go-live: [SEASON_START]

PICO BASE                          ESCOLA
─────────────────────────────────  ────────────────────────────────
✅ Discovery call done             ✅ Provided school information
⬜ Create school in database       ⬜ Send logo (PNG, fundo branco)
⬜ Configure instructors           ⬜ Confirm instructor list + PIX keys
⬜ Configure partners              ⬜ Confirm partner agreements + %
⬜ Upload waiver (PT + EN)         ⬜ Review and approve waiver text
⬜ Set monthly operating costs     ⬜ Confirm monthly cost estimate
⬜ Generate QR code                ⬜ Print QR and place at reception
⬜ Send magic link to owner        ⬜ Test login on phone
⬜ Training call (45 min)          ⬜ Attend training call
⬜ Monitor first week              ⬜ Confirm first lesson

GO LIVE: [CHECK_IN_URL]
```

---

## Step 5 — Generate owner setup brief

WhatsApp-ready message to send to the owner after the call.

```
Oi [OWNER_NAME]! 

Aqui está o resumo do que configuramos para a [SCHOOL_NAME]:

🔗 Link de check-in dos alunos:
[CHECK_IN_URL]

📋 Próximos passos (da nossa parte):
• Configurar escola no sistema
• Subir instrutores e parceiros
• Preparar QR Code para impressão
• Enviar seu acesso de proprietário

📋 Da sua parte:
• Logo da escola (PNG fundo branco)
• Lista de instrutores com PIX e % de comissão
• Acordos com hotéis/agências (nome + %)
• Custo fixo mensal estimado (aluguel, salários, etc.)

⏱ Prazo: tudo pronto em até 7 dias.

Qualquer dúvida me chama aqui! 🤙
```

Adapt language to school's country:
- Brazil → Portuguese
- International → English

---

## Step 6 — Season economics summary card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PICO BASE — [SCHOOL_NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sport:          [SPORT]
Season:         [SEASON_START] → [SEASON_END] ([SEASON_LENGTH] months)
Off-season:     [OFF_SEASON_LENGTH] months
Runway target:  [RUNWAY_TARGET] months

[IF MONTHLY_COSTS PROVIDED:]
Monthly costs:  [MONTHLY_COSTS]
Minimum profit: [MINIMUM_PROFIT_TARGET]
               to survive until next season

Check-in URL:  [CHECK_IN_URL]
Owner portal:  [OWNER_URL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 7 — Remind about SQL setup

Always end with:

```
🔧 DATABASE SETUP
Run the picobase-new-client skill to generate the SQL:

Provide:
- School name: [SCHOOL_NAME]
- Sport: [SPORT]
- Country: [COUNTRY]
- Season: [SEASON_START]–[SEASON_END]
- Instructors: [LIST IF PROVIDED]
- Partners: [LIST IF PROVIDED]
- Monthly costs: [MONTHLY_COSTS IF PROVIDED]

Then run the generated SQL in Supabase SQL Editor.
```

---

## Edge cases

**School hasn't decided on monthly costs yet:**
Use sport-based estimates:
- Small kitesurf school (BR): R$ 4.000–8.000/month
- Medium kitesurf school (BR): R$ 8.000–15.000/month
- Ski school (Europe): €8.000–20.000/month
Present as: "Estimativa baseada em escolas similares. Confirmar com o proprietário."

**Multi-location school:**
Generate one slug per location.
Note: multi-location admin panel coming soon.

**International school:**
Adjust currency in season economics.
Generate WhatsApp brief in English.

**School starts season in < 30 days:**
Add urgency note:
"⚠️ Temporada começa em [X] dias. Prioridade máxima para configuração."
