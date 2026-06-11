<script lang="ts">
  import { onMount } from 'svelte';

  export let ticketId: string;
  export let sessionId: string;
  export let sessionRol: string;
  export let ticketCerrado: boolean = false;

  interface Adjunto {
    id: string;
    nombre_original: string;
    mime_type: string;
    tamanio_bytes: number;
    url_firmada: string | null;
    subido_por: string;
    subido_por_usuario: { nombre: string } | null;
    created_at: string;
  }

  let adjuntos: Adjunto[] = [];
  let cargando = true;
  let subiendo = false;
  let errorMsg = '';
  let exitoMsg = '';
  let inputRef: HTMLInputElement;

  const MAX_MB = 10;
  const esAdmin = ['admin', 'agente'].includes(sessionRol);

  function icono(mime: string): string {
    if (mime.startsWith('image/')) return 'fa-file-image text-blue-500';
    if (mime === 'application/pdf') return 'fa-file-pdf text-red-500';
    if (mime.includes('word')) return 'fa-file-word text-blue-700';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return 'fa-file-excel text-green-600';
    return 'fa-file text-gray-400';
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' });
  }

  async function cargar() {
    cargando = true;
    const res = await fetch(`/api/mesa-ayuda/tickets/${ticketId}/adjuntos`);
    if (res.ok) adjuntos = await res.json();
    cargando = false;
  }

  onMount(cargar);

  async function subirArchivo(e: Event) {
    if (subiendo) return;
    errorMsg = '';
    exitoMsg = '';
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const archivo = files[0];
    if (archivo.size > MAX_MB * 1024 * 1024) {
      errorMsg = `El archivo supera el límite de ${MAX_MB} MB.`;
      return;
    }

    subiendo = true;
    const formData = new FormData();
    formData.append('archivo', archivo);

    const res = await fetch(`/api/mesa-ayuda/tickets/${ticketId}/adjuntos`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      exitoMsg = 'Archivo adjuntado correctamente.';
      setTimeout(() => exitoMsg = '', 3000);
      await cargar();
    } else {
      errorMsg = data.error || 'Error al subir el archivo.';
    }

    subiendo = false;
    // Limpiar el input
    if (inputRef) inputRef.value = '';
  }

  async function eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar el archivo "${nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/mesa-ayuda/adjuntos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      exitoMsg = 'Archivo eliminado.';
      setTimeout(() => exitoMsg = '', 3000);
      await cargar();
    } else {
      const d = await res.json();
      errorMsg = d.error || 'Error al eliminar.';
    }
  }
</script>

<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-bold text-gray-700 flex items-center gap-2">
      <i class="fas fa-paperclip text-gray-400"></i>
      Adjuntos
      {#if adjuntos.length > 0}
        <span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{adjuntos.length}</span>
      {/if}
    </h3>
    {#if !ticketCerrado}
      <label class="cursor-pointer">
        <input
          bind:this={inputRef}
          type="file"
          class="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          on:change={subirArchivo}
          disabled={subiendo}
        />
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer">
          {#if subiendo}
            <i class="fas fa-spinner fa-spin"></i> Subiendo...
          {:else}
            <i class="fas fa-upload"></i> Adjuntar
          {/if}
        </span>
      </label>
    {/if}
  </div>

  {#if errorMsg}
    <div class="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
      <i class="fas fa-exclamation-circle mr-1"></i>{errorMsg}
    </div>
  {/if}

  {#if exitoMsg}
    <div class="mb-3 p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200 font-bold">
      <i class="fas fa-check-circle mr-1"></i>{exitoMsg}
    </div>
  {/if}

  {#if cargando}
    <div class="py-6 text-center text-gray-400 text-sm">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
  {:else if adjuntos.length === 0}
    <div class="py-6 text-center">
      <i class="fas fa-paperclip text-gray-200 text-3xl mb-2 block"></i>
      <p class="text-xs text-gray-400">No hay archivos adjuntos</p>
      {#if !ticketCerrado}
        <p class="text-xs text-gray-300 mt-1">Máx. {MAX_MB} MB · Imágenes, PDF, Word, Excel</p>
      {/if}
    </div>
  {:else}
    <ul class="space-y-2">
      {#each adjuntos as adj (adj.id)}
        <li class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors group">
          <!-- Icono de tipo -->
          <div class="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm">
            <i class={`fas ${icono(adj.mime_type)} text-base`}></i>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{adj.nombre_original}</p>
            <p class="text-xs text-gray-400">
              {formatBytes(adj.tamanio_bytes)}
              {#if adj.subido_por_usuario}
                · por {adj.subido_por_usuario.nombre}
              {/if}
              · {formatFecha(adj.created_at)}
            </p>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-1 shrink-0">
            {#if adj.url_firmada}
              <!-- Preview si es imagen -->
              {#if adj.mime_type.startsWith('image/')}
                <a
                  href={adj.url_firmada}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                  title="Ver imagen"
                >
                  <i class="fas fa-eye text-sm"></i>
                </a>
              {/if}
              <!-- Descargar -->
              <a
                href={adj.url_firmada}
                download={adj.nombre_original}
                class="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                title="Descargar"
              >
                <i class="fas fa-download text-sm"></i>
              </a>
            {/if}

            <!-- Eliminar: solo el que subió o admin/agente -->
            {#if esAdmin || adj.subido_por === sessionId}
              <button
                on:click={() => eliminar(adj.id, adj.nombre_original)}
                class="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar"
              >
                <i class="fas fa-trash text-sm"></i>
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
