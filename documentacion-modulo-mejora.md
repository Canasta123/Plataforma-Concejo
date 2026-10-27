# Especificación Funcional: Módulo de Mejora Continua y Acciones de Mejora

Este documento detalla la especificación funcional, el ciclo de vida de los hallazgos, el control de roles y permisos, y la lógica de monitoreo para la implementación de un módulo de Mejora Continua en tu plataforma personal, inspirado en las mejores prácticas del sistema de gestión Isolución.

---

## 1. Arquitectura e Integración del Módulo
El módulo de mejora continua no opera como un silo aislado, sino que se comporta como el receptor centralizado de desvíos, no conformidades y oportunidades de mejora detectados en todo el sistema:

### Orígenes de Entrada de Hallazgos (Integraciones Automatizadas)
* **Módulo de Auditorías:** Al registrar un hallazgo no conforme en una lista de chequeo durante una auditoría interna o externa, el sistema debe crear de forma automática un registro en este módulo.
* **Módulo de Medición de Indicadores:** Si un indicador cae por debajo de sus límites de tolerancia (zonas roja o amarilla), el sistema debe sugerir e iniciar de forma automática el registro de una acción correctiva o de mitigación.
* **Contexto Estratégico / Matriz DOFA:** Al identificar amenazas u oportunidades en el análisis DOFA de un proceso, la plataforma debe permitir la creación directa de acciones de mejora o preventivas asociadas.
* **Quejas y Reclamos de Clientes:** Las quejas graves registradas en el módulo de clientes que requieran un análisis de fondo deben ser escaladas directamente aquí como planes de acción formales.
* **Autocontrol:** Opción de registro manual para que cualquier colaborador autorizado reporte desviaciones cotidianas en sus respectivos procesos.

### Tipificación de Hallazgos
El sistema debe permitir categorizar los registros de acuerdo con los lineamientos de la norma ISO 9001:2015:
1. **Acciones Correctivas:** Para eliminar la causa raíz de una no conformidad real y evitar su recurrencia.
2. **Oportunidades de Mejora:** Para implementar optimizaciones proactivas en procesos estables.
3. **Acciones para Abordar Riesgos:** Para mitigar desvíos potenciales y amenazas antes de que ocurran.
4. **Tratamiento de Producto o Servicio No Conforme:** Para gestionar desvíos específicos en entregables antes de su liberación al cliente.

---

## 2. Ciclo de Vida del Hallazgo (Flujo de Trabajo)
El flujo del hallazgo dentro de la plataforma consta de cuatro etapas secuenciales obligatorias. Cada fase debe bloquear el avance a la siguiente hasta que se completen sus registros requeridos.

```
[1. Identificación y Registro] ──> [2. Tratamiento Inmediato] ──> [3. Análisis de Causas] ──> [4. Plan de Acción]
```

### Etapa 1: Identificación y Registro
* **Campos Requeridos de Entrada:**
  * **Título/Nombre:** Identificación clara y resumida de la no conformidad o hallazgo.
  * **Proceso:** Selección del proceso de la empresa donde se originó el hallazgo.
  * **Responsable General:** Usuario responsable de coordinar y vigilar todo el ciclo de vida del hallazgo hasta su cierre.
  * **Descripción / Evidencia:** Explicación detallada del hecho detectado.
  * **Requisito Incumplido:** Especificación del numeral normativo, requisito legal o procedimiento interno que se vulneró.

### Etapa 2: Tratamiento Inmediato (Mitigación)
* **Objetivo:** Contener y mitigar el impacto inmediato de la desviación.
* **Funcionalidad:**
  * Creación rápida de una o varias tareas de contención.
  * Asignación de un responsable de ejecución para cada tarea.
  * Definición de una **Fecha de Compromiso** o "ficha de compromiso" con alertas para su cumplimiento.

### Etapa 3: Análisis de Causas
Para evitar que el problema se repita, el módulo debe forzar la identificación de la causa raíz utilizando metodologías guiadas:
* **Diagrama de Ishikawa (Espina de Pescado):** Herramienta visual para clasificar causas en categorías tradicionales (Mano de Obra, Maquinaria, Métodos, Materiales, Medición, Medio Ambiente).
* **Los 5 Porqués:** Cadena interactiva de preguntas de causa y efecto.
  * *Lógica de Configuración:* El administrador del sistema puede definir como parámetro obligatorio que el usuario complete un mínimo de porqués (por ejemplo, tres o cinco) antes de que el sistema le permita formular la causa raíz final.

### Etapa 4: Plan de Acción
* **Objetivo:** Definir e implementar acciones correctivas permanentes que actúen sobre la causa raíz identificada en la etapa anterior.
* **Funcionalidad:**
  * Desglose de actividades específicas.
  * Asignación de responsables individuales por tarea.
  * Establecimiento de fechas límite individuales y flujos de seguimiento automatizados.

