<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let rol: string = 'solicitante';
  export let agentes: { id: string; nombre: string }[] = [];
  export let solicitantes: { id: string; nombre: string }[] = [];

  const dispatch = createEventDispatcher();

  const today = new Date().toISOString().slice(0, 10);
  const mesAnterior = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  let desde = mesAnterior;
  let hasta = today;
  let estados: string[] = [];
  let categorias: string[] = [];
  let prioridades: string[] = [];
  let agente_id = 'todos';
  let solicitante_id = 'todos';
  let scope = 'todos';
  let incluir_internos = false;
  let incluir_trazabilidad = true;

  let cargando = false;
  let error = '';
  let nombrePlantilla = '';
  let guardandoPlantilla = false;
  let plantillas: { id: string; nombre: string; filtros: Record<string, unknown> }[] = [];
  let mostrarGuardar = false;

  const puedeVerTodos = ['admin', 'auditor', 'agente'].includes(rol);
  const puedeVerInternos = ['admin', 'auditor', 'agente'].includes(rol);

  function toggleArr(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  async function cargarPlantillas() {
    const res = await fetch('/api/mesa-ayuda/plantillas-export');
    if (res.ok) plantillas = await res.json();
  }

  async function guardarPlantilla() {
    if (guardandoPlantilla) return;
    if (!nombrePlantilla.trim()) return;
    guardandoPlantilla = true;
    const filtros = getFiltros();
    const res = await fetch('/api/mesa-ayuda/plantillas-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombrePlantilla.trim(), filtros }),
    });
    guardandoPlantilla = false;
    if (res.ok) {
      const nueva = await res.json();
      plantillas = [nueva, ...plantillas];
      nombrePlantilla = '';
      mostrarGuardar = false;
    }
  }

  async function borrarPlantilla(id: string) {
    await fetch(`/api/mesa-ayuda/plantillas-export/${id}`, { method: 'DELETE' });
    plantillas = plantillas.filter(p => p.id !== id);
  }

  function cargarDesde(plantilla: { filtros: Record<string, unknown> }) {
    const f = plantilla.filtros;
    desde = (f.desde as string) ?? mesAnterior;
    hasta = (f.hasta as string) ?? today;
    estados = (f.estados as string[]) ?? [];
    categorias = (f.categorias as string[]) ?? [];
    prioridades = (f.prioridades as string[]) ?? [];
    agente_id = (f.agente_id as string) ?? 'todos';
    solicitante_id = (f.solicitante_id as string) ?? 'todos';
    scope = (f.scope as string) ?? 'todos';
    incluir_internos = (f.incluir_internos as boolean) ?? false;
    incluir_trazabilidad = (f.incluir_trazabilidad as boolean) ?? true;
  }

  function getFiltros() {
    return { desde, hasta, estados, categorias, prioridades, agente_id, solicitante_id, scope, incluir_internos, incluir_trazabilidad };
  }

  async function exportar() {
    if (cargando) return;
    cargando = true;
    error = '';
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      if (estados.length) params.set('estados', estados.join(','));
      if (categorias.length) params.set('categorias', categorias.join(','));
      if (prioridades.length) params.set('prioridades', prioridades.join(','));
      if (agente_id !== 'todos') params.set('agente_id', agente_id);
      if (solicitante_id !== 'todos') params.set('solicitante_id', solicitante_id);
      params.set('scope', scope);
      params.set('incluir_internos', String(incluir_internos));
      params.set('incluir_trazabilidad', String(incluir_trazabilidad));

      const res = await fetch(`/api/mesa-ayuda/tickets/exportar-excel?${params}`);
      if (!res.ok) {
        const d = await res.json();
        error = d.error ?? 'Error al generar el Excel';
        return;
      }

      const blob = await res.blob();
      const fecha = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${fecha}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch('exportado');
    } finally {
      cargando = false;
    }
  }

  onMount(() => {
    cargarPlantillas();
  });
</script>

