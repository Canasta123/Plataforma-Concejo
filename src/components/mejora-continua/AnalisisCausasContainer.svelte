<script lang="ts">
  import IshikawaDiagram from './IshikawaDiagram.svelte';
  import CincoPorques from './CincoPorques.svelte';

  export let hallazgoId: string;
  export let analisis: any = null; // null if no analysis saved yet
  export let isGestorOrResponsable: boolean = false;
  export let minPorques: number = 3;

  let activeTab: 'Categorías' | '5 Porqués' = (analisis?.metodologia === 'ishikawa' || analisis?.metodologia === 'Categorías') ? 'Categorías' : '5 Porqués';
  let loading = false;
  let error = '';
  let exito = '';

  $: isSaved = analisis !== null;

  async function handleSaveAnalisis(data: { datos_analisis: any, causa_raiz: string }) {
    loading = true;
    error = '';
    exito = '';
    try {
      const payload = {
        metodologia: activeTab === 'Categorías' ? 'ishikawa' : '5_porques',
        datos_analisis: data.datos_analisis,
        causa_raiz: data.causa_raiz
      };

      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}/analisis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al guardar el análisis de causas');
      
      analisis = resData.analisis || resData;
      exito = '¡Análisis de causas guardado exitosamente!';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function advanceStage() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/mejora-continua/hallazgos/${hallazgoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa_actual: 4 })
      });
      if (!res.ok) throw new Error('Error al avanzar a la Etapa 4');
      window.location.reload();
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 font-['Lato']">
  
  <!-- Tarjeta Didáctica / Guía Paso a Paso -->
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
    <div class="flex items-start gap-3">
      <div class="w-9 h-9 rounded-lg bg-[#3359A4] text-white flex items-center justify-center text-lg shrink-0 mt-0.5">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div>
        <h4 class="text-sm font-bold text-[#3359A4] font-['Montserrat'] mb-1">
          Guía Didáctica: ¿Cómo investigar la causa raíz del problema?
        </h4>
        <p class="text-xs text-blue-900 leading-relaxed">
          Para evitar que el hallazgo vuelva a ocurrir, debemos encontrar la <strong>Causa Raíz</strong> (el motivo verdadero de la falla). Selecciona uno de los 2 métodos amigables a continuación, llena las preguntas y concluye con la causa principal.
        </p>
      </div>
    </div>
  </div>

  <h3 class="text-lg font-bold text-gray-900 font-['Montserrat'] mb-4">Etapa 3: Investigación y Análisis de Causas</h3>

  {#if error}
    <div class="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 flex items-center gap-2 text-red-700 text-sm font-medium">
      <i class="fas fa-exclamation-circle"></i> {error}
    </div>
  {/if}

  {#if exito}
    <div class="rounded-xl bg-green-50 border border-green-200 p-4 mb-4 flex items-center gap-2 text-green-700 text-sm font-medium">
      <i class="fas fa-check-circle"></i> {exito}
    </div>
  {/if}

  <!-- Tab selector de metodología -->
  {#if !isSaved}
    <div class="flex border-b border-gray-200 mb-6 gap-2">
      <button 
        type="button"
        on:click={() => activeTab = 'Categorías'} 
        class="pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 {activeTab === 'Categorías' ? 'border-[#3359A4] text-[#3359A4]' : 'border-transparent text-gray-400 hover:text-gray-600'}"
      >
        <i class="fas fa-th-large text-xs"></i> 1. Análisis por Categorías (Método 6M)
      </button>
      <button 
        type="button"
        on:click={() => activeTab = '5 Porqués'} 
        class="pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 {activeTab === '5 Porqués' ? 'border-[#3359A4] text-[#3359A4]' : 'border-transparent text-gray-400 hover:text-gray-600'}"
      >
        <i class="fas fa-question-circle text-xs"></i> 2. Método de los 5 Porqués
      </button>
    </div>
  {:else}
    <div class="mb-6 flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
      <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
        <i class="fas fa-check-circle"></i> Metodología Utilizada: {analisis.metodologia === 'ishikawa' ? 'Análisis por Categorías (6M)' : 'Método de los 5 Porqués'}
      </span>
      {#if isGestorOrResponsable}
        <button
          type="button"
          on:click={() => { analisis = null; exito = ''; }}
          class="text-xs text-[#3359A4] hover:underline font-bold"
        >
          <i class="fas fa-edit"></i> Modificar Análisis
        </button>
      {/if}
    </div>
  {/if}

  <div class="mt-4">
    {#if activeTab === 'Categorías'}
      <IshikawaDiagram 
        readonly={isSaved || !isGestorOrResponsable} 
        initialData={analisis?.datos_analisis}
        initialCausaRaiz={analisis?.causa_raiz}
        onSave={handleSaveAnalisis} 
      />
    {:else}
      <CincoPorques 
        readonly={isSaved || !isGestorOrResponsable} 
        initialData={Array.isArray(analisis?.datos_analisis) ? analisis.datos_analisis : (analisis?.datos_analisis?.porques || [''])}
        initialCausaRaiz={analisis?.causa_raiz}
        {minPorques}
        onSave={handleSaveAnalisis} 
      />
    {/if}
  </div>

  {#if isSaved && isGestorOrResponsable}
    <div class="mt-8 pt-6 border-t border-gray-200 flex justify-end">
      <button 
        type="button" 
        on:click={advanceStage} 
        disabled={loading} 
        class="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all disabled:opacity-50"
      >
        <span>Avanzar al Plan de Acción (Etapa 4)</span>
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  {/if}

</div>
