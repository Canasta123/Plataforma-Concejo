import { supabase } from './supabase';
import type { SessionPayload } from './auth';

export async function esGestorMejora(session: SessionPayload): Promise<boolean> {
  if (session.rol === 'admin') return true;
  const { data } = await supabase
    .from('usuarios')
    .select('es_gestor_mejora')
    .eq('id', session.id)
    .single();
  return data?.es_gestor_mejora ?? false;
}
