import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { data, error } = await supabase
      .from('procesos_sgc')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching procesos:', error);
      return new Response(JSON.stringify({ error: 'Error al obtener los procesos' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Unexpected error in procesos API:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