<div class="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style="background: linear-gradient(135deg, #1e3a8a 0%, #3359A4 100%);">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
        <i class="fas fa-file-excel text-white text-sm"></i>
      </div>
      <div>
        <p class="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">Exportar</p>
        <p class="text-sm font-bold text-white leading-tight" style="font-family:'Montserrat',sans-serif;">Reporte Excel</p>
      </div>
    </div>
  </div>

  <div class="p-6 space-y-5">

    <!-- Plantillas guardadas -->
    {#if plantillas.length > 0}
      <div>
        <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Plantillas guardadas</p>
        <div class="flex flex-wrap gap-2">
          {#each plantillas as p (p.id)}
            <div class="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
              <button on:click={() => cargarDesde(p)} class="text-xs font-semibold text-blue-700 hover:text-blue-900">
                {p.nombre}
              </button>
              <button on:click={() => borrarPlantilla(p.id)} class="text-blue-300 hover:text-red-500 transition-colors ml-1">
                <i class="fas fa-times text-[9px]"></i>
              </button>
            </div>
          {/each}
        </div>
      </div>
      <hr class="border-gray-100" />
    {/if}

    <!-- Fechas -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Desde</label>
        <input type="date" bind:value={desde} class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Hasta</label>
        <input type="date" bind:value={hasta} class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
      </div>
    </div>

    <!-- Estado -->
    <div>
      <p class="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Estado</p>
      <div class="flex flex-wrap gap-2">
        {#each ['abierto', 'en_progreso', 'resuelto', 'cerrado'] as e}
          <button
            on:click={() => estados = toggleArr(estados, e)}
            class={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all capitalize ${estados.includes(e) ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
          >
            {e.replace('_', ' ')}
          </button>
        {/each}
      </div>
      <p class="text-[10px] text-gray-400 mt-1">Sin selección = todos los estados</p>
    </div>

    <!-- Categoría y Prioridad -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Categoría</p>
        <div class="flex flex-col gap-1">
          {#each ['hardware', 'software', 'redes', 'otro'] as c}
            <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={categorias.includes(c)} on:change={() => categorias = toggleArr(categorias, c)} class="rounded" />
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </label>
          {/each}
        </div>
      </div>
      <div>
        <p class="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Prioridad</p>
        <div class="flex flex-col gap-1">
          {#each ['alta', 'media', 'baja'] as p}
            <label class="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={prioridades.includes(p)} on:change={() => prioridades = toggleArr(prioridades, p)} class="rounded" />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </label>
          {/each}
        </div>
      </div>
    </div>

    <!-- Alcance y agentes (solo si no es solicitante) -->
    {#if puedeVerTodos}
      <div class="grid grid-cols-2 gap-3">
        {#if rol === 'agente'}
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Alcance</label>
            <select bind:value={scope} class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="todos">Todos los tickets</option>
              <option value="mios">Solo mis tickets</option>
            </select>
          </div>
        {/if}
        {#if agentes.length > 0 && (rol === 'auditor' || rol === 'admin')}
          <div>
            <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Agente</label>
            <select bind:value={agente_id} class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="todos">Todos</option>
              {#each agentes as a}<option value={a.id}>{a.nombre}</option>{/each}
            </select>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Switches -->
    <div class="space-y-2">
      <label class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl cursor-pointer">
        <span class="text-xs font-semibold text-gray-700">Incluir hoja de trazabilidad</span>
        <input type="checkbox" bind:checked={incluir_trazabilidad} class="rounded" />
      </label>
      {#if puedeVerInternos}
        <label class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl cursor-pointer">
          <span class="text-xs font-semibold text-gray-700">Incluir notas internas</span>
          <input type="checkbox" bind:checked={incluir_internos} class="rounded" />
        </label>
      {/if}
    </div>

    <!-- Error -->
    {#if error}
      <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
        <i class="fas fa-exclamation-circle"></i> {error}
      </div>
    {/if}

    <!-- Acciones -->
    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
      <div>
        {#if !mostrarGuardar}
          <button on:click={() => mostrarGuardar = true} class="text-xs text-blue-600 hover:text-blue-800 font-semibold">
            <i class="fas fa-bookmark text-[10px] mr-1"></i> Guardar como plantilla
          </button>
        {:else}
          <div class="flex items-center gap-2">
            <input
              bind:value={nombrePlantilla}
              placeholder="Nombre de la plantilla"
              class="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
            />
            <button
              on:click={guardarPlantilla}
              disabled={guardandoPlantilla || !nombrePlantilla.trim()}
              class="px-3 py-1 rounded-lg text-xs font-bold text-gray-900 disabled:opacity-50"
              style="background:#FFD402;"
            >
              {guardandoPlantilla ? 'Guardando...' : 'Guardar'}
            </button>
            <button on:click={() => { mostrarGuardar = false; nombrePlantilla = ''; }} class="text-xs text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        {/if}
      </div>

      <button
        on:click={exportar}
        disabled={cargando}
        class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-gray-900 transition-opacity hover:opacity-80 disabled:opacity-50"
        style="background-color:#FFD402;"
      >
        {#if cargando}
          <i class="fas fa-spinner fa-spin text-xs"></i> Generando...
        {:else}
          <i class="fas fa-file-excel text-xs"></i> Generar Excel
        {/if}
      </button>
    </div>
  </div>
</div>
