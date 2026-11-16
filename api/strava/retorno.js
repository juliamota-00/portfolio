// O Strava volta para cá depois que você autoriza. Guarda as chaves e já busca as corridas.
import { comBanco } from '../_comum.js';
import { stravaConfigurado, trocarToken, gravarDoc, sincronizarStrava } from '../_strava.js';

const voltar = (res, ok, motivo) => { res.setHeader('Location', '/painel/?strava=' + (ok ? 'ok' : 'erro') + (motivo ? '&motivo=' + encodeURIComponent(motivo) : '')); res.status(302).end(); };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { code, state: nonce, error, scope } = req.query || {};
  if (error) return voltar(res, false, 'autorização cancelada');
  if (!stravaConfigurado() || !code || !nonce) return voltar(res, false, 'link inválido');
  if (scope && !/activity:read/.test(scope)) return voltar(res, false, 'marque a permissão de ver as atividades');
  try {
    await comBanco(async db => {
      const q = await db.query(`select user_id, data from public.docs where id = 'strava-estado' and data->>'nonce' = $1`, [String(nonce)]);
      const l = q.rows[0];
      if (!l || Date.now() - Number(l.data.criado) > 20 * 60 * 1000) throw new Error('o link expirou, tente de novo');
      await db.query(`delete from public.docs where user_id = $1 and id = 'strava-estado'`, [l.user_id]);
      const j = await trocarToken({ grant_type: 'authorization_code', code: String(code) });
      const a = j.athlete || {};
      await gravarDoc(db, l.user_id, 'strava-tokens', { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at,
        atleta: [a.firstname, a.lastname].filter(Boolean).join(' ') || null, atletaId: a.id || null });
      await sincronizarStrava(db, l.user_id);
    });
    voltar(res, true);
  } catch (e) { voltar(res, false, e.message); }
}
