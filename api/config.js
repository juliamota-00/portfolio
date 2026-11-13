// Entrega ao navegador o endereço do banco e a chave pública (anon).
// A chave anon é pública por natureza: quem protege os dados são as regras de acesso (RLS) do banco.
export default function handler(req, res) {
  const env = process.env;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    url: env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || null,
    key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY ||
         env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || null
  });
}
