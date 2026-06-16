<script>
  import { onMount } from 'svelte';

  let formatsData = [];
  let loading = true;
  let error = false;
  let searchQuery = '';
  
  // Keep track of which categories are open. Default: first category is open, others closed.
  let openCategories = {
    "Organización y Archivo de Gestión": true,
    "Préstamo y Consulta de Documentos": false,
    "Correspondencia y Radicación (VUAR)": false,
    "Control e Instrumentos Archivísticos": false
  };

  onMount(async () => {
    try {
      const res = await fetch('/api/formatos-documental');
      if (!res.ok) throw new Error();
      formatsData = await res.json();
    } catch {
      error = true;
    } finally {
      loading = false;
    }
  });

  // Toggle category collapse
  function toggleCategory(category) {
    openCategories[category] = !openCategories[category];
  }

  // Filter formats based on search query
  $: filteredData = formatsData.map(cat => {
    const matchedFormats = cat.formats.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      formats: matchedFormats
    };
  }).filter(cat => cat.formats.length > 0);

  // Automatically expand categories when searching
  $: if (searchQuery.trim() !== '') {
    filteredData.forEach(cat => {
      openCategories[cat.category] = true;
    });
  }

  // Helper to get extension/type color and icon classes
  function getDocMeta(type) {
    switch(type) {
      case 'excel':
        return { icon: 'far fa-file-excel', color: 'text-green-600 bg-green-50 border-green-100' };
      case 'word':
        return { icon: 'far fa-file-word', color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'pdf':
        return { icon: 'far fa-file-pdf', color: 'text-red-500 bg-red-50 border-red-100' };
      default:
        return { icon: 'far fa-file', color: 'text-gray-500 bg-gray-50 border-gray-100' };
    }
  }
</script>

<div class="formatos-list flex flex-col h-full gap-4">
  
  {#if loading}
    <div class="flex flex-col items-center justify-center py-8 text-gray-400">
      <i class="fas fa-spinner fa-spin text-lg text-brand-blue mb-2"></i>
      <p class="text-xs font-semibold">Cargando formatos...</p>
    </div>
  {:else if error}
    <div class="flex flex-col items-center justify-center py-8 text-red-500">
      <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
      <p class="text-xs font-semibold">Error al cargar formatos</p>
    </div>
  {:else}
    <!-- Buscador de Formatos -->
    <div class="search-box relative z-10 shrink-0">
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Buscar formato por nombre..." 
        class="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all bg-gray-50/50"
      />
      <i class="fas fa-search absolute left-3.5 top-3.5 text-gray-400 text-xs"></i>
      {#if searchQuery}
        <button 
          class="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 text-xs"
          on:click={() => searchQuery = ''}
        >
          <i class="fas fa-times-circle"></i>
        </button>
      {/if}
    </div>

    <!-- Contenedor de Acordeones -->
    <div class="accordion-container flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-2.5">
      
      {#if filteredData.length === 0}
        <div class="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
          <i class="fas fa-folder-open text-gray-300 text-3xl mb-2"></i>
          <p class="text-xs font-semibold text-gray-500">No se encontraron formatos coincidentes</p>
        </div>
      {:else}
        {#each filteredData as cat}
          <div class="bg-gray-50/50 border border-gray-100 rounded-lg overflow-hidden transition-all shadow-sm">
            <!-- Botón Cabecera del Acordeón -->
            <button 
              class="w-full px-4 py-3 flex items-center justify-between transition-colors bg-white hover:bg-gray-50/80 border-b border-gray-100"
              on:click={() => toggleCategory(cat.category)}
            >
              <div class="flex items-center gap-3 text-brand-blue">
                <div class="w-7 w-7 flex items-center justify-center shrink-0">
                  <i class="{cat.icon} text-sm text-brand-gold"></i>
                </div>
                <span class="text-xs font-bold text-left">{cat.category}</span>
                <span class="text-[10px] bg-blue-50 text-brand-blue font-bold px-1.5 py-0.5 rounded-full shrink-0 border border-blue-100/50">
                  {cat.formats.length}
                </span>
              </div>
              <i class="fas fa-chevron-down text-gray-400 text-xs transition-transform duration-300 {openCategories[cat.category] ? 'rotate-180 text-brand-blue' : ''}"></i>
            </button>

            <!-- Lista de Formatos (Colapsable) -->
            {#if openCategories[cat.category]}
              <div class="p-2 flex flex-col gap-1.5 bg-white/50 animate-slide-down">
                {#each cat.formats as format}
                  {@const meta = getDocMeta(format.type)}
                  <div class="format-row flex items-center justify-between p-2.5 rounded-md hover:bg-blue-50/40 border border-transparent hover:border-blue-100/30 transition-all gap-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded border flex items-center justify-center shrink-0 shadow-sm {meta.color}">
                        <i class="{meta.icon} text-sm"></i>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-700 leading-tight block">{format.name}</span>
                        <span class="text-[9px] text-gray-400 block mt-0.5">{format.file}</span>
                      </div>
                    </div>
                    <a 
                      href={format.path} 
                      download 
                      class="w-8 h-8 rounded-full bg-gray-50 hover:bg-brand-blue hover:text-white border border-gray-200/60 flex items-center justify-center text-gray-500 hover:shadow-sm transition-all"
                      title="Descargar Formato"
                    >
                      <i class="fas fa-download text-xs"></i>
                    </a>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}

    </div>
  {/if}
</div>

<style>
  .custom-scroll::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Animación para el despliegue del acordeón */
  .animate-slide-down {
    animation: slideDown 0.2s ease-out forwards;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
