<script lang="ts">
  export let minPorques: number = 3;
  export let onSave: (data: { datos_analisis: string[], causa_raiz: string }) => void;
  export let initialData: string[] = [''];
  export let initialCausaRaiz: string = '';
  export let readonly: boolean = false;

  let porques = Array.isArray(initialData) && initialData.length > 0 ? [...initialData] : ['', '', ''];
  let causaRaiz = initialCausaRaiz;

  function addPorque() {
    if (porques.length < 7) {
      porques = [...porques, ''];
    }
  }

  function removePorque(index: number) {
    if (porques.length > 1) {
      porques = porques.filter((_, i) => i !== index);
    }
  }

  function handleSave() {
    onSave({ datos_analisis: porques, causa_raiz: causaRaiz });
  }

  $: validCount = porques.filter(p => p.trim().length > 0).length;
  $: isValid = validCount >= minPorques && causaRaiz.trim().length > 0;
</script>

<div class="space-y-6 max-w-3xl mx-auto font-['Lato']">

  <!-- Tarjeta Didáctica para 5 Porqués -->
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
    <strong class="font-bold block mb-1">💡 ¿Cómo funciona la técnica de los 5 Porqués?</strong>
    Consiste en preguntarse sucesivamente <em>"¿Por qué ocurrió esto?"</em> sobre cada respuesta anterior hasta llegar al motivo original. Se requiere responder al menos <strong>{minPorques} preguntas</strong> para asegurar un buen análisis.
  </div>

  <div class="space-y-4 relative">
    {#each porques as pq, i}
      <div class="relative z-10 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all">
        <div class="flex items-center justify-between mb-2">
          <label for="porque-{i}" class="text-xs font-bold text-[#3359A4] uppercase tracking-wider flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-[#3359A4] text-white flex items-center justify-center text-xs">{i + 1}</span>
            ¿Por qué ocurrió el hecho {i === 0 ? 'inicial' : `anterior (${i})`}?
          </label>
          {#if !readonly && porques.length > 1}
            <button type="button" on:click={() => removePorque(i)} class="text-xs text-red-500 hover:text-red-700 font-bold">
              <i class="fas fa-trash-alt mr-1"></i> Quitar
            </button>
          {/if}
        </div>

        {#if readonly}
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800">{pq || 'N/A'}</div>
        {:else}
          <input 
            type="text" 
            id="porque-{i}"
            bind:value={porques[i]} 
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#3359A4] focus:ring-[#3359A4] text-sm py-2 px-3 border"
            placeholder={`Escribe la causa del nivel ${i + 1}...`}
          />
        {/if}
      </div>
    {/each}
  </div>

  {#if !readonly && porques.length < 7}
    <div class="flex justify-center mt-4">
      <button type="button" on:click={addPorque} class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">
        <i class="fas fa-plus text-blue-600"></i> Agregar otro ¿Por qué?
      </button>
    </div>
  {/if}

  {#if !readonly && validCount < minPorques}
    <p class="text-xs text-amber-700 font-semibold text-center bg-amber-50 p-2 rounded-lg border border-amber-200">
      ⚠️ Debes completar al menos {minPorques} preguntas con su respuesta para poder guardar. (Completadas: {validCount}/{minPorques})
    </p>
  {/if}

  <!-- Conclusión de Causa Raíz -->
  <div class="bg-blue-50 p-5 rounded-2xl border border-blue-200 mt-8">
    <label for="causa-raiz-5p" class="block text-sm font-bold text-[#3359A4] mb-1 font-['Montserrat']">
      Causa Raíz Final (Conclusión) *
    </label>
    <p class="text-xs text-blue-800 mb-3">Resume aquí la causa raíz definitiva identificada en el último porqué:</p>
    
    {#if readonly}
      <p class="text-sm font-medium text-gray-900 bg-white p-4 rounded-xl border border-gray-200">{causaRaiz || 'No registrada'}</p>
    {:else}
      <textarea 
        id="causa-raiz-5p" 
        bind:value={causaRaiz} 
        rows="3" 
        class="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#3359A4] focus:ring-[#3359A4] text-sm p-3 border" 
        placeholder="La causa raíz principal que debemos eliminar es..."
      ></textarea>
    {/if}
  </div>

  {#if !readonly}
    <div class="flex justify-end mt-6">
      <button 
        type="button" 
        on:click={handleSave}
        disabled={!isValid}
        class="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all disabled:opacity-50"
      >
        <i class="fas fa-save"></i> Guardar Análisis de 5 Porqués
      </button>
    </div>
  {/if}
</div>
