<script lang="ts">
  export let userId: string;
  export let userNombre: string;

  let sgc_marcador = false;
  let mesa_marcador = false;
  let capacitacion_recibida = false;
  let comentarios = '';

  let valoracion_sgc = 0;
  let valoracion_mesa = 0;
  let hoverSgc = 0;
  let hoverMesa = 0;

  let cargando = false;
  let errorMsg = '';

  const ratingLabels: Record<number, string> = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: 'Excelente'
  };

  $: isValid = valoracion_sgc > 0 && valoracion_mesa > 0;

  async function handleSubmit() {
    if (!isValid || cargando) return;
    cargando = true;
    errorMsg = '';

    try {
      const res = await fetch('/api/mesa-ayuda/usuarios/completar-induccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sgc_marcador,
          mesa_marcador,
          capacitacion_recibida,
          comentarios,
          valoracion_sgc,
          valoracion_mesa
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al guardar la inducción');
      }

      // Recargar la página para que MesaAyudaLayout vuelva a validar y quite el modal
      window.location.reload();
    } catch (e: any) {
      errorMsg = e.message || 'Error de conexión';
      cargando = false;
    }
  }
</script>

<div class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-5 text-white flex items-center gap-3 shrink-0">
      <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <i class="fas fa-handshake text-brand-gold text-lg"></i>
      </div>
      <div>
        <h2 class="text-lg font-bold leading-tight" style="font-family: 'Montserrat', sans-serif;">
          Confirmación de Instalación e Inducción
        </h2>
        <p class="text-xs text-blue-200 mt-0.5">SGC y Mesa de Ayuda · Concejo de Chía</p>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
      <p class="text-sm text-gray-600 leading-relaxed">
        Hola, <strong class="text-gray-900">{userNombre}</strong>. Antes de comenzar a utilizar los sistemas, por favor confirma junto al encargado del despliegue que se han completado los siguientes pasos en tu equipo de cómputo:
      </p>

      {#if errorMsg}
        <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
          <i class="fas fa-exclamation-circle shrink-0"></i>
          <span>{errorMsg}</span>
        </div>
      {/if}

      <!-- Checklist -->
      <div class="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <label class="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            bind:checked={sgc_marcador}
            class="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span class="text-xs text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
            Se configuró el acceso directo o marcador de la <strong>Plataforma del SGC</strong> en mi navegador de preferencia.
          </span>
        </label>

        <label class="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            bind:checked={mesa_marcador}
            class="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span class="text-xs text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
            Se configuró e inició sesión correctamente en el sistema de la <strong>Mesa de Ayuda</strong>.
          </span>
        </label>

        <label class="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            bind:checked={capacitacion_recibida}
            class="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span class="text-xs text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
            Recibí inducción básica sobre el uso de la Plataforma SGC (búsqueda de documentos) y Mesa de Ayuda (creación y consulta de tickets).
          </span>
        </label>
      </div>

      <!-- Criterios de Evaluación -->
      <div class="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
        <h3 class="text-[10px] font-bold text-blue-900 uppercase tracking-widest leading-none mb-1" style="font-family: 'Montserrat', sans-serif;">
          Criterios de Evaluación *
        </h3>
        <p class="text-[11px] text-gray-500 leading-relaxed mb-2">
          Por favor califique el acceso y funcionamiento de cada plataforma:
        </p>

        <!-- SGC Star Rating -->
        <div class="space-y-1">
          <p class="text-xs text-gray-700 font-medium">
            ¿Cómo califica la <strong>Plataforma SGC</strong>?
          </p>
          <div class="flex items-center gap-1">
            <div class="flex gap-1">
              {#each [1, 2, 3, 4, 5] as star}
                <button
                  type="button"
                  on:click={() => valoracion_sgc = star}
                  on:mouseenter={() => hoverSgc = star}
                  on:mouseleave={() => hoverSgc = 0}
                  class="focus:outline-none transition-all duration-150 transform hover:scale-125 cursor-pointer text-xl"
                  title={ratingLabels[star]}
                >
                  <i class={`fa-star ${star <= (hoverSgc || valoracion_sgc) ? 'fas text-amber-400' : 'far text-gray-300'}`}></i>
                </button>
              {/each}
            </div>
            {#if valoracion_sgc > 0}
              <span class="text-[10px] font-bold text-blue-800 ml-2 bg-blue-100 px-2 py-0.5 rounded-md animate-fade-in uppercase tracking-wider">
                {ratingLabels[valoracion_sgc]}
              </span>
            {/if}
          </div>
        </div>

        <!-- Mesa de Ayuda Star Rating -->
        <div class="space-y-1 mt-2">
          <p class="text-xs text-gray-700 font-medium">
            ¿Cómo califica la <strong>Mesa de Ayuda</strong>?
          </p>
          <div class="flex items-center gap-1">
            <div class="flex gap-1">
              {#each [1, 2, 3, 4, 5] as star}
                <button
                  type="button"
                  on:click={() => valoracion_mesa = star}
                  on:mouseenter={() => hoverMesa = star}
                  on:mouseleave={() => hoverMesa = 0}
                  class="focus:outline-none transition-all duration-150 transform hover:scale-125 cursor-pointer text-xl"
                  title={ratingLabels[star]}
                >
                  <i class={`fa-star ${star <= (hoverMesa || valoracion_mesa) ? 'fas text-amber-400' : 'far text-gray-300'}`}></i>
                </button>
              {/each}
            </div>
            {#if valoracion_mesa > 0}
              <span class="text-[10px] font-bold text-blue-800 ml-2 bg-blue-100 px-2 py-0.5 rounded-md animate-fade-in uppercase tracking-wider">
                {ratingLabels[valoracion_mesa]}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Comentarios -->
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          Observaciones o comentarios adicionales (opcional)
        </label>
        <textarea
          bind:value={comentarios}
          rows="3"
          placeholder="Ej: Instalación completada con éxito. / Quedó pendiente configurar atajo en escritorio."
          class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400 bg-white"
        ></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider {isValid ? 'text-green-600' : 'text-gray-400'}">
        <i class="fas {isValid ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>{isValid ? 'Listo para enviar' : 'Faltan confirmaciones'}</span>
      </div>

      <button
        on:click={handleSubmit}
        disabled={!isValid || cargando}
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
        style="background-color: var(--color-brand-gold, #FFD402);"
      >
        {#if cargando}
          <i class="fas fa-spinner animate-spin"></i> Guardando...
        {:else}
          <i class="fas fa-check"></i> Firmar Visto Bueno
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-scale-up {
    animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
  }
</style>
