// Funções compartilhadas pelas rotas da pasta /api (arquivos com _ não viram rota).
import pg from 'pg';

export const env = process.env;
export const SUPA_URL = () => env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = () => env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

// Confere o login do painel: devolve o id da pessoa ou null.
export async function usuarioDoPedido(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token || !SUPA_URL()) return null;
  const r = await fetch(SUPA_URL() + '/auth/v1/user', { headers: { apikey: ANON(), Authorization: 'Bearer ' + token } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u && u.id ? u.id : null;
}

function semSslmode(url) {
  try { const u = new URL(url); u.searchParams.delete('sslmode'); return u.toString(); } catch (e) { return url; }
}
export async function comBanco(fn) {
  const cs = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
  const client = new pg.Client({ connectionString: semSslmode(cs), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try { return await fn(client); } finally { await client.end(); }
}

// ---- Pluggy ----
const API = 'https://api.pluggy.ai';
export const pluggyConfigurada = () => !!(env.PLUGGY_CLIENT_ID && env.PLUGGY_CLIENT_SECRET);
let chaveCache = null, chaveAte = 0;
export async function pluggyChave() {
  if (chaveCache && Date.now() < chaveAte) return chaveCache;
  const r = await fetch(API + '/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: env.PLUGGY_CLIENT_ID, clientSecret: env.PLUGGY_CLIENT_SECRET }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.apiKey) throw new Error('A Pluggy recusou as chaves (confira PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET na Vercel).');
  chaveCache = j.apiKey; chaveAte = Date.now() + 90 * 60 * 1000;
  return chaveCache;
}
export async function pluggy(caminho, opcoes = {}) {
  const chave = await pluggyChave();
  const r = await fetch(API + caminho, { ...opcoes, headers: { 'Content-Type': 'application/json', 'X-API-KEY': chave, ...(opcoes.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.message || ('Erro da Pluggy ' + r.status)); e.status = r.status; throw e; }
  return j;
}