---

## 3. Matriz de Roles y Permisos (Esquema de Accesos)

Para estructurar la lógica de seguridad y visualización en tu base de datos, implementa los siguientes perfiles:

| Perfil | Rol en el Módulo | Funcionalidades Clave |
| :--- | :--- | :--- |
| **Administrador (Parametrizador)** | Configura el backend y las reglas de negocio del sistema de gestión. | • Activar/desactivar parámetros globales.<br>• Definir el número mínimo de "porqués" en la Etapa 3.<br>• Establecer el límite permitido de reformulaciones automáticas.<br>• Renombrar campos técnicos de la interfaz según la nomenclatura corporativa. |
| **Gestor (Líder de Calidad / Dueño de Proceso)** | Supervisa e impulsa el ciclo completo de los hallazgos en sus áreas de responsabilidad. | • Registrar nuevos hallazgos e iniciar flujos de trabajo.<br>• Evaluar la eficacia individual y global una vez completadas las acciones.<br>• Visualizar dashboards de desempeño del módulo. |
| **Usuario Ejecutor / Responsable** | Realiza las tareas asignadas en los planes de acción o tratamientos inmediatos. | • Ver su **Bandeja de Tareas Pendientes** con semaforización de vencimiento.<br>• Recibir notificaciones por correo electrónico con enlaces directos.<br>• Adjuntar archivos y reportar comentarios como evidencia de ejecución. |
| **Usuario de Consulta** | Auditor externo o directivo con acceso de solo lectura. | • Buscar, filtrar e inspeccionar hallazgos autorizados.<br>• Generar exportaciones sin capacidad para editar planes, causas o registros. |

---

## 4. Control de Eficacia y Lógica de "Reformulación"
Este componente asegura la mejora continua cerrando el ciclo de calidad de forma rigurosa:

```
[Fin de Tareas] ──> [Evaluación de Eficacia Global] 
                          │
                          ├─► [SÍ fue Eficaz] ──> [Cierre definitivo del Hallazgo]
                          │
                          └─► [NO fue Eficaz] ──> [Disparador de Reformulación] ──> ¿Límite excedido?
                                                                                        ├─► SÍ ──> Alerta Crítica al Líder
                                                                                        └─► NO ──> Reabrir Etapa 3 (Causas)
```

1. **Cierre de Tareas:** Los ejecutores completan el 100% de las tareas del plan de acción y cargan las evidencias.
2. **Evaluación de Eficacia:** El sistema genera de manera automatizada una tarea al Responsable General del Hallazgo (o al Gestor) para calificar la eficacia global de la acción tras un periodo prudencial.
3. **Flujo de Reformulación:**
   * **Resultado Eficaz:** El caso se cierra con éxito y el registro se archiva (solo lectura).
   * **Resultado No Eficaz:** Si se determina que las acciones no resolvieron el problema de fondo:
     * El sistema reabre el ciclo y retrocede obligatoriamente el hallazgo a la **Etapa 3 (Análisis de Causas)** para identificar qué falló.
     * Incrementa un contador acumulativo interno de `intentos_de_reformulacion` en la base de datos.
     * Si este contador supera el límite máximo parametrizado por el Administrador, bloquea la reformulación directa y eleva una notificación crítica al Administrador/Líder de Calidad para su intervención manual.

---

## 5. Monitoreo, Dashboards e Informes de Control

Un panel de control (dashboard) robusto e interactivo para este módulo debe contar con la siguiente infraestructura de datos:

### Filtros de Búsqueda y Clasificación
* **Estado:** Abiertos, Cerrados, Vencidos.
* **Proceso:** Clasificación por proceso dueño del hallazgo.
* **Tipo:** Acción Correctiva, Oportunidad de Mejora, Preventiva, etc.
* **Fechas:** Rango de fecha de apertura, fecha límite y fecha de cierre.
* **Responsable:** Búsqueda por Responsable General o ejecutor específico de tareas.

### Indicadores Clave de Desempeño (KPIs)
* **Tiempo de Ciclo Activo:** Días transcurridos desde la fecha de registro hasta hoy (en abiertos) o hasta la fecha de cierre.
* **Días para Responder:** Tiempo de tolerancia que le resta al responsable para registrar el análisis y el plan inicial.
* **Porcentaje de Avance:** Métrica calculada que promedia el avance de las subtareas del plan de acción frente a las tareas totales estimadas.
* **Semaforización Visual:**
  * **Rojo:** Tareas o hallazgos cuya fecha límite ya venció sin completarse.
  * **Amarillo:** Tareas a vencer dentro del rango crítico de advertencia (ej. 3 días hábiles antes).
  * **Verde:** Tareas en tiempo y forma, o hallazgos cerrados satisfactoriamente.
