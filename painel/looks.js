// painel/looks.js
// Aba "Guarda-roupa": peças, categorias, ocasiões e looks coringa.
// Dados guardados sob a chave 'guarda-roupa' (AJUSTAR a chamada de storage conforme supa.js).
(function () {
  const CHAVE = 'guarda-roupa';
  const VAZIO = { pecas: [], looks: [] };
  const CATEGORIAS = ['Blusa', 'Calça', 'Saia', 'Vestido', 'Blazer', 'Sapato', 'Acessório'];
  const OCASIOES = ['Trabalho', 'Fim de semana', 'Viagem', 'Coringa'];

  let estado = structuredClone(VAZIO);

  async function carregar() {
    try {
      const r = await window.claude.use('db').get(CHAVE); // AJUSTAR
      return r && r.data ? r.data : structuredClone(VAZIO);
    } catch (e) {
      return structuredClone(VAZIO);
    }
  }

  async function salvar() {
    try {
      await window.claude.use('db').set(CHAVE, estado); // AJUSTAR
    } catch (e) {
      console.error('Guarda-roupa: não consegui salvar', e);
    }
  }

  function el(tag, props = {}, filhos = []) {
    const n = document.createElement(tag);
    Object.assign(n, props);
    filhos.forEach((f) => n.append(f));
    return n;
  }

  function selectDe(opcoes, valor, onChange) {
    const s = el('select', { onchange: (e) => onChange(e.target.value) });
    opcoes.forEach((o) => s.append(el('option', { value: o, textContent: o, selected: o === valor })));
    return s;
  }

  function formPeca(container) {
    const nome = el('input', { placeholder: 'Nome (ex.: blusa social branca)' });
    const cor = el('input', { placeholder: 'Cor' });
    let categoria = CATEGORIAS[0];
    let ocasiao = OCASIOES[0];
    const botao = el('button', {
      textContent: 'Adicionar peça',
      onclick: async () => {
        if (!nome.value.trim()) return;
        estado.pecas.push({ id: Date.now().toString(), nome: nome.value.trim(), cor: cor.value.trim(), categoria, ocasiao, estado: 'usa' });
        await salvar();
        desenhar(container);
      },
    });
    return el('div', {}, [
      nome, cor,
      selectDe(CATEGORIAS, categoria, (v) => (categoria = v)),
      selectDe(OCASIOES, ocasiao, (v) => (ocasiao = v)),
      botao,
    ]);
  }

  function formLook(container) {
    const nome = el('input', { placeholder: 'Nome do look (ex.: look Taubaté)' });
    const marcadas = new Set();
    const lista = el('div');
    estado.pecas.forEach((p) => {
      const cb = el('input', { type: 'checkbox', onchange: (e) => (e.target.checked ? marcadas.add(p.id) : marcadas.delete(p.id)) });
      lista.append(el('label', {}, [cb, ' ' + p.nome]), el('br'));
    });
    const botao = el('button', {
      textContent: 'Salvar look',
      onclick: async () => {
        if (!nome.value.trim() || marcadas.size === 0) return;
        estado.looks.push({ id: Date.now().toString(), nome: nome.value.trim(), pecas: [...marcadas] });
        await salvar();
        desenhar(container);
      },
    });
    return el('div', {}, [nome, lista, botao]);
  }

  function desenhar(container) {
    container.replaceChildren();
    container.append(el('h2', { textContent: 'Guarda-roupa' }));

    container.append(el('h3', { textContent: 'Peças' }), formPeca(container));
    CATEGORIAS.forEach((cat) => {
      const itens = estado.pecas.filter((p) => p.categoria === cat);
      if (!itens.length) return;
      container.append(el('h4', { textContent: cat }));
      itens.forEach((p) => {
        container.append(el('div', { textContent: `${p.nome}${p.cor ? ' · ' + p.cor : ''} · ${p.ocasiao}` }));
      });
    });

    container.append(el('h3', { textContent: 'Looks' }), formLook(container));
    estado.looks.forEach((l) => {
      const nomes = l.pecas
        .map((id) => estado.pecas.find((p) => p.id === id))
        .filter(Boolean)
        .map((p) => p.nome);
      container.append(el('div', { textContent: `${l.nome}: ${nomes.join(' + ')}` }));
    });
  }

  window.GuardaRoupa = {
    async render(container) {
      estado = await carregar();
      desenhar(container);
    },
  };
})();
