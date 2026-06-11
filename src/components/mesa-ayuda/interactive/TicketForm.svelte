<script lang="ts">
  interface Categoria {
    nombre: string;
    sla_horas_alta: number;
    sla_horas_media: number;
    sla_horas_baja: number;
  }

  export let categorias: Categoria[] = [
    { nombre: 'Hardware', sla_horas_alta: 4, sla_horas_media: 24, sla_horas_baja: 72 },
    { nombre: 'Software', sla_horas_alta: 4, sla_horas_media: 24, sla_horas_baja: 72 },
    { nombre: 'Redes',    sla_horas_alta: 4, sla_horas_media: 24, sla_horas_baja: 72 },
    { nombre: 'Otro',     sla_horas_alta: 4, sla_horas_media: 24, sla_horas_baja: 72 },
  ];

  let loading     = false;
  let error       = '';
  let categoria   = categorias[0]?.nombre ?? 'Hardware';
  let prioridad   = 'media';
  let titulo      = '';
  let descripcion = '';
  let archivos: File[] = [];
  let archivoError = '';

  const MAX_MB = 10;
  const TIPOS_OK = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  // SLA dinámico según categoría seleccionada
  $: catActual = categorias.find(c => c.nombre === categoria) ?? categorias[0];
  $: slaOpciones = catActual ? [
    { value: 'baja',  label: 'Baja',  horas: catActual.sla_horas_baja },
    { value: 'media', label: 'Media', horas: catActual.sla_horas_media },
    { value: 'alta',  label: 'Alta',  horas: catActual.sla_horas_alta },
  ] : [];

  function formatHoras(h: number): string {
    if (h < 24) return `${h}h`;
    const dias = Math.floor(h / 24);
    const resto = h % 24;
    return resto > 0 ? `${dias}d ${resto}h` : `${dias}d`;
  }

  function onFileChange(e: Event) {
    archivoError = '';
    const input = e.target as HTMLInputElement;
    const nuevos = Array.from(input.files ?? []);
    const invalidos = nuevos.filter(f => !TIPOS_OK.includes(f.type));
    const grandes   = nuevos.filter(f => f.size > MAX_MB * 1024 * 1024);
    if (invalidos.length) { archivoError = 'Tipo de archivo no permitido. Solo imágenes, PDF, Word y Excel.'; input.value = ''; return; }
    if (grandes.length)   { archivoError = `Cada archivo debe pesar menos de ${MAX_MB} MB.`; input.value = ''; return; }
    archivos = [...archivos, ...nuevos];
    input.value = '';
  }

  function removeFile(i: number) { archivos = archivos.filter((_, idx) => idx !== i); }

  function iconoArchivo(mime: string): string {
    if (mime.startsWith('image/'))  return 'fa-file-image text-blue-500';
    if (mime === 'application/pdf') return 'fa-file-pdf text-red-500';
    if (mime.includes('word'))      return 'fa-file-word text-blue-700';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return 'fa-file-excel text-green-600';
    return 'fa-file text-gray-400';
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (loading) return;
    error = '';
    loading = true;
    try {
      const form = new FormData();
      form.append('categoria',   categoria.toLowerCase());
      form.append('prioridad',   prioridad);
      form.append('titulo',      titulo.trim());
      form.append('descripcion', descripcion.trim());

      const res = await fetch('/api/mesa-ayuda/tickets', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { error = data.error ?? 'Error al crear el ticket'; return; }

      // Subir adjuntos si hay
      if (archivos.length > 0) {
        await Promise.all(archivos.map(async (archivo) => {
          const fd = new FormData();
          fd.append('archivo', archivo);
          await fetch(`/api/mesa-ayuda/tickets/${data.id}/adjuntos`, { method: 'POST', body: fd });
        }));
      }

      window.location.href = `/mesa-ayuda/ticket/${data.id}`;
    } catch {
      error = 'Error de conexión. Intenta de nuevo.';
    } finally {
      loading = false;
    }
  }

  let dropdownOpen = false;

  function getDescripcion(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('hardware')) {
      return 'Problemas con computadores, pantallas, teclados, mouse, impresoras u otros dispositivos físicos.';
    }
    if (n.includes('software')) {
      return 'Fallas en sistemas operativos, Office, correo institucional, aplicativos internos o programas.';
    }
    if (n.includes('redes') || n.includes('conectividad')) {
      return 'Problemas de internet, Wi-Fi, cable de red, telefonía o carpetas compartidas (NAS).';
    }
    if (n.includes('otro') || n.includes('general')) {
      return 'Cualquier otra solicitud o inquietud técnica que no encaje en las categorías anteriores.';
    }
    return 'Solicitudes generales de soporte técnico para esta categoría.';
  }
