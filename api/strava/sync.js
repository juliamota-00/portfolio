// Atualiza as corridas do Strava: pelo botão do painel (POST) ou sozinho todo dia (agendamento da Vercel).
import { usuarioDoPedido, comBanco, env } from '../_comum.js';
import { stravaConfigurado, sincronizarStrava } from '../_strava.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!stravaConfigurado()) return res.status(503).json({ erro: 'Falta colocar STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET nas variáveis da Vercel.' });
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
    const r = await comBanco(async db => {
      const q = await db.query(`select user_id from public.docs where id = 'strava-tokens'` + (somente ? ' and user_id = $1' : ''), somente ? [somente] : []);
      if (somente && !q.rows.length) throw new Error('O Strava ainda não foi conectado.');
      let total = 0;
      for (const l of q.rows) { try { total += await sincronizarStrava(db, l.user_id); } catch (e) { if (somente) throw e; } }
      return total;
    });
    res.status(200).json({ ok: true, corridas: r });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}
