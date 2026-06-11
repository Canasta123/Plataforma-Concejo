<script lang="ts">
  import { isUploadOpen } from '../../store/modals';

  const VALID_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const FOLDERS = [
    'Riesgos y oportunidades',
    'Planes de Mejoramiento',
    'Indicadores',
    'Revisión por la Dirección',
    'Modelo Integrado de Planeación y Gestión 2025',
    'Seguimiento Planes Institucionales',
    'SG-SST',
    'Empalme',
  ];

  let username = '';
  let folder = FOLDERS[0];
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
    if (!file || fileStatus !== 'valid') return;
    
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
    fd.append('folder', folder);
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
        setTimeout(() => { $isUploadOpen = false; uploadMsg = ''; uploadOk = false; }, 2500);
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
</script>

{#if $isUploadOpen}
  <div
    class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
    on:click|self={() => ($isUploadOpen = false)}
    role="dialog"
    aria-modal="true"
    aria-label="Modal de subida de archivo"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div class="flex justify-between items-start p-6 border-b border-gray-100">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-full flex items-center justify-center" style="background:#3359A4">
            <i class="fas fa-upload text-white"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Subir Archivo</h2>
            <p class="text-sm text-gray-500 mt-0.5">Documentos Office y PDF — máx. 10MB</p>
          </div>
        </div>
        <button on:click={() => ($isUploadOpen = false)} class="w-9 h-9 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1" for="upload-username">
            Tu nombre <span class="text-red-500">*</span>
          </label>
          <input id="upload-username" type="text" bind:value={username} on:input={saveUsername}
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Ingresa tu nombre (obligatorio)" required />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1" for="upload-folder">Carpeta destino</label>
          <select id="upload-folder" bind:value={folder}
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            {#each FOLDERS as f}
              <option value={f}>{f}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Archivo</label>
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all {dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}"
            on:dragenter|preventDefault={() => (dragging = true)}
            on:dragover|preventDefault={() => (dragging = true)}
            on:dragleave={() => (dragging = false)}
            on:drop={onDrop}
            on:click={() => document.getElementById('upload-input')?.click()}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && document.getElementById('upload-input')?.click()}
          >
            <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
            <p class="text-sm text-gray-600 font-medium">Arrastra aquí o <span class="text-blue-600 font-semibold">haz clic para seleccionar</span></p>
            <p class="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint — máx. 10MB</p>
            <input id="upload-input" type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" on:change={onFileChange} />
          </div>

          {#if fileInfo}
            <p class="mt-2 text-sm flex items-center gap-1 {fileStatus === 'valid' ? 'text-green-600' : 'text-red-500'}">
              <i class="fas {fileStatus === 'valid' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
              {fileInfo}
            </p>
          {/if}
        </div>

        {#if uploadMsg}
          <p class="text-sm flex items-center gap-1 {uploadOk ? 'text-green-600' : 'text-red-500'}">
            <i class="fas {uploadOk ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            {uploadMsg}
          </p>
        {/if}
      </div>

      <div class="px-6 pb-6 flex justify-end gap-3">
        <button on:click={() => ($isUploadOpen = false)} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          Cancelar
        </button>
        <button on:click={submit} disabled={fileStatus !== 'valid' || uploading}
          class="px-5 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style="background:#3359A4">
          {#if uploading}
            <i class="fas fa-spinner fa-spin mr-2"></i>Subiendo...
          {:else}
            <i class="fas fa-upload mr-2"></i>Subir Archivo
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
