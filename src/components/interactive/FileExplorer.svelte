<script lang="ts">
  import { onDestroy } from 'svelte';

  export let rutaBase: string;

  type Carpeta = { nombre: string; ruta: string };
  type Archivo = { nombre: string; extension: string; tamano: string; rutaDescarga: string };
  type Data = { ruta: string; carpetas: Carpeta[]; archivos: Archivo[] };

  let data: Data | null = null;
  let loading = true;
  let error = false;
  let currentRuta = rutaBase;
  let breadcrumbStack: string[] = [];

  const EXT_ICON: Record<string, string> = {
    '.pdf':  'fas fa-file-pdf text-red-600',
    '.xls':  'fas fa-file-excel text-green-600',
    '.xlsx': 'fas fa-file-excel text-green-600',
    '.doc':  'fas fa-file-word text-blue-600',
    '.docx': 'fas fa-file-word text-blue-600',
    '.ppt':  'fas fa-file-powerpoint text-orange-500',
    '.pptx': 'fas fa-file-powerpoint text-orange-500',
  };

  const EXT_BG: Record<string, string> = {
    '.pdf':  'bg-red-50 border-red-200',
    '.xls':  'bg-green-50 border-green-200',
    '.xlsx': 'bg-green-50 border-green-200',
    '.doc':  'bg-blue-50 border-blue-200',
    '.docx': 'bg-blue-50 border-blue-200',
    '.ppt':  'bg-orange-50 border-orange-200',
    '.pptx': 'bg-orange-50 border-orange-200',
  };

  function getIcon(ext: string) { return EXT_ICON[ext] ?? 'fas fa-file-alt text-gray-400'; }
  function getBg(ext: string) { return EXT_BG[ext] ?? 'bg-gray-50 border-gray-200'; }

  async function cargar(ruta: string) {
    loading = true;
    error = false;
    try {
      const res = await fetch(`/api/explorar?ruta=${encodeURIComponent(ruta)}`);
      if (!res.ok) throw new Error();
      data = await res.json();
      currentRuta = ruta;
    } catch {
      error = true;
    } finally {
      loading = false;
    }
  }

  function navegar(ruta: string) {
    breadcrumbStack = [...breadcrumbStack, currentRuta];
    cargar(ruta);
  }

  function volver() {
    if (breadcrumbStack.length === 0) return;
    const prev = breadcrumbStack[breadcrumbStack.length - 1];
    breadcrumbStack = breadcrumbStack.slice(0, -1);
    cargar(prev);
  }

  cargar(rutaBase);

  const extraBreadcrumb = () => {
    const baseParts = rutaBase.split('/').filter(Boolean);
    const currParts = currentRuta.split('/').filter(Boolean);
    return currParts.slice(baseParts.length);
  };
</script>

<div class="flex flex-col gap-1 h-full">
  {#if loading}
    <div class="flex flex-col items-center justify-center py-4 text-gray-400">
      <i class="fas fa-spinner fa-spin text-base text-blue-400 mb-1"></i>
      <p class="text-xs">Cargando...</p>
    </div>
  {:else if error}
    <div class="flex flex-col items-center justify-center py-4 text-red-400">
      <i class="fas fa-exclamation-triangle text-lg mb-1"></i>
      <p class="text-xs font-medium">Error de conexión</p>
    </div>
  {:else if data}
    {#if currentRuta !== rutaBase}
      <nav class="flex items-center flex-wrap gap-1 mb-2 text-xs border-b border-gray-100 pb-1">
        <button
          on:click={() => { breadcrumbStack = []; cargar(rutaBase); }}
          class="font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        >
          <i class="fas fa-home mr-1"></i>Inicio
        </button>
        {#each extraBreadcrumb() as parte, i}
          <i class="fas fa-chevron-right text-gray-300 text-[9px]"></i>
          {#if i < extraBreadcrumb().length - 1}
            <button
              on:click={() => {
                const tgt = rutaBase + '/' + extraBreadcrumb().slice(0, i + 1).join('/');
                breadcrumbStack = [...breadcrumbStack, currentRuta];
                cargar(tgt);
              }}
              class="text-blue-600 hover:text-blue-900 font-medium transition-colors truncate max-w-[80px]"
            >{parte}</button>
          {:else}
            <span class="text-gray-500 font-medium truncate max-w-[100px]">{parte}</span>
          {/if}
        {/each}
      </nav>
    {/if}

    {#if data.carpetas.length === 0 && data.archivos.length === 0}
      <div class="flex flex-col items-center justify-center py-4 text-gray-400">
        <i class="fas fa-folder-open text-2xl mb-1 text-gray-300"></i>
        <p class="text-xs font-medium">Carpeta vacía</p>
      </div>
    {:else}
      {#each data.carpetas as carpeta}
        <button
          on:click={() => navegar(carpeta.ruta)}
          class="group flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm transition-all text-left w-full min-w-0"
        >
          <div class="w-5 h-5 rounded bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
            <i class="fas fa-folder text-amber-500 text-xs"></i>
          </div>
          <span class="text-xs font-semibold text-gray-700 truncate min-w-0 flex-1" title={carpeta.nombre}>
            {carpeta.nombre}
          </span>
          <i class="fas fa-chevron-right text-amber-300 text-xs shrink-0"></i>
        </button>
      {/each}

      {#each data.archivos as archivo}
        <div class="flex items-center gap-2 p-2 rounded-lg border {getBg(archivo.extension)} hover:shadow-sm transition-all min-w-0">
          <div class="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0 shadow-sm">
            <i class="{getIcon(archivo.extension)} text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-gray-700 truncate leading-tight" title={archivo.nombre}>
              {archivo.nombre}
            </p>
            <p class="text-[10px] text-gray-400 leading-none mt-0.5">{archivo.tamano}</p>
          </div>
          <a
            href={archivo.rutaDescarga}
            target="_blank"
            download
            class="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
            title="Descargar {archivo.nombre}"
          >
            <i class="fas fa-download text-xs"></i>
          </a>
        </div>
      {/each}
    {/if}
  {/if}
</div>
