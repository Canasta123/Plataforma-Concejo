<script lang="ts">
  let inputTxt = '';
  let cargando = false;
  let exito = '';
  let error = '';
  let resultados: { correo: string, ok: boolean, error?: string }[] = [];

  // Función para procesar CSV o texto pegado desde Excel (separado por tabuladores)
  function procesarTexto() {
    const lineas = inputTxt.trim().split('\n');
    const usuarios = [];
    
    for (let i = 0; i < lineas.length; i++) {
      // Intentar detectar si está separado por tabulador (Excel) o por comas (CSV)
      const linea = lineas[i].trim();
      if (!linea) continue;

      let partes = linea.split('\t');
      if (partes.length < 4) partes = linea.split(','); // Fallback a CSV
      
      if (partes.length >= 4) {
        // Formato esperado: Nombre, Correo, Rol, Cargo, [Correo_Notificacion]
        usuarios.push({
          nombre: partes[0].trim(),
          correo: partes[1].trim(),
          rol: partes[2].trim().toLowerCase(),
          cargo: partes[3].trim(),
          correo_notificacion: partes[4] ? partes[4].trim() : null
        });
      }
    }
    return usuarios;
  }

  async function importar() {
    if (cargando) return;
    error = '';
    exito = '';
    resultados = [];
    
    const usuarios = procesarTexto();
    if (usuarios.length === 0) {
      error = 'No se encontraron datos válidos. Asegúrate de seguir el formato indicado.';
      return;
    }

    if (!confirm(`Se van a importar ${usuarios.length} usuarios y se enviarán sus contraseñas por correo. ¿Continuar?`)) return;

    cargando = true;
    try {
      const res = await fetch('/api/mesa-ayuda/usuarios/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios })
      });

      const data = await res.json();
      if (res.ok) {
        resultados = data.resultados;
        const exitosos = resultados.filter(r => r.ok).length;
        exito = `Importación completada: ${exitosos} correctos, ${resultados.length - exitosos} con errores.`;
        if (exitosos > 0) inputTxt = ''; // Limpiar si hubo éxito parcial o total
      } else {
        error = data.error || 'Error en la importación';
      }
    } catch (e) {
      error = 'Error de red al intentar importar.';
    } finally {
      cargando = false;
    }
  }
</script>

<div>
  <div class="mb-4">
    <h2 class="text-lg font-bold text-gray-800" style="font-family: 'Montserrat', sans-serif;">Importación Masiva de Usuarios</h2>
    <p class="text-sm text-gray-500">Copia y pega desde Excel o escribe en formato CSV. Se creará la cuenta, se asignará una contraseña aleatoria y se enviará por correo automáticamente al usuario.</p>
  </div>

  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
    <h3 class="font-bold text-blue-800 text-sm mb-2"><i class="fas fa-info-circle"></i> Instrucciones de formato</h3>
    <p class="text-xs text-blue-700 mb-2">Pega los datos en el siguiente orden, separados por comas o copiados directo de Excel (columnas):</p>
    <code class="block bg-white p-2 text-xs border border-blue-100 rounded text-gray-700 font-mono">
      Nombre Completo, Correo Institucional, Rol (admin|agente|auditor|solicitante), Cargo, [Correo de notificaciones opcional]
    </code>
    <p class="text-xs text-blue-700 mt-2"><strong>Ejemplo:</strong> Juan Perez, juan@cmc.gov.co, solicitante, Asesor Jurídico</p>
  </div>

  {#if error}
    <div class="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
      <i class="fas fa-exclamation-circle"></i> {error}
    </div>
  {/if}

  {#if exito}
    <div class="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold">
      <i class="fas fa-check-circle"></i> {exito}
    </div>
  {/if}

  <div class="mb-4">
    <textarea 
      bind:value={inputTxt} 
      rows="8" 
      placeholder="Pega los datos aquí..." 
      class="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono whitespace-pre"
    ></textarea>
  </div>

  <button 
    on:click={importar} 
    disabled={cargando || inputTxt.trim().length === 0}
    class="px-4 py-2 bg-[#FFD402] text-gray-900 rounded-xl font-bold text-sm hover:bg-[#efc200] transition-colors disabled:opacity-50"
  >
    {#if cargando}
      <i class="fas fa-spinner fa-spin mr-2"></i> Procesando y enviando correos...
    {:else}
      <i class="fas fa-upload mr-2"></i> Importar Usuarios
    {/if}
  </button>

  {#if resultados.length > 0}
    <div class="mt-8">
      <h3 class="font-bold text-sm mb-3 text-gray-700">Resultados de la importación</h3>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <ul class="divide-y divide-gray-50 text-sm">
          {#each resultados as r}
            <li class="px-4 py-2 flex items-center justify-between">
              <span class="font-medium text-gray-700">{r.correo}</span>
              {#if r.ok}
                <span class="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold"><i class="fas fa-check"></i> Creado</span>
              {:else}
                <span class="text-red-600 text-xs">{r.error}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</div>
