<script lang="ts">
  export let tickets: any[]  = [];
  export let isAgent: boolean = false;

  let filtroEstado    = 'todos';
  let filtroPrioridad = 'todas';
  let filtroCategoria = 'todas';
  let busqueda        = '';

  $: filtrados = tickets.filter(t => {
    if (filtroEstado    !== 'todos'  && t.estado    !== filtroEstado)    return false;
    if (filtroPrioridad !== 'todas'  && t.prioridad !== filtroPrioridad) return false;
    if (filtroCategoria !== 'todas'  && t.categoria !== filtroCategoria) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      if (!t.titulo.toLowerCase().includes(q) && !t.codigo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const estadoMap: Record<string, string> = {
    abierto: 'bg-blue-100 text-blue-800', en_progreso: 'bg-yellow-100 text-yellow-800',
    resuelto: 'bg-green-100 text-green-800', cerrado: 'bg-gray-100 text-gray-500',
  };
  const prioridadMap: Record<string, string> = {
    alta: 'text-red-600', media: 'text-orange-500', baja: 'text-gray-400',
  };
  const prioridadIcon: Record<string, string> = {
    alta: 'fa-arrow-up', media: 'fa-minus', baja: 'fa-arrow-down',
  };

  function slaInfo(t: any) {
    if (t.estado === 'resuelto' || t.estado === 'cerrado') return { cls: 'bg-gray-200', pct: 100, label: '—' };
    const total   = new Date(t.fecha_limite).getTime() - new Date(t.fecha_creacion).getTime();
    const elapsed = Date.now() - new Date(t.fecha_creacion).getTime();
    const pct     = Math.min(Math.round((elapsed / total) * 100), 100);
    const vencido = Date.now() > new Date(t.fecha_limite).getTime();
    if (vencido)  return { cls: 'bg-red-600',    pct: 100, label: 'Vencido' };
    if (pct >= 80) return { cls: 'bg-red-400',   pct, label: `${pct}%` };
    if (pct >= 50) return { cls: 'bg-yellow-400', pct, label: `${pct}%` };
    return { cls: 'bg-green-400', pct, label: `${pct}%` };
  }

  function detailUrl(id: string) {
    return isAgent ? `/mesa-ayuda/agente/ticket/${id}` : `/mesa-ayuda/ticket/${id}`;
  }
</script>

<!-- Filtros -->
<div class="flex flex-wrap gap-3 mb-6">
  <div class="relative flex-1 min-w-[180px]">
    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
    <input
      type="text"
      bind:value={busqueda}
      placeholder="Buscar por código o título..."
      class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    />
  </div>
  <select bind:value={filtroEstado} class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
    <option value="todos">Todos los estados</option>
    <option value="abierto">Abierto</option>
    <option value="en_progreso">En Progreso</option>
    <option value="resuelto">Resuelto</option>
    <option value="cerrado">Cerrado</option>
  </select>
  <select bind:value={filtroPrioridad} class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
    <option value="todas">Toda prioridad</option>
    <option value="alta">Alta</option>
    <option value="media">Media</option>
    <option value="baja">Baja</option>
  </select>
  <select bind:value={filtroCategoria} class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
    <option value="todas">Toda categoría</option>
    <option value="hardware">Hardware</option>
    <option value="software">Software</option>
    <option value="redes">Redes</option>
    <option value="otro">Otro</option>
  </select>
</div>

<!-- Contador -->
<p class="text-xs text-gray-400 mb-3">
  {filtrados.length} ticket{filtrados.length !== 1 ? 's' : ''}
  {filtrados.length !== tickets.length ? ` (filtrado de ${tickets.length})` : ''}
</p>

<!-- Lista -->
{#if filtrados.length === 0}
  <div class="flex flex-col items-center justify-center py-16 text-gray-300">
    <i class="fas fa-inbox text-4xl mb-3"></i>
    <p class="text-sm font-medium text-gray-400">Sin tickets que mostrar</p>
  </div>
{:else}
  <div class="flex flex-col gap-3">
    {#each filtrados as t (t.id)}
      {@const sla = slaInfo(t)}
      <a
        href={detailUrl(t.id)}
        class="block bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all group"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono font-bold text-gray-400">{t.codigo}</span>
              <span class={`text-xs px-2 py-0.5 rounded-full font-semibold ${estadoMap[t.estado] ?? ''}`}>
                {t.estado.replace('_', ' ')}
              </span>
              <span class={`text-xs font-semibold ${prioridadMap[t.prioridad] ?? ''}`}>
                <i class={`fas ${prioridadIcon[t.prioridad] ?? 'fa-minus'} text-[10px] mr-0.5`}></i>
                {t.prioridad}
              </span>
              <span class="text-xs text-gray-400 capitalize">{t.categoria}</span>
            </div>
            <h3 class="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
              {t.titulo}
            </h3>
            <p class="text-xs text-gray-400 mt-1">
              {new Date(t.fecha_creacion).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </div>

          <div class="flex flex-col items-end gap-2 shrink-0 w-32">
            <div class="w-full">
              <div class="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>SLA</span><span>{sla.label}</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class={`h-full rounded-full ${sla.cls}`} style={`width:${sla.pct}%`}></div>
              </div>
            </div>
            <i class="fas fa-chevron-right text-gray-300 group-hover:text-blue-500 text-xs transition-colors"></i>
          </div>
        </div>
      </a>
    {/each}
  </div>
{/if}
