// Desconecta o Strava: revoga a autorização e apaga as chaves guardadas.
import { usuarioDoPedido, comBanco } from '../_comum.js';
import { lerDoc, gravarDoc } from '../_strava.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const userId = await usuarioDoPedido(req);
  if (!userId) return res.status(401).json({ erro: 'Faça login de novo.' });
  try {
    await comBanco(async db => {
      const tk = await lerDoc(db, userId, 'strava-tokens');
      if (tk && tk.access_token) { try { await fetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', headers: { Authorization: 'Bearer ' + tk.access_token } }); } catch (e) {} }
      await db.query(`delete from public.docs where user_id = $1 and id = 'strava-tokens'`, [userId]);
      const c = await lerDoc(db, userId, 'strava-corridas');
      if (c) await gravarDoc(db, userId, 'strava-corridas', { ...c, conectado: false });
    });
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ erro: e.message }); }
}
