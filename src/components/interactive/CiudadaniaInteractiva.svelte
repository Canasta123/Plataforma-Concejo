<script>
  import FileExplorer from './FileExplorer.svelte';

  // Active tab: 'caracterizacion' | 'pqrsdf' | 'riesgos' | 'formatos'
  let activeTab = 'caracterizacion';

  // State for DOFA selected quadrant (null, 'debilidades', 'oportunidades', 'fortalezas', 'amenazas')
  let selectedQuadrant = 'debilidades';

  // Active step for PQRSDF workflow (0 to 4)
  let pqrsdfStep = 0;
  const pqrsdfSteps = [
    {
      title: "1. Recepción",
      desc: "Ingreso de la Petición",
      icon: "fas fa-inbox",
      details: "El ciudadano presenta su PQRSDF por cualquiera de los canales (virtual, presencial o telefónico). Se verifica que contenga la información mínima requerida para su trámite."
    },
    {
      title: "2. Radicación",
      desc: "Constancia de Radicado",
      icon: "fas fa-barcode",
      details: "Se ingresa al sistema y se le asigna un número de radicado único, fecha y hora oficial. Al ciudadano se le entrega una constancia física o notificación por correo electrónico."
    },
    {
      title: "3. Distribución",
      desc: "Asignación al Responsable",
      icon: "fas fa-share-nodes",
      details: "Desde la ventanilla única se direcciona la petición al área competente para resolver el asunto (ej. Presidencia, Secretaría General, Comisiones)."
    },
    {
      title: "4. Gestión y Control",
      desc: "Estudio y Proyección",
      icon: "fas fa-business-time",
      details: "El funcionario a cargo proyecta la respuesta y realiza los trámites necesarios. El Líder de PQRSDF realiza monitoreos mensuales para evitar vencimientos de términos legales."
    },
    {
      title: "5. Respuesta Oficial",
      desc: "Notificación y Cierre",
      icon: "fas fa-paper-plane",
      details: "Se suscribe la respuesta formal y se notifica al ciudadano mediante el canal elegido (físico o digital), registrando la fecha de cierre en el sistema."
    }
  ];

  // Plazos PQRSDF
  const plazos = [
    { type: "Interés General o Particular", time: "15 días hábiles", desc: "Peticiones estándar de los ciudadanos.", bg: "bg-blue-50 text-brand-blue border-blue-100" },
    { type: "Información y Copias", time: "10 días hábiles", desc: "Solicitudes de expedición de copias de documentos oficiales.", bg: "bg-yellow-50 text-brand-gold border-yellow-100" },
    { type: "Consultas y Conceptos", time: "30 días hábiles", desc: "Consultas jurídicas o técnicas del área de competencia del Concejo.", bg: "bg-purple-50 text-purple-700 border-purple-100" },
    { type: "Otras Autoridades Públicas", time: "10 días hábiles", desc: "Requerimientos de información de entidades del Estado.", bg: "bg-green-50 text-green-700 border-green-100" },
    { type: "Congresistas o Concejales", time: "5 días hábiles", desc: "Consultas especiales formuladas por corporados.", bg: "bg-red-50 text-red-700 border-red-100" }
  ];

  // Canales de Atención
  const canales = [
    { name: "Presencial / Escrito", icon: "fas fa-building-user", text: "Ventanilla única de atención física en el Concejo Municipal (Chía)." },
    { name: "Telefónico", icon: "fas fa-phone-volume", text: "Líneas de atención telefónica de la corporación para consulta y radicación verbal." },
    { name: "Virtual (Web y Correo)", icon: "fas fa-globe", text: "Formulario web de PQRSDF y correo institucional: correspondencia@concejomunicipalchia.gov.co" }
  ];

  // Risks & Controls (MECI 2026)
  let activeRiskIndex = 0;
  const riesgosMeci = [
    {
      id: "R1",
      tipo: "Reputacional",
      name: "Imagen negativa de la entidad ante sus grupos de valor",
      cause: "Falta de receptividad o insatisfacción de la comunidad de Chía y demás grupos de valor frente a los ejercicios de relacionamiento.",
      consequence: "Pérdida de confianza institucional, baja participación en el control social y descrédito en la gestión de la corporación.",
      controls: [
        {
          no: "1",
          desc: "El Líder del Proceso de Relacionamiento realiza seguimiento cuatrimestral a las estrategias definidas (participación, PQRSDF, canales, PTEP y atención al ciudadano) y evalúa los resultados en el Comité Institucional de Gestión y Desempeño.",
          type: "Preventivo",
          impl: "Manual",
          eval: "Documentado / Con Registro"
        },
        {
          no: "2",
          desc: "Evaluar la percepción de los grupos de valor a través de encuestas anuales de satisfacción en todas las áreas de relación ciudadana. En caso de no cumplir la meta, se genera una acción correctiva formal.",
          type: "Preventivo",
          impl: "Manual",
          eval: "Documentado / Con Registro"
        }
      ],
      actions: "Aplicar la caracterización y guías del proceso de Relacionamiento con el Ciudadano, realizando seguimientos cuatrimestrales de participación y analizando grupos de valor mediante asistencias a plenarias y comisiones."
    },
    {
      id: "R2",
      tipo: "Disciplinario, Económico y Reputacional",
      name: "Investigaciones administrativas y disciplinarias por contestación fuera de los términos legales",
      cause: "Contestación y/o respuestas fuera de los términos de ley para Derechos de Petición, acciones de tutela o demandas judiciales.",
      consequence: "Sanciones disciplinarias por parte de la Procuraduría, condenas económicas a la corporación por tutelas y aumento de quejas.",
      controls: [
        {
          no: "1",
          desc: "El Líder de PQRSDF realiza seguimiento mensual al consolidado de la corporación para control de términos y emite alertas tempranas a las áreas responsables.",
          type: "Preventivo",
          impl: "Manual",
          eval: "Sin Documentar / Con Registro"
        }
      ],
      actions: "Generar y enviar mensualmente a cada responsable, desde el área de Gestión Documental, el reporte consolidado de peticiones pendientes por tramitar o cerrar en el sistema de correspondencia."
    }
  ];

  // Files for download
  const documentosPdf = [
    { name: "Caracterización del Proceso (RC)", path: "/C-Procesos/RC.pdf", icon: "fas fa-file-pdf text-red-600", desc: "Ficha técnica general del proceso" },
    { name: "Manual de Ventanilla Única (VUAR)", path: "/C-Procedimientos/MANUAL VENTANILLA ÚNICA VUAR.pdf", icon: "fas fa-book text-blue-600", desc: "Normas de radicación y recepción" },
    { name: "Procedimiento de Audiencia Pública", path: "/C-Procedimientos/1. PROCEDIMIENTO AUDIENCIA PUBLICA.pdf", icon: "fas fa-file-pdf text-red-600", desc: "Mecanismo de rendición de cuentas" },
    { name: "Procedimiento Publicación en Página Web", path: "/C-Procedimientos/3. PROCEDIMIENTO PUBLICACION  INFORMACION PAGINA WEB.pdf", icon: "fas fa-file-pdf text-red-600", desc: "Transparencia y publicidad activa" },
    { name: "Procedimiento de Comunicación Convergente", path: "/C-Procedimientos/1. PROCEDIMIENTO PARA LA COMUNICACION CONVERGENTE.pdf", icon: "fas fa-file-pdf text-red-600", desc: "Lineamientos de difusión y prensa" },
    { name: "Procedimiento de Comunicación Interna y Externa", path: "/C-Procedimientos/2. PROCEDIMIENTO PARA LA COMUNICACION INTERNA Y EXTERNA.pdf", icon: "fas fa-file-pdf text-red-600", desc: "Gestión de canales institucionales" }
  ];

  // Categories of formats for explorer cards (kept exactly as in the filesystem)
  const formatCategories = [
    { title: "Transparencia y Ética", path: "Formatos/3. Relacionamiento con la Ciudadanía/Transparencia y Ética", icon: "fas fa-eye text-blue-700 bg-blue-50" },
    { title: "Servicio al Ciudadano", path: "Formatos/3. Relacionamiento con la Ciudadanía/Servicio al Ciudadano", icon: "fas fa-headset text-green-700 bg-green-50" },
    { title: "Gestión y Planeación", path: "Formatos/3. Relacionamiento con la Ciudadanía/Gestión y Planeación", icon: "fas fa-tasks text-yellow-700 bg-yellow-50" },
    { title: "Manuales y Normativas", path: "Formatos/3. Relacionamiento con la Ciudadanía/Manuales y Normativas", icon: "fas fa-book-reader text-purple-700 bg-purple-50" }
  ];
