// Ponte entre o painel e o banco (Supabase).
// O painel foi escrito para o banco do Claude (window.claude.use('db' | 'user' | 'downloads')).
// Este arquivo oferece a mesma interface, gravando na tabela public.docs do Supabase,
// em que cada pessoa só enxerga as próprias linhas (regra de acesso no banco).
// Modo demonstração (/demo ou ?demo=1): sem login e sem banco. Dados inventados, que ficam só nesta aba.
(function () {
  if (!(/[?&]demo=1\b/.test(location.search) || /^\/demo\b/.test(location.pathname))) return;
  window.DEMO = true;
  const CHAVE = 'jm-demo-docs';
  const congelar = v => (v == null ? v : JSON.parse(JSON.stringify(v)));
  let docs = null;
  try { docs = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch (e) {}
  const carregar = () => { if (!docs) docs = window.montarDemo ? window.montarDemo() : {}; return docs; };
  const gravar = () => { try { sessionStorage.setItem(CHAVE, JSON.stringify(docs)); } catch (e) {} };
  const doc = id => ({
    id,
    async get() { const d = carregar(); return { id, exists: id in d, data: () => congelar(d[id]) }; },
    async set(v) { carregar()[id] = congelar(v); gravar(); },
    async delete() { delete carregar()[id]; gravar(); }
  });
  const db = { collection() { return { doc, async get() { const d = carregar(); return { docs: Object.keys(d).sort().map(id => ({ id, exists: true, data: () => congelar(d[id]) })) }; } }; } };
  window.claude = { async use(n) { return n === 'db' ? db : n === 'user' ? { async id() { return 'demo'; } } : n === 'downloads' ? { async save() { alert('Na demonstração os downloads ficam desligados.'); } } : null; } };
  window.tokenDoPainel = async () => '';
  window.sairDoPainel = () => { location.href = '/#projetos'; };
  const fetchOrig = window.fetch.bind(window);
  window.fetch = (url, op) => (String(url).startsWith('/api/')
    ? Promise.resolve(new Response(JSON.stringify({ erro: 'Na demonstração as integrações (bancos, Strava) ficam desligadas. No painel de verdade, este botão conecta e atualiza tudo sozinho.' }), { status: 403, headers: { 'Content-Type': 'application/json' } }))
    : fetchOrig(url, op));
  window.reiniciarDemo = () => { sessionStorage.removeItem(CHAVE); location.reload(); };
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div');
    b.setAttribute('role', 'note');
    b.style.cssText = 'position:fixed;left:12px;right:12px;margin:0 auto;width:fit-content;bottom:14px;z-index:9999;background:#1a1216;color:#f6e6ed;border-radius:999px;padding:8px 10px 8px 16px;font:500 13px/1.3 "DM Sans",system-ui,sans-serif;box-shadow:0 10px 30px -10px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center;max-width:calc(100vw - 24px);flex-wrap:wrap;justify-content:center';
    b.innerHTML = '<span>Demonstração com dados fictícios · pode mexer à vontade, nada é salvo</span><button type="button" onclick="reiniciarDemo()" style="background:none;border:1px solid #6b4a5a;color:#f6e6ed;border-radius:999px;padding:5px 12px;font:inherit;cursor:pointer">Recomeçar</button><a href="/#projetos" style="background:#f3b6c8;color:#1a1216;border-radius:999px;padding:5px 12px;text-decoration:none;font-weight:600">Voltar ao portfólio</a>';
    document.body.appendChild(b);
    document.body.style.paddingBottom = '70px';
  });
})();
if (window.DEMO) { /* a ponte real fica desligada */ } else
(function () {
  let client = null, sessao = null;

  const pronto = (async () => {
    const cfg = await fetch('/api/config', { cache: 'no-store' }).then(r => r.json());
    if (!cfg.url || !cfg.key) throw new Error('Banco não configurado.');
    client = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await client.auth.getSession();
    if (!data.session) { location.replace('/entrar/'); throw new Error('sem login'); }
    sessao = data.session;
    client.auth.onAuthStateChange((ev, s) => { if (ev === 'SIGNED_OUT') location.replace('/entrar/'); else if (s) sessao = s; });
    return client;
  })();

  const congelar = v => (v == null ? v : JSON.parse(JSON.stringify(v)));

  function doc(id) {
    return {
      id,
      async get() {
        await pronto;
        const { data, error } = await client.from('docs').select('data').eq('id', id).maybeSingle();
        if (error) throw error;
        return { id, exists: !!data, data: () => congelar(data && data.data) };
      },
      async set(valor) {
        await pronto;
        const { error } = await client.from('docs').upsert(
          { user_id: sessao.user.id, id, data: congelar(valor), updated_at: new Date().toISOString() },
          { onConflict: 'user_id,id' });
        if (error) throw error;
      },
      async delete() {
        await pronto;
        const { error } = await client.from('docs').delete().eq('id', id);
        if (error) throw error;
      }
    };
  }

  const db = {
    collection() {
      return {
        doc,
        async get() {
          await pronto;
          const docs = [];
          const passo = 1000;
          for (let de = 0; ; de += passo) {
            const { data, error } = await client.from('docs').select('id,data').order('id').range(de, de + passo - 1);
            if (error) throw error;
            data.forEach(l => docs.push({ id: l.id, exists: true, data: () => congelar(l.data) }));
            if (data.length < passo) break;
          }
          return { docs };
        }
      };
    }
  };

  const user = { async id() { await pronto; return sessao.user.id; } };

  const downloads = {
    async save({ filename, data, mime }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
  };

  window.claude = {
    async use(nome) {
      await pronto;
      if (nome === 'db') return db;
      if (nome === 'user') return user;
      if (nome === 'downloads') return downloads;
      return null;
    }
  };

  // Token do login, para as rotas /api que precisam saber quem está usando.
  window.tokenDoPainel = async function () { await pronto; const { data } = await client.auth.getSession(); return data.session ? data.session.access_token : ''; };

  window.sairDoPainel = async function () {
    try { await pronto; await client.auth.signOut(); } finally { location.replace('/entrar/'); }
  };
})();
