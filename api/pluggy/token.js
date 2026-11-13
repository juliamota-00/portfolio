// Gera o token de 30 minutos que abre a janela da Pluggy no painel (só para quem está logada).
import { usuarioDoPedido, pluggy, pluggyConfigurada } from '../_comum.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  if (!(await usuarioDoPedido(req))) return res.status(401).json({ erro: 'Faça login de novo.' });
  if (!pluggyConfigurada()) return res.status(503).json({ erro: 'As chaves da Pluggy ainda não foram colocadas na Vercel.' });
  try {
    const body = req.body && req.body.itemId ? { itemId: String(req.body.itemId) } : {};
    const j = await pluggy('/connect_token', { method: 'POST', body: JSON.stringify(body) });
    return res.status(200).json({ accessToken: j.accessToken });
  } catch (e) { return res.status(502).json({ erro: e.message }); }
}
