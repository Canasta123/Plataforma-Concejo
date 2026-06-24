<script lang="ts">
  import { onMount } from 'svelte';

  interface Evidencia {
    id: string;
    fecha: string;
    ip: string;
    usuario: string;
    carpeta_destino: string;
    nombre_archivo: string;
    carpeta_id?: string | null;
  }

  interface Folder {
    id: string;
    nombre: string;
    icono: string;
    color: string;
    activa: boolean;
    created_at?: string;
  }

  export let evidenciasIniciales: Evidencia[] = [];

  let evidencias: Evidencia[] = [...evidenciasIniciales];
  let folders: Folder[] = [];
  let loadingFolders = true;
  
  let selectedFolderId: string | 'all' = 'all';
  let showArchivedFolders = false;

  // Filtros de búsqueda
  let filterUsuario = '';
  let filterFecha = '';

  // Modales
  let modalFolderOpen = false;
  let folderForm = { id: '', nombre: '', icono: 'fas fa-folder', color: 'text-blue-600 bg-blue-50 border-blue-100' };
  let editingFolder: Folder | null = null;
  let errorMsg = '';
  let successMsg = '';
  let actionLoading = false;

  // Catálogo de iconos y colores para el creador de carpetas
  const ICON_CATALOG = [
    { value: 'fas fa-folder', label: 'Carpeta General' },
    { value: 'fas fa-shield-halved', label: 'Escudo / Riesgos' },
    { value: 'fas fa-chart-line', label: 'Gráfico Líneas / Planes' },
    { value: 'fas fa-chart-bar', label: 'Gráfico Barras / Indicadores' },
    { value: 'fas fa-users-cog', label: 'Usuarios / Dirección' },
    { value: 'fas fa-sitemap', label: 'Sitemap / Procesos' },
    { value: 'fas fa-list-check', label: 'Lista / Seguimiento' },
    { value: 'fas fa-heart-pulse', label: 'Corazón / SG-SST' },
    { value: 'fas fa-handshake', label: 'Apretón Manos / Empalme' },
    { value: 'fas fa-file-invoice', label: 'Factura / Finanzas' },
  ];

  const COLOR_CATALOG = [
    { value: 'text-blue-600 bg-blue-50 border-blue-100', label: 'Azul' },
    { value: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Verde' },
    { value: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Amarillo' },
    { value: 'text-purple-600 bg-purple-50 border-purple-100', label: 'Morado' },
    { value: 'text-indigo-600 bg-indigo-50 border-indigo-100', label: 'Índigo' },
    { value: 'text-cyan-600 bg-cyan-50 border-cyan-100', label: 'Cian' },
    { value: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Rosa' },
    { value: 'text-teal-600 bg-teal-50 border-teal-100', label: 'Menta' },
    { value: 'text-orange-600 bg-orange-50 border-orange-100', label: 'Naranja' },
  ];

  onMount(async () => {
    await loadFolders();
  });

  async function loadFolders() {
    loadingFolders = true;
    try {
      const res = await fetch('/api/mesa-ayuda/evidencias/carpetas');
      if (res.ok) {
        folders = await res.json();
      }
    } catch (e) {
      console.error('Error cargando carpetas:', e);
    } finally {
      loadingFolders = false;
    }
  }

  // Filtrar carpetas según si se muestran activas o archivadas
  $: carpetasVisibles = folders.filter(f => showArchivedFolders ? !f.activa : f.activa);

  // Obtener la carpeta actualmente seleccionada
  $: activeFolder = folders.find(f => f.id === selectedFolderId);

  // Filtrar evidencias según la carpeta seleccionada y los filtros de búsqueda
  $: evidenciasFiltradas = evidencias.filter(ev => {
    // Si hay una carpeta seleccionada, filtrar por carpeta_id o por carpeta_destino (retrocompatibilidad)
    if (selectedFolderId !== 'all' && activeFolder) {
      const matchesCarpeta = ev.carpeta_id === activeFolder.id || ev.carpeta_destino === activeFolder.nombre;
      if (!matchesCarpeta) return false;
    }

    const matchesUsuario = ev.usuario.toLowerCase().includes(filterUsuario.toLowerCase());
    
    let matchesFecha = true;
    if (filterFecha) {
      const evDate = new Date(ev.fecha).toISOString().split('T')[0];
      matchesFecha = evDate === filterFecha;
    }

    return matchesUsuario && matchesFecha;
  });

  // Estadísticas globales
  $: totalArchivos = evidencias.length;
  $: totalCarpetas = folders.length;
  $: ultimasSubidas = evidencias.slice(0, 5);

  function getCleanFileName(fullName: string): string {
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

  function showMessage(type: 'error' | 'success', msg: string) {
    if (type === 'error') {
      errorMsg = msg;
      setTimeout(() => errorMsg = '', 4000);
    } else {
      successMsg = msg;
      setTimeout(() => successMsg = '', 4000);
    }
  }

  // Crear/Editar carpeta modal
  function openCreateFolder() {
    editingFolder = null;
    folderForm = { id: '', nombre: '', icono: 'fas fa-folder', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    errorMsg = '';
    modalFolderOpen = true;
  }

  function openEditFolder(folder: Folder) {
    editingFolder = folder;
    folderForm = { id: folder.id, nombre: folder.nombre, icono: folder.icono, color: folder.color };
    errorMsg = '';
    modalFolderOpen = true;
  }

  async function saveFolder() {
    if (actionLoading) return;
    if (!folderForm.nombre.trim()) {
      showMessage('error', 'El nombre de la carpeta es requerido');
      return;
    }

    actionLoading = true;
    errorMsg = '';

    try {
      if (editingFolder) {
        // Editar
        const res = await fetch(`/api/mesa-ayuda/evidencias/carpetas/${editingFolder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(folderForm)
        });
        
        const data = await res.json();
        if (res.ok) {
          // Si cambió el nombre, actualizamos la trazabilidad localmente para mantener los archivos en la vista
          if (editingFolder.nombre !== folderForm.nombre.trim()) {
            evidencias = evidencias.map(ev => {
              if (ev.carpeta_id === editingFolder!.id || ev.carpeta_destino === editingFolder!.nombre) {
                return { ...ev, carpeta_destino: folderForm.nombre.trim() };
              }
              return ev;
            });
          }

          folders = folders.map(f => f.id === editingFolder!.id ? data : f);
          showMessage('success', 'Carpeta actualizada con éxito');
          modalFolderOpen = false;
        } else {
          showMessage('error', data.error || 'Error al actualizar carpeta');
        }
      } else {
        // Crear
        const res = await fetch('/api/mesa-ayuda/evidencias/carpetas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(folderForm)
        });

        const data = await res.json();
        if (res.ok) {
          folders = [...folders, data];
          showMessage('success', 'Carpeta creada con éxito');
          modalFolderOpen = false;
        } else {
          showMessage('error', data.error || 'Error al crear carpeta');
        }
      }
    } catch (e) {
      showMessage('error', 'Error de red al procesar carpeta');
    } finally {
      actionLoading = false;
    }
  }

  async function archiveFolder(folder: Folder) {
    if (!confirm(`¿Estás seguro de archivar la carpeta "${folder.nombre}"? Ya no aparecerá en el Buzón Digital de cargas, pero los archivos físicos y registros se conservarán.`)) return;

    try {
      const res = await fetch(`/api/mesa-ayuda/evidencias/carpetas/${folder.id}`, { method: 'DELETE' });
      if (res.ok) {
        folders = folders.map(f => f.id === folder.id ? { ...f, activa: false } : f);
        showMessage('success', `Carpeta "${folder.nombre}" archivada correctamente.`);
        if (selectedFolderId === folder.id) {
          selectedFolderId = 'all';
        }
      } else {
        const d = await res.json();
        showMessage('error', d.error || 'Error al archivar carpeta');
      }
    } catch (e) {
      showMessage('error', 'Error al archivar la carpeta');
    }
  }

  async function restoreFolder(folder: Folder) {
    try {
      const res = await fetch(`/api/mesa-ayuda/evidencias/carpetas/${folder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: true })
      });
      if (res.ok) {
        const data = await res.json();
        folders = folders.map(f => f.id === folder.id ? data : f);
        showMessage('success', `Carpeta "${folder.nombre}" reactivada.`);
      } else {
        const d = await res.json();
        showMessage('error', d.error || 'Error al restaurar carpeta');
      }
    } catch (e) {
      showMessage('error', 'Error al restaurar la carpeta');
    }
  }

  async function deleteFile(evidencia: Evidencia) {
    if (!confirm(`¿Estás seguro de eliminar el archivo "${getCleanFileName(evidencia.nombre_archivo)}"? Esta acción lo borrará físicamente del servidor/NAS de forma permanente.`)) return;

    try {
      const res = await fetch(`/api/mesa-ayuda/evidencias/archivos/${evidencia.id}`, { method: 'DELETE' });
      if (res.ok) {
        evidencias = evidencias.filter(ev => ev.id !== evidencia.id);
        showMessage('success', 'Archivo eliminado de forma permanente.');
      } else {
        const d = await res.json();
        showMessage('error', d.error || 'Error al eliminar archivo');
      }
    } catch (e) {
      showMessage('error', 'Error de red al eliminar el archivo');
    }
  }

  function cleanFilters() {
    filterUsuario = '';
    filterFecha = '';
  }
</script>

<!-- Mensajes emergentes flotantes -->
{#if successMsg}
  <div class="fixed bottom-4 right-4 z-50 p-4 bg-green-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold transition-all">
    <i class="fas fa-check-circle text-sm"></i>
    <span>{successMsg}</span>
  </div>
{/if}
{#if errorMsg && !modalFolderOpen}
  <div class="fixed bottom-4 right-4 z-50 p-4 bg-red-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold transition-all">
    <i class="fas fa-exclamation-circle text-sm"></i>
    <span>{errorMsg}</span>
  </div>
{/if}

<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
  
  <!-- Sidebar izquierdo: Gestión de Carpetas -->
  <div class="w-full md:w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col p-5 shrink-0">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Carpetas SGC</h3>
      <button 
        on:click={openCreateFolder} 
        class="text-[11px] font-bold text-white bg-brand-blue hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
      >
        <i class="fas fa-plus text-[9px]"></i> Nueva
      </button>
    </div>

    <!-- Toggle Carpetas Archivadas -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
      <span class="text-[11px] font-semibold text-gray-500">Mostrar archivadas</span>
      <button 
        on:click={() => showArchivedFolders = !showArchivedFolders} 
        class="focus:outline-none transition-colors text-lg {showArchivedFolders ? 'text-blue-600' : 'text-gray-300'}"
      >
        <i class="fas {showArchivedFolders ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
      </button>
    </div>

    <!-- Lista de carpetas -->
    <div class="space-y-1 overflow-y-auto pr-1 flex-1 max-h-[450px]">
      <button
        on:click={() => selectedFolderId = 'all'}
        class="w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold
          {selectedFolderId === 'all' 
            ? 'border-brand-blue bg-blue-50/40 text-brand-blue shadow-sm' 
            : 'border-transparent bg-transparent hover:bg-gray-100 text-gray-700'
          }"
      >
        <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border bg-slate-100 border-slate-200 text-slate-600">
          <i class="fas fa-folder-tree text-xs"></i>
        </div>
        <span class="truncate flex-1">Todas las evidencias</span>
        <span class="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">{totalArchivos}</span>
      </button>

      {#if loadingFolders}
        <div class="flex items-center justify-center p-6 text-gray-400 text-xs">
          <i class="fas fa-spinner fa-spin mr-2"></i> Cargando...
        </div>
      {:else if carpetasVisibles.length === 0}
        <div class="p-4 text-center text-xs text-gray-400 italic">
          No hay carpetas {showArchivedFolders ? 'archivadas' : 'activas'}.
        </div>
      {:else}
        {#each carpetasVisibles as f (f.id)}
          {@const numArchivos = evidencias.filter(ev => ev.carpeta_id === f.id || ev.carpeta_destino === f.nombre).length}
          <div 
            class="group w-full p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-semibold
              {selectedFolderId === f.id 
                ? 'border-brand-blue bg-blue-50/40 text-brand-blue shadow-sm font-bold' 
                : 'border-transparent bg-transparent hover:bg-gray-100 text-gray-700'
              }"
          >
            <button on:click={() => selectedFolderId = f.id} class="flex items-center gap-2.5 text-left flex-1 min-w-0">
              <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border {selectedFolderId === f.id ? 'bg-brand-blue text-white border-brand-blue' : f.color}">
                <i class="{f.icono} text-xs"></i>
              </div>
              <span class="truncate leading-snug flex-1 text-gray-800 font-bold" title={f.nombre}>{f.nombre}</span>
              <span class="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono">{numArchivos}</span>
            </button>

            <!-- Acciones de la carpeta (hover) -->
            <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button 
                on:click={() => openEditFolder(f)} 
                title="Editar carpeta" 
                class="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              >
                <i class="fas fa-edit text-[10px]"></i>
              </button>
              
              {#if f.activa}
                <button 
                  on:click={() => archiveFolder(f)} 
                  title="Archivar carpeta" 
                  class="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                >
                  <i class="fas fa-archive text-[10px]"></i>
                </button>
              {:else}
                <button 
                  on:click={() => restoreFolder(f)} 
                  title="Restaurar carpeta" 
                  class="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50"
                >
                  <i class="fas fa-trash-restore text-[10px]"></i>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Panel principal de Contenido -->
  <div class="flex-1 p-6 flex flex-col min-w-0">
    
    <!-- Renderizado condicional: Dashboard General o Vista de Carpeta -->
    {#if selectedFolderId === 'all'}
      <!-- Vista Dashboard General -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center text-lg shadow-sm">
            <i class="fas fa-file-invoice"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Total Archivos</p>
            <p class="text-xl font-extrabold text-blue-900 leading-none mt-1">{totalArchivos}</p>
          </div>
        </div>

        <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-lg shadow-sm">
            <i class="fas fa-folder-open"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Carpetas</p>
            <p class="text-xl font-extrabold text-emerald-900 leading-none mt-1">{totalCarpetas}</p>
          </div>
        </div>

        <div class="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center text-lg shadow-sm">
            <i class="fas fa-chart-line"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Últimos 30 días</p>
            <p class="text-xl font-extrabold text-purple-900 leading-none mt-1">
              {evidencias.filter(e => {
                const diffTime = Math.abs(Date.now() - new Date(e.fecha).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
              }).length}
            </p>
          </div>
        </div>
      </div>

      <!-- Últimas subidas en carrusel/lista -->
      <div class="border border-gray-150 rounded-xl p-4 mb-6 bg-slate-50/50">
        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Subidas Recientes</h4>
        <div class="space-y-2">
          {#each ultimasSubidas as ev}
            <div class="flex items-center justify-between text-xs bg-white border border-gray-100 p-2.5 rounded-lg shadow-2xs">
              <div class="flex items-center gap-3 min-w-0">
                <i class="fas fa-cloud-arrow-up text-brand-blue text-sm"></i>
                <div class="min-w-0">
                  <p class="font-bold text-gray-800 truncate" title={getCleanFileName(ev.nombre_archivo)}>
                    {getCleanFileName(ev.nombre_archivo)}
                  </p>
                  <p class="text-[10px] text-gray-400">
                    Cargado por <span class="font-semibold text-gray-600">{ev.usuario}</span> en <span class="italic">{ev.carpeta_destino}</span>
                  </p>
                </div>
              </div>
              <span class="text-[10px] text-gray-400 italic shrink-0 whitespace-nowrap">{formatDate(ev.fecha)}</span>
            </div>
          {/each}
          {#if ultimasSubidas.length === 0}
            <p class="text-xs italic text-gray-400 text-center py-2">No hay subidas registradas.</p>
          {/if}
        </div>
      </div>
    {:else if activeFolder}
      <!-- Vista de carpeta específica -->
      <div class="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg border {activeFolder.color}">
            <i class="{activeFolder.icono}"></i>
          </div>
          <div>
            <h2 class="text-base font-bold text-gray-850">{activeFolder.nombre}</h2>
            <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
              Estado: <span class={activeFolder.activa ? 'text-green-600' : 'text-amber-500'}>{activeFolder.activa ? 'Activa' : 'Archivada'}</span>
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            on:click={() => openEditFolder(activeFolder!)} 
            class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-all"
          >
            <i class="fas fa-edit"></i> Renombrar
          </button>
          
          {#if activeFolder.activa}
            <button 
              on:click={() => archiveFolder(activeFolder!)} 
              class="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/20 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-1 transition-all"
            >
              <i class="fas fa-archive"></i> Archivar
            </button>
          {:else}
            <button 
              on:click={() => restoreFolder(activeFolder!)} 
              class="px-3 py-1.5 rounded-lg border border-green-200 bg-green-50/20 text-xs font-bold text-green-700 hover:bg-green-50 flex items-center gap-1 transition-all"
            >
              <i class="fas fa-trash-restore"></i> Reactivar
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Filtros de búsqueda (compartidos) -->
    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3 items-end mb-4">
      <div class="flex-1 w-full">
        <label for="filtro-usuario" class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Responsable de Carga</label>
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-3 text-gray-400 text-xs"></i>
          <input
            id="filtro-usuario"
            type="text"
            bind:value={filterUsuario}
            placeholder="Buscar por funcionario..."
            class="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
          />
        </div>
      </div>

      <div class="w-full sm:w-44">
        <label for="filtro-fecha" class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha de Carga</label>
        <input
          id="filtro-fecha"
          type="date"
          bind:value={filterFecha}
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-gray-700 bg-white"
        />
      </div>

      {#if filterUsuario || filterFecha}
        <button
          on:click={cleanFilters}
          class="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-1 shrink-0 w-full sm:w-auto justify-center"
        >
          <i class="fas fa-filter-circle-xmark"></i> Limpiar
        </button>
      {/if}
    </div>

    <!-- Listado de archivos -->
    <div class="border border-gray-200 rounded-xl overflow-hidden flex-1 bg-white">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th class="px-5 py-3">Fecha de Carga</th>
              {#if selectedFolderId === 'all'}
                <th class="px-5 py-3">Carpeta Destino</th>
              {/if}
              <th class="px-5 py-3">Responsable</th>
              <th class="px-5 py-3">Archivo</th>
              <th class="px-5 py-3">IP Origen</th>
              <th class="px-5 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
            {#if evidenciasFiltradas.length === 0}
              <tr>
                <td colspan={selectedFolderId === 'all' ? 6 : 5} class="px-5 py-12 text-center text-gray-400 font-medium leading-relaxed">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <i class="fas fa-folder-open text-2xl text-gray-300"></i>
                    <span>No se encontraron evidencias depositadas en esta vista.</span>
                  </div>
                </td>
              </tr>
            {:else}
              {#each evidenciasFiltradas as ev (ev.id)}
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-5 py-3 whitespace-nowrap text-gray-400">
                    {formatDate(ev.fecha)}
                  </td>
                  
                  {#if selectedFolderId === 'all'}
                    <td class="px-5 py-3 max-w-[160px]">
                      <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-650 border border-slate-200 truncate max-w-full" title={ev.carpeta_destino}>
                        {ev.carpeta_destino}
                      </span>
                    </td>
                  {/if}

                  <td class="px-5 py-3 whitespace-nowrap font-bold text-gray-800">
                    {ev.usuario}
                  </td>

                  <td class="px-5 py-3 max-w-[200px]">
                    <span class="block truncate font-mono text-[11px] text-gray-500" title={getCleanFileName(ev.nombre_archivo)}>
                      {getCleanFileName(ev.nombre_archivo)}
                    </span>
                  </td>

                  <td class="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-gray-400">
                    {ev.ip}
                  </td>

                  <td class="px-5 py-3 text-right whitespace-nowrap">
                    <div class="inline-flex items-center gap-1">
                      <a
                        href={`/archivos/${encodeURIComponent(ev.carpeta_destino)}/${encodeURIComponent(ev.nombre_archivo)}`}
                        download
                        title="Descargar archivo"
                        class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-brand-blue hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                      >
                        <i class="fas fa-download text-[11px]"></i>
                      </a>
                      <button
                        on:click={() => deleteFile(ev)}
                        title="Eliminar archivo permanentemente"
                        class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 transition-all"
                      >
                        <i class="fas fa-trash-alt text-[11px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

  </div>
</div>

<!-- Modal: Crear/Editar Carpeta -->
{#if modalFolderOpen}
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
      
      <!-- Encabezado -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
          <i class="fas {editingFolder ? 'fa-edit text-brand-blue' : 'fa-folder-plus text-emerald-600'}"></i>
          <span>{editingFolder ? 'Editar Carpeta SGC' : 'Crear Nueva Carpeta SGC'}</span>
        </h3>
        <button on:click={() => modalFolderOpen = false} class="w-6 h-6 text-gray-450 hover:text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <!-- Errores internos del modal -->
      {#if errorMsg}
        <div class="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg flex items-center gap-2">
          <i class="fas fa-exclamation-circle text-xs"></i>
          <span>{errorMsg}</span>
        </div>
      {/if}

      <!-- Formulario -->
      <div class="space-y-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="folder-name-input">
            Nombre de la Carpeta <span class="text-red-500">*</span>
          </label>
          <input
            id="folder-name-input"
            type="text"
            bind:value={folderForm.nombre}
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold bg-gray-50/50"
            placeholder="Ej. Plan de Mejoramiento 2026"
            required
          />
        </div>

        <!-- Selección de icono -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="folder-icon-select">
            Icono Ilustrativo
          </label>
          <div class="grid grid-cols-5 gap-2 max-h-[110px] overflow-y-auto border border-slate-100 p-2 rounded-lg">
            {#each ICON_CATALOG as ic}
              <button
                type="button"
                on:click={() => folderForm.icono = ic.value}
                class="h-9 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all
                  {folderForm.icono === ic.value ? 'border-brand-blue bg-blue-50/30 font-bold scale-105 shadow-2xs' : 'border-slate-100 bg-white'}"
                title={ic.label}
              >
                <i class="{ic.value} text-sm"></i>
              </button>
            {/each}
          </div>
        </div>

        <!-- Selección de Color -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="folder-color-select">
            Color / Estilo
          </label>
          <div class="grid grid-cols-3 gap-2">
            {#each COLOR_CATALOG as cc}
              <button
                type="button"
                on:click={() => folderForm.color = cc.value}
                class="px-2.5 py-1.5 border rounded-lg text-[10px] font-bold truncate flex items-center justify-center gap-1.5 transition-all
                  {folderForm.color === cc.value ? 'border-brand-blue ring-1 ring-brand-blue/50 font-bold scale-102 shadow-2xs' : 'border-slate-100 bg-white'}"
              >
                <div class="w-3.5 h-3.5 rounded-full border border-slate-200/50 flex items-center justify-center {cc.value}">
                  <i class="{folderForm.icono} text-[8px]"></i>
                </div>
                <span>{cc.label}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Pie de página -->
      <div class="pt-3 border-t border-slate-100 flex justify-end gap-2.5 mt-2">
        <button
          type="button"
          on:click={() => modalFolderOpen = false}
          class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          on:click={saveFolder}
          disabled={actionLoading}
          class="px-5 py-2.5 text-xs font-bold text-white rounded-lg bg-brand-blue hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {#if actionLoading}
            <i class="fas fa-spinner fa-spin"></i>
            <span>Guardando...</span>
          {:else}
            <i class="fas fa-check"></i>
            <span>{editingFolder ? 'Guardar Cambios' : 'Crear Carpeta'}</span>
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}

<style>
  /* Personalización de scrollbar */
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  .scale-102 {
    transform: scale(1.02);
  }
</style>
