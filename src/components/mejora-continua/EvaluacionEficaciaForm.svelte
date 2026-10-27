<script lang="ts">
  export let hallazgoId: string;
  export let evaluaciones: any[] = [];
  export let isGestor: boolean = false;
  export let intentosReformulacion: number = 0;
  export let maxReformulaciones: number = 3;

  let esEficaz: boolean | null = null;
  let justificacion = '';
  let loading = false;
  let error = '';

  $: finalizada = evaluaciones.some(e => e.es_eficaz === true);

  async function submitEvaluacion() {
    if (esEficaz === null) {
      error = 'Debe seleccionar si la acción fue eficaz o no.';
      return;
    }
    if (!justificacion.trim()) {
      error = 'Debe proporcionar una justificación técnica de la evaluación.';
      return;
    }

    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/evaluacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          es_eficaz: esEficaz,
          justificacion: justificacion
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la evaluación');
      
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
  <div class="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
    <div class="flex items-start gap-3">
      <div class="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center text-lg shrink-0 mt-0.5">
        <i class="fas fa-[#3359A4] fa-stamp"></i>
      </div>
      <div>
        <h4 class="text-sm font-bold text-purple-900 font-['Montserrat'] mb-1">
          Guía Didáctica: Etapa 5 — Evaluación de Eficacia (Cierre)
        </h4>
        <p class="text-xs text-purple-900 leading-relaxed">
          <strong>Reservado para el Gestor de Mejora / Auditor de Calidad.</strong> Una vez ejecutado el plan al 100%, se evalúa si el problema realmente desapareció. Si fue eficaz, el hallazgo se cierra. Si no, se devuelve a la Etapa 3 (Análisis de Causas) para una reformulación.
        </p>
      </div>
    </div>
  </div>

  <h3 class="text-lg font-bold text-gray-900 font-['Montserrat'] mb-4">Etapa 5: Evaluación de Eficacia</h3>

  <!-- Historial de evaluaciones previa -->
  {#if evaluaciones.length > 0}
    <div class="mb-6 space-y-3">
      <h4 class="text-xs font-bold text-gray-600 uppercase tracking-wider">Historial de Evaluaciones Registradas</h4>
      {#each evaluaciones as ev, i}
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-gray-800">Evaluación #{i + 1}</span>
            <span class="px-2.5 py-1 text-[10px] font-bold rounded-full {ev.es_eficaz ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
              {ev.es_eficaz ? '✅ EFICAZ' : '❌ NO EFICAZ'}
            </span>
          </div>
          <p class="text-xs text-gray-700 mb-1">{ev.justificacion}</p>
          <p class="text-[10px] text-gray-400">
            Evaluado el {new Date(ev.fecha_evaluacion || ev.created_at).toLocaleString()}
          </p>
        </div>
      {/each}
    </div>
  {/if}

  {#if !finalizada && isGestor}
    <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
      <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
        Formulario de Calificación de Eficacia
      </h4>

      {#if error}
        <div class="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 text-xs font-bold text-red-700">
          <i class="fas fa-exclamation-circle"></i> {error}
        </div>
      {/if}

      <form on:submit|preventDefault={submitEvaluacion} class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-gray-800 mb-2">
            ¿La implementación del Plan de Acción eliminó definitivamente la causa raíz? *
          </label>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input type="radio" bind:group={esEficaz} value={true} class="text-green-600 focus:ring-green-500 h-4 w-4" />
              <span>Sí, fue EFICAZ (Cerrar Hallazgo)</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input type="radio" bind:group={esEficaz} value={false} class="text-red-600 focus:ring-red-500 h-4 w-4" />
              <span>No fue EFICAZ (Reformular Plan)</span>
            </label>
          </div>
        </div>

        {#if esEficaz === false}
          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>⚠️ Consecuencia de no eficacia:</strong> El hallazgo retrocederá a la <strong>Etapa 3 (Análisis de Causas)</strong> para reformular la causa raíz y el plan.
            <div class="mt-1 font-bold">Intentos consumidos: {intentosReformulacion} de {maxReformulaciones}</div>
            {#if intentosReformulacion >= maxReformulaciones}
              <div class="text-red-700 font-bold mt-1">🔴 Límite alcanzado. Se cerrará definitivamente como NO EFICAZ y enviará alerta crítica.</div>
            {/if}
          </div>
        {/if}

        <div>
          <label for="justificacion" class="block text-xs font-bold text-gray-700 mb-1">
            Justificación / Observaciones de la Evaluación *
          </label>
          <textarea 
            id="justificacion" 
            bind:value={justificacion} 
            rows="3" 
            required 
            class="w-full text-xs p-3 border border-gray-300 rounded-xl" 
            placeholder="Describa el resultado de las verificaciones de seguimiento, evidencias auditadas, etc."
          ></textarea>
        </div>

        <div class="flex justify-end">
          <button type="submit" disabled={loading} class="px-6 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-xl shadow hover:bg-purple-800 transition-colors">
            {loading ? 'Guardando...' : 'Registrar Evaluación y Finalizar'}
          </button>
        </div>
      </form>
    </div>
  {:else if finalizada}
    <div class="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-xs font-bold flex items-center gap-2">
      <i class="fas fa-check-circle text-lg text-green-600"></i>
      <span>Este hallazgo ha sido evaluado como EFICAZ y se encuentra CERRADO SATISFACTORIAMENTE.</span>
    </div>
  {:else}
    <div class="p-4 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 text-xs italic text-center">
      Esperando calificación de eficacia por parte del Gestor de Calidad / Administrador.
    </div>
  {/if}

</div>
