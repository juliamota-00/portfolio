// Busca saldos, cartões e transações dos bancos conectados e grava no painel (documento "banco-dados").
// Roda sozinho todo dia (agendamento da Vercel) e também pelo botão "Atualizar agora" do painel.
import { usuarioDoPedido, comBanco, pluggy, pluggyConfigurada, env } from '../_comum.js';

const DIAS = 120;

// Transações pela API nova (GET /v2/transactions), que pagina por cursor ("next").
async function todasTransacoes(accountId, from) {
  const out = [];
  const base = `/v2/transactions?accountId=${encodeURIComponent(accountId)}&dateFrom=${from}T00:00:00.000Z`;
  let caminho = base;
  for (let i = 0; i < 40 && caminho; i++) {
    const j = await pluggy(caminho);
    out.push(...(j.results || []));
    const nx = j.next;
    if (!nx) break;
    if (/^https?:/i.test(nx)) { const u = new URL(nx); caminho = u.pathname + u.search; }
    else caminho = base + '&after=' + encodeURIComponent(nx);
  }
  return out;
}

async function sincronizarUsuario(db, userId, itens) {
  const from = new Date(Date.now() - DIAS * 864e5).toISOString().slice(0, 10);
  const dados = { atualizado: new Date().toISOString(), itens: [], contas: [], transacoes: [], erros: [] };
  for (const itemId of itens) {
    try {
      const item = await pluggy('/items/' + encodeURIComponent(itemId));
      const conector = (item.connector && item.connector.name) || 'Banco';
      const contas = await pluggy('/accounts?itemId=' + encodeURIComponent(itemId));
      // Pelo MeuPluggy o conector se chama "MeuPluggy": o nome do banco vem da conta.
      const nomeBanco = a => (/meu ?pluggy/i.test(conector) ? (a.name || conector) : conector);
      const lista = contas.results || [];
      const banco = lista.length ? nomeBanco(lista.find(a => a.type === 'BANK') || lista[0]) : conector;
      dados.itens.push({ id: itemId, banco, status: item.status, execucao: item.executionStatus, atualizadoBanco: item.lastUpdatedAt || item.updatedAt });
      for (const a of lista) {
        const banco = nomeBanco(a);
        const cd = a.creditData || {};
        dados.contas.push({ id: a.id, item: itemId, banco, nome: a.marketingName || a.name, tipo: a.type, subtipo: a.subtype, numero: a.number,
          saldo: a.balance, limite: cd.creditLimit ?? null, disponivel: cd.availableCreditLimit ?? null,
          vencFatura: cd.balanceDueDate || null, fechFatura: cd.balanceCloseDate || null, minimo: cd.minimumPayment ?? null });
        let txs = [];
        try { txs = await todasTransacoes(a.id, from); }
        catch (e) { dados.erros.push({ item: itemId, conta: a.id, msg: 'movimentos de ' + (a.name || 'uma conta') + ': ' + e.message }); }
        for (const t of txs) {
          const cm = t.creditCardMetadata || {};
          dados.transacoes.push({ id: t.id, conta: a.id, cartao: a.type === 'CREDIT', banco, data: String(t.date).slice(0, 10),
            desc: t.description || t.descriptionRaw || '', valor: t.amount, tipo: t.type, cat: t.category || '',
            parc: cm.totalInstallments > 1 ? [cm.installmentNumber || 1, cm.totalInstallments] : null, status: t.status || null });
        }
      }
    } catch (e) { dados.erros.push({ item: itemId, msg: e.message }); }
  }
  dados.transacoes.sort((p, q) => (p.data < q.data ? 1 : p.data > q.data ? -1 : 0));
  dados.transacoes = dados.transacoes.slice(0, 3000);
  await db.query(`insert into public.docs (user_id, id, data, updated_at) values ($1, 'banco-dados', $2, now())
    on conflict (user_id, id) do update set data = excluded.data, updated_at = now()`, [userId, JSON.stringify(dados)]);
  return { contas: dados.contas.length, transacoes: dados.transacoes.length, erros: dados.erros };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!pluggyConfigurada()) return res.status(503).json({ erro: 'As chaves da Pluggy ainda não foram colocadas na Vercel.' });
  let somente = null;
  if (req.method === 'POST') {
    somente = await usuarioDoPedido(req);
    if (!somente) return res.status(401).json({ erro: 'Faça login de novo.' });
  } else {
    const auth = req.headers.authorization || '', ua = String(req.headers['user-agent'] || '');
    const ok = env.CRON_SECRET ? auth === 'Bearer ' + env.CRON_SECRET : ua.includes('vercel-cron');
    if (!ok) return res.status(401).json({ erro: 'Não autorizado.' });
  }
  try {
    const resultado = await comBanco(async db => {
      const q = await db.query(`select user_id, data from public.docs where id = 'pluggy-itens'` + (somente ? ' and user_id = $1' : ''), somente ? [somente] : []);
      const out = [];
      for (const l of q.rows) {
        const itens = ((l.data && l.data.itens) || []).map(x => (typeof x === 'string' ? x : x.id)).filter(Boolean);
        if (itens.length) out.push(await sincronizarUsuario(db, l.user_id, itens));
      }
      return out;
    });
    return res.status(200).json({ ok: true, resultado });
  } catch (e) { return res.status(500).json({ erro: e.message }); }
}
