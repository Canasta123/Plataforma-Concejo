<script lang="ts">
  export let onSave: (data: { datos_analisis: any, causa_raiz: string }) => void;
  export let initialData: Record<string, string[]> = {
    mano_de_obra: [],
    maquinaria: [],
    metodos: [],
    materiales: [],
    medicion: [],
    medio_ambiente: []
  };
  export let initialCausaRaiz: string = '';
  export let readonly: boolean = false;

  let categorias = [
    { id: 'mano_de_obra', label: '1. Personal / Talento Humano', desc: 'Falta de capacitación, sobrecarga, comunicación' },
    { id: 'maquinaria', label: '2. Equipos y Tecnología', desc: 'Fallas técnicas, software, mantenimiento' },
    { id: 'metodos', label: '3. Métodos y Procedimientos', desc: 'Instrucciones poco claras, falta de estándar' },
    { id: 'materiales', label: '4. Documentos / Insumos', desc: 'Formatos desactualizados, datos incompletos' },
    { id: 'medicion', label: '5. Controles y Medición', desc: 'Falta de seguimiento, indicadores desalineados' },
    { id: 'medio_ambiente', label: '6. Entorno y Organización', desc: 'Espacio físico, clima organizacional, ruido' }
  ];

  let datosAnalisis: Record<string, string[]> = {
    mano_de_obra: Array.isArray(initialData?.mano_de_obra) ? [...initialData.mano_de_obra] : [],
    maquinaria: Array.isArray(initialData?.maquinaria) ? [...initialData.maquinaria] : [],
    metodos: Array.isArray(initialData?.metodos) ? [...initialData.metodos] : [],
    materiales: Array.isArray(initialData?.materiales) ? [...initialData.materiales] : [],
    medicion: Array.isArray(initialData?.medicion) ? [...initialData.medicion] : [],
    medio_ambiente: Array.isArray(initialData?.medio_ambiente) ? [...initialData.medio_ambiente] : []
  };

  let causaRaiz = initialCausaRaiz;
  let newCauses: Record<string, string> = {
    mano_de_obra: '',
    maquinaria: '',
    metodos: '',
    materiales: '',
    medicion: '',
    medio_ambiente: ''
  };

  function addCause(categoryId: string) {
    const val = newCauses[categoryId]?.trim();
    if (val) {
      datosAnalisis[categoryId] = [...(datosAnalisis[categoryId] || []), val];
      newCauses[categoryId] = '';
    }
  }

  function removeCause(categoryId: string, index: number) {
    if (!readonly) {
      datosAnalisis[categoryId] = datosAnalisis[categoryId].filter((_, i) => i !== index);
    }
  }

  function handleSave() {
    onSave({ datos_analisis: datosAnalisis, causa_raiz: causaRaiz });
  }
</script>

<div class="space-y-6 font-['Lato']">

  <!-- Tarjeta Didáctica -->
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
    <strong class="font-bold block mb-1">💡 ¿Cómo funciona el Análisis por Categorías (6M)?</strong>
    Analiza el problema explorando 6 áreas clave (Personal, Equipos, Métodos, Documentos, Controles y Entorno). Escribe causas potenciales en cada tarjeta y luego concluye cuál es la <strong>Causa Raíz Principal</strong>.
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each categorias as cat}
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between shadow-sm">
        <div>
          <h4 class="font-bold text-gray-800 text-sm mb-0.5 font-['Montserrat']">{cat.label}</h4>
          <p class="text-[11px] text-gray-400 mb-3">{cat.desc}</p>
          
          <ul class="space-y-2 mb-4">
            {#if datosAnalisis[cat.id] && datosAnalisis[cat.id].length > 0}
              {#each datosAnalisis[cat.id] as causa, i}
                <li class="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-gray-200 text-gray-800 shadow-2xs">
                  <span class="break-words font-medium">{causa}</span>
                  {#if !readonly}
                    <button type="button" class="text-red-500 hover:text-red-700 font-bold ml-2 text-sm" on:click={() => removeCause(cat.id, i)} title="Eliminar causa">&times;</button>
                  {/if}
                </li>
              {/each}
            {:else}
              <li class="text-xs text-gray-400 italic bg-white/50 p-2.5 rounded-lg border border-dashed border-gray-200 text-center">
                Sin posibles causas en este rubro
              </li>
            {/if}
          </ul>
        </div>

        {#if !readonly}
          <div class="flex gap-2 mt-2">
            <input 
              type="text" 
              bind:value={newCauses[cat.id]} 
              placeholder="Agregar posible causa..." 
              class="flex-1 rounded-lg border-gray-300 text-xs py-1.5 px-2.5 border focus:ring-[#3359A4]"
              on:keydown={(e) => e.key === 'Enter' && addCause(cat.id)}
            />
            <button 
              type="button" 
              on:click={() => addCause(cat.id)}
              class="px-3 py-1.5 bg-[#3359A4] text-white rounded-lg font-bold text-xs hover:bg-blue-800 transition-colors"
            >
              +
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="bg-blue-50 p-5 rounded-2xl border border-blue-200 mt-8">
    <label for="causa-raiz-6m" class="block text-sm font-bold text-[#3359A4] mb-1 font-['Montserrat']">
      Causa Raíz Identificada (Conclusión) *
    </label>
    <p class="text-xs text-blue-800 mb-3">Con base en las causas analizadas arriba, escribe la causa raíz principal:</p>
    
    {#if readonly}
      <p class="text-sm font-medium text-gray-900 bg-white p-4 rounded-xl border border-gray-200">{causaRaiz || 'No registrada'}</p>
    {:else}
      <textarea 
        id="causa-raiz-6m" 
        bind:value={causaRaiz} 
        rows="3" 
        class="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#3359A4] focus:ring-[#3359A4] text-sm p-3 border" 
        placeholder="Describe la causa raíz principal que genera la desviación..."
      ></textarea>
    {/if}
  </div>

  {#if !readonly}
    <div class="flex justify-end mt-6">
      <button 
        type="button" 
        on:click={handleSave}
        disabled={!causaRaiz.trim()}
        class="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all disabled:opacity-50"
      >
        <i class="fas fa-save"></i> Guardar Análisis por Categorías
      </button>
    </div>
  {/if}
</div>
