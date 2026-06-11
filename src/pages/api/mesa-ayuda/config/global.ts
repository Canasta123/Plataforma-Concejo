import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async () => {
  const { data } = await supabase
    .from('config_global')
    .select('clave, valor')
    .in('clave', ['banner_activo', 'banner_mensaje', 'banner_tipo']);

  const config: Record<string, string> = {};
  for (const row of data ?? []) config[row.clave] = row.valor;
  return new Response(JSON.stringify(config), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const body = await request.json();
  const upserts = Object.entries(body).map(([clave, valor]) => ({ clave, valor: String(valor) }));

  const { error } = await supabase
    .from('config_global')
    .upsert(upserts, { onConflict: 'clave' });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
