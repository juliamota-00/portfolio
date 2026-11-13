// Primeiro acesso: cria a tabela do painel (se ainda não existir) e a conta da dona.
// Só funciona enquanto o banco não tem nenhum usuário, e só para o e-mail da dona.
import pg from 'pg';

const DONA = 'julia.clmota@gmail.com';

const SQL = `
create table if not exists public.docs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.docs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'docs' and policyname = 'dono_le_e_grava') then
    create policy dono_le_e_grava on public.docs for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
revoke all on public.docs from anon;
grant select, insert, update, delete on public.docs to authenticated;
`;

function semSslmode(url) {
  try { const u = new URL(url); u.searchParams.delete('sslmode'); return u.toString(); } catch (e) { return url; }
}

async function garantirTabela() {
  const cs = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!cs) throw new Error('Banco não configurado (POSTGRES_URL ausente).');
  const client = new pg.Client({ connectionString: semSslmode(cs), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try { await client.query(SQL); } finally { await client.end(); }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const env = process.env;
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!url || !chave) return res.status(500).json({ erro: 'Banco não configurado na Vercel.' });

  const { email, password } = req.body || {};
  if (String(email || '').trim().toLowerCase() !== DONA) return res.status(403).json({ erro: 'Este e-mail não pode criar conta aqui.' });
  if (!password || String(password).length < 8) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' });

  try { await garantirTabela(); }
  catch (e) { return res.status(500).json({ erro: 'Não consegui preparar o banco: ' + e.message }); }

  const h = { apikey: chave, Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' };
  const lista = await fetch(url + '/auth/v1/admin/users?page=1&per_page=1', { headers: h });
  const lj = await lista.json().catch(() => ({}));
  if (!lista.ok) return res.status(500).json({ erro: 'Não consegui consultar o banco.' });
  if ((lj.users || []).length > 0) return res.status(409).json({ erro: 'A conta já foi criada. Use "Entrar".' });

  const r = await fetch(url + '/auth/v1/admin/users', {
    method: 'POST', headers: h,
    body: JSON.stringify({ email: DONA, password: String(password), email_confirm: true })
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    return res.status(400).json({ erro: j.msg || j.message || 'Não consegui criar a conta.' });
  }
  return res.status(200).json({ ok: true });
}
