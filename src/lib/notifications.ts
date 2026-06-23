import { supabase } from './supabase';

export interface Notificacion {
  id?: string;
  usuario_id: string;
  titulo: string;
  contenido: string;
  leido?: boolean;
  tipo: string; // 'reserva' | 'ticket' | 'evidencia'
  created_at?: string;
}

export async function crearNotificacion(notif: Notificacion) {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert({
        usuario_id: notif.usuario_id,
        titulo: notif.titulo,
        contenido: notif.contenido,
        tipo: notif.tipo,
        leido: false
      })
      .select();

    if (error) {
      console.error('Error al insertar notificación en Supabase:', error);
    }
    return { data, error };
  } catch (err) {
    console.error('Excepción al crear notificación:', err);
    return { data: null, error: err };
  }
}
