import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabase
      .from('config_mejora')
      .select('*');

    if (error) {
      console.error('Error fetching config:', error);
      return new Response(JSON.stringify({ error: 'Error al obtener configuración' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session || session.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo el administrador puede modificar la configuración' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    
    // Assuming body is an array of objects to update or a single object
    const updates = Array.isArray(body) ? body : [body];

    const { data, error } = await supabase
      .from('config_mejora')
      .upsert(updates)
      .select();

    if (error) {
      console.error('Error updating config:', error);
      return new Response(JSON.stringify({ error: 'Error al actualizar configuración' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
