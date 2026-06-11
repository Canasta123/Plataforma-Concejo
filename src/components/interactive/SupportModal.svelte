<script lang="ts">
  import { isSupportOpen } from '../../store/modals';

  let activeTab: 'documento' | 'soporte' = 'documento';
  let cargando = false;
  let exito = false;
  let errorMsg = '';

  // Formulario 1: Documento
  let formDoc = {
    nombre: '',
    correo: '',
    proceso: '',
    documento: '',
    tipoDocumento: '',
    comentarios: ''
  };

  // Formulario 2: Soporte
  let formSop = {
    nombre: '',
    correo: '',
    dependencia: '',
    tipoSoporte: '',
    asunto: '',
    descripcion: ''
  };

  const procesos = [
    "Direccionamiento Estratégico y Comunicaciones",
    "Gestión de Calidad",
    "Relacionamiento con la Ciudadanía",
    "Control Político",
    "Proyectos de Acuerdo",
    "Gestión Jurídica y Contractual",
    "Gestión Documental y TI",
    "Gestión Administrativa, Financiera y Talento Humano",
    "Evaluación Independiente"
  ];

  function cerrar() {
    $isSupportOpen = false;
    exito = false;
    errorMsg = '';
    formDoc = { nombre: '', correo: '', proceso: '', documento: '', tipoDocumento: '', comentarios: '' };
    formSop = { nombre: '', correo: '', dependencia: '', tipoSoporte: '', asunto: '', descripcion: '' };
  }

  async function enviar() {
    cargando = true;
    errorMsg = '';

    const payload = activeTab === 'documento' 
      ? { tipoFormulario: 'documento', ...formDoc }
      : { tipoFormulario: 'soporte', ...formSop };

    try {
      const res = await fetch('/api/enviar-soporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud');
      }

      exito = true;
    } catch (err: any) {
      errorMsg = err.message || 'Error de red';
    } finally {
      cargando = false;
    }
  }
</script>

