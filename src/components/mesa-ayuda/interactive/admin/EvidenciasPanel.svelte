<script lang="ts">
  interface Evidencia {
    id: string;
    fecha: string;
    ip: string;
    usuario: string;
    carpeta_destino: string;
    nombre_archivo: string;
  }

  export let evidenciasIniciales: Evidencia[] = [];

  let filterUsuario = '';
  let filterCarpeta = '';
  let filterFecha = '';

  const CARPETAS = [
    'Riesgos y oportunidades',
    'Planes de Mejoramiento',
    'Indicadores',
    'Revisión por la Dirección',
    'Modelo Integrado de Planeación y Gestión 2025',
    'Seguimiento Planes Institucionales',
    'SG-SST',
    'Empalme',
  ];

  $: evidenciasFiltradas = evidenciasIniciales.filter(ev => {
    const matchesUsuario = ev.usuario.toLowerCase().includes(filterUsuario.toLowerCase());
    const matchesCarpeta = filterCarpeta === '' || ev.carpeta_destino === filterCarpeta;
    
    let matchesFecha = true;
    if (filterFecha) {
      const evDate = new Date(ev.fecha).toISOString().split('T')[0];
      matchesFecha = evDate === filterFecha;
    }

    return matchesUsuario && matchesCarpeta && matchesFecha;
  });

  function getFolderBadgeColor(folder: string): string {
    switch (folder) {
      case 'Riesgos y oportunidades': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Planes de Mejoramiento': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Indicadores': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Revisión por la Dirección': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Modelo Integrado de Planeación y Gestión 2025': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Seguimiento Planes Institucionales': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'SG-SST': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Empalme': return 'bg-teal-50 text-teal-700 border-teal-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  }

  function getCleanFileName(fullName: string): string {
    // Remove the timestamp prefix from name (timestamp-filename)
    return fullName.replace(/^\d+-/, '');
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  function cleanFilters() {
    filterUsuario = '';
    filterCarpeta = '';
    filterFecha = '';
  }
</script>

<div class="space-y-6">
  <!-- Filtros -->
  <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
    
    <!-- Filtro de responsable -->
    <div class="flex-1 w-full">
      <label for="filtro-usuario" class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Responsable de Carga</label>
      <div class="relative">
        <i class="fas fa-search absolute left-3.5 top-3.5 text-gray-400 text-xs"></i>
        <input
          id="filtro-usuario"
          type="text"
          bind:value={filterUsuario}
          placeholder="Buscar por funcionario..."
          class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
        />
      </div>
    </div>

    <!-- Filtro de carpeta -->
    <div class="flex-1 w-full">
      <label for="filtro-carpeta" class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Carpeta / Categoría</label>
      <select
        id="filtro-carpeta"
        bind:value={filterCarpeta}
        class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white text-gray-700"
      >
        <option value="">Todas las carpetas</option>
        {#each CARPETAS as f}
          <option value={f}>{f}</option>
        {/each}
      </select>
    </div>

    <!-- Filtro de fecha -->
    <div class="w-full md:w-48">
      <label for="filtro-fecha" class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha de Carga</label>
      <input
        id="filtro-fecha"
        type="date"
        bind:value={filterFecha}
        class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-gray-700"
      />
    </div>

    <!-- Botón Limpiar -->
    {#if filterUsuario || filterCarpeta || filterFecha}
      <button
        on:click={cleanFilters}
        class="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center"
      >
        <i class="fas fa-filter-circle-xmark"></i> Limpiar
      </button>
    {/if}

  </div>

  <!-- Tabla de Resultados -->
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <th class="px-6 py-4">Fecha de Carga</th>
            <th class="px-6 py-4">Carpeta Destino</th>
            <th class="px-6 py-4">Responsable</th>
            <th class="px-6 py-4">Archivo</th>
            <th class="px-6 py-4">IP Origen</th>
            <th class="px-6 py-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
          {#if evidenciasFiltradas.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-400 font-medium leading-relaxed">
                <div class="flex flex-col items-center justify-center gap-2.5">
                  <i class="fas fa-folder-open text-3xl text-gray-300"></i>
                  <span>No se encontraron registros de evidencias cargadas.</span>
                </div>
              </td>
            </tr>
          {:else}
            {#each evidenciasFiltradas as ev (ev.id)}
              <tr class="hover:bg-slate-50/50 transition-colors">
                <!-- Fecha -->
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatDate(ev.fecha)}
                </td>
                
                <!-- Carpeta -->
                <td class="px-6 py-4 max-w-[200px]">
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border truncate {getFolderBadgeColor(ev.carpeta_destino)}" title={ev.carpeta_destino}>
                    {ev.carpeta_destino}
                  </span>
                </td>

                <!-- Responsable -->
                <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-800">
                  {ev.usuario}
                </td>

                <!-- Archivo -->
                <td class="px-6 py-4 max-w-[240px]">
                  <span class="block truncate font-mono text-[11px] text-gray-500" title={getCleanFileName(ev.nombre_archivo)}>
                    {getCleanFileName(ev.nombre_archivo)}
                  </span>
                </td>

                <!-- IP -->
                <td class="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-gray-400">
                  {ev.ip}
                </td>

                <!-- Descargar -->
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <a
                    href="/archivos/{encodeURIComponent(ev.carpeta_destino)}/{encodeURIComponent(ev.nombre_archivo)}"
                    download
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-blue hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                    title="Descargar Evidencia"
                  >
                    <i class="fas fa-download"></i>
                  </a>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Footer de estadísticas -->
    {#if evidenciasFiltradas.length > 0}
      <div class="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 flex justify-between items-center">
        <span>MOSTRANDO {evidenciasFiltradas.length} DE {evidenciasIniciales.length} EVIDENCIAS REGISTRADAS</span>
      </div>
    {/if}
  </div>
</div>
