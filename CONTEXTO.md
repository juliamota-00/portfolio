# Contexto do projeto (para continuar em outra conversa)

Site pessoal da Júlia Mota: portfólio + painel pessoal de finanças e rotina.
Cole este arquivo (ou o link do repositório) numa conversa nova para retomar de onde parou.

## Onde está cada coisa
- **Site:** https://juliamota.vercel.app (o endereço antigo `portfolio-three-theta-n8d0x0gnu9.vercel.app` redireciona para ele)
- **Código:** GitHub `juliamota-00/portfolio`. A Vercel publica sozinha a cada commit na `main`.
- **Vercel:** time `portifolio-63e1`, projeto `portfolio`.
- **Banco de dados:** Supabase (integração da Vercel, região São Paulo/gru1, plano grátis). Tabela `public.docs (user_id, id, data jsonb, updated_at)` com RLS: cada pessoa só lê e grava as próprias linhas.

## Páginas
| Caminho | O que é |
|---|---|
| `/` (`index.html`) | Portfólio/currículo. PT e EN com botão PT/EN (dicionário EN no fim do arquivo, atributos `data-i18n`). |
| `/entrar/` | Login (Supabase Auth). "Primeiro acesso" chama `/api/setup`. |
| `/painel/` | Painel pessoal (um único `painel/index.html`). |
| `/painel/?demo=1` | Demonstração pública com dados inventados (`painel/demo.js`), sem login, nada é salvo. |

## Como o painel guarda dados
`painel/supa.js` imita a interface `window.claude.use('db' | 'user' | 'downloads')` gravando no Supabase.
Documentos principais por usuária:
- `jm_financas_v2`: estado inteiro (lançamentos, notas, eventos, ciclo, caixa, orçamento, metas, regras aprendidas, salário, assinaturas, treino…)
- `banco-dados`, `pluggy-itens`: dados dos bancos (Pluggy)
- `strava-corridas`, `strava-tokens`: Strava
- `marm-*`, `cfg-marm`, `cfg-marm-compras`, `hab-*`: marmitas e hábitos

## Rotas do servidor (`/api`, Vercel Functions)
- `api/config.js`: entrega URL e chave pública do Supabase
- `api/setup.js`: cria a tabela e a conta da dona (só enquanto não há usuários)
- `api/pluggy/token.js`, `api/pluggy/sync.js`: Open Finance via Pluggy (MeuPluggy). Sync diário às 10h UTC (`vercel.json`).
- `api/strava/conectar.js`, `retorno.js`, `sync.js`, `sair.js`: Strava (falta configurar, ver abaixo)

## Variáveis de ambiente na Vercel (nunca colar os valores em conversa)
- Supabase: injetadas pela integração (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`…)
- Pluggy: `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`
- Strava (ainda não criadas): `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`

## Funcionalidades do painel
Visão Geral (resumo inteligente, agenda, tarefas, pomodoro) · Finanças: Resumo, Caixa e contas (saldo dos bancos, fatura por cartão, entradas previstas, salário líquido 2026 com INSS/IRRF e Lei 15.270), Lançamentos (origem, ações em lote, regras aprendidas), Orçamento (limites e metas), Assinaturas (recorrentes e aumentos), Imposto de Renda (deduções saúde/educação/PGBL), Bancos · Anotações · Calendário (contas a pagar, ciclo) · Marmitas (cardápio e lista de compras) · Treinos (academia/Wellhub, Strava, hábitos) · ⚙ Configurações (regras aprendidas, nomes próprios para transferências, backup/exportação).

## Decisões já tomadas
- VR/VA não é controlado no painel (só o desconto de 10% entra no cálculo do salário líquido).
- Transferências entre contas próprias e pagamento de fatura não são lançados (vêm desmarcados).
- Categorias: Moradia = contas da casa (CDHU, condomínio, luz, água, gás); Casa = compras para dentro de casa; também Pets, Roupas e acessórios, Beleza e cuidados, Presentes.
- Portfólio: cargos em português; dados fictícios na prévia da Central ADM/Financeiro (4 empresas, Bling + Mercado Pago); certificados e CV completos ficam no LinkedIn, não no site.

## Pendências e ideias
- Strava: criar app em strava.com/settings/api (callback domain `juliamota.vercel.app`), pôr as variáveis na Vercel e fazer Redeploy.
- Reconectar Nubank e Itaú no MeuPluggy marcando **cartão de crédito** (só o cartão Santander veio).
- Atualizar a LHV para "10/2026 – 11/2026" e incluir a Comexport quando começar.
- Guardar o código da Central ADM/Financeiro num repositório **privado** separado (sem chaves de API).
- Feito: média mensal por categoria no Orçamento; currículo em PDF sem telefone (`curriculo-julia-mota.pdf`, gerado a partir do CV, cargos em português). Decidido: sem logos das empresas.
- Futuro: abrir o app para amigas (cada uma com a própria conta; o RLS já separa os dados).
