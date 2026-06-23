<script lang="ts">
  import { isUploadOpen } from '../../store/modals';

  const VALID_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const FOLDERS = [
    { name: 'Riesgos y oportunidades', icon: 'fas fa-shield-halved', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { name: 'Planes de Mejoramiento', icon: 'fas fa-chart-line', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { name: 'Indicadores', icon: 'fas fa-chart-bar', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { name: 'Revisión por la Dirección', icon: 'fas fa-users-cog', color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { name: 'Modelo Integrado de Planeación y Gestión 2025', icon: 'fas fa-sitemap', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { name: 'Seguimiento Planes Institucionales', icon: 'fas fa-list-check', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
    { name: 'SG-SST', icon: 'fas fa-heart-pulse', color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { name: 'Empalme', icon: 'fas fa-handshake', color: 'text-teal-600 bg-teal-50 border-teal-100' },
  ];

  let username = '';
  let selectedFolder: string | null = null;
  let file: File | null = null;
  let fileInfo = '';
  let fileStatus: 'idle' | 'valid' | 'invalid' = 'idle';
  let uploading = false;
  let uploadMsg = '';
  let uploadOk = false;
  let dragging = false;

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

  function goBack() {
    selectedFolder = null;
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
          selectedFolder = null; 
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
    selectedFolder = null;
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
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-start p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-brand-blue text-white shadow-sm">
            <i class="fas fa-inbox text-lg"></i>
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">Buzón de Carga de Evidencias</h2>
            <p class="text-xs text-slate-400 mt-0.5">Depósito seguro de documentos institucionales</p>
          </div>
        </div>
        <button on:click={resetAndClose} class="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Navigation breadcrumb when folder selected -->
      {#if selectedFolder}
        <div class="px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs flex items-center gap-2 shrink-0">
          <button on:click={goBack} class="text-brand-blue font-bold hover:underline flex items-center gap-1">
            <i class="fas fa-folder-open"></i> Carpetas
          </button>
          <i class="fas fa-chevron-right text-slate-300 text-[10px]"></i>
          <span class="text-slate-500 font-semibold truncate">{selectedFolder}</span>
        </div>
      {/if}

      <!-- Modal Body (Scrollable if needed) -->
      <div class="p-6 overflow-y-auto flex-1 custom-scroll space-y-5">
        
        <!-- ESTADO 1: GRID DE SELECCIÓN DE CARPETA -->
        {#if !selectedFolder}
          <div class="space-y-4">
            <!-- Nota informativa de seguridad -->
            <div class="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex gap-3 text-xs text-blue-900 leading-relaxed font-medium">
              <i class="fas fa-info-circle text-brand-blue text-base mt-0.5 shrink-0"></i>
              <div>
                <strong>Recepción Exclusiva:</strong> Este canal funciona únicamente para depositar evidencias. Por motivos de trazabilidad y seguridad, los funcionarios no podrán ver, modificar ni descargar documentos previamente cargados.
              </div>
            </div>

            <!-- Listado de carpetas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {#each FOLDERS as f}
                <button
                  on:click={() => selectFolder(f.name)}
                  class="group p-4 rounded-xl border border-slate-200/80 bg-white hover:border-brand-blue hover:bg-blue-50/10 hover:shadow-sm transition-all text-left flex items-start gap-3 w-full min-w-0"
                >
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all {f.color} group-hover:scale-105">
                    <i class="{f.icon} text-sm"></i>
                  </div>
                  <div class="min-w-0 flex-1 flex flex-col justify-center h-9">
                    <h4 class="text-xs font-bold text-slate-700 leading-tight group-hover:text-brand-blue truncate" title={f.name}>
                      {f.name}
                    </h4>
                    <span class="text-[9px] text-slate-400 mt-0.5">Haga clic para depositar archivo</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>

        <!-- ESTADO 2: FORMULARIO DE CARGA PARA LA CARPETA SELECCIONADA -->
        {:else}
          <div class="space-y-5 animate-fade-in">
            <!-- Nombre del Responsable -->
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5" for="upload-username">
                Nombre del Responsable <span class="text-red-500">*</span>
              </label>
              <input
                id="upload-username"
                type="text"
                bind:value={username}
                on:input={saveUsername}
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold"
                placeholder="Escribe tu nombre completo para trazabilidad"
                required
              />
            </div>

            <!-- Drop Zone -->
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Archivo a Depositar</label>
              <div
                class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all {dragging ? 'border-brand-blue bg-blue-50/20' : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50/50'}"
                on:dragenter|preventDefault={() => (dragging = true)}
                on:dragover|preventDefault={() => (dragging = true)}
                on:dragleave={() => (dragging = false)}
                on:drop={onDrop}
                on:click={() => document.getElementById('upload-input')?.click()}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && document.getElementById('upload-input')?.click()}
              >
                <div class="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400">
                  <i class="fas fa-cloud-upload-alt text-lg"></i>
                </div>
                <p class="text-xs text-slate-600 font-bold">Arrastra tu archivo aquí o <span class="text-brand-blue hover:underline">explora tus carpetas</span></p>
                <p class="text-[10px] text-slate-400 mt-1 leading-snug">Tipos de archivo permitidos: PDF, Word, Excel, PowerPoint<br>Tamaño máximo: 10MB</p>
                <input id="upload-input" type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" on:change={onFileChange} />
              </div>

              {#if fileInfo}
                <p class="mt-2 text-xs flex items-center gap-1.5 font-semibold {fileStatus === 'valid' ? 'text-green-600' : 'text-red-500'}">
                  <i class="fas {fileStatus === 'valid' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                  {fileInfo}
                </p>
              {/if}
            </div>

            <!-- Feedback Message -->
            {#if uploadMsg}
              <div class="p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 {uploadOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
                <i class="fas {uploadOk ? 'fa-check-circle' : 'fa-times-circle'} text-sm"></i>
                {uploadMsg}
              </div>
            {/if}
          </div>
        {/if}

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
        <div>
          {#if selectedFolder}
            <button on:click={goBack} class="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
              <i class="fas fa-arrow-left"></i> Cambiar Carpeta
            </button>
          {/if}
        </div>
        <div class="flex gap-2">
          <button on:click={resetAndClose} class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
          {#if selectedFolder}
            <button
              on:click={submit}
              disabled={fileStatus !== 'valid' || uploading}
              class="px-5 py-2 text-xs font-bold text-white rounded-lg bg-brand-blue hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {#if uploading}
                <i class="fas fa-spinner fa-spin"></i>
                <span>Cargando...</span>
              {:else}
                <i class="fas fa-cloud-arrow-up"></i>
                <span>Depositar Evidencia</span>
              {/if}
            </button>
          {/if}
        </div>
      </div>

    </div>
  </div>
{/if}

<style>
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