</script>

{#if dropdownOpen}
  <div class="fixed inset-0 z-20" on:click={() => dropdownOpen = false}></div>
{/if}

<form on:submit={submit} class="flex flex-col gap-6 max-w-2xl">

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
      <i class="fas fa-exclamation-circle"></i>{error}
    </div>
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Categoría -->
    <div class="relative z-30">
      <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Categoría</label>
      <button
        type="button"
        on:click={() => dropdownOpen = !dropdownOpen}
        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white flex items-center justify-between text-left"
      >
        <span>{categoria}</span>
        <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
      </button>

      {#if dropdownOpen}
        <div class="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 overflow-visible z-30">
          {#each categorias as cat}
            <div class="relative group">
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-semibold text-gray-700 transition-colors"
                on:click={() => { categoria = cat.nombre; dropdownOpen = false; }}
              >
                {cat.nombre}
              </button>
              
              <!-- Tooltip on hover -->
              <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-gray-900 text-white text-xs p-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-40 shadow-xl border border-gray-800">
                <div class="font-bold mb-1 text-yellow-400">{cat.nombre}</div>
                <p class="leading-normal text-gray-200">{getDescripcion(cat.nombre)}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Prioridad con SLA dinámico -->
    <div>
      <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Prioridad</label>
      <select bind:value={prioridad} class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
        {#each slaOpciones as op}
          <option value={op.value}>{op.label} — {formatHoras(op.horas)}</option>
        {/each}
      </select>
      {#if catActual}
        <p class="text-[10px] text-gray-400 mt-1">
          Tiempos de respuesta para la categoría <strong>{catActual.nombre}</strong>
        </p>
      {/if}
    </div>
  </div>

  <!-- Título -->
  <div>
    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Asunto</label>
    <input
      type="text"
      bind:value={titulo}
      placeholder="Ej: No puedo acceder al sistema de nómina"
      required
      maxlength="150"
      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    />
    <p class="text-right text-[10px] text-gray-400 mt-1">{titulo.length}/150</p>
  </div>

  <!-- Descripción -->
  <div>
    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Descripción detallada</label>
    <textarea
      bind:value={descripcion}
      placeholder="Describe el problema con el mayor detalle posible: qué sucede, cuándo, qué pasos seguiste..."
      required
      rows={5}
      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
    ></textarea>
  </div>

  <!-- Adjuntos -->
  <div>
    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
      Archivos adjuntos <span class="font-normal normal-case text-gray-400">(opcional)</span>
    </label>

    {#if archivoError}
      <div class="mb-2 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
        <i class="fas fa-exclamation-circle mr-1"></i>{archivoError}
      </div>
    {/if}

    <!-- Archivos ya seleccionados -->
    {#if archivos.length > 0}
      <ul class="mb-2 space-y-1.5">
        {#each archivos as f, i}
          <li class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <i class={`fas ${iconoArchivo(f.type)} text-sm`}></i>
            <span class="flex-1 truncate text-gray-700">{f.name}</span>
            <span class="text-xs text-gray-400 shrink-0">{formatBytes(f.size)}</span>
            <button type="button" on:click={() => removeFile(i)} class="text-gray-300 hover:text-red-500 transition-colors ml-1">
              <i class="fas fa-times text-xs"></i>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Zona de carga -->
    <label class="flex flex-col items-center gap-2 px-4 py-5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
      <i class="fas fa-cloud-upload-alt text-2xl text-gray-300"></i>
      <span class="text-sm text-gray-500">Haz clic para adjuntar un archivo</span>
      <span class="text-xs text-gray-400">Imágenes, PDF, Word, Excel · Máx. {MAX_MB} MB por archivo</span>
      <input
        type="file"
        class="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        on:change={onFileChange}
      />
    </label>
  </div>

  <!-- Botones -->
  <div class="flex items-center gap-4">
    <button
      type="submit"
      disabled={loading}
      class="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-gray-900 transition-all disabled:opacity-60"
      style="background-color: #FFD402;"
    >
      {#if loading}
        <i class="fas fa-spinner fa-spin"></i>
        {archivos.length > 0 ? 'Enviando y adjuntando...' : 'Enviando...'}
      {:else}
        <i class="fas fa-paper-plane"></i> Radicar Solicitud
      {/if}
    </button>
    <a href="/mesa-ayuda/dashboard" class="text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancelar</a>
  </div>

</form>
