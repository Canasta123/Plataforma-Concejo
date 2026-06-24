<script lang="ts">
  import { onMount } from 'svelte';
  import { isUploadOpen } from '../../store/modals';

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

  let username = '';
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
      console.error('Error al cargar carpetas en la página de inicio:', e);
    } finally {
      loadingFolders = false;
    }
  });

  function init() {
    if (typeof localStorage !== 'undefined') {
      username = localStorage.getItem('sgc_username') ?? '';
    }
  }
  init();

  function saveUsername() {
    if (typeof localStorage !== 'undefined') localStorage.setItem('sgc_username', username);
  }

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
      uploadMsg = 'El nombre es obligatorio para mantener la trazabilidad de la subida.';
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
        uploadMsg = data.message ?? 'Archivo subido correctamente.';
        file = null; fileInfo = ''; fileStatus = 'idle';
        setTimeout(() => { 
          $isUploadOpen = false; 
          uploadMsg = ''; 
          uploadOk = false; 
          selectedFolder = 'Riesgos y oportunidades'; 
        }, 2200);
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

  function resetAndClose() {
    $isUploadOpen = false;
    selectedFolder = 'Riesgos y oportunidades';
    file = null;
    fileInfo = '';
    fileStatus = 'idle';
    uploadMsg = '';
  }
</script>

{#if $isUploadOpen}
  <div
    class="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
    on:click|self={resetAndClose}
    role="dialog"
    aria-modal="true"
    aria-label="Buzón de subida de evidencias"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-start p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-brand-blue text-white shadow-sm">
            <i class="fas fa-inbox text-lg"></i>
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">Buzón de Carga de Evidencias</h2>
            <p class="text-xs text-slate-400 mt-0.5">Depósito seguro de documentos institucionales (Canal de una sola vía)</p>
          </div>
        </div>
        <button on:click={resetAndClose} class="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Split Layout (Left panel = folder select & user, Right panel = upload dropzone) -->
      <div class="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
        
        <!-- Left Panel: Responsable y Carpetas -->
        <div class="w-full md:w-[40%] border-r border-slate-100 flex flex-col min-h-0 bg-slate-50/30 p-5 gap-4 shrink-0">
          <!-- Responsable input -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="upload-username">
              Nombre del Responsable <span class="text-red-500">*</span>
            </label>
            <input
              id="upload-username"
              type="text"
              bind:value={username}
              on:input={saveUsername}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold"
              placeholder="Escribe tu nombre para trazabilidad"
              required
            />
          </div>

          <div class="border-t border-slate-200/50 my-1"></div>

          <!-- Mobile Select Dropdown -->
          <div class="mobile-select">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5" for="folder-select">
              Carpeta de Destino
            </label>
            <select
              id="folder-select"
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
        <div class="w-full md:w-[60%] flex flex-col min-h-0 bg-white p-5 gap-4 overflow-y-auto custom-scroll">
          <!-- Dynamic Header -->
          <div class="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-3">
            <i class="fas fa-folder-open text-brand-blue text-sm"></i>
            <span>Depositar evidencia en:</span>
            <span class="text-brand-blue truncate flex-1" title={selectedFolder}>{selectedFolder}</span>
          </div>

          <!-- Nota informativa de seguridad -->
          <div class="p-3 bg-blue-50/50 border border-blue-100/60 rounded-xl flex gap-2.5 text-[11px] text-blue-900 leading-relaxed font-medium">
            <i class="fas fa-shield-halved text-brand-blue text-sm mt-0.5 shrink-0"></i>
            <div>
              <strong>Recepción Exclusiva:</strong> Este es un canal de una sola vía. Por seguridad, no es posible ver, descargar ni modificar los archivos que ya han sido cargados.
            </div>
          </div>

          <!-- Drop Zone -->
          <div class="flex-1 flex flex-col justify-center min-h-[140px]">
            <div
              class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-full min-h-[140px]
                {dragging ? 'border-brand-blue bg-blue-50/20' : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50/30'}"
              on:dragenter|preventDefault={() => (dragging = true)}
              on:dragover|preventDefault={() => (dragging = true)}
              on:dragleave={() => (dragging = false)}
              on:drop={onDrop}
              on:click={() => document.getElementById('upload-input')?.click()}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && document.getElementById('upload-input')?.click()}
            >
              <div class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 shadow-sm text-slate-400">
                <i class="fas fa-cloud-upload-alt text-base"></i>
              </div>
              <p class="text-xs text-slate-600 font-bold">Arrastra tu archivo aquí o <span class="text-brand-blue hover:underline">explora</span></p>
              <p class="text-[9px] text-slate-400 mt-1 leading-snug">Formatos admitidos: PDF, Word, Excel, PowerPoint<br>Tamaño máximo: 10MB</p>
              <input id="upload-input" type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" on:change={onFileChange} />
            </div>
          </div>

          <!-- File Info and Feedback Messages -->
          {#if fileInfo || uploadMsg}
            <div class="space-y-2 shrink-0">
              {#if fileInfo}
                <div class="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-150 text-[11px] flex items-center gap-1.5 font-bold {fileStatus === 'valid' ? 'text-green-600' : 'text-red-500'}">
                  <i class="fas {fileStatus === 'valid' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                  <span class="truncate">{fileInfo}</span>
                </div>
              {/if}

              {#if uploadMsg}
                <div class="p-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-2 {uploadOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} animate-fade-in">
                  <i class="fas {uploadOk ? 'fa-check-circle' : 'fa-times-circle'} text-xs"></i>
                  <span>{uploadMsg}</span>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Footer Actions inside the Right Panel -->
          <div class="pt-3 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
            <button on:click={resetAndClose} class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button
              on:click={submit}
              disabled={fileStatus !== 'valid' || uploading}
              class="px-5 py-2 text-xs font-bold text-white rounded-lg bg-brand-blue hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {#if uploading}
                <i class="fas fa-spinner fa-spin"></i>
                <span>Enviando...</span>
              {:else}
                <i class="fas fa-cloud-arrow-up"></i>
                <span>Depositar Evidencia</span>
              {/if}
            </button>
          </div>

        </div>

      </div>

    </div>
  </div>
{/if}

<style>
  .mobile-select {
    display: block;
  }

  .desktop-list {
    display: none;
  }

  @media (min-width: 768px) {
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

  .animate-fade-in {
    animation: fadeIn 0.25s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
