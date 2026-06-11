<script lang="ts">
  import { NAVIGATION } from '../../lib/navigation';
  import { isSearchOpen } from '../../store/modals';

  // ── Types ────────────────────────────────────────────────────────────────
  type PageResult = { ruta: string; titulo: string; seccion: string; snippet?: string };
  type DocResult  = { nombre: string; ruta: string; carpeta: string };

  // ── State ────────────────────────────────────────────────────────────────
  let query        = '';
  let activeTab: 'paginas' | 'documentos' = 'paginas';

  // Páginas tab
  let pageResults: PageResult[] = [];
  let pageLoading  = false;

  // Documentos tab
  let docResults: DocResult[]   = [];
  let docLoading   = false;

  let timer: ReturnType<typeof setTimeout>;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function highlight(text: string, term: string) {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  }

  // ── Search logic ─────────────────────────────────────────────────────────
  function search() {
    clearTimeout(timer);
    if (!query.trim()) {
      pageResults = [];
      docResults  = [];
      return;
    }

    timer = setTimeout(async () => {
      const q = query.toLowerCase().trim();

      // --- Páginas (synchronous) ---
      pageLoading = true;
      const found: PageResult[] = [];
      for (const page of NAVIGATION) {
        if (
          page.titulo.toLowerCase().includes(q) ||
          page.seccion.toLowerCase().includes(q) ||
          page.ruta.toLowerCase().includes(q)
        ) {
          found.push({
            ...page,
            snippet: highlight(`${page.seccion} › ${page.titulo}`, query),
          });
        }
      }
      pageResults = found;
      pageLoading = false;

      // --- Documentos (async fetch) ---
      docLoading = true;
      try {
        const res  = await fetch(`/api/buscar-documentos?q=${encodeURIComponent(q)}`);
        docResults = res.ok ? await res.json() : [];
      } catch {
        docResults = [];
      }
      docLoading = false;
    }, 300);
  }

  function close() {
    $isSearchOpen = false;
    query        = '';
    pageResults  = [];
    docResults   = [];
    activeTab    = 'paginas';
  }

  function navigate(ruta: string) {
    close();
    window.location.href = ruta;
  }

  function getFileIcon(ext: string) {
    const e = (ext || '').toLowerCase();
    if (e === '.pdf') {
      return { icon: 'fas fa-file-pdf', bg: 'bg-red-50', text: 'text-red-500', hoverBg: 'group-hover:bg-red-100', hoverLi: 'hover:bg-red-50/50' };
    }
    if (['.doc', '.docx'].includes(e)) {
      return { icon: 'fas fa-file-word', bg: 'bg-blue-50', text: 'text-blue-500', hoverBg: 'group-hover:bg-blue-100', hoverLi: 'hover:bg-blue-50/50' };
    }
    if (['.xls', '.xlsx'].includes(e)) {
      return { icon: 'fas fa-file-excel', bg: 'bg-green-50', text: 'text-green-600', hoverBg: 'group-hover:bg-green-100', hoverLi: 'hover:bg-green-50/50' };
    }
    if (['.ppt', '.pptx'].includes(e)) {
      return { icon: 'fas fa-file-powerpoint', bg: 'bg-orange-50', text: 'text-orange-500', hoverBg: 'group-hover:bg-orange-100', hoverLi: 'hover:bg-orange-50/50' };
    }
    return { icon: 'fas fa-file-alt', bg: 'bg-gray-50', text: 'text-gray-500', hoverBg: 'group-hover:bg-gray-100', hoverLi: 'hover:bg-gray-50/50' };
  }
</script>

