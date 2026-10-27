<script lang="ts">
  export let hallazgoId: string;
  export let tareas: any[] = [];
  export let isGestorOrResponsable: boolean = false;
  export let currentUserId: string = '';
  export let usuarios: any[] = [];

  let newActividad = '';
  let newDetalle = '';
  let newResponsableId = currentUserId;
  let newFechaLimite = '';
  let loading = false;
  let error = '';

  let selectedTareaId = '';
  let updatePorcentaje = 0;
  let updateEvidencia = '';

  $: progressTotal = tareas.length > 0 
    ? Math.round(tareas.reduce((sum, t) => sum + (t.porcentaje_avance || 0), 0) / tareas.length)
    : 0;

  $: allTasksCompleted = tareas.length > 0 && tareas.every(t => t.estado === 'completada' || t.porcentaje_avance === 100);

  async function addTask() {
    if (!newActividad || !newResponsableId || !newFechaLimite) {
      error = 'Actividad, responsable y fecha límite son obligatorios';
      return;
    }
    
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/plan-accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actividad: newActividad,
          descripcion_detalle: newDetalle,
          responsable_id: newResponsableId,
          fecha_limite: newFechaLimite
        })
      });
      if (!res.ok) throw new Error('Error al guardar la actividad');
      const data = await res.json();
      tareas = [...tareas, data];
      newActividad = '';
      newDetalle = '';
      newFechaLimite = '';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function updateTaskStatus(id: string) {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/plan-accion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tarea_id: id,
          porcentaje_avance: updatePorcentaje, 
          evidencia_texto: updateEvidencia,
          estado: updatePorcentaje === 100 ? 'completada' : 'en_progreso' 
        })
      });
      if (!res.ok) throw new Error('Error al actualizar el avance');
      tareas = tareas.map(t => t.id === id ? {
        ...t,
        porcentaje_avance: updatePorcentaje,
        evidencia_texto: updateEvidencia,
        estado: updatePorcentaje === 100 ? 'completada' : 'en_progreso'
      } : t);
      selectedTareaId = '';
      updateEvidencia = '';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function startUpdate(t: any) {
    selectedTareaId = t.id;
    updatePorcentaje = t.porcentaje_avance || 0;
    updateEvidencia = t.evidencia_texto || '';
  }

  async function advanceStage() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa_actual: 5 })
      });
      if (!res.ok) throw new Error('Error al avanzar a Evaluación de Eficacia');
      window.location.reload();
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function getStatusBadge(estado: string, avance: number) {
    if (avance === 100 || estado === 'completada') return { label: '✅ Completada', cls: 'bg-green-100 text-green-700 border-green-200' };
    if (estado === 'vencida') return { label: '🔴 Vencida', cls: 'bg-red-100 text-red-700 border-red-200' };
    if (avance > 0) return { label: '🔵 En Progreso', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    return { label: '⏳ Pendiente', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
</script>

<div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 font-['Lato']">
  
  <!-- Tarjeta Didáctica Guía -->
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
    <div class="flex items-start gap-3">
      <div class="w-9 h-9 rounded-lg bg-[#3359A4] text-white flex items-center justify-center text-lg shrink-0 mt-0.5">
        <i class="fas fa-tasks"></i>
      </div>
      <div>
        <h4 class="text-sm font-bold text-[#3359A4] font-['Montserrat'] mb-1">
          Guía Didáctica: Etapa 4 — Plan de Acción Correctivo / Preventivo
        </h4>
        <p class="text-xs text-blue-900 leading-relaxed">
          Son las <strong>actividades definitivas</strong> para erradicar la Causa Raíz. La persona asignada (y los ejecutores de tareas) deben agregar las actividades, actualizar su porcentaje de avance y cargar evidencias hasta alcanzar el <strong>100% de cumplimiento</strong>.
        </p>
      </div>
    </div>
  </div>

  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <h3 class="text-lg font-bold text-gray-900 font-['Montserrat']">Etapa 4: Plan de Acción y Actividades</h3>
    
    <!-- Barra de progreso global -->
    <div class="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
      <span class="text-xs font-bold text-gray-600">Avance Global:</span>
      <div class="w-32 bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width: {progressTotal}%"></div>
      </div>
      <span class="text-xs font-bold {progressTotal === 100 ? 'text-green-600' : 'text-[#3359A4]'}">{progressTotal}%</span>
    </div>
  </div>

  {#if error}
    <div class="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 flex items-center gap-2 text-red-700 text-sm font-medium">
      <i class="fas fa-exclamation-circle"></i> {error}
    </div>
  {/if}

  <!-- Tabla de Actividades del Plan -->
  <div class="overflow-x-auto border border-gray-200 rounded-xl mb-6">
    <table class="w-full text-left text-sm">
      <thead class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
        <tr>
          <th class="px-4 py-3">Actividad</th>
          <th class="px-4 py-3">Responsable</th>
          <th class="px-4 py-3">Fecha Límite</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3">Avance (%)</th>
          <th class="px-4 py-3 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each tareas as t}
          {@const st = getStatusBadge(t.estado, t.porcentaje_avance)}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-semibold text-gray-900">{t.actividad}</p>
              {#if t.descripcion_detalle}
                <p class="text-xs text-gray-500 mt-0.5">{t.descripcion_detalle}</p>
              {/if}
              {#if t.evidencia_texto}
                <p class="text-[11px] text-gray-600 italic mt-1 bg-gray-50 p-1.5 rounded border border-gray-200">Evidencia: {t.evidencia_texto}</p>
              {/if}
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
              {usuarios.find(u => u.id === t.responsable_id)?.nombre || 'Asignado'}
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{new Date(t.fecha_limite).toLocaleDateString()}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="px-2.5 py-1 text-[10px] font-bold rounded-full border {st.cls}">
                {st.label}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div class="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-blue-600 h-1.5 rounded-full" style="width: {t.porcentaje_avance || 0}%"></div>
                </div>
                <span class="text-xs font-bold text-gray-700">{t.porcentaje_avance || 0}%</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              {#if t.porcentaje_avance < 100 && (t.responsable_id === currentUserId || isGestorOrResponsable)}
                {#if selectedTareaId === t.id}
                  <div class="flex flex-col gap-2 mt-2 p-3 bg-blue-50 rounded-xl border border-blue-200 text-left w-64">
                    <label class="text-xs font-bold text-gray-700">Porcentaje: {updatePorcentaje}%</label>
                    <input type="range" min="0" max="100" step="10" bind:value={updatePorcentaje} class="w-full">
                    <textarea bind:value={updateEvidencia} class="text-xs p-2 border border-gray-300 rounded-lg w-full" placeholder="Observaciones / Evidencia de avance..."></textarea>
                    <div class="flex justify-end gap-2">
                      <button type="button" on:click={() => selectedTareaId = ''} class="px-3 py-1 text-xs text-gray-600">Cancelar</button>
                      <button type="button" on:click={() => updateTaskStatus(t.id)} disabled={loading} class="px-3 py-1 bg-[#3359A4] text-white rounded-lg font-bold text-xs">Guardar Avance</button>
                    </div>
                  </div>
                {:else}
                  <button type="button" on:click={() => startUpdate(t)} class="px-3 py-1 bg-blue-50 text-[#3359A4] rounded-lg font-bold text-xs hover:bg-blue-100">
                    Reportar Avance
                  </button>
                {/if}
              {/if}
            </td>
          </tr>
        {/each}
        {#if tareas.length === 0}
          <tr>
            <td colspan="6" class="px-4 py-6 text-center text-xs text-gray-400 italic">No hay actividades registradas en el plan de acción.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Form para agregar actividad al plan -->
  {#if isGestorOrResponsable}
    <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
        + Registrar Nueva Actividad al Plan
      </h4>
      <form on:submit|preventDefault={addTask} class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-gray-600 mb-1">Nombre de la Actividad *</label>
          <input type="text" bind:value={newActividad} required placeholder="Ej: Actualizar el procedimiento de radicación e instruir al personal" class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Responsable</label>
          <select bind:value={newResponsableId} class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg bg-white">
            {#each usuarios as u}
              <option value={u.id}>{u.nombre}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Fecha Límite *</label>
          <input type="date" bind:value={newFechaLimite} required class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg" />
        </div>
        <div class="md:col-span-4">
          <label class="block text-xs font-bold text-gray-600 mb-1">Detalle / Recursos Necesarios (Opcional)</label>
          <input type="text" bind:value={newDetalle} placeholder="Especificar recursos o requerimientos..." class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg" />
        </div>
        <div class="md:col-span-4 flex justify-end">
          <button type="submit" disabled={loading} class="py-2 px-6 bg-[#3359A4] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors">
            {loading ? 'Guardando...' : 'Agregar Actividad al Plan'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if allTasksCompleted && isGestorOrResponsable && tareas.length > 0}
    <div class="mt-6 flex justify-end pt-4 border-t border-gray-100">
      <button type="button" on:click={advanceStage} disabled={loading} class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow hover:bg-purple-700 transition-all">
        <span>Avanzar a Evaluación de Eficacia (Etapa 5)</span>
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  {/if}
</div>
