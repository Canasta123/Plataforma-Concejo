<script lang="ts">
  import { onMount } from 'svelte';

  export let initialUsername = '';

  const VALID_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  const MAX_SIZE = 10 * 1024 * 1024;

  interface Folder {
    id: string;
    nombre: string;
    icono: string;
    color: string;
    activa: boolean;
  }

  let folders: Folder[] = [];
  let loadingFolders = true;

  let username = initialUsername;
  let selectedFolder: string | null = null;
  let file: File | null = null;
  let fileInfo = '';
  let fileStatus: 'idle' | 'valid' | 'invalid' = 'idle';
  let uploading = false;
  let uploadMsg = '';
  let uploadOk = false;
  let dragging = false;

  onMount(async () => {
    try {
      const res = await fetch('/api/mesa-ayuda/evidencias/carpetas?activasOnly=true');
      if (res.ok) {
        folders = await res.json();
        if (folders.length > 0) {
          selectedFolder = folders[0].nombre;
        }
      }
    } catch (e) {
      console.error('Error al cargar carpetas:', e);
    } finally {
      loadingFolders = false;
    }
  });

  function selectFolder(folderName: string) {
    selectedFolder = folderName;
    file = null;
    fileInfo = '';
    fileStatus = 'idle';
    uploadMsg = '';
  }

  function validateFile(f: File): boolean {
    if (f.size > MAX_SIZE) {
      fileInfo = 'El archivo supera los 10MB';
      fileStatus = 'invalid';
      return false;
    }
    const ext = '.' + f.name.split('.').pop()!.toLowerCase();
    if (!VALID_EXT.includes(ext)) {
      fileInfo = 'Formato no permitido. Solo Office y PDF.';
      fileStatus = 'invalid';
      return false;
    }
    const mb = (f.size / (1024 * 1024)).toFixed(2);
    fileInfo = `${f.name} (${mb} MB) listo para subir`;
    fileStatus = 'valid';
    return true;
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) { file = input.files[0]; validateFile(file); }
  }

  function onDrop(e: DragEvent) {
    dragging = false;
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) { file = e.dataTransfer.files[0]; validateFile(file); }
  }

  async function submit() {
    if (uploading) return;
    if (!selectedFolder || !file || fileStatus !== 'valid') return;
    
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername === 'Anónimo') {
      uploadOk = false;
      uploadMsg = 'El nombre del responsable es obligatorio.';
      return;
    }

    uploading = true;
    uploadMsg = '';
    const fd = new FormData();
    fd.append('username', cleanUsername);
    fd.append('folder', selectedFolder);
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || 'Error del servidor' };
      }

      if (res.ok) {
        uploadOk = true;
        uploadMsg = data.message ?? 'Archivo depositado correctamente en el SGC.';
        file = null; fileInfo = ''; fileStatus = 'idle';
        setTimeout(() => { 
          uploadMsg = ''; 
          uploadOk = false; 
        }, 3000);
      } else {
        throw new Error(data.error ?? 'Error desconocido');
      }
    } catch (err: any) {
      uploadOk = false;
      uploadMsg = err.message || 'Error al subir el archivo. Intenta de nuevo.';
    } finally {
      uploading = false;
    }
  }

  function resetFile() {
    file = null;
    fileInfo = '';
    fileStatus = 'idle';
    uploadMsg = '';
  }
</script>

