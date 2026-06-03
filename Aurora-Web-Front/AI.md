# AI.md — Registro de Uso de Inteligencia Artificial

## Interacao 1 — Sugestao de perguntas para o Quiz

**O que pedimos:** Sugestao de alternativas erradas para as 10 perguntas do quiz sobre a missao AURORA, para tornar as opcoes mais plausíveis e desafiadoras.

**O que a IA retornou:** Alternativas erradas para cada pergunta, como opcoes numericas proximas da correta (ex: 1 dia, 5 dias, 16 dias para a pergunta sobre a noite lunar) e nomes de programas e sensores alternativos.

**O que alteramos/mantivemos/rejeitamos:** Usamos parte das sugestoes de alternativas. Mantivemos todas as respostas corretas conforme o gabarito do enunciado. Rejeitamos alternativas que estavam muito obvias ou fora de contexto.

---

## Interacao 2 — Revisao de acessibilidade

**O que pedimos:** Verificar se os atributos aria-label e aria-hidden estavam corretos nos elementos interativos do slideshow (botoes prev/next, dots, carousel).

**O que a IA retornou:** Sugestao de adicionar aria-roledescription='carousel' no header e aria-label='Ir para o slide N' nos dots, alem de aria-hidden='true' nos elementos decorativos.

**O que alteramos/mantivemos/rejeitamos:** Mantivemos as sugestoes de acessibilidade no HTML. Nao alteramos a logica JavaScript nem o CSS com base nessa interacao.
