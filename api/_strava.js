// Funções do Strava usadas pelas rotas /api/strava/* (arquivo com _ não vira rota).
import { env } from './_comum.js';

export const stravaConfigurado = () => !!(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET);

export async function gravarDoc(db, userId, id, dados) {
  await db.query(`insert into public.docs (user_id, id, data, updated_at) values ($1, $2, $3, now())
    on conflict (user_id, id) do update set data = excluded.data, updated_at = now()`, [userId, id, JSON.stringify(dados)]);
}
export async function lerDoc(db, userId, id) {
  const q = await db.query('select data from public.docs where user_id = $1 and id = $2', [userId, id]);
  return q.rows.length ? q.rows[0].data : null;
}

export async function trocarToken(corpo) {
  const r = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, ...corpo }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('O Strava recusou a autorização (' + (j.message || r.status) + ').');
  return j;
}

// Busca as corridas e grava no documento "strava-corridas" do painel.
export async function sincronizarStrava(db, userId) {
  let tk = await lerDoc(db, userId, 'strava-tokens');
  if (!tk || !tk.refresh_token) throw new Error('O Strava ainda não foi conectado.');
  if (!tk.expires_at || tk.expires_at * 1000 < Date.now() + 120000) {
    const j = await trocarToken({ grant_type: 'refresh_token', refresh_token: tk.refresh_token });
    tk = { ...tk, access_token: j.access_token, refresh_token: j.refresh_token || tk.refresh_token, expires_at: j.expires_at };
    await gravarDoc(db, userId, 'strava-tokens', tk);
  }
  const depois = Math.floor(Date.now() / 1000) - 3 * 365 * 86400, corridas = [];
  for (let pagina = 1; pagina <= 8; pagina++) {
    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${pagina}&after=${depois}`, { headers: { Authorization: 'Bearer ' + tk.access_token } });
    if (r.status === 429) throw new Error('O Strava pediu para esperar um pouco (limite de consultas). Tente de novo em 15 minutos.');
    if (!r.ok) throw new Error('Erro do Strava ' + r.status + '.');
    const lista = await r.json();
    for (const a of lista) {
      const tipo = a.sport_type || a.type;
      if (!/run/i.test(tipo) || !(a.distance > 300)) continue;
      const km = a.distance / 1000;
      corridas.push([String(a.start_date_local || a.start_date).slice(0, 10), Math.round(km * 100) / 100, Math.round(a.moving_time / km)]);
    }
    if (lista.length < 200) break;
  }
  corridas.sort((p, q) => (p[0] < q[0] ? 1 : -1));
  await gravarDoc(db, userId, 'strava-corridas', { atualizado: new Date().toISOString(), atleta: tk.atleta || null, conectado: true, corridas });
  return corridas.length;
}
