// Notícias sobre a reforma tributária (Google Notícias, RSS). A Vercel guarda a resposta em cache por algumas horas,
// então a lista se atualiza sozinha várias vezes por dia sem precisar de banco.
const BUSCAS = [
  'reforma tributária CBS IBS',
  '"reforma tributária" Receita Federal OR "Comitê Gestor"',
  '"reforma tributária" nota fiscal OR NF-e OR "split payment"'
];
const limpar = s => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, 'i')); return m ? limpar(m[1]) : ''; };

async function buscar(q) {
  const url = 'https://news.google.com/rss/search?' + new URLSearchParams({ q: q + ' when:30d', hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419' });
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (portfolio juliamota)' } });
  if (!r.ok) return [];
  const xml = await r.text();
  return (xml.match(/<item>[\s\S]*?<\/item>/g) || []).map(it => {
    const fonte = tag(it, 'source');
    let titulo = tag(it, 'title');
    if (fonte && titulo.endsWith(' - ' + fonte)) titulo = titulo.slice(0, -(fonte.length + 3));
    return { titulo, fonte, link: tag(it, 'link'), data: new Date(tag(it, 'pubDate')).toISOString() };
  }).filter(n => n.titulo && n.link && !isNaN(new Date(n.data)));
}

export default async function handler(req, res) {
  try {
    const listas = await Promise.all(BUSCAS.map(q => buscar(q).catch(() => [])));
    const vistos = new Set(), out = [];
    listas.flat().sort((a, b) => (a.data < b.data ? 1 : -1)).forEach(n => {
      const k = n.titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 60);
      if (vistos.has(k)) return; vistos.add(k); out.push(n);
    });
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json({ atualizado: new Date().toISOString(), noticias: out.slice(0, 24) });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ erro: 'Não consegui buscar as notícias agora.', noticias: [] });
  }
}