{#if $isSearchOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-16 p-4"
    on:click|self={close}
    role="dialog"
    aria-modal="true"
    aria-label="Buscar en el sistema"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

      <!-- ── Header ── -->
      <div class="flex justify-between items-center p-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
            <i class="fas fa-search text-white"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800">Buscar en el Sistema</h2>
            <p class="text-xs text-gray-500">Encuentra páginas, secciones y documentos</p>
          </div>
        </div>
        <button
          on:click={close}
          class="w-9 h-9 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- ── Search input ── -->
      <div class="p-5 pb-3">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            bind:value={query}
            on:input={search}
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Ej: Direccionamiento, Calidad, Procedimientos..."
            autofocus
          />
        </div>

        <!-- ── Tabs ── -->
        <div class="flex gap-2 mt-3">
          <button
            on:click={() => (activeTab = 'paginas')}
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              {activeTab === 'paginas'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            <i class="fas fa-file-alt text-xs"></i>
            Páginas
            {#if pageResults.length > 0}
              <span class="ml-1 text-xs opacity-75">({pageResults.length})</span>
            {/if}
          </button>
          <button
            on:click={() => (activeTab = 'documentos')}
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              {activeTab === 'documentos'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            <i class="fas fa-folder-open text-xs"></i>
            Documentos
            {#if docResults.length > 0}
              <span class="ml-1 text-xs opacity-75">({docResults.length})</span>
            {/if}
          </button>
        </div>
      </div>

      <!-- ── Results area ── -->
      {#if query.trim()}
        <div class="max-h-72 overflow-y-auto border-t border-gray-100">

          <!-- ════ PÁGINAS TAB ════ -->
          {#if activeTab === 'paginas'}
            {#if pageLoading}
              <div class="flex items-center justify-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin mr-2"></i> Buscando páginas...
              </div>
            {:else if pageResults.length === 0}
              <div class="flex flex-col items-center justify-center py-8 text-gray-400">
                <i class="fas fa-search text-2xl mb-2 text-gray-300"></i>
                <p class="text-sm">Sin resultados para "<strong>{query}</strong>"</p>
              </div>
            {:else}
              <ul class="divide-y divide-gray-100">
                {#each pageResults as r}
                  <li>
                    <button
                      on:click={() => navigate(r.ruta)}
                      class="w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition-colors text-left group"
                    >
                      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                        <i class="fas fa-file-alt text-blue-500 text-sm"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-gray-800 truncate">
                          {@html r.snippet ?? r.titulo}
                        </p>
                        <p class="text-xs text-gray-400 truncate">{r.ruta}</p>
                      </div>
                      <i class="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 transition-colors text-xs shrink-0"></i>
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}

          <!-- ════ DOCUMENTOS TAB ════ -->
          {:else}
            {#if docLoading}
              <div class="flex items-center justify-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin mr-2"></i> Buscando documentos...
              </div>
            {:else if docResults.length === 0}
              <div class="flex flex-col items-center justify-center py-8 text-gray-400">
                <i class="fas fa-folder-open text-2xl mb-2 text-gray-300"></i>
                <p class="text-sm">Sin documentos para "<strong>{query}</strong>"</p>
              </div>
            {:else}
              <ul class="divide-y divide-gray-100">
                {#each docResults as d}
                  {@const fileConfig = getFileIcon(d.extension)}
                  <li class="flex items-center gap-3 px-5 py-3 {fileConfig.hoverLi} transition-colors group">
                    <!-- Dynamic File Icon -->
                    <div class="w-8 h-8 rounded-lg {fileConfig.bg} flex items-center justify-center shrink-0 {fileConfig.hoverBg} transition-colors">
                      <i class="{fileConfig.icon} {fileConfig.text} text-sm"></i>
                    </div>

                    <!-- Name + folder -->
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-800 truncate" title={d.nombre}>
                        {d.nombre}
                      </p>
                      <p class="text-xs text-gray-400 truncate">
                        <i class="fas fa-folder text-gray-300 mr-1"></i>{d.carpeta}
                      </p>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex items-center gap-1 shrink-0">
                      <a
                        href={d.ruta}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver Documento"
                        class="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                        aria-label="Ver {d.nombre}"
                      >
                        <i class="fas fa-eye text-blue-500 text-xs"></i>
                      </a>
                      <a
                        href={d.ruta}
                        download
                        title="Descargar Documento"
                        class="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                        aria-label="Descargar {d.nombre}"
                      >
                        <i class="fas fa-download text-green-600 text-xs"></i>
                      </a>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          {/if}

        </div>
      {/if}

      <!-- ── Footer hint ── -->
      {#if !query.trim()}
        <div class="px-5 pb-5 pt-1">
          <p class="text-xs text-gray-400">
            Busca en las {NAVIGATION.length} páginas del proyecto y en los documentos PDF disponibles.
          </p>
        </div>
      {/if}

    </div>
  </div>
{/if}
