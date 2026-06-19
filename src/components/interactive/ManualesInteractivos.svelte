<script>
  // Active manual tab: 'vuar' (Ventanilla Única) or 'archivo' (Gestión de Archivo)
  let activeTab = 'vuar';

  // Active step for Ventanilla Única stepper (0 to 3)
  let vuarStep = 0;
  const vuarSteps = [
    {
      title: "1. Recepción",
      desc: "Recepción de documentos",
      icon: "fas fa-inbox",
      details: "Verificar folios, firmas y anexos del documento físico o digital. Si la petición está incompleta o carece de firma, se le informa al ciudadano bajo el principio de facilitación administrativa para su respectivo subsane."
    },
    {
      title: "2. Radicación",
      desc: "Impresión del Sticker",
      icon: "fas fa-barcode",
      details: "Se genera un sticker único (físico o digital en la web) que contiene número consecutivo de radicado, fecha, hora, folios y destinatario. Este número es la identificación oficial y única para todo el trámite."
    },
    {
      title: "3. Digitalización",
      desc: "Escaneo a PDF",
      icon: "fas fa-file-pdf",
      details: "Los documentos físicos se escanean a formato PDF (escala de grises, resolución mínima de 200 dpi, con OCR/reconocimiento de texto). Esto garantiza la legibilidad y la búsqueda ágil de datos."
    },
    {
      title: "4. Distribución",
      desc: "Entrega física/virtual",
      icon: "fas fa-route",
      details: "Se realiza la entrega física o asignación virtual en el software de correspondencia. Los recorridos de distribución interna física se realizan en horarios programados (Mañana: 9:00 am y 11:30 am, Tarde: 3:30 pm)."
    }
  ];

  // Active step for Archivística stepper (0 to 4)
  let archivoStep = 0;
  const archivoSteps = [
    {
      title: "1. Clasificación",
      desc: "Identificar Series",
      icon: "fas fa-list-check",
      details: "Identificar la serie o subserie a la que pertenece el expediente según la Tabla de Retención Documental (TRD) de la oficina productora."
    },
    {
      title: "2. Ordenación",
      desc: "Cronología estricta",
      icon: "fas fa-sort-amount-down",
      details: "Ordenar las hojas de forma cronológica (del primer documento que inició el trámite al fondo, al más reciente en la parte superior)."
    },
    {
      title: "3. Foliación",
      desc: "Numeración a lápiz",
      icon: "fas fa-pen-clip",
      details: "Escribir el número consecutivo con lápiz de grafito blando (HB/2H) en la esquina superior derecha del folio (cara recta). Máximo 200 folios por carpeta."
    },
    {
      title: "4. Rotulación",
      desc: "Marcar Carpeta/Caja",
      icon: "fas fa-tag",
      details: "Diligenciar y pegar el rótulo oficial en la tapa de la carpeta y en el frente de la caja archivadora, en el lugar de alineación indicado."
    },
    {
      title: "5. Transferencia",
      desc: "Entrega a Central",
      icon: "fas fa-truck-ramp-box",
      details: "Elaborar el Formato Único de Inventario Documental (FUID) para hacer la transferencia formal de los expedientes al Archivo Central."
    }
  ];

  // Channels of attention for Ventanilla Única
  const canales = [
    { name: "Presencial", icon: "fas fa-users", text: "Atención en la oficina del Concejo en el horario oficial." },
    { name: "Escrito", icon: "fas fa-file-lines", text: "Radicación de peticiones físicas directamente en la ventanilla." },
    { name: "Virtual", icon: "fas fa-laptop", text: "Sitio Web oficial y correo correspondencia@concejomunicipalchia.gov.co" },
    { name: "Telefónico", icon: "fas fa-phone", text: "Líneas de atención de la corporación para radicación y PQRSDF verbales." },
    { name: "Buzón", icon: "fas fa-mailbox", text: "Buzón de sugerencias ubicado en la entrada de la corporación." },
    { name: "Redes Sociales", icon: "fas fa-share-nodes", text: "Radicación de PQRSDF ingresadas formalmente vía canales sociales." }
  ];

  // Response times for PQRSDF
  const pqrsdfTimes = [
    { type: "Interés General / Particular", time: "15 días hábiles", bg: "bg-blue-50 text-brand-blue" },
    { type: "Información y Copias", time: "10 días hábiles", bg: "bg-yellow-50 text-brand-gold" },
    { type: "Consultas de Conceptos", time: "30 días hábiles", bg: "bg-purple-50 text-purple-700" },
    { type: "Otras Autoridades Públicas", time: "10 días hábiles", bg: "bg-green-50 text-green-700" },
    { type: "Congresistas o Concejales", time: "5 días hábiles", bg: "bg-red-50 text-red-700" }
  ];

  // Key formats detailed in the instructivo
  const formatosClave = [
    {
      name: "Hoja de Control",
      purpose: "Obligatorio en carpetas complejas (contratos, resoluciones). Registra cada tipo documental indexado con fecha y folios.",
      rule: "Se coloca al inicio de la carpeta, antes del primer folio. No se folia.",
      path: "/archivos/Formatos/7. Gestión Documental y Tecnologías de la Información/Gestión Documental/Organizacion y Archivo de Gestion/HOJA DE CONTROL.xlsx"
    },
    {
      name: "Testigo Documental",
      purpose: "Ficha de cartón o papel que reemplaza un documento original que ha sido retirado temporalmente de la carpeta para préstamo.",
      rule: "Indica fecha, responsable, folios retirados y el motivo del préstamo.",
      path: "/archivos/Formatos/7. Gestión Documental y Tecnologías de la Información/Gestión Documental/Organizacion y Archivo de Gestion/TESTIGO DOCUMENTAL.xlsx"
    },
    {
      name: "Rótulo de Medios Magnéticos",
      purpose: "Formato adhesivo circular o cuadrado para identificar CD/DVD/USB que contienen anexos digitales de las transferencias.",
      rule: "Debe estar diligenciado con el código de serie, nombre de la oficina y año.",
      path: "/archivos/Formatos/7. Gestión Documental y Tecnologías de la Información/Gestión Documental/Organizacion y Archivo de Gestion/ROTULO MEDIOS MAGNETICOS.xlsx"
    },
    {
      name: "FUID (Inventario)",
      purpose: "El Formato Único de Inventario Documental es la herramienta oficial para detallar las series que se entregan al Archivo Central.",
      rule: "Se entrega firmado en original y dos copias, adjuntando la base de datos digital en excel.",
      path: "/archivos/Formatos/7. Gestión Documental y Tecnologías de la Información/Gestión Documental/Organizacion y Archivo de Gestion/FUID.xlsx"
    }
  ];