</script>

<div class="ciudadania-dashboard flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
  <!-- Pestañas de Navegación del Dashboard -->
  <div class="flex flex-wrap border-b border-slate-200 bg-white p-2 gap-2">
    <button
      class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all {activeTab === 'caracterizacion' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}"
      on:click={() => activeTab = 'caracterizacion'}
    >
      <i class="fas fa-address-card"></i>
      <span>Caracterización y DOFA</span>
    </button>
    <button
      class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all {activeTab === 'pqrsdf' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}"
      on:click={() => activeTab = 'pqrsdf'}
    >
      <i class="fas fa-headset"></i>
      <span>Canales y PQRSDF</span>
    </button>
    <button
      class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all {activeTab === 'riesgos' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}"
      on:click={() => activeTab = 'riesgos'}
    >
      <i class="fas fa-shield-halved"></i>
      <span>Gestión de Riesgos (MECI)</span>
    </button>
    <button
      class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all {activeTab === 'formatos' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}"
      on:click={() => activeTab = 'formatos'}
    >
      <i class="fas fa-folder-open"></i>
      <span>Documentos y Formatos</span>
    </button>
  </div>

  <!-- Contenido de las Pestañas -->
  <div class="flex-1 p-6 overflow-y-auto min-h-0">
    
    <!-- PESTAÑA 1: CARACTERIZACIÓN Y DOFA -->
    {#if activeTab === 'caracterizacion'}
      <div class="space-y-6 animate-fade-in">
        
        <!-- Ficha Resumen -->
        <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
            <span class="text-[10px] uppercase font-bold text-slate-400">Líder del Proceso</span>
            <h4 class="text-lg font-bold text-brand-blue flex items-center gap-2 mt-1">
              <i class="fas fa-user-tie text-brand-gold"></i>
              Secretaría General
            </h4>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              Responsable directo de articular las estrategias estatales de servicio con la ciudadanía de Chía.
            </p>
          </div>
          <div class="md:col-span-2 space-y-4">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Objetivo del Proceso</span>
              <p class="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                Garantizar un relacionamiento efectivo y participativo entre el Concejo Municipal, la ciudadanía y grupos de interés, dando cumplimiento a la normatividad vigente, para así promover la participación ciudadana, la accesibilidad y transparencia.
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400">Alcance</span>
              <p class="text-xs text-slate-600 leading-relaxed mt-1">
                Inicia con la identificación de los grupos de valor y sus necesidades y finaliza con la optimización del proceso. Aplica para los escenarios de relacionamiento institucional con la ciudadanía, los usuarios y grupos de valor.
              </p>
            </div>
          </div>
        </div>

        <!-- Matriz DOFA Interactiva -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue shadow-sm">
              <i class="fas fa-chart-pie"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800">Matriz DOFA del Proceso (Planeación 2026)</h3>
              <p class="text-xs text-slate-500">Haz clic en cada cuadrante para expandir sus factores claves en detalle</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Cuadrante 2x2 Selector -->
            <div class="lg:col-span-6 grid grid-cols-2 gap-3 w-full">
              <!-- Fortalezas -->
              <button
                class="flex flex-col p-4 rounded-xl border transition-all text-left group h-[130px] justify-between {selectedQuadrant === 'fortalezas' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/20'}"
                on:click={() => selectedQuadrant = 'fortalezas'}
              >
                <div class="flex justify-between items-start w-full">
                  <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">F</div>
                  <i class="fas fa-arrow-trend-up text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-emerald-900">Fortalezas</h4>
                  <span class="text-[10px] text-slate-400">Aspectos positivos internos</span>
                </div>
              </button>
              
              <!-- Debilidades -->
              <button
                class="flex flex-col p-4 rounded-xl border transition-all text-left group h-[130px] justify-between {selectedQuadrant === 'debilidades' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-100 shadow-sm' : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/20'}"
                on:click={() => selectedQuadrant = 'debilidades'}
              >
                <div class="flex justify-between items-start w-full">
                  <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">D</div>
                  <i class="fas fa-arrow-trend-down text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-rose-900">Debilidades</h4>
                  <span class="text-[10px] text-slate-400">Puntos de mejora internos</span>
                </div>
              </button>

              <!-- Oportunidades -->
              <button
                class="flex flex-col p-4 rounded-xl border transition-all text-left group h-[130px] justify-between {selectedQuadrant === 'oportunidades' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/20'}"
                on:click={() => selectedQuadrant = 'oportunidades'}
              >
                <div class="flex justify-between items-start w-full">
                  <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">O</div>
                  <i class="fas fa-lightbulb text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-blue-900">Oportunidades</h4>
                  <span class="text-[10px] text-slate-400">Factores externos a explotar</span>
                </div>
              </button>

              <!-- Amenazas -->
              <button
                class="flex flex-col p-4 rounded-xl border transition-all text-left group h-[130px] justify-between {selectedQuadrant === 'amenazas' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/20'}"
                on:click={() => selectedQuadrant = 'amenazas'}
              >
                <div class="flex justify-between items-start w-full">
                  <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">A</div>
                  <i class="fas fa-triangle-exclamation text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-amber-900">Amenazas</h4>
                  <span class="text-[10px] text-slate-400">Riesgos externos a mitigar</span>
                </div>
              </button>
            </div>

            <!-- Panel Detalle Cuadrante Activo -->
            <div class="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[272px] flex flex-col">
              {#if selectedQuadrant === 'fortalezas'}
                <div class="animate-fade-in flex flex-col h-full">
                  <h4 class="text-xs font-bold text-emerald-800 flex items-center gap-2 mb-3">
                    <i class="fas fa-circle-check text-sm text-emerald-500"></i>
                    FORTALEZAS INTERNAS
                  </h4>
                  <ul class="space-y-3 flex-1">
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Acceso a Tecnología:</strong> Canales digitales institucionales y automatización de la gestión del trámite de cara al usuario.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Personal Capacitado:</strong> Experiencia demostrada para brindar una atención con calidez y altos estándares de calidad en PQRSDF.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Cultura de Transparencia:</strong> Garantía estricta de participación de grupos de valor mediante el cumplimiento formal de la ley en audiencias y comisiones.
                      </div>
                    </li>
                  </ul>
                </div>
              {:else if selectedQuadrant === 'debilidades'}
                <div class="animate-fade-in flex flex-col h-full">
                  <h4 class="text-xs font-bold text-rose-800 flex items-center gap-2 mb-3">
                    <i class="fas fa-circle-xmark text-sm text-rose-500"></i>
                    DEBILIDADES INTERNAS
                  </h4>
                  <ul class="space-y-3 flex-1">
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Lenguaje Complejo:</strong> Dificultad para formular y ofrecer información pública de manera clara, sencilla y accesible para todos los ciudadanos.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Canales Limitados:</strong> Ciertos cuellos de botella en la robustez física y de recursos para procesar picos en la demanda ciudadana.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Contacto Directo:</strong> Complejidad en lograr canales directos y bidireccionales con todos los distintos segmentos y grupos de valor de la comunidad.
                      </div>
                    </li>
                  </ul>
                </div>
              {:else if selectedQuadrant === 'oportunidades'}
                <div class="animate-fade-in flex flex-col h-full">
                  <h4 class="text-xs font-bold text-blue-800 flex items-center gap-2 mb-3">
                    <i class="fas fa-lightbulb text-sm text-blue-500"></i>
                    OPORTUNIDADES EXTERNAS
                  </h4>
                  <ul class="space-y-3 flex-1">
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Demanda de Participación:</strong> Incremento en el interés de la ciudadanía de Chía por ejercer control social e incidir directamente en las decisiones públicas del Concejo.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Tecnología e Inteligencia Artificial:</strong> Posibilidad de adoptar herramientas tecnológicas e IA para sistematizar la interacción, mejorar flujos y agilizar el control de plazos.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Inclusión Social:</strong> Mayor conciencia pública y metodologías sobre inclusión, permitiendo diseñar canales con formatos de lectura fácil y accesibilidad.
                      </div>
                    </li>
                  </ul>
                </div>
              {:else if selectedQuadrant === 'amenazas'}
                <div class="animate-fade-in flex flex-col h-full">
                  <h4 class="text-xs font-bold text-amber-800 flex items-center gap-2 mb-3">
                    <i class="fas fa-triangle-exclamation text-sm text-amber-500"></i>
                    AMENAZAS EXTERNAS
                  </h4>
                  <ul class="space-y-3 flex-1">
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Desinformación:</strong> Proliferación de noticias falsas o canales de información no oficiales que confunden a la comunidad y restan credibilidad a la corporación.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Problemas de Conectividad:</strong> Brechas tecnológicas y de red en ciertas veredas o sectores vulnerables que restringen el uso eficaz de canales virtuales.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Baja Participación Ciudadana:</strong> Desinterés o apatía general de algunos sectores sociales que limitan la efectividad del control social y la veeduría.
                      </div>
                    </li>
                    <li class="text-xs text-slate-700 flex items-start gap-2.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                      <div>
                        <strong>Normativa Cambiante:</strong> Reformas legales continuas de los entes reguladores del Estado, obligando a reestructurar procesos de forma rápida.
                      </div>
                    </li>
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        </div>

      </div>
    {/if}

    <!-- PESTAÑA 2: CANALES Y PQRSDF -->
    {#if activeTab === 'pqrsdf'}
      <div class="space-y-6 animate-fade-in">
        
        <!-- Canales de Atención -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          {#each canales as canal}
            <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center text-base shrink-0 shadow-sm">
                <i class={canal.icon}></i>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-800">{canal.name}</h4>
                <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">{canal.text}</p>
              </div>
            </div>
          {/each}
        </div>

        <!-- Stepper interactivo PQRSDF -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
            <i class="fas fa-route text-brand-gold text-lg"></i>
            <div>
              <h3 class="text-sm font-bold text-slate-800">Ciclo del Trámite de una PQRSDF</h3>
              <p class="text-[11px] text-slate-400">Paso a paso del flujo de atención desde la recepción hasta el cierre</p>
            </div>
          </div>

          <!-- Stepper Buttons -->
          <div class="flex items-center justify-between flex-wrap md:flex-nowrap gap-2 bg-slate-50 p-2 rounded-lg border border-slate-150">
            {#each pqrsdfSteps as step, i}
              <button
                class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all truncate {pqrsdfStep === i ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'}"
                on:click={() => pqrsdfStep = i}
              >
                <i class={step.icon}></i>
                <span class="hidden md:inline">{step.title.split('. ')[1]}</span>
                <span class="md:hidden">{step.title.split('. ')[0]}</span>
              </button>
            {/each}
          </div>

          <!-- Step Details Content -->
          <div class="p-4 bg-slate-50/50 rounded-lg border border-slate-100 flex gap-4 items-start">
            <div class="w-10 h-10 rounded-lg bg-brand-blue text-white flex items-center justify-center text-base shrink-0 shadow-sm">
              <i class={pqrsdfSteps[pqrsdfStep].icon}></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-brand-blue uppercase tracking-wider">{pqrsdfSteps[pqrsdfStep].title} - {pqrsdfSteps[pqrsdfStep].desc}</h4>
              <p class="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                {pqrsdfSteps[pqrsdfStep].details}
              </p>
            </div>
          </div>
        </div>

        <!-- Tabla Plazos de Ley -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <i class="fas fa-clock text-brand-blue text-sm"></i>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Términos Legales de Respuesta (Ley 1755 de 2015)</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {#each plazos as plazo}
              <div class="p-3 rounded-lg border flex flex-col justify-between {plazo.bg} shadow-sm">
                <div>
                  <h4 class="text-[11px] font-bold text-slate-700 leading-tight">{plazo.type}</h4>
                  <p class="text-[10px] text-slate-400 mt-1 leading-snug">{plazo.desc}</p>
                </div>
                <div class="text-right mt-3">
                  <span class="inline-block px-2 py-0.5 bg-white text-[10px] font-bold rounded border border-slate-200/50">
                    {plazo.time}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>

      </div>
    {/if}

    <!-- PESTAÑA 3: GESTIÓN DE RIESGOS (MECI) -->
    {#if activeTab === 'riesgos'}
      <div class="space-y-6 animate-fade-in">
        
        <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg shrink-0">
              <i class="fas fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800">Mapa de Riesgos por Procesos (MECI 2026)</h3>
              <p class="text-xs text-slate-500 leading-relaxed max-w-xl">
                De acuerdo con la Dimensión de Control Interno (MECI/MIPG), el Concejo identifica los riesgos críticos que impiden lograr la interacción óptima con la ciudadanía, estableciendo controles preventivos y planes de acción específicos.
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            {#each riesgosMeci as r, idx}
              <button
                class="px-4 py-2 rounded-lg text-xs font-bold border transition-all {activeRiskIndex === idx ? 'bg-brand-blue text-white border-brand-blue shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                on:click={() => activeRiskIndex = idx}
              >
                Riesgo {r.id}
              </button>
            {/each}
          </div>
        </div>

        <!-- Ficha de Riesgo Activo -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 flex-wrap">
            <div>
              <span class="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded border border-red-100">
                Clasificación: {riesgosMeci[activeRiskIndex].tipo}
              </span>
              <h4 class="text-sm font-bold text-brand-blue mt-2 leading-relaxed">
                Riesgo {riesgosMeci[activeRiskIndex].id}: {riesgosMeci[activeRiskIndex].name}
              </h4>
            </div>
            <div class="bg-slate-50 border border-slate-150 p-2 rounded-lg text-center min-w-[120px] shrink-0">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Nivel de Riesgo</span>
              <span class="text-sm font-black text-red-600 block mt-1">Alto ➔ Bajo</span>
              <span class="text-[9px] text-slate-400 block">(Con Mitigación)</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 class="text-xs font-bold text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-2">
                <i class="fas fa-circle-question text-slate-400"></i>Causa Raíz
              </h5>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                {riesgosMeci[activeRiskIndex].cause}
              </p>
            </div>
            <div>
              <h5 class="text-xs font-bold text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-2">
                <i class="fas fa-circle-exclamation text-slate-400"></i>Efecto o Consecuencia
              </h5>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                {riesgosMeci[activeRiskIndex].consequence}
              </p>
            </div>
          </div>

          <!-- Controles Establecidos -->
          <div class="space-y-3">
            <h5 class="text-xs font-bold text-slate-700 flex items-center gap-2">
              <i class="fas fa-shield-halved text-brand-gold"></i>Controles Oficiales Establecidos
            </h5>
            <div class="space-y-3">
              {#each riesgosMeci[activeRiskIndex].controls as ctrl}
                <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col gap-3">
                  <div class="flex gap-3 items-start">
                    <div class="w-6 h-6 rounded bg-brand-blue text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      C{ctrl.no}
                    </div>
                    <p class="text-xs text-slate-700 leading-relaxed font-medium flex-1">
                      {ctrl.desc}
                    </p>
                  </div>
                  <div class="flex items-center gap-4 text-[10px] border-t border-slate-200/60 pt-2 flex-wrap text-slate-500">
                    <span><strong>Tipo:</strong> {ctrl.type}</span>
                    <span><strong>Implementación:</strong> {ctrl.impl}</span>
                    <span><strong>Calidad:</strong> {ctrl.eval}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Plan de Acción -->
          <div class="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <h5 class="text-xs font-bold text-emerald-800 flex items-center gap-2 mb-2">
              <i class="fas fa-circle-check text-emerald-500"></i>Plan de Acción y Mitigación
            </h5>
            <p class="text-xs text-emerald-900 leading-relaxed font-medium">
              {riesgosMeci[activeRiskIndex].actions}
            </p>
          </div>

        </div>

      </div>
    {/if}

    <!-- PESTAÑA 4: DOCUMENTOS Y FORMATOS -->
    {#if activeTab === 'formatos'}
      <div class="space-y-8 animate-fade-in">
        
        <!-- Documentos y Guías de Consulta -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue shadow-sm">
              <i class="fas fa-book"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800">Procedimientos e Instrumentos de Consulta</h3>
              <p class="text-xs text-slate-500">Descarga directa de manuales oficiales del proceso</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each documentosPdf as doc}
              <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                    <i class="{doc.icon} text-lg"></i>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-800 leading-tight" title={doc.name}>{doc.name}</h4>
                    <p class="text-[10px] text-slate-400 mt-1 leading-snug">{doc.desc}</p>
                  </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-150/60 flex justify-end">
                  <a
                    href={doc.path}
                    download
                    class="bg-brand-blue hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <i class="fas fa-download text-[9px]"></i>
                    <span>Descargar PDF</span>
                  </a>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Explorador de Formatos Dinámico -->
        <div class="space-y-4 pt-4 border-t border-slate-200">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-brand-gold shadow-sm">
                <i class="fas fa-folder-tree"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">Formatos Relacionamiento con la Ciudadanía</h3>
                <p class="text-xs text-slate-500">Sube, edita o descarga plantillas desde Windows Explorer para sincronizarlas</p>
              </div>
            </div>
            <div class="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 border border-slate-200/60 px-2 py-1 rounded-md">
              Sincronización Dinámica Activa
            </div>
          </div>

          <!-- Explorer Cards Grid (Exact matching category paths as in implementation) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            {#each formatCategories as cat}
              <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col h-[400px]">
                <h4 class="font-bold text-brand-blue text-sm mb-3 flex items-center shrink-0">
                  <div class="w-6 h-6 rounded flex items-center justify-center mr-2 text-[10px] {cat.icon}">
                  </div>
                  {cat.title}
                </h4>
                <div class="flex-1 overflow-y-auto min-h-0 relative pr-1">
                  <FileExplorer client:load rutaBase={cat.path} />
                </div>
              </div>
            {/each}
          </div>
        </div>

      </div>
    {/if}

  </div>
</div>

<style>
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
