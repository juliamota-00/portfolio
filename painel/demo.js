// Dados da demonstração pública do painel. Tudo aqui é inventado.
// As datas são calculadas a partir de hoje, para a demonstração parecer sempre atual.
window.montarDemo = function () {
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const dia = (k) => { const d = new Date(hoje); d.setDate(d.getDate() + k); return iso(d); };
  const noMes = (mOff, d) => { const x = new Date(hoje.getFullYear(), hoje.getMonth() + mOff, 1, 12); x.setDate(Math.min(d, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x; };
  let id = 1, uidN = 900000;
  const entries = [];
  const L = (mOff, desc, val, categoria, extra) => {
    const d = noMes(mOff, 1);
    entries.push({ id: id++, desc, val, mes: d.getMonth(), ano: d.getFullYear(), tipo: 'saida', fixo: 'variavel', payment: 'debito', categoria, auto: false, ...(extra || {}) });
  };
  for (let m = -5; m <= 0; m++) {
    const atual = m === 0, var_ = k => Math.round((1 + Math.sin(m * 1.7 + k) * 0.12) * 100) / 100;
    L(m, 'Salário', 6200, 'Renda', { tipo: 'entrada', fixo: 'fixo', payment: 'pix' });
    if (m === -1) L(m, 'Freela de consultoria fiscal', 900, 'Renda', { tipo: 'entrada', payment: 'pix' });
    L(m, 'Aluguel', 1650, 'Moradia', { fixo: 'fixo', payment: 'pix' });
    L(m, 'Condomínio', 480, 'Moradia', { fixo: 'fixo', payment: 'pix' });
    L(m, 'Enel - conta de luz', Math.round(150 * var_(1)), 'Moradia', { fixo: 'fixo', auto: true, banco: 'demo-l' + m });
    L(m, 'Internet fibra', 109.9, 'Moradia', { fixo: 'fixo', payment: 'credito' });
    if (!atual || hoje.getDate() > 10) L(m, 'Mercado do mês', Math.round(780 * var_(2)), 'Alimentação', { payment: 'credito', auto: true, banco: 'demo-m' + m, cartao: true });
    L(m, 'Hortifruti e padaria', Math.round(210 * var_(3)), 'Alimentação', { payment: 'debito' });
    L(m, 'iFood', Math.round(185 * var_(4)), 'Alimentação', { payment: 'credito', auto: true, banco: 'demo-i' + m, cartao: true });
    L(m, 'Combustível', Math.round(260 * var_(5)), 'Transporte', { payment: 'credito', auto: true, banco: 'demo-c' + m, cartao: true });
    L(m, 'Uber', Math.round(70 * var_(6)), 'Transporte', { payment: 'credito' });
    L(m, 'Netflix', m >= -1 ? 44.9 : 39.9, 'Fixos Digitais', { fixo: 'fixo', payment: 'credito', auto: true, banco: 'demo-n' + m, cartao: true });
    L(m, 'Spotify', 21.9, 'Fixos Digitais', { fixo: 'fixo', payment: 'credito' });
    L(m, 'Academia', 119, 'Saúde', { fixo: 'fixo', payment: 'credito' });
    L(m, 'Pós-graduação - mensalidade', 420, 'Estudos', { fixo: 'fixo', payment: 'pix', ded: 'educacao' });
    L(m, 'Petshop - ração e areia', Math.round(160 * var_(7)), 'Pets', { payment: 'credito' });
    if (m % 2 === 0) L(m, 'Cinema e jantar', Math.round(160 * var_(8)), 'Lazer', { payment: 'credito' });
    if (m === -3) L(m, 'Consulta dermatologista', 350, 'Saúde', { payment: 'pix' });
    if (m === -2) L(m, 'Exames laboratoriais', 180, 'Saúde', { payment: 'pix' });
    if (m === -4) L(m, 'Tênis de corrida', 399.9, 'Roupas e acessórios', { payment: 'credito', parc: { atual: 1, total: 3 } });
    if (m === -3) L(m, 'Tênis de corrida', 399.9, 'Roupas e acessórios', { payment: 'credito', parc: { atual: 2, total: 3 } });
    if (m === -2) L(m, 'Tênis de corrida', 399.9, 'Roupas e acessórios', { payment: 'credito', parc: { atual: 3, total: 3 } });
    if (m === -1) L(m, 'Presente de aniversário', 150, 'Presentes', { payment: 'pix' });
    if (m === 0) L(m, 'Investimento - reserva', 600, 'Investimentos', { payment: 'pix' });
  }
  const uid = () => ++uidN;
  const notes = [
    { id: uid(), board: 'trabalho', kind: 'lista', title: 'Fechamento do mês', color: 'rosa', important: true, created: Date.now() - 864e5 * 3, body: '',
      items: [{ id: uid(), text: 'Conferir apuração de ICMS', done: true }, { id: uid(), text: 'Revisar parametrização das novas NCMs', done: false, hi: true }, { id: uid(), text: 'Enviar DCTFWeb', done: false, due: dia(4) }, { id: uid(), text: 'Bater entradas com o SPED', done: false }] },
    { id: uid(), board: 'trabalho', kind: 'texto', title: 'Ideias de automação', color: 'lavanda', important: true, created: Date.now() - 864e5 * 9, items: [],
      body: 'Ler XML das notas de entrada e sugerir a TES pela NCM e pelo CFOP do fornecedor.\nAlerta quando a alíquota da nota vier diferente do cadastro.' },
    { id: uid(), board: 'estudos', kind: 'lista', title: 'Pós: próximas entregas', color: 'ceu', important: false, created: Date.now() - 864e5 * 5, body: '',
      items: [{ id: uid(), text: 'Resumo de reforma tributária (IBS/CBS)', done: false, due: dia(6) }, { id: uid(), text: 'Estudo de caso: créditos de PIS/COFINS', done: true }] },
    { id: uid(), board: 'casa', kind: 'lista', title: 'Casa', color: 'menta', important: false, created: Date.now() - 864e5 * 2, body: '',
      items: [{ id: uid(), text: 'Trocar o filtro da torneira', done: false }, { id: uid(), text: 'Agendar vacina das gatas', done: false, hi: true }, { id: uid(), text: 'Comprar areia', done: true }] },
    { id: uid(), board: 'contatos', kind: 'texto', title: 'Contadora do condomínio', color: 'manteiga', important: false, created: Date.now() - 864e5 * 20, items: [], body: 'Marina (contato fictício)\nAtende de segunda a quinta.' }
  ];
  const ev = (k, title, tipo, extra) => ({ id: uid(), date: dia(k), title, tipo, repeat: 'none', done: [], ...(extra || {}) });
  const events = [
    { id: uid(), date: iso(noMes(0, 10)), title: 'Aluguel', tipo: 'contas', repeat: 'monthly', done: [], conta: { val: 1650, categoria: 'Moradia', fixo: 'fixo', payment: 'pix' }, lancado: {} },
    { id: uid(), date: iso(noMes(0, 15)), title: 'Condomínio', tipo: 'contas', repeat: 'monthly', done: [], conta: { val: 480, categoria: 'Moradia', fixo: 'fixo', payment: 'pix' }, lancado: {} },
    { id: uid(), date: iso(noMes(0, 20)), title: 'Enel - conta de luz', tipo: 'contas', repeat: 'monthly', done: [], conta: { val: 155, categoria: 'Moradia', fixo: 'fixo', payment: 'pix' }, lancado: {} },
    { id: uid(), date: iso(noMes(0, 8)), title: 'Pós-graduação - mensalidade', tipo: 'contas', repeat: 'monthly', done: [], conta: { val: 420, categoria: 'Estudos', fixo: 'fixo', payment: 'pix' }, lancado: {} },
    { id: uid(), date: iso(noMes(0, 20)), title: 'Vencimento DAS / guias do mês', tipo: 'impostos', repeat: 'monthly', done: [] },
    ev(1, 'Reunião de fechamento', 'trabalho', { hora: '10:00' }),
    ev(3, 'Aula da pós: tributação sobre consumo', 'estudos', { hora: '19:00' }),
    ev(5, 'Vacina das gatas', 'gatas', { hora: '09:30' }),
    ev(8, 'Dentista', 'saude', { hora: '18:00' }),
    ev(12, 'Aniversário da Bia', 'pessoal'),
    { id: uid(), date: dia(0), title: 'Caminhada', tipo: 'pessoal', repeat: 'dias', dias: [1, 3, 5], done: [], hora: '07:00' }
  ];
  // Contas do mês que já venceram aparecem como pagas.
  events.forEach(e => { if (e.repeat !== 'monthly') return; const dd = Number(e.date.slice(8)); for (let m = -2; m <= 0; m++) { const s = iso(noMes(m, dd)); if (s < dia(0)) e.done.push(s); } });
  const ciclo = {};
  [-58, -30, -2].forEach(k => { for (let i = 0; i < 5; i++) ciclo[dia(k + i)] = { fluxo: i < 2 ? 2 : 1 }; });
  const academia = {};
  for (let k = -27; k <= 0; k++) { const d = new Date(hoje); d.setDate(d.getDate() + k); if ([1, 3, 5].includes(d.getDay()) && k % 7 !== -6) academia[iso(d)] = 1; }
  const mesTx = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fech = iso(noMes(0, 28) < hoje ? noMes(1, 28) : noMes(0, 28)), venc = iso(new Date(new Date(fech + 'T12:00').getTime() + 7 * 864e5));
  const estado = {
    versao: 3, entries, nextId: id, notes, events, seq: uidN + 1, ciclo,
    caixa: { saldo: 0, contas: [], entradas: [{ id: uid(), nome: 'Salário', valor: 6200, dia: 5 }], cartaoValor: 0, cartaoDia: 5, reserva: 8400, reservaMeses: 6, usarBancos: true, cartaoBanco: 2, contasMeses: 3 },
    orc: { limites: { 'Alimentação': 1250, 'Transporte': 400, 'Lazer': 250, 'Moradia': 2450, 'Fixos Digitais': 80, 'Pets': 200 } },
    metas: [{ id: uid(), nome: 'Viagem de férias', alvo: 6000, guardado: 2100, prazo: iso(noMes(7, 1)).slice(0, 7) }, { id: uid(), nome: 'Reserva de emergência', alvo: 20000, guardado: 8400, prazo: '' }],
    pomo: {}, bancoVistos: {}, regras: { 'mercado': { categoria: 'Alimentação' } }, salario: { bruto: 7500, dia: 5, diasUteis: 22, vrDia: 40, descBenef: 10, plano: 0, outros: 0, vrPct: 30, entradaId: null },
    beneficios: {}, assin: { ignorar: {} }, treino: { academia, metaSemana: 3 }, meusNomes: ['Ana Exemplo da Silva'], _ts: Date.now()
  };
  const tx = (k, conta, desc, valor, extra) => ({ id: 'dtx' + (++uidN), conta, banco: conta.startsWith('nu') ? 'Nubank' : 'Itaú', cartao: conta === 'nu-cc', data: dia(k), desc, valor, tipo: valor < 0 ? 'DEBIT' : 'CREDIT', cat: '', parc: null, status: 'POSTED', ...(extra || {}) });
  const transacoes = [
    tx(0, 'nu-cc', 'Padaria Pão Quente', 23.5), tx(-1, 'nu-cc', 'Posto Ipiranga', 180), tx(-1, 'itau-cc', 'PIX ENVIADO Ana Exemplo da Silva', -500),
    tx(-1, 'nu-conta', 'Transferência recebida Ana Exemplo da Silva', 500), tx(-2, 'nu-cc', 'Drogaria São Paulo', 47.9), tx(-3, 'nu-cc', 'Cobasi - ração', 132),
    tx(-3, 'itau-cc', 'PIX ENVIADO Marina Costa', -80), tx(-4, 'nu-cc', 'Uber *Trip', 18.4), tx(-5, 'nu-cc', 'Renner', 159.9, { parc: [1, 2] }),
    tx(-6, 'itau-cc', 'Pagamento cartão de crédito Nubank', -1830.2), tx(-7, 'nu-cc', 'Pão de Açúcar', 236.75), tx(-8, 'nu-cc', 'Netflix.com', 44.9),
    tx(-9, 'itau-cc', 'Sabesp - conta de água', -42.3), tx(-10, 'nu-cc', 'O Boticário', 89.9)
  ];
  const banco = {
    atualizado: new Date(Date.now() - 3 * 36e5).toISOString(),
    itens: [{ id: 'demo-nu', banco: 'Nubank', status: 'UPDATED', atualizadoBanco: new Date(Date.now() - 3 * 36e5).toISOString() }, { id: 'demo-itau', banco: 'Itaú', status: 'UPDATED', atualizadoBanco: new Date(Date.now() - 5 * 36e5).toISOString() }],
    contas: [
      { id: 'nu-conta', item: 'demo-nu', banco: 'Nubank', nome: 'Conta', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', saldo: 3420.55 },
      { id: 'itau-cc', item: 'demo-itau', banco: 'Itaú', nome: 'Conta corrente', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', saldo: 1180.4 },
      { id: 'nu-cc', item: 'demo-nu', banco: 'Nubank', nome: 'Ultravioleta', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', saldo: 2920, limite: 9000, disponivel: 6080, fechFatura: fech, vencFatura: venc, faturas: [] }
    ],
    transacoes: transacoes.filter(t => t.data <= dia(0)), erros: []
  };
  const corridas = [];
  for (let k = -120; k <= 0; k++) { const d = new Date(hoje); d.setDate(d.getDate() + k); if ([2, 6].includes(d.getDay())) { const km = d.getDay() === 6 ? 6 + ((k * 7) % 5) * 0.4 : 4 + ((k * 3) % 4) * 0.3; corridas.push([iso(d), Math.round(km * 100) / 100, Math.round(380 - (k + 120) * 0.25 + ((k * 13) % 9))]); } }
  corridas.reverse();
  const docs = {
    jm_financas_v2: estado,
    'banco-dados': banco,
    'pluggy-itens': { itens: [{ id: 'demo-nu', banco: 'Nubank' }, { id: 'demo-itau', banco: 'Itaú' }] },
    'strava-corridas': { atualizado: new Date(Date.now() - 6 * 36e5).toISOString(), atleta: 'Ana Exemplo', conectado: true, corridas },
    'hab-plano': { tarefas: ['Ler 20 páginas', 'Beber 2 L de água', 'Revisar agenda do dia seguinte'], treinos: ['Descanso', 'Corrida leve', 'Musculação: superiores', 'Corrida intervalada', 'Musculação: inferiores', 'Mobilidade', 'Longão'] }
  };
  void mesTx;
  return docs;
};