<div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
  <div class="split-layout">
    
    <!-- Left Panel: Responsable y Carpetas -->
    <div class="left-panel">
      <!-- Responsable input -->
      <div>
        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="inline-upload-username">
          Responsable de la Carga <span class="text-red-500">*</span>
        </label>
        <input
          id="inline-upload-username"
          type="text"
          bind:value={username}
          class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold bg-gray-50/50"
          placeholder="Escribe tu nombre para trazabilidad"
          required
        />
      </div>

      <div class="border-t border-slate-200/50 my-1"></div>

      <!-- Mobile Select Dropdown -->
      <div class="mobile-select">
        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="inline-folder-select">
          Carpeta de Destino
        </label>
        <select
          id="inline-folder-select"
          bind:value={selectedFolder}
          class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold bg-white text-slate-700"
        >
          {#each folders as f}
            <option value={f.nombre}>{f.nombre}</option>
          {/each}
        </select>
      </div>

      <!-- Desktop vertical list (hidden on mobile) -->
      <div class="desktop-list">
        <span class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Carpeta de Destino</span>
        <div class="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scroll">
          {#if loadingFolders}
            <div class="flex items-center justify-center p-8 text-slate-400 text-xs">
              <i class="fas fa-spinner fa-spin mr-2"></i> Cargando carpetas...
            </div>
          {:else if folders.length === 0}
            <div class="p-4 text-center text-xs text-slate-450 italic">
              No hay carpetas activas disponibles.
            </div>
          {:else}
            {#each folders as f}
              <button
                on:click={() => selectFolder(f.nombre)}
                class="group w-full p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs font-semibold
                  {selectedFolder === f.nombre 
                    ? 'border-brand-blue bg-blue-50/40 text-brand-blue shadow-sm font-bold' 
                    : 'border-slate-100 bg-white hover:border-slate-350 hover:bg-slate-50 text-slate-700'
                  }"
              >
                <!-- Folder Icon with background -->
                <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border transition-all 
                  {selectedFolder === f.nombre 
                    ? 'bg-brand-blue text-white border-brand-blue' 
                    : f.color
                  } group-hover:scale-105"
                >
                  <i class="{f.icono} text-xs"></i>
                </div>
                <span class="truncate flex-1 leading-snug">{f.nombre}</span>
                {#if selectedFolder === f.nombre}
                  <i class="fas fa-chevron-right text-[10px] text-brand-blue/70 shrink-0"></i>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- Right Panel: Carga y Confirmación -->
    <div class="right-panel custom-scroll">
      <!-- Dynamic Header -->
      <div class="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-3">
        <i class="fas fa-folder-open text-brand-blue text-sm"></i>
        <span>Depositar evidencia en:</span>
        <span class="text-brand-blue truncate flex-1 font-bold" title={selectedFolder}>{selectedFolder}</span>
      </div>

      <!-- Nota informativa de seguridad -->
      <div class="p-3 bg-blue-50/50 border border-blue-100/60 rounded-xl flex gap-2.5 text-[11px] text-blue-900 leading-relaxed font-medium">
        <i class="fas fa-shield-halved text-brand-blue text-sm mt-0.5 shrink-0"></i>
        <div>
          <strong>Canal Seguro de Una Vía:</strong> Por motivos de protección de datos, este es un canal exclusivo para el depósito de archivos. Solo el personal de Calidad y Control Interno tiene acceso para consultarlos y descargarlos.
        </div>
      </div>

      <!-- Drop Zone -->
      <div class="flex-1 flex flex-col justify-center min-h-[160px]">
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-full min-h-[160px]
            {dragging ? 'border-brand-blue bg-blue-50/20' : 'border-slate-350 hover:border-brand-blue hover:bg-slate-50/30'}"
          on:dragenter|preventDefault={() => (dragging = true)}
          on:dragover|preventDefault={() => (dragging = true)}
          on:dragleave={() => (dragging = false)}
          on:drop={onDrop}
          on:click={() => document.getElementById('inline-upload-input')?.click()}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && document.getElementById('inline-upload-input')?.click()}
        >
          <div class="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 shadow-sm text-slate-400">
            <i class="fas fa-cloud-upload-alt text-lg"></i>
          </div>
          <p class="text-xs text-slate-650 font-bold">Arrastra tu archivo aquí o <span class="text-brand-blue hover:underline">explora</span></p>
          <p class="text-[9px] text-slate-400 mt-1.5 leading-snug">Formatos admitidos: PDF, Word, Excel, PowerPoint<br>Tamaño máximo: 10MB</p>
          <input id="inline-upload-input" type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" on:change={onFileChange} />
        </div>
      </div>

      <!-- File Info and Feedback Messages -->
      {#if fileInfo || uploadMsg}
        <div class="space-y-2 shrink-0">
          {#if fileInfo}
            <div class="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-150 text-[11px] flex items-center gap-1.5 font-bold {fileStatus === 'valid' ? 'text-green-600' : 'text-red-500'}">
              <i class="fas {fileStatus === 'valid' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
              <span class="truncate flex-1">{fileInfo}</span>
              {#if fileStatus === 'valid'}
                <button on:click|stopPropagation={resetFile} class="text-gray-400 hover:text-gray-600 text-[10px]">
                  <i class="fas fa-times-circle"></i> Quitar
                </button>
              {/if}
            </div>
          {/if}

          {#if uploadMsg}
            <div class="p-3 rounded-lg border text-[11px] font-bold flex items-center gap-2 {uploadOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
              <i class="fas {uploadOk ? 'fa-check-circle' : 'fa-times-circle'} text-xs"></i>
              <span>{uploadMsg}</span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Actions Footer -->
      <div class="pt-3.5 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
        {#if file}
          <button on:click={resetFile} class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
        {/if}
        <button
          on:click={submit}
          disabled={fileStatus !== 'valid' || uploading}
          class="px-5 py-2.5 text-xs font-bold text-white rounded-lg bg-brand-blue hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
        >
          {#if uploading}
            <i class="fas fa-spinner fa-spin"></i>
            <span>Depositando...</span>
          {:else}
            <i class="fas fa-cloud-arrow-up"></i>
            <span>Depositar Evidencia</span>
          {/if}
        </button>
      </div>

    </div>

  </div>
</div>

<style>
  .split-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 500px;
  }

  .left-panel {
    width: 100%;
    border-right: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: rgba(248, 250, 252, 0.3);
    padding: 1.25rem;
    gap: 1rem;
    flex-shrink: 0;
  }

  .right-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: #ffffff;
    padding: 1.25rem;
    gap: 1rem;
    overflow-y: auto;
  }

  .mobile-select {
    display: block;
  }

  .desktop-list {
    display: none;
  }

  @media (min-width: 768px) {
    .split-layout {
      flex-direction: row;
    }
    .left-panel {
      width: 40%;
    }
    .right-panel {
      width: 60%;
    }
    .mobile-select {
      display: none;
    }
    .desktop-list {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
  }

  /* Scrollbar styles for the body */
  .custom-scroll::-webkit-scrollbar {
    width: 6px;
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
</style>
