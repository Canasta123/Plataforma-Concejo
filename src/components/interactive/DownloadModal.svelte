<script lang="ts">
  import categorias from '../../data/categorias-documentos.json';
  import { isDownloadOpen } from '../../store/modals';

  type FileItem = { name?: string; nombre?: string; extension?: string; isDirectory?: boolean; folder?: string; path?: string; ruta?: string; rutaDescarga?: string; tamano?: string };

  const EXT_ICON: Record<string, string> = {
    '.pdf': 'fas fa-file-pdf text-red-500', '.xls': 'fas fa-file-excel text-green-500',
    '.xlsx': 'fas fa-file-excel text-green-500', '.doc': 'fas fa-file-word text-blue-500',
    '.docx': 'fas fa-file-word text-blue-500', '.ppt': 'fas fa-file-powerpoint text-orange-500',
    '.pptx': 'fas fa-file-powerpoint text-orange-500',
  };
  function getIcon(ext?: string) { return EXT_ICON[ext ?? ''] ?? 'fas fa-file-alt text-gray-400'; }
  function getName(f: FileItem) { return f.name ?? f.nombre ?? ''; }
  function isDir(f: FileItem) { return !!f.isDirectory; }

  let view: 'categories' | 'files' = 'categories';
  let items: FileItem[] = [];
  let navHistory: { items: FileItem[]; folder: string }[] = [];
  let currentFolder = '';
  let loading = false;
  let docSearch = '';
  let docSearchTimer: ReturnType<typeof setTimeout>;

  async function openCategory(carpeta: string) {
    view = 'files';
    navHistory = [];
    currentFolder = carpeta;
    loading = true;
    items = [];
    try {
      const res = await fetch(`/api/listar-categoria/${encodeURIComponent(carpeta)}`);
      items = await res.json();
    } catch { items = []; }
    loading = false;
  }

  async function openSubfolder(item: FileItem) {
    const folderPath = item.path ?? item.ruta ?? (currentFolder + '/' + getName(item));
    navHistory = [...navHistory, { items, folder: currentFolder }];
    currentFolder = folderPath;
    loading = true;
    items = [];
    try {
      const res = await fetch(`/api/listar-categoria/${encodeURIComponent(folderPath)}`);
      items = await res.json();
    } catch { items = []; }
    loading = false;
  }

  function back() {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      navHistory = navHistory.slice(0, -1);
      items = prev.items;
      currentFolder = prev.folder;
    } else {
      view = 'categories';
      items = [];
      navHistory = [];
      docSearch = '';
    }
  }

  function onDocSearch() {
    clearTimeout(docSearchTimer);
    docSearchTimer = setTimeout(async () => {
      const q = docSearch.trim();
      if (!q) { view = 'categories'; return; }
      view = 'files';
      navHistory = [];
      loading = true;
      items = [];
      try {
        const res = await fetch(`/api/buscar-archivos?q=${encodeURIComponent(q)}`);
        items = await res.json();
      } catch { items = []; }
      loading = false;
    }, 400);
  }

  function fileHref(f: FileItem) {
    if (f.rutaDescarga) return f.rutaDescarga;
    const name = encodeURIComponent(getName(f));
    const folder = encodeURIComponent(f.folder ?? currentFolder ?? '');
    return `/archivos/${folder}/${name}`;
  }

  function close() { $isDownloadOpen = false; view = 'categories'; docSearch = ''; items = []; navHistory = []; }
</script>

{#if $isDownloadOpen}
  <div
    class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
    on:click|self={close}
    role="dialog"
    aria-modal="true"
    aria-label="Modal de descarga de archivos"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center">
            <i class="fas fa-download text-white"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Descargar Documentos</h2>
            <p class="text-sm text-gray-500 mt-0.5">Busca y descarga archivos del sistema</p>
          </div>
        </div>
        <button on:click={close} class="w-9 h-9 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Search -->
      <div class="px-6 pt-4 shrink-0">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            bind:value={docSearch}
            on:input={onDocSearch}
            class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar archivos por nombre..."
          />
        </div>
      </div>

      <!-- Nav bar -->
      {#if view === 'files'}
        <div class="px-6 pt-3 shrink-0">
          <button on:click={back} class="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <i class="fas fa-arrow-left text-xs"></i>
            {navHistory.length === 0 ? 'Volver a categorías' : 'Volver'}
          </button>
        </div>
      {/if}

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 pt-4">
        {#if view === 'categories'}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {#each categorias as cat}
              <button
                on:click={() => openCategory(cat.carpeta)}
                class="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all group text-center"
              >
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <i class="{cat.icono} {cat.color} text-lg"></i>
                </div>
                <span class="text-xs font-semibold text-gray-700 group-hover:text-blue-800 transition-colors leading-tight">{cat.carpeta}</span>
              </button>
            {/each}
          </div>
        {:else}
          {#if loading}
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
              <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-3"></i>
              <p class="text-sm">Cargando...</p>
            </div>
          {:else if items.length === 0}
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
              <i class="fas fa-folder-open text-4xl mb-3 text-gray-300"></i>
              <p class="text-sm">No se encontraron archivos.</p>
            </div>
          {:else}
            {@const folders = items.filter(i => isDir(i))}
            {@const files = items.filter(i => !isDir(i))}
            {#if folders.length > 0}
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {#each folders as folder}
                  <button on:click={() => openSubfolder(folder)}
                    class="flex flex-col items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 hover:border-amber-400 hover:shadow-md transition-all group text-center">
                    <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <i class="fas fa-folder text-amber-500"></i>
                    </div>
                    <span class="text-xs font-semibold text-gray-700 truncate w-full">{getName(folder)}</span>
                  </button>
                {/each}
              </div>
            {/if}
            {#if files.length > 0}
              <div class="flex flex-col gap-2">
                {#each files as file}
                  {@const ext = file.extension ?? ''}
                  <div class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all">
                    <div class="w-8 h-8 flex items-center justify-center shrink-0">
                      <i class="{getIcon(ext)} text-xl"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-gray-800 truncate text-sm" title={getName(file)}>{getName(file)}</p>
                      <p class="text-xs text-blue-600 mt-0.5 truncate">
                        <i class="fas fa-folder-open mr-1"></i>
                        <span class="font-semibold">{file.folder ?? currentFolder}</span>
                      </p>
                    </div>
                    <a href={fileHref(file)} target="_blank" download
                      class="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1">
                      <i class="fas fa-download"></i> Descargar
                    </a>
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
