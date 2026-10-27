import { supabase } from './supabase';
import { enviarRecordatorioReserva, notificarTareaVencida, notificarHallazgoVencido } from './mailer';

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  console.log('[Scheduler] Iniciado — revisando recordatorios cada 10 minutos.');

  async function checkReminders() {
    try {
      const ahora = new Date();
      const en70min = new Date(ahora.getTime() + 70 * 60 * 1000);
      const en50min = new Date(ahora.getTime() + 50 * 60 * 1000);

      // Buscar reservas aprobadas que empiezan entre 50 y 70 minutos en el futuro y aun no se les envió recordatorio
      const { data: reservas, error } = await supabase
        .from('reservas')
        .select(`
          id, motivo, fecha_inicio, fecha_fin, recordatorio_enviado,
          solicitante:solicitante_id(id, nombre, correo, correo_notificacion),
          recurso:recurso_id(nombre)
        `)
        .eq('estado', 'aprobada')
        .eq('recordatorio_enviado', false)
        .gte('fecha_inicio', en50min.toISOString())
        .lte('fecha_inicio', en70min.toISOString());

      if (error) {
        console.error('[Scheduler] Error consultando reservas:', error.message);
        return;
      }

      if (!reservas || reservas.length === 0) return;

      // Obtener admins y agentes para notificar
      const { data: admins } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, correo_notificacion')
        .in('rol', ['admin', 'agente'])
        .eq('activo', true);

      for (const reserva of reservas) {
        try {
          const solicitante = reserva.solicitante as any;
          const recurso = reserva.recurso as any;
          if (!solicitante || !recurso) continue;

          await enviarRecordatorioReserva(
            { motivo: reserva.motivo, fecha_inicio: reserva.fecha_inicio, fecha_fin: reserva.fecha_fin },
            solicitante,
            recurso,
            admins ?? []
          );

          // Marcar como enviado
          await supabase
            .from('reservas')
            .update({ recordatorio_enviado: true })
            .eq('id', reserva.id);

          console.log(`[Scheduler] Recordatorio enviado para reserva ${reserva.id}`);
        } catch (e) {
          console.error(`[Scheduler] Error enviando recordatorio para reserva ${reserva.id}:`, e);
        }
      }
    } catch (e) {
      console.error('[Scheduler] Error general:', e);
    }
    
    // Mejora Continua Overdue Checks
    try {
      const ahoraIso = new Date().toISOString();
      
      // Tareas vencidas
      const { data: tareasVencidas, error: errTareas } = await supabase
        .from('plan_accion_tareas')
        .select(`
          id, descripcion, fecha_limite, recordatorio_enviado,
          hallazgo:hallazgo_id(id, codigo),
          responsable:responsable_id(id, nombre, correo, correo_notificacion)
        `)
        .neq('estado', 'completada')
        .lt('fecha_limite', ahoraIso)
        .eq('recordatorio_enviado', false);
        
      if (!errTareas && tareasVencidas) {
        for (const t of tareasVencidas) {
          const hallazgo = t.hallazgo as any;
          const responsable = t.responsable as any;
          if (hallazgo && responsable) {
            await notificarTareaVencida(hallazgo, t, responsable);
            await supabase.from('plan_accion_tareas').update({ recordatorio_enviado: true }).eq('id', t.id);
            console.log(`[Scheduler] Notificación de tarea vencida enviada (Tarea: ${t.id})`);
          }
        }
      }
      
      // Hallazgos vencidos
      const { data: gestores } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, correo_notificacion')
        .eq('es_gestor_mejora', true)
        .eq('activo', true);
        
      const { data: hallazgosVencidos, error: errHallazgos } = await supabase
        .from('hallazgos')
        .select('id, codigo, descripcion, fecha_limite, recordatorio_enviado')
        .not('estado', 'in', '("cerrado_eficaz","cerrado_no_eficaz")')
        .lt('fecha_limite', ahoraIso)
        .eq('recordatorio_enviado', false);
        
      if (!errHallazgos && hallazgosVencidos && gestores) {
        for (const h of hallazgosVencidos) {
          await notificarHallazgoVencido(h, gestores);
          await supabase.from('hallazgos').update({ recordatorio_enviado: true }).eq('id', h.id);
          console.log(`[Scheduler] Notificación de hallazgo vencido enviada (Hallazgo: ${h.codigo})`);
        }
      }
    } catch (e) {
      console.error('[Scheduler] Error en Mejora Continua:', e);
    }
  }

  // Ejecutar inmediatamente y luego cada 10 minutos
  checkReminders();
  setInterval(checkReminders, 10 * 60 * 1000);
}
