import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';
import { generarLibroInducciones } from '../../../../lib/excel';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  // Obtener todos los usuarios del sistema ordenados alfabéticamente
  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const buffer = await generarLibroInducciones(usuarios ?? [], session.nombre);
  
  const fecha = new Date().toISOString().slice(0, 10);
  const filename = `reporte-inducciones-SGC-${fecha}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};