{#if $isSupportOpen}
  <div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" on:click|self={cerrar}>
    <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-scale-up">
      
      <!-- Header -->
      <div class="bg-[#3359A4] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <i class="fas fa-envelope-open-text text-brand-gold text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-bold leading-none" style="font-family: 'Montserrat', sans-serif;">
              Solicitud de Actualización
            </h2>
            <p class="text-[10px] text-blue-200 mt-1 leading-none">Plataforma SGC · Concejo de Chía</p>
          </div>
        </div>
        <button on:click={cerrar} class="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>

      <!-- Tabs -->
      {#if !exito && false} <!-- Oculto temporalmente a petición del usuario -->
        <div class="flex border-b border-gray-100 bg-gray-50/50 shrink-0">
          <button
            on:click={() => { activeTab = 'documento'; errorMsg = ''; }}
            class={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'documento'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i class="fas fa-file-signature text-sm"></i>
            Actualizar Documento
          </button>
          <button
            on:click={() => { activeTab = 'soporte'; errorMsg = ''; }}
            class={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'soporte'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i class="fas fa-cogs text-sm"></i>
            Soporte Técnico
          </button>
        </div>
      {/if}

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 min-h-0">
        {#if exito}
          <!-- Success Screen -->
          <div class="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-200 text-green-500 animate-bounce">
              <i class="fas fa-check text-2xl"></i>
            </div>
            <h3 class="text-base font-bold text-gray-900" style="font-family: 'Montserrat', sans-serif;">
              Solicitud Enviada con Éxito
            </h3>
            <p class="text-xs text-gray-500 max-w-xs leading-relaxed">
              {#if activeTab === 'documento'}
                Tu solicitud fue remitida al equipo de **Gestión de Calidad**. Pronto se te enviará el editable a tu correo para proceder con la actualización formal.
              {:else}
                Tu solicitud de soporte técnico fue enviada correctamente. Se revisará tu reporte y recibirás respuesta en tu correo de contacto.
              {/if}
            </p>
            <button on:click={cerrar} class="mt-4 px-6 py-2 rounded-xl text-xs font-bold text-gray-900 shadow hover:opacity-90 transition-opacity" style="background-color: #FFD402;">
              Cerrar Ventana
            </button>
          </div>
        {:else}
          <!-- Form Screen -->
          <form on:submit|preventDefault={enviar} class="space-y-4">
            {#if errorMsg}
              <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
                <i class="fas fa-exclamation-circle shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            {/if}

            {#if activeTab === 'documento'}
              <!-- Formulario 1: Documento -->
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                  <input bind:value={formDoc.nombre} required type="text" placeholder="Tu nombre" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo de Contacto *</label>
                  <input bind:value={formDoc.correo} required type="email" placeholder="ejemplo@correo.com" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Proceso Relacionado *</label>
                  <select bind:value={formDoc.proceso} required class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                    <option value="" disabled selected>Selecciona un proceso...</option>
                    {#each procesos as proc}
                      <option value={proc}>{proc}</option>
                    {/each}
                  </select>
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Documento Solicitado *</label>
                  <input bind:value={formDoc.documento} required type="text" placeholder="Nombre completo del documento" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de Documento *</label>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {#each ['formato', 'procedimiento', 'instructivo', 'manual', 'dofa', 'matriz'] as tipo}
                      <label class="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-xs cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" bind:group={formDoc.tipoDocumento} value={tipo} required class="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-gray-300" />
                        <span class="capitalize text-gray-700 font-medium">{tipo}</span>
                      </label>
                    {/each}
                  </div>
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Detalle o cambios a realizar (opcional)</label>
                  <textarea bind:value={formDoc.comentarios} rows="3" placeholder="Describe brevemente qué modificaciones planeas realizar..." class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"></textarea>
                </div>

                <div class="col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2 items-start text-[11px] text-blue-800 leading-relaxed">
                  <i class="fas fa-info-circle mt-0.5 shrink-0"></i>
                  <span><strong>Nota importante:</strong> El documento editable correspondiente le será enviado a su correo de contacto y deberá seguir el proceso normal de actualización de la documentación del SGC.</span>
                </div>
              </div>
            {:else}
              <!-- Formulario 2: Soporte -->
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                  <input bind:value={formSop.nombre} required type="text" placeholder="Tu nombre" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo de Contacto *</label>
                  <input bind:value={formSop.correo} required type="email" placeholder="ejemplo@correo.com" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>

                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Área / Dependencia *</label>
                  <input bind:value={formSop.dependencia} required type="text" placeholder="Ej: Talento Humano" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>
                <div class="col-span-2 sm:col-span-1">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de Soporte *</label>
                  <select bind:value={formSop.tipoSoporte} required class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                    <option value="" disabled selected>Selecciona una opción...</option>
                    <option value="error">Reportar un error/fallo</option>
                    <option value="mejora">Sugerencia de mejora</option>
                    <option value="consulta">Consulta técnica</option>
                    <option value="otro">Otro asunto</option>
                  </select>
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Asunto de la solicitud *</label>
                  <input bind:value={formSop.asunto} required type="text" placeholder="Asunto de soporte" class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                </div>

                <div class="col-span-2">
                  <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción detallada *</label>
                  <textarea bind:value={formSop.descripcion} required rows="4" placeholder="Explica detalladamente la falla o la solicitud técnica..." class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"></textarea>
                </div>
              </div>
            {/if}

            <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" on:click={cerrar} class="px-4 py-2.5 rounded-xl text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                class="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-900 shadow hover:opacity-90 transition-opacity disabled:opacity-50"
                style="background-color: #FFD402;"
              >
                {#if cargando}
                  <i class="fas fa-spinner animate-spin mr-1"></i> Enviando...
                {:else}
                  <i class="fas fa-paper-plane mr-1"></i> Enviar Solicitud
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-scale-up {
    animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
