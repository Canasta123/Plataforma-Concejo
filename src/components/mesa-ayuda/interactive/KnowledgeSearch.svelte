<script lang="ts">
  interface Article {
    id:        string;
    titulo:    string;
    categoria: string;
    tags:      string[];
    resumen:   string;
    contenido: string;
  }

  export let articles: Article[] = [];

  const categoriaMap: Record<string, { label: string; icon: string; cls: string }> = {
    software: { label: 'Software',  icon: 'fa-laptop-code',  cls: 'bg-blue-100 text-blue-700' },
    hardware: { label: 'Hardware',  icon: 'fa-server',       cls: 'bg-purple-100 text-purple-700' },
    redes:    { label: 'Redes',     icon: 'fa-network-wired', cls: 'bg-teal-100 text-teal-700' },
    otro:     { label: 'Otro',      icon: 'fa-question-circle', cls: 'bg-gray-100 text-gray-600' },
  };

  let busqueda    = '';
  let categoriaFiltro = 'todas';
  let seleccionado: Article | null = null;

  $: filtrados = articles.filter(a => {
    const cat = categoriaFiltro !== 'todas' && a.categoria !== categoriaFiltro;
    if (cat) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      a.titulo.toLowerCase().includes(q) ||
      a.resumen.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      a.contenido.toLowerCase().includes(q)
    );
  });

  function highlight(text: string): string {
    if (!busqueda.trim()) return text;
    const q = busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${q})`, 'gi'), '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  }

  function formatContenido(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br>');
  }
</script>

<!-- Buscador -->
<div class="flex flex-col sm:flex-row gap-3 mb-6">
  <div class="relative flex-1">
    <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
    <input
      type="text"
      bind:value={busqueda}
      placeholder="Busca por problema, síntoma o palabra clave..."
      class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
    />
    {#if busqueda}
      <button
        on:click={() => busqueda = ''}
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <i class="fas fa-times text-xs"></i>
      </button>
    {/if}
  </div>

  <div class="flex gap-2 flex-wrap">
    {#each ['todas', 'software', 'hardware', 'redes'] as cat}
      <button
        on:click={() => categoriaFiltro = cat}
        class={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
          categoriaFiltro === cat
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        }`}
      >
        {cat === 'todas' ? 'Todas' : (categoriaMap[cat]?.label ?? cat)}
      </button>
    {/each}
  </div>
</div>

<!-- Contador -->
<p class="text-xs text-gray-400 mb-4">
  {filtrados.length} artículo{filtrados.length !== 1 ? 's' : ''}
  {busqueda ? ` para "${busqueda}"` : ''}
</p>

<!-- Artículo seleccionado (modal inline) -->
{#if seleccionado}
  <div class="bg-white rounded-2xl border border-blue-200 shadow-lg p-6 mb-6">
    <div class="flex items-start justify-between gap-4 mb-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          {#if categoriaMap[seleccionado.categoria]}
            <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${categoriaMap[seleccionado.categoria].cls}`}>
              <i class={`fas ${categoriaMap[seleccionado.categoria].icon} text-[9px]`}></i>
              {categoriaMap[seleccionado.categoria].label}
            </span>
          {/if}
          {#each seleccionado.tags.slice(0, 4) as tag}
            <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{tag}</span>
          {/each}
        </div>
        <h2 class="text-base font-bold text-gray-900">{seleccionado.titulo}</h2>
      </div>
      <button
        on:click={() => seleccionado = null}
        class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
      >
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>

    <div
      class="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
      style="white-space: pre-line;"
    >
      <!-- eslint-disable-next-line -->
      {@html formatContenido(seleccionado.contenido)}
    </div>

    <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
      <p class="text-xs text-gray-400">¿Este artículo resolvió tu problema?</p>
      <a
        href="/mesa-ayuda/nuevo-ticket"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <i class="fas fa-ticket-alt text-[10px]"></i> No, radicar ticket
      </a>
    </div>
  </div>
{/if}

<!-- Lista de artículos -->
{#if filtrados.length === 0}
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <i class="fas fa-search text-4xl text-gray-200 mb-4"></i>
    <p class="text-sm font-medium text-gray-400 mb-1">Sin resultados para "{busqueda}"</p>
    <p class="text-xs text-gray-400 mb-4">Intenta con otras palabras o revisa la categoría seleccionada</p>
    <a
      href="/mesa-ayuda/nuevo-ticket"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 transition-opacity hover:opacity-80"
      style="background-color:#FFD402;"
    >
      <i class="fas fa-plus text-xs"></i> Radicar ticket
    </a>
  </div>
{:else}
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {#each filtrados as art (art.id)}
      {@const meta = categoriaMap[art.categoria]}
      <button
        on:click={() => seleccionado = seleccionado?.id === art.id ? null : art}
        class={`text-left bg-white rounded-xl border p-4 hover:shadow-md transition-all group ${
          seleccionado?.id === art.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100 hover:border-blue-200'
        }`}
      >
        <div class="flex items-start gap-3">
          <div class={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta?.cls ?? 'bg-gray-100 text-gray-500'}`}>
            <i class={`fas ${meta?.icon ?? 'fa-file'} text-sm`}></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-gray-800 group-hover:text-blue-700 transition-colors mb-0.5 leading-tight">
              {@html highlight(art.titulo)}
            </p>
            <p class="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {@html highlight(art.resumen)}
            </p>
            <div class="flex flex-wrap gap-1 mt-2">
              {#each art.tags.slice(0, 3) as tag}
                <span class="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">{tag}</span>
              {/each}
            </div>
          </div>
          <i class={`fas fa-chevron-${seleccionado?.id === art.id ? 'up' : 'down'} text-gray-300 group-hover:text-blue-400 text-xs shrink-0 mt-1 transition-all`}></i>
        </div>
      </button>
    {/each}
  </div>
{/if}
