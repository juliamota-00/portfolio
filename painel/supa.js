// Ponte entre o painel e o banco (Supabase).
// O painel foi escrito para o banco do Claude (window.claude.use('db' | 'user' | 'downloads')).
// Este arquivo oferece a mesma interface, gravando na tabela public.docs do Supabase,
// em que cada pessoa só enxerga as próprias linhas (regra de acesso no banco).
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
