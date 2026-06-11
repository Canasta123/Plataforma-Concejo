import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const session = await getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });

  const { data: recursos, error } = await supabase
    .from('recursos_reserva')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Obtener la información detallada de todos los responsables
  const userIds = Array.from(new Set((recursos || []).flatMap(r => r.notificar_usuarios_ids || [])));
  let usuariosMap: Record<string, { id: string; nombre: string; correo: string }> = {};

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('usuarios')
      .select('id, nombre, correo')
      .in('id', userIds);
    if (users) {
      usuariosMap = Object.fromEntries(users.map(u => [u.id, u]));
    }
  }

  const recursosMapeados = (recursos || []).map(r => {
    const listaResponsables = (r.notificar_usuarios_ids || [])
      .map((id: string) => usuariosMap[id])
      .filter(Boolean);
    return {
      ...r,
      responsables: listaResponsables,
      responsable: listaResponsables[0] || null // Retrocompatibilidad
    };
  });

  return new Response(JSON.stringify(recursosMapeados), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const { nombre, tipo, descripcion, notificar_usuarios_ids } = await request.json();
  if (!nombre) return new Response(JSON.stringify({ error: 'El nombre es obligatorio' }), { status: 400 });

  const idsArray = Array.isArray(notificar_usuarios_ids) ? notificar_usuarios_ids : [];

  const { data: recursoCreado, error } = await supabase
    .from('recursos_reserva')
    .insert({
      nombre,
      tipo: tipo ?? 'equipo',
      descripcion: descripcion ?? null,
      notificar_usuarios_ids: idsArray,
      // Retrocompatibilidad: rellenar el campo antiguo con el primer elemento
      notificar_usuario_id: idsArray[0] || null,
    })
    .select('*')
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Obtener info detallada para la respuesta
  let responsables: any[] = [];
  if (idsArray.length > 0) {
    const { data: users } = await supabase
      .from('usuarios')
      .select('id, nombre, correo')
      .in('id', idsArray);
    responsables = users || [];
  }

  const responseData = {
    ...recursoCreado,
    responsables,
    responsable: responsables[0] || null
  };

  return new Response(JSON.stringify(responseData), { status: 201 });
};
