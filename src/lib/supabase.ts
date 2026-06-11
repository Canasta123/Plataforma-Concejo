import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

const env = loadEnv(import.meta.env.MODE || 'development', process.cwd(), '');

const supabaseUrl = env.SUPABASE_URL || import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY || import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Rol = 'admin' | 'solicitante' | 'agente' | 'auditor';
export type EstadoTicket = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
export type Prioridad = 'alta' | 'media' | 'baja';
export type Categoria = 'hardware' | 'software' | 'redes' | 'otro';
export type TipoTrazabilidad = 'comentario' | 'respuesta' | 'cambio_estado' | 'asignacion';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password_hash: string;
  rol: Rol;
  cargo: string;
  activo: boolean;
  created_at: string;
  correo_notificacion?: string | null;
  induccion_sgc?: boolean;
  induccion_mesa?: boolean;
  induccion_capacitacion?: boolean;
  induccion_completada?: boolean;
  induccion_fecha?: string | null;
  induccion_comentarios?: string | null;
  induccion_habilitada?: boolean;
  induccion_valoracion_sgc?: number | null;
  induccion_valoracion_mesa?: number | null;
}

export interface Ticket {
  id: string;
  codigo: string;
  creador_id: string;
  agente_id: string | null;
  categoria: Categoria;
  prioridad: Prioridad;
  estado: EstadoTicket;
  titulo: string;
  descripcion: string;
  fecha_creacion: string;
  fecha_limite: string;
  fecha_cierre: string | null;
  updated_at: string;
}

export interface Trazabilidad {
  id: string;
  ticket_id: string;
  autor_id: string;
  tipo: TipoTrazabilidad;
  contenido: string;
  es_interno: boolean;
  created_at: string;
}

export interface Adjunto {
  id: string;
  ticket_id: string;
  nombre: string;
  url: string;
  created_at: string;
}

export interface Exportacion {
  id: string;
  usuario_id: string;
  filtros: Record<string, unknown>;
  tickets_count: number;
  incluyo_internos: boolean;
  created_at: string;
}

export interface PlantillaExport {
  id: string;
  usuario_id: string;
  nombre: string;
  filtros: Record<string, unknown>;
  created_at: string;
}
