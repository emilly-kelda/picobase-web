# Auditoria — Base Camp: card financeiro e validação de saldo

Investigação feita consultando o banco de produção diretamente (via service role,
scripts descartáveis) antes de qualquer alteração de código, conforme pedido na Fase 0.
Os dois bugs são reais, mas a causa raiz de cada um difere do que a hipótese original
descrevia — documentado abaixo com os dados que embasam a conclusão.

## 1. Card "Reserva de Baixa Temporada" — escopo de datas

**Confirmado: os três campos não vêm do mesmo escopo.**

- `season_revenue` e `crew_commissions` vêm de `getRunwayData(schoolId, seasonId)` —
  usa a RPC `get_runway_by_season` quando existe um cookie `active_season_id`, senão cai
  para a view `v_runway` (que calcula sua própria noção de "temporada atual" — hoje
  retorna `current_season: '2026-2027'`, um rótulo que **não corresponde a nenhuma linha
  real da tabela `seasons`**).
- `totalPartnerCommissions` (comissões de parceiro, somada às `crew_commissions` para
  formar o total exibido) vem de `getRunwayProjection(schoolId)` — essa função **ignora
  completamente o cookie de temporada** e sempre busca a temporada mais recente por
  `start_date` na tabela `seasons` (hoje: a linha rotulada "2024-2025", com datas
  2026-06-01 a 2027-01-30 — rótulo e datas visivelmente não batem, mas isso é dado de
  cadastro, não bug de código) para filtrar a tabela `referrals` por período.

Ou seja: trocar a temporada ativa no seletor do owner muda `season_revenue`/
`crew_commissions`, mas **não muda** `totalPartnerCommissions`, que fica sempre preso à
temporada mais recente por data de início. Mesmo sem trocar de temporada, os dois lados
usam duas definições independentes de "temporada atual" que só coincidem por acaso.

**Correção (Fase 2):** `getRunwayProjection` passa a aceitar `seasonId` e usar a mesma
fonte (RPC `get_runway_by_season` ou `v_runway`, espelhando `getRunwayData`) e a mesma
linha de `seasons` para os limites de data — garante que os dois lados sempre descrevem
a mesma janela.

## 2. "Lucro líquido" exibindo R$ 0,00

**Confirmado — bug de fórmula, não de dado.** `adjustedNetProfit` é calculado como:

```
Math.max(0, season_profit - totalPartnerCommissions)
```

O `Math.max(0, …)` estava correto para alimentar `runwayMonths` (meses de reserva não
faz sentido como número negativo), mas o mesmo valor "grampeado" também alimentava o
campo **exibido** como "Lucro líquido" — então qualquer temporada com comissões +
custos maiores que a receita mostra R$ 0,00 em vez do prejuízo real.

**Correção (Fase 2):** o clamp em 0 continua existindo só para o cálculo de
`runwayMonths`/projeção; o valor exibido como "Lucro líquido" passa a ser o resultado
real (pode ficar negativo), com cor de alerta quando `< 0`.

## 3. "Confirmada" + "Sem créditos" simultâneos (caso Sofia Andersson)

**Reproduzido, mas a causa raiz não é falta de validação de saldo no confirm —
é um badge que não sabe que a aula já foi encerrada.**

Dados reais da Sofia Andersson: seu único pacote (`424c6091…`, 60 min) está em
`60/60` minutos usados (esgotado) desde 2026-04-28. Duas aulas foram confirmadas depois
disso (16/07 e 19/07), ambas vinculadas a esse `package_sale_id` na tabela
`scheduled_lessons`. Conferindo a tabela `sessions` (o registro real de cobrança):

| data | valor cobrado | forma de pagamento | `package_sale_id` na sessão |
|---|---|---|---|
| 2026-07-16 | R$ 85 | PIX | `null` |
| 2026-07-19 | R$ 366 (60 EUR) | PIX | `null` |

**As duas aulas foram cobradas avulsas corretamente** — preço > 0, pagamento
registrado, nenhum crédito de pacote foi debitado (porque não havia crédito a debitar).
Financeiramente não há inconsistência: a aluna pagou por fora depois que o pacote
acabou, que é exatamente o comportamento correto e esperado em uma escola onde nem toda
aula usa pacote.

O bug real está em `ScheduledLessons.tsx` (widget "Aulas Agendadas"): o badge de saldo
(`getPackageBadge`) é recalculado **a partir do nome do aluno**, ignorando se a aula
específica já está `status: 'confirmed'`. Por isso uma aula já paga e encerrada continua
mostrando "Sem créditos" — um selo que só faz sentido *antes* de confirmar (para avisar
a recepção que vai precisar cobrar avulso), não depois.

**Por que a Fase 1 do dossiê original (bloquear "Confirmada" sem crédito) não é a
correção certa:** bloquear a confirmação sempre que não houver pacote ativo quebraria o
fluxo normal de aula avulsa (paga na hora, sem pacote) — que, pelos dados acima, é usado
o tempo todo e está funcionando corretamente. A escola não obriga todo aluno a comprar
pacote. **Correção real implementada (Fase 1): parar de mostrar o badge de crédito em
aulas já confirmadas**, já que ele deixa de ser informação acionável nesse ponto.

## 4. "Duplicação do Jack Ryan" — não é registro duplicado

**Confirmado: existe apenas UM registro em `students` para "Jack Ryan"** (id
`4f2f144c…`). Não há duplicidade de cadastro para mesclar.

O que existe de fato: Jack Ryan comprou **três pacotes separados** (`package_sales`),
nenhum com `student_id` preenchido (todos `null`, apesar do registro em `students`
existir):

| pacote | minutos comprados | usados | vendido em |
|---|---|---|---|
| `ea246bc4…` | 600 | 0 | 2026-06-15 17:37 |
| `093dcef5…` | 60  | 0 | 2026-06-15 17:46 |
| `e1c7ba25…` | 60  | 0 | 2026-06-17 15:48 |

`getPackageBalancesForCheckins` (usado pela Sala de Espera) e `getPackageBadge` em
`ScheduledLessons.tsx` (usado pelas Aulas Agendadas) **cada um escolhe apenas UM desses
três pacotes** (o mais recente, ou o mais recente ainda não esgotado) em vez de somar o
saldo real. Resultado: o app mostra Jack Ryan com **60 minutos restantes**, quando ele
na verdade tem **720 minutos (600+60+60)** — um saldo real quase 12x maior que o
exibido. É plausível que isso tenha levado a recepção a vender pacotes extras
repetidamente sem perceber que ele já tinha crédito de sobra.

**Correção (Fase 5):** somar minutos restantes de todos os pacotes ativos do aluno
(FIFO — o pacote mais antigo ainda com saldo é o "próximo" a ser debitado), aplicado nos
dois pontos de leitura acima e na ordem de débito automático em `confirm-lesson`.
Também um backfill (aditivo, não destrutivo) de `package_sales.student_id` nulos onde
existe exatamente um `students` correspondente pelo nome — não há merge de registros
porque não há registros duplicados.

## Conclusão

Causa raiz de cada item confirmada com dados reais antes de qualquer alteração de UI,
conforme pedido. Dois dos quatro achados (itens 3 e 4) exigem uma correção
tecnicamente diferente da hipótese original do dossiê — documentado acima com os dados
que sustentam a mudança de direção. Nenhuma correção necessária envolve apagar ou
mesclar dado de cliente; tudo abaixo é aditivo ou lógica de leitura/exibição.