</script>

<div class="manuales-container flex flex-col h-full bg-white rounded-xl card-shadow border-t-4 border-brand-blue overflow-hidden">
  
  <!-- Header de la sección -->
  <div class="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue shadow-sm">
        <i class="fas fa-book text-lg"></i>
      </div>
      <div>
        <h3 class="font-bold text-brand-blue text-lg">Guías y Manuales del Proceso</h3>
        <p class="text-xs text-gray-500">Consulta interactiva de directrices oficiales</p>
      </div>
    </div>

    <!-- Pestañas Conmutadoras -->
    <div class="tabs-switcher p-1 bg-gray-200 rounded-lg flex self-start md:self-auto shadow-inner relative z-10">
      <button 
        class="tab-btn px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 {activeTab === 'vuar' ? 'active bg-white text-brand-blue shadow-sm' : 'text-gray-600 hover:text-brand-blue'}"
        on:click={() => activeTab = 'vuar'}
      >
        <i class="fas fa-mail-bulk"></i>
        <span>Ventanilla Única</span>
      </button>
      <button 
        class="tab-btn px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 {activeTab === 'archivo' ? 'active bg-white text-brand-blue shadow-sm' : 'text-gray-600 hover:text-brand-blue'}"
        on:click={() => activeTab = 'archivo'}
      >
        <i class="fas fa-archive"></i>
        <span>Gestión de Archivo</span>
      </button>
    </div>
  </div>

  <!-- Contenido de las pestañas -->
  <div class="p-6 flex-1 overflow-y-auto custom-scroll flex flex-col gap-6">
    
    {#if activeTab === 'vuar'}
      <!-- SECCIÓN: VENTANILLA ÚNICA (VUAR 2026) -->
      
      <!-- Stepper del Documento -->
      <div>
        <h4 class="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <i class="fas fa-circle-play text-brand-blue"></i>
          <span>Ciclo de Correspondencia Oficial (Haz clic en cada paso)</span>
        </h4>
        <div class="grid grid-cols-4 gap-2 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
          {#each vuarSteps as step, i}
            <button 
              class="flex flex-col items-center p-3 rounded-lg transition-all text-center group {vuarStep === i ? 'bg-brand-blue text-white shadow-md' : 'bg-white hover:bg-blue-50 border border-gray-100'}"
              on:click={() => vuarStep = i}
            >
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm {vuarStep === i ? 'bg-white text-brand-blue' : 'bg-gray-100 text-brand-blue group-hover:bg-blue-100'}">
                <i class={step.icon}></i>
              </div>
              <span class="text-xs font-bold block truncate max-w-full">{step.title}</span>
              <span class="text-[9px] block opacity-75 truncate max-w-full hidden sm:inline">{step.desc}</span>
            </button>
          {/each}
        </div>

        <!-- Detalle del Paso Seleccionado -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-lg p-4 animate-fade-in">
          <h5 class="font-bold text-brand-blue text-xs uppercase mb-1 flex items-center gap-2">
            <i class={vuarSteps[vuarStep].icon}></i>
            <span>{vuarSteps[vuarStep].title} - {vuarSteps[vuarStep].desc}</span>
          </h5>
          <p class="text-xs text-gray-700 leading-relaxed font-medium">{vuarSteps[vuarStep].details}</p>
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Canales de Atención -->
      <div>
        <h4 class="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <i class="fas fa-circle-nodes text-brand-blue"></i>
          <span>Canales Oficiales de Radicación</span>
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          {#each canales as canal}
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-3 hover:shadow-md transition-all flex gap-3 items-start hover:-translate-y-0.5">
              <div class="w-8 h-8 rounded bg-white text-brand-blue border border-gray-100 flex items-center justify-center shrink-0">
                <i class={canal.icon}></i>
              </div>
              <div>
                <span class="text-xs font-bold text-brand-blue block">{canal.name}</span>
                <span class="text-[10px] text-gray-500 leading-tight block mt-0.5">{canal.text}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Tiempos de Respuesta PQRSDF -->
      <div>
        <h4 class="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <i class="fas fa-clock text-brand-blue"></i>
          <span>Términos y Plazos de Respuesta (Ley de PQRSDF)</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each pqrsdfTimes as item}
            <div class="border border-gray-100 rounded-lg p-3 flex justify-between items-center bg-gray-50">
              <span class="text-xs font-medium text-gray-600 pr-2">{item.type}</span>
              <span class="text-xs font-bold px-2 py-1 rounded shrink-0 shadow-sm {item.bg}">{item.time}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Descarga Manual -->
      <div class="bg-brand-blue/5 border border-brand-blue/10 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
        <div class="flex items-center gap-3">
          <i class="far fa-file-pdf text-3xl text-red-500"></i>
          <div>
            <span class="text-xs font-bold text-brand-blue block">Documento de Referencia Completo</span>
            <span class="text-[11px] text-gray-500 block">Manual de Ventanilla Única de Atención al Ciudadano 2026 (PDF)</span>
          </div>
        </div>
        <a 
          href="/archivos/MANUAL DE VENTANILLA UNICA VUAR 2026.pdf"
          download
          class="bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded shadow-md transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <i class="fas fa-download"></i>
          <span>Descargar Manual PDF</span>
        </a>
      </div>

    {:else}
      <!-- SECCIÓN: INSTRUCTIVO DE ARCHIVO -->

      <!-- Stepper del Proceso de Archivo -->
      <div>
        <h4 class="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <i class="fas fa-circle-play text-brand-blue"></i>
          <span>Organización Archivística en Oficina (Haz clic en cada paso)</span>
        </h4>
        <div class="grid grid-cols-5 gap-1.5 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
          {#each archivoSteps as step, i}
            <button 
              class="flex flex-col items-center p-2 rounded-lg transition-all text-center group {archivoStep === i ? 'bg-brand-blue text-white shadow-md' : 'bg-white hover:bg-blue-50 border border-gray-100'}"
              on:click={() => archivoStep = i}
            >
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm {archivoStep === i ? 'bg-white text-brand-blue' : 'bg-gray-100 text-brand-blue group-hover:bg-blue-100'}">
                <i class={step.icon}></i>
              </div>
              <span class="text-[10px] font-bold block truncate max-w-full">{step.title}</span>
              <span class="text-[8px] block opacity-75 truncate max-w-full hidden sm:inline">{step.desc}</span>
            </button>
          {/each}
        </div>

        <!-- Detalle del Paso Seleccionado -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-lg p-4 animate-fade-in">
          <h5 class="font-bold text-brand-blue text-xs uppercase mb-1 flex items-center gap-2">
            <i class={archivoSteps[archivoStep].icon}></i>
            <span>{archivoSteps[archivoStep].title} - {archivoSteps[archivoStep].desc}</span>
          </h5>
          <p class="text-xs text-gray-700 leading-relaxed font-medium">{archivoSteps[archivoStep].details}</p>
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Guía Práctica de Foliación -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 border border-gray-200/60 rounded-xl p-4 flex flex-col gap-3">
          <h5 class="font-bold text-brand-blue text-sm border-b border-gray-200 pb-2 flex items-center gap-2">
            <i class="fas fa-file-signature text-brand-gold"></i>
            <span>Reglas de Foliación Directas</span>
          </h5>
          <ul class="space-y-2 text-xs text-gray-600 leading-relaxed font-medium">
            <li class="flex items-start gap-2">
              <i class="fas fa-chevron-right text-brand-gold mt-1 text-[9px]"></i>
              <span><strong>Mina blanda (HB o 2H):</strong> Escribir siempre a lápiz suave en la esquina superior derecha del folio.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-chevron-right text-brand-gold mt-1 text-[9px]"></i>
              <span><strong>Solo Cara Recto:</strong> Escribir el número únicamente en la cara frontal del folio (no numerar reversos).</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-chevron-right text-brand-gold mt-1 text-[9px]"></i>
              <span><strong>Capacidad máxima:</strong> Máximo 200 folios por carpeta legajadora plástica.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-chevron-right text-brand-gold mt-1 text-[9px]"></i>
              <span><strong>Consecutivo Continuo:</strong> La carpeta 2 iniciará con el folio 201 en adelante (no reiniciar en 1).</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-chevron-right text-brand-gold mt-1 text-[9px]"></i>
              <span><strong>Prohibido suplementos:</strong> No usar subíndices (ej. 1A, 1B, 1-Bis). Debe ser numeración pura.</span>
            </li>
          </ul>
        </div>

        <div class="bg-gray-50 border border-gray-200/60 rounded-xl p-4 flex flex-col gap-3">
          <h5 class="font-bold text-brand-blue text-sm border-b border-gray-200 pb-2 flex items-center gap-2">
            <i class="fas fa-triangle-exclamation text-brand-gold"></i>
            <span>Excepciones y Correcciones</span>
          </h5>
          <ul class="space-y-2 text-xs text-gray-600 leading-relaxed font-medium">
            <li class="flex items-start gap-2">
              <i class="fas fa-check text-green-600 mt-1 text-[10px]"></i>
              <span><strong>Corrección de error:</strong> Tachar con una sola línea diagonal (/) el número incorrecto y colocar el número corregido al lado de forma legible.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-ban text-red-500 mt-1 text-[10px]"></i>
              <span><strong>No foliar:</strong> Pastas de carpetas, hojas-guarda en blanco ni los separadores plásticos/cartones.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-object-group text-blue-600 mt-1 text-[10px]"></i>
              <span><strong>Formatos pequeños:</strong> Fotos o facturas pequeñas deben adherirse a una hoja en blanco y se folia únicamente esa hoja soporte.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fas fa-book-open text-purple-600 mt-1 text-[10px]"></i>
              <span><strong>Libros de fábrica:</strong> Libros contables o de actas impresos y foliados de fábrica se aceptan tal como vienen.</span>
            </li>
          </ul>
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Formatos Archivísticos Clave -->
      <div>
        <h4 class="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <i class="fas fa-folder-open text-brand-blue"></i>
          <span>Formatos Archivísticos Clave y sus Reglas</span>
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each formatosClave as formato}
            <div class="bg-gray-50/50 border border-gray-100 rounded-lg p-3.5 hover:shadow-md transition-all flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-xs font-bold text-brand-blue block mb-1">{formato.name}</span>
                  <a 
                    href={formato.path} 
                    download 
                    class="w-6 h-6 rounded-full bg-white hover:bg-brand-blue hover:text-white border border-gray-200/60 flex items-center justify-center text-gray-500 hover:shadow-sm transition-all shrink-0"
                    title="Descargar Plantilla"
                  >
                    <i class="fas fa-download text-[10px]"></i>
                  </a>
                </div>
                <p class="text-[11px] text-gray-500 leading-relaxed mb-2 font-medium">{formato.purpose}</p>
              </div>
              <span class="text-[10px] text-brand-gold bg-yellow-50 border border-yellow-100 px-2 py-1 rounded block self-start font-bold font-semibold">
                <i class="fas fa-circle-exclamation mr-1"></i>Regla: {formato.rule}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <hr class="border-gray-100" />

      <!-- Normas Archivo Central -->
      <div class="bg-gray-50 border border-gray-100 rounded-lg p-4 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-full bg-white text-brand-blue border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
          <i class="fas fa-clock-rotate-left text-lg"></i>
        </div>
        <div>
          <span class="text-xs font-bold text-brand-blue block">Préstamos y Consultas en el Archivo Central</span>
          <p class="text-[11px] text-gray-500 leading-relaxed mt-1 font-medium">
            Las dependencias pueden solicitar en préstamo expedientes transferidos. El tiempo máximo de préstamo es de <strong>10 días calendario</strong>, prorrogables por <strong>5 días adicionales</strong> previa solicitud escrita al técnico del archivo.
          </p>
        </div>
      </div>

      <!-- Descarga Manual -->
      <div class="bg-brand-blue/5 border border-brand-blue/10 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
        <div class="flex items-center gap-3">
          <i class="far fa-file-pdf text-3xl text-red-500"></i>
          <div>
            <span class="text-xs font-bold text-brand-blue block">Documento de Referencia Completo</span>
            <span class="text-[11px] text-gray-500 block">Instructivo para la Organización y Gestión de Archivos 2025 (PDF)</span>
          </div>
        </div>
        <a 
          href="/archivos/Instructivo gestion de archivo.pdf"
          download
          class="bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded shadow-md transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <i class="fas fa-download"></i>
          <span>Descargar Instructivo PDF</span>
        </a>
      </div>

    {/if}

  </div>
</div>

<style>
  .manuales-container {
    height: 100%;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  }

  .tabs-switcher {
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .tab-btn {
    min-width: 140px;
    justify-content: center;
  }

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

  /* Animación para cambio de pasos en el stepper */
  .animate-fade-in {
    animation: fadeIn 0.25s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
