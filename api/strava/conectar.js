// Gera o link de autorização do Strava para quem está logado no painel.
import crypto from 'node:crypto';
import { usuarioDoPedido, comBanco, env } from '../_comum.js';
import { stravaConfigurado, gravarDoc } from '../_strava.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  if (!stravaConfigurado()) return res.status(503).json({ erro: 'Falta colocar STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET nas variáveis da Vercel (e fazer Redeploy).' });
  const userId = await usuarioDoPedido(req);
  if (!userId) return res.status(401).json({ erro: 'Faça login de novo.' });
  const nonce = crypto.randomUUID();
  await comBanco(db => gravarDoc(db, userId, 'strava-estado', { nonce, criado: Date.now() }));
  const volta = `https://${req.headers['x-forwarded-host'] || req.headers.host}/api/strava/retorno`;
  const url = 'https://www.strava.com/oauth/authorize?' + new URLSearchParams({ client_id: env.STRAVA_CLIENT_ID, response_type: 'code', redirect_uri: volta,
    approval_prompt: 'auto', scope: 'read,activity:read_all', state: nonce });
  res.status(200).json({ url });
}
