<script lang="ts">
  import { onMount } from 'svelte';

  export let hallazgoId: string;
  export let etapa: number;
  export let adjuntos: Array<any> = [];
  export let isGestorOrResponsable: boolean = false;

  let fileInput: HTMLInputElement;
  let isUploading = false;
  let uploadError = '';

  function formatSize(bytes: number) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function handleFileUpload() {
    const file = fileInput?.files?.[0];
    if (!file) return;

    isUploading = true;
    uploadError = '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('etapa', etapa.toString());

    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/adjuntos`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al subir el archivo');
      }

      const newFile = await res.json();
      adjuntos = [...adjuntos, newFile];
      
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      uploadError = err.message;
    } finally {
      isUploading = false;
    }
  }
</script>

<div class="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
  <div class="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
    <div>
      <h3 class="text-lg leading-6 font-medium text-gray-900">Evidencias y Adjuntos</h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">Documentos de soporte para esta etapa.</p>
    </div>
    
    {#if isGestorOrResponsable}
      <div>
        <label for="file-upload-{etapa}" class="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {isUploading ? 'opacity-50 cursor-not-allowed' : ''}">
          {#if isUploading}
            Subiendo...
          {:else}
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Subir Archivo
          {/if}
        </label>
        <input 
          id="file-upload-{etapa}" 
          type="file" 
          class="hidden" 
          bind:this={fileInput}
          on:change={handleFileUpload}
          disabled={isUploading}
        />
      </div>
    {/if}
  </div>
  
  {#if uploadError}
    <div class="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
      {uploadError}
    </div>
  {/if}

  <div class="px-4 py-5 sm:p-0">
    {#if adjuntos.length === 0}
      <div class="text-center py-8 text-gray-500 text-sm">
        No hay archivos adjuntos en esta etapa.
      </div>
    {:else}
      <ul role="list" class="divide-y divide-gray-200">
        {#each adjuntos as adjunto (adjunto.id)}
          <li class="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
            <div class="w-0 flex-1 flex items-center">
              <svg class="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clip-rule="evenodd" />
              </svg>
              <span class="ml-2 flex-1 w-0 truncate text-gray-900 font-medium">
                {adjunto.nombre_original || adjunto.nombre_archivo}
              </span>
              <span class="ml-2 flex-shrink-0 text-gray-500">
                {formatSize(adjunto.tamanio_bytes || adjunto.tamano_bytes)}
              </span>
            </div>
            <div class="ml-4 flex-shrink-0 flex space-x-4">
              <div class="text-gray-400 text-xs flex flex-col text-right">
                <span>Subido por: {adjunto.subido_por?.nombre || adjunto.subido_por_usuario?.nombre || 'Usuario'}</span>
                <span>{new Date(adjunto.created_at || adjunto.fecha_subida).toLocaleDateString()}</span>
              </div>
              <a href={adjunto.url || adjunto.url_descarga} target="_blank" rel="noopener noreferrer" class="font-medium text-blue-600 hover:text-blue-500 flex items-center">
                Descargar
              </a>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
