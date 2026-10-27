<script lang="ts">
  export let hallazgoId: string;
  export let tratamientos: any[] = [];
  export let isGestorOrResponsable: boolean = false;
  export let currentUserId: string = '';
  export let usuarios: any[] = [];

  let newDescripcion = '';
  let newResponsableId = currentUserId;
  let newFechaCompromiso = '';
  let loading = false;
  let error = '';

  let evidenciaText = '';
  let selectedTratamientoId = '';

  $: allCompleted = tratamientos.length > 0 && tratamientos.every(t => t.completada);

  async function addTratamiento() {
    if (!newDescripcion || !newResponsableId || !newFechaCompromiso) {
      error = 'Todos los campos son obligatorios';
      return;
    }
    
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/tratamientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: newDescripcion,
          responsable_id: newResponsableId,
          fecha_compromiso: newFechaCompromiso
        })
      });
      if (!res.ok) throw new Error('Error al guardar la medida de contención');
      const data = await res.json();
      tratamientos = [...tratamientos, data];
      newDescripcion = '';
      newFechaCompromiso = '';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function completeTratamiento(id: string) {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/tratamientos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tratamiento_id: id, completada: true, evidencia_texto: evidenciaText })
      });
      if (!res.ok) throw new Error('Error al completar la medida');
      tratamientos = tratamientos.map(t => t.id === id ? { ...t, completada: true, evidencia_texto: evidenciaText } : t);
      selectedTratamientoId = '';
      evidenciaText = '';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function advanceStage() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa_actual: 3 })
      });
      if (!res.ok) throw new Error('Error al avanzar a Etapa 3');
      window.location.reload();
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 font-['Lato']">
  
  <!-- Tarjeta Didáctica Guía -->
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
    <div class="flex items-start gap-3">
      <div class="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center text-lg shrink-0 mt-0.5">
        <i class="fas fa-shield-alt"></i>
      </div>
      <div>
        <h4 class="text-sm font-bold text-amber-900 font-['Montserrat'] mb-1">
          Guía Didáctica: Etapa 2 — Tratamiento Inmediato (Contención)
        </h4>
        <p class="text-xs text-amber-900 leading-relaxed">
          Son las <strong>acciones inmediatas y de emergencia</strong> para mitigar el impacto del problema de forma rápida mientras se investiga la causa raíz. La persona asignada debe registrar las tareas de contención y marcarlas como completadas.
        </p>
      </div>
    </div>
  </div>

  <h3 class="text-lg font-bold text-gray-900 font-['Montserrat'] mb-4">Etapa 2: Medidas de Contención Inmediata</h3>

  {#if error}
    <div class="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 flex items-center gap-2 text-red-700 text-sm font-medium">
      <i class="fas fa-exclamation-circle"></i> {error}
    </div>
  {/if}

  <!-- Tabla de Tratamientos -->
  <div class="overflow-x-auto border border-gray-200 rounded-xl mb-6">
    <table class="w-full text-left text-sm">
      <thead class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
        <tr>
          <th class="px-4 py-3">Descripción de la Medida</th>
          <th class="px-4 py-3">Responsable</th>
          <th class="px-4 py-3">Fecha Compromiso</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each tratamientos as t}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{t.descripcion}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">
              {usuarios.find(u => u.id === t.responsable_id)?.nombre || 'Asignado'}
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{new Date(t.fecha_compromiso).toLocaleDateString()}</td>
            <td class="px-4 py-3">
              <span class="px-2.5 py-1 text-[10px] font-bold rounded-full {t.completada ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                {t.completada ? '✅ Completada' : '⏳ Pendiente'}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              {#if !t.completada && (t.responsable_id === currentUserId || isGestorOrResponsable)}
                {#if selectedTratamientoId === t.id}
                  <div class="flex flex-col gap-2 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-left">
                    <label class="text-xs font-bold text-gray-700">Evidencia / Notas de cumplimiento:</label>
                    <textarea bind:value={evidenciaText} class="text-xs p-2 border border-gray-300 rounded-lg w-full" placeholder="Escribe observaciones o evidencia..."></textarea>
                    <div class="flex justify-end gap-2">
                      <button type="button" on:click={() => selectedTratamientoId = ''} class="px-3 py-1 text-xs text-gray-600">Cancelar</button>
                      <button type="button" on:click={() => completeTratamiento(t.id)} disabled={loading} class="px-3 py-1 bg-green-600 text-white rounded-lg font-bold text-xs">Guardar Evidencia</button>
                    </div>
                  </div>
                {:else}
                  <button type="button" on:click={() => selectedTratamientoId = t.id} class="px-3 py-1 bg-blue-50 text-[#3359A4] rounded-lg font-bold text-xs hover:bg-blue-100">
                    Completar
                  </button>
                {/if}
              {/if}
            </td>
          </tr>
        {/each}
        {#if tratamientos.length === 0}
          <tr>
            <td colspan="5" class="px-4 py-6 text-center text-xs text-gray-400 italic">No se han registrado medidas de contención inmediata.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Form para agregar tratamiento -->
  {#if isGestorOrResponsable}
    <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
        + Registrar Nueva Medida de Contención
      </h4>
      <form on:submit|preventDefault={addTratamiento} class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-3">
          <label class="block text-xs font-bold text-gray-600 mb-1">Descripción de la Medida Inmediata *</label>
          <input type="text" bind:value={newDescripcion} required placeholder="Ej: Suspender temporalmente la emisión de certificados hasta corregir el formato" class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Responsable de Ejecución</label>
          <select bind:value={newResponsableId} class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg bg-white">
            {#each usuarios as u}
              <option value={u.id}>{u.nombre}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Fecha Compromiso *</label>
          <input type="date" bind:value={newFechaCompromiso} required class="w-full text-xs py-2 px-3 border border-gray-300 rounded-lg" />
        </div>
        <div class="flex items-end">
          <button type="submit" disabled={loading} class="w-full py-2 bg-[#3359A4] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors">
            {loading ? 'Guardando...' : 'Agregar Medida'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if allCompleted && isGestorOrResponsable}
    <div class="mt-6 flex justify-end pt-4 border-t border-gray-100">
      <button type="button" on:click={advanceStage} disabled={loading} class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow hover:bg-green-700 transition-all">
        <span>Avanzar al Análisis de Causas (Etapa 3)</span>
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  {/if}
</div>
