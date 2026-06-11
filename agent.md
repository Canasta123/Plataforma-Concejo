# Agent Context: SGC — Concejo Municipal de Chía

Eres un **Desarrollador Fullstack Senior** responsable del mantenimiento y evolución del Sistema de Gestión de Calidad (SGC) y la Mesa de Ayuda del Concejo Municipal de Chía. Este archivo es tu fuente de verdad para entender la arquitectura, convenciones y reglas del proyecto.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Astro 6.x (SSR) | Adaptador `@astrojs/node`, output `server` |
| Componentes interactivos | Svelte 5 | Solo para UI con estado (modales, buscador, tableros reactivos) |
| Estilos | Tailwind CSS v4 | Sin `tailwind.config.js` — configurado via plugin Vite |
| Animaciones | GSAP 3 + ScrollTrigger | Registrado en `BaseLayout.astro` |
| Puerto dev | 3001 | El 3000 está ocupado en este equipo |
| Fuentes | Montserrat + Lato | Cargadas desde Google Fonts en `BaseLayout.astro` |
| Iconos | Font Awesome 6.4 | CDN en `BaseLayout.astro` |
| Base de datos | Supabase (PostgreSQL) | Usado en Mesa de Ayuda — cliente en `src/lib/supabase.ts` |
| Correo | Nodemailer + SMTP genérico | Notificaciones de tickets — helper en `src/lib/mailer.ts` (Gmail, Outlook, o cualquier proveedor) |
| Autenticación | JWT propio + bcrypt | Solo activa bajo `/mesa-ayuda/*` — sin impacto en el SGC principal |

---

## 2. Paleta de Colores (tokens CSS en `src/styles/global.css`)

```css
--color-brand-blue:  #3359A4   /* Estratégicos */
--color-brand-gold:  #FFD402   /* Apoyo (amarillo brillante) */
--color-brand-green: #009741   /* Misionales */
--color-brand-red:   #E30D21   /* Evaluación */
--color-brand-cyan:  #0384BA   /* Acento secundario */
```

### Colores por tipo de proceso (SGC)

| Tipo | Color principal | Header gradient | Tailwind equivalente |
|---|---|---|---|
| `estrategico` | `#3359A4` | `from-[#1e3a8a] to-[#3359A4]` | `text-brand-blue` |
| `misional` | `#009741` | `from-[#166534] to-[#16a34a]` | `text-green-700` |
| `apoyo` | `#FFD402` | `from-[#FFD402] to-[#FFA500]` | `text-brand-gold` |
| `evaluacion` | `#E30D21` | `from-[#991b1b] to-[#dc2626]` | `text-red-700` |

### Colores de estado (Mesa de Ayuda)

| Estado del ticket | Color | Clase Tailwind |
|---|---|---|
| `abierto` | `#3359A4` (azul) | `bg-blue-100 text-brand-blue` |
| `en_progreso` | `#FFD402` (dorado) | `bg-yellow-100 text-yellow-700` |
| `resuelto` | `#009741` (verde) | `bg-green-100 text-green-700` |
| `cerrado` | `#6B7280` (gris) | `bg-gray-100 text-gray-600` |
| SLA en riesgo | `#E30D21` (rojo) | `bg-red-100 text-red-700` |

**Regla:** Nunca usar `text-yellow-600`, `text-yellow-700`, `bg-yellow-600`, `bg-orange-*` para apoyo — se ven como café. Siempre usar `text-brand-gold` o `bg-yellow-400`.

---

## 3. Estructura de Archivos

```
sgc-cmc/
├── public/
│   ├── C-Procedimientos/
│   ├── C-Procesos/
│   ├── archivos/
│   └── logo1.png
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ProcessCard.astro
│   │   ├── DownloadButton.astro
│   │   ├── ExplorerCard.astro
│   │   ├── InfoModal.astro
│   │   ├── StatCard.astro
│   │   ├── TimelineStep.astro
│   │   ├── interactive/
│   │   │   ├── FloatingButton.svelte
│   │   │   ├── SearchModal.svelte
│   │   │   ├── UploadModal.svelte
│   │   │   ├── DownloadModal.svelte
│   │   │   └── PdfViewerModal.svelte
│   │   ├── navigation/
│   │   │   ├── ProcessNav.astro
│   │   │   └── QuickNav.astro
│   │   └── mesa-ayuda/                        # ← Componentes exclusivos de la Mesa de Ayuda
│   │       ├── TicketCard.astro               # Tarjeta de ticket en el dashboard
│   │       ├── StatusBadge.astro              # Badge de estado con color semafórico
│   │       ├── PriorityBadge.astro            # Badge de prioridad (Alta/Media/Baja)
│   │       ├── SlaIndicator.astro             # Semáforo visual de tiempo SLA restante
│   │       ├── interactive/
│   │       │   ├── TicketBoard.svelte         # Tablero reactivo de tickets (agente)
│   │       │   ├── TicketForm.svelte          # Formulario de creación de ticket
│   │       │   ├── TicketDetail.svelte        # Vista detalle + historial + respuesta
│   │       │   ├── KnowledgeSearch.svelte     # Buscador de artículos de autoayuda
│   │       │   ├── UserManager.svelte         # CRUD de usuarios (panel admin)
│   │       │   ├── ExportExcelModal.svelte    # Modal de filtros pre-export a Excel
│   │       │   └── UploadAttachment.svelte    # Subida de pantallazos al ticket
│   ├── data/
│   │   ├── procesos.json
│   │   ├── categorias-documentos.json
│   │   └── kb-articles.json                   # ← Artículos de base de conocimiento
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── ProcesoLayout.astro
│   │   ├── FormatosLayout.astro
│   │   └── MesaAyudaLayout.astro              # ← Layout exclusivo con auth guard
│   ├── lib/
│   │   ├── navigation.ts
│   │   ├── gsap.ts
│   │   ├── supabase.ts                        # ← Cliente Supabase (server-side)
│   │   ├── mailer.ts                          # ← Nodemailer + SMTP genérico
│   │   ├── excel.ts                           # ← Helper de generación de Excel (exceljs)
│   │   └── auth.ts                            # ← Helpers de sesión y roles
│   ├── pages/
│   │   ├── index.astro
│   │   ├── agradecimiento.astro
│   │   ├── estadisticas.astro
│   │   ├── procesos/
│   │   ├── estrategicos/
│   │   ├── misionales/
│   │   ├── apoyo/
│   │   ├── evaluacion/
│   │   ├── mesa-ayuda/                        # ← Todas las páginas bajo auth guard
│   │   │   ├── login.astro                    # Página de login (credenciales propias)
│   │   │   ├── index.astro                    # Redirect según rol al dashboard correcto
│   │   │   ├── dashboard.astro                # Dashboard del Solicitante
│   │   │   ├── nuevo-ticket.astro             # Formulario de radicación
│   │   │   ├── ticket/[id].astro              # Vista detalle de ticket
│   │   │   ├── agente/
│   │   │   │   ├── index.astro                # Consola del Agente (tablero)
│   │   │   │   └── ticket/[id].astro          # Gestión del ticket por el agente
│   │   │   ├── auditor/
│   │   │   │   └── index.astro                # Panel de reportes y exportación PDF
│   │   │   ├── admin/
│   │   │   │   └── index.astro                # Gestión de usuarios (solo admin)
│   │   │   ├── reportes/
│   │   │   │   └── index.astro                # Centro de reportes y auditoría de exportaciones
│   │   │   └── kb/
│   │   │       └── index.astro                # Base de conocimiento pública (sin auth)
│   │   └── api/
│   │       ├── upload.ts
│   │       ├── explorar.ts
│   │       ├── buscar-archivos.ts
│   │       ├── buscar-documentos.ts
│   │       ├── listar-categoria/[...carpeta].ts
│   │       └── mesa-ayuda/                    # ← Endpoints de la Mesa de Ayuda
│   │           ├── auth/
│   │           │   ├── login.ts               # POST: valida credenciales, crea sesión
│   │           │   └── logout.ts              # POST: destruye sesión
│   │           ├── tickets/
│   │           │   ├── index.ts               # GET: lista tickets | POST: crea ticket
│   │           │   ├── [id].ts                # GET: detalle | PATCH: actualiza estado
│   │           │   ├── [id]/comentarios.ts    # POST: agrega comentario/respuesta
│   │           │   ├── [id]/exportar.ts       # GET: exporta ticket a PDF
│   │           │   └── exportar-excel.ts      # GET: exporta múltiples tickets a Excel con filtros
│   │           ├── adjuntos/
│   │           │   └── upload.ts              # POST: sube imagen adjunta al ticket
│   │           ├── usuarios/
│   │           │   ├── index.ts               # GET: lista usuarios | POST: crea usuario (solo admin)
│   │           │   └── [id].ts                # PATCH: editar usuario | POST /reset-password
│   │           ├── exportaciones/
│   │           │   └── index.ts               # GET: lista exportaciones realizadas (auditor/admin)
│   │           ├── plantillas-export/
│   │           │   ├── index.ts               # GET: plantillas del usuario | POST: crea plantilla
│   │           │   └── [id].ts                # DELETE: borra plantilla
│   │           └── kb/
│   │               └── buscar.ts              # GET: busca artículos en kb-articles.json
│   ├── store/
│   │   ├── modals.ts
│   │   └── mesa-ayuda.ts                      # ← Stores Svelte para la Mesa de Ayuda
│   └── styles/
│       └── global.css
└── agent.md
```

---

## 4. Convenciones de Páginas (SGC)

### Estructura de un proceso

Cada proceso tiene hasta 4 sub-páginas con su propio `.astro`:

| Sub-página | Layout usado | Ejemplo |
|---|---|---|
| Caracterización | `ProcesoLayout` | `apoyo/juridica.astro` |
| Procedimientos | `ProcesoLayout` | `apoyo/juridica-procedimientos.astro` |
| Formatos | `FormatosLayout` | `apoyo/juridica-formatos.astro` |
| Variantes (RRHH, Contratos…) | `ProcesoLayout` | `apoyo/administrativa-rrhh.astro` |

### Props obligatorias de ProcesoLayout / FormatosLayout

```astro
<ProcesoLayout
  title="Título SEO"
  numero="06"
  tituloHeader="Nombre del Proceso"
  subtituloHeader="Caracterización del Proceso"
  tipo="apoyo"
  badge="Texto badge"
  badgeIcon="fas fa-..."
  rutaActual="/apoyo/juridica"
>
```

---

## 5. Sistema de Modales Globales (Svelte — SGC)

Todos los modales viven en `BaseLayout.astro` como `client:load` y se controlan desde `src/store/modals.ts`:

```ts
isUploadOpen    // UploadModal
isDownloadOpen  // DownloadModal
isSearchOpen    // SearchModal
isPdfViewerOpen // PdfViewerModal
pdfViewerUrl    // URL del PDF a mostrar
```

**Para abrir el visor PDF desde un componente Astro:**
```js
window.dispatchEvent(new CustomEvent('open-pdf-viewer', { detail: { url: '/ruta/archivo.pdf' } }));
```

---

## 6. Navegación entre Procesos

`src/lib/navigation.ts` define el array `NAVIGATION` con todos los slugs en orden. `ProcessNav` usa este array para los botones ← / → y las flechas de teclado.

**Para agregar una nueva página al flujo:** añadir entrada al array `NAVIGATION` en el orden correcto. Las rutas `/mesa-ayuda/*` NO se agregan a este array.

---

## 7. Búsqueda (SGC)

`SearchModal.svelte` tiene dos pestañas:
- **Páginas:** busca en `NAVIGATION` (sincrónico)
- **Documentos:** llama a `/api/buscar-documentos?q=...`

Para agregar carpetas al índice, editar `DIRS` en `src/pages/api/buscar-documentos.ts`.

---

## 8. Módulo Mesa de Ayuda

### 8.1 Principio de Aislamiento

La Mesa de Ayuda vive dentro del mismo repositorio pero está **completamente aislada** del SGC principal:

- Todas sus páginas están bajo `/mesa-ayuda/` y usan `MesaAyudaLayout.astro`
- La autenticación **solo** aplica a rutas `/mesa-ayuda/*` — el SGC no requiere login
- `MesaAyudaLayout.astro` verifica la sesión en el servidor (Astro.locals) y redirige a `/mesa-ayuda/login` si no hay sesión válida
- La excepción es `/mesa-ayuda/kb/` (base de conocimiento), que es pública y no requiere login
- Los stores de Svelte de la Mesa de Ayuda están en `src/store/mesa-ayuda.ts`, separados de `modals.ts`

### 8.2 Autenticación

**Estrategia: credenciales propias en Supabase** con gestión completa de usuarios desde un panel de administración integrado. No se usa SSO/Microsoft Entra ID porque hay personas sin correo institucional.

```
Tabla: usuarios
- id (uuid)
- nombre (text)
- correo (text, unique)           ← correo de login (puede ser personal o institucional)
- password_hash (text)            ← bcrypt
- rol (enum: admin | solicitante | agente | auditor)
- cargo (text)
- activo (boolean)
- correo_notificacion (text)      ← opcional, si quiere recibir alertas en otro buzón
- created_at (timestamptz)
```

**Flujo de sesión:**
1. `POST /api/mesa-ayuda/auth/login` valida credenciales contra Supabase
2. Si son correctas, genera un JWT firmado con `AUTH_SECRET` (variable de entorno)
3. El JWT se almacena en una cookie `httpOnly`, `secure`, `sameSite=strict`
4. `MesaAyudaLayout.astro` verifica y decodifica el JWT en cada request usando `src/lib/auth.ts`
5. El payload del JWT contiene `{ id, nombre, correo, rol, cargo }`
6. `POST /api/mesa-ayuda/auth/logout` borra la cookie

**Variables de entorno requeridas (`.env`):**
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
AUTH_SECRET=          # string aleatorio >= 32 chars para firmar JWT
SMTP_HOST=            # smtp.gmail.com, smtp.office365.com, o cualquier SMTP
SMTP_PORT=587
SMTP_USER=            # correo del remitente
SMTP_PASS=            # contraseña o app password
SMTP_FROM_NAME=       # "Mesa de Ayuda — Concejo de Chía"
SMTP_FROM_EMAIL=      # dirección que aparece como remitente
```

**Roles y permisos:**

| Rol | Puede hacer |
|---|---|
| `admin` | Todo lo del auditor + crear/editar/desactivar usuarios, asignar roles, resetear contraseñas |
| `solicitante` | Ver sus propios tickets, crear tickets, comentar en los suyos |
| `agente` | Ver todos los tickets, cambiar estado, asignarse tickets, comentar (notas internas + respuestas) |
| `auditor` | Ver todos los tickets y trazabilidad, exportar PDF de evidencia, ver reportes — sin editar |

### 8.3 Base de Datos Supabase

```sql
-- Usuarios (ver sección 8.2)

-- Tickets
CREATE TABLE tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        text UNIQUE,                  -- generado: TK-2024-0001
  creador_id    uuid REFERENCES usuarios(id),
  agente_id     uuid REFERENCES usuarios(id), -- null hasta asignación
  categoria     text CHECK (categoria IN ('hardware', 'software', 'redes', 'otro')),
  prioridad     text CHECK (prioridad IN ('alta', 'media', 'baja')) DEFAULT 'media',
  estado        text CHECK (estado IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')) DEFAULT 'abierto',
  titulo        text NOT NULL,
  descripcion   text NOT NULL,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_limite  timestamptz,                  -- calculada al crear según SLA por prioridad
  fecha_cierre  timestamptz,
  updated_at    timestamptz DEFAULT now()
);

-- Trazabilidad (historial de comentarios y cambios de estado)
CREATE TABLE trazabilidad (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid REFERENCES tickets(id) ON DELETE CASCADE,
  autor_id    uuid REFERENCES usuarios(id),
  tipo        text CHECK (tipo IN ('comentario', 'respuesta', 'cambio_estado', 'asignacion')),
  contenido   text,                           -- texto del comentario o descripción del cambio
  es_interno  boolean DEFAULT false,          -- true = nota interna solo visible para agentes/auditores
  created_at  timestamptz DEFAULT now()
);

-- Adjuntos
CREATE TABLE adjuntos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid REFERENCES tickets(id) ON DELETE CASCADE,
  nombre      text,
  url         text,                           -- path en Supabase Storage
  created_at  timestamptz DEFAULT now()
);

-- Auditoría de exportaciones a Excel
CREATE TABLE exportaciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid REFERENCES usuarios(id),
  filtros         jsonb NOT NULL,             -- snapshot de los filtros aplicados
  tickets_count   int NOT NULL,               -- cuántos tickets exportó
  incluyo_internos boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Plantillas de filtros guardadas por usuario
CREATE TABLE plantillas_export (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  filtros     jsonb NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (usuario_id, nombre)
);
```

**SLA por prioridad (tiempos de resolución):**

| Prioridad | `fecha_limite` |
|---|---|
| `alta` | +4 horas desde creación |
| `media` | +24 horas desde creación |
| `baja` | +72 horas desde creación |

### 8.4 Notificaciones por Correo

Helper en `src/lib/mailer.ts` usando Nodemailer con SMTP **genérico** (compatible con Gmail, Outlook, o cualquier proveedor). El destinatario es `correo_notificacion` si existe, sino `correo` principal. Se dispara en los siguientes eventos:

| Evento | Destinatario |
|---|---|
| Ticket creado | Agentes (todos) + Solicitante (confirmación) |
| Ticket asignado | Agente asignado |
| Cambio de estado | Solicitante del ticket |
| Respuesta del agente | Solicitante del ticket |
| SLA en riesgo (80% del tiempo) | Agente asignado + Auditor |

Las notificaciones se disparan **desde los endpoints API** después de escribir en Supabase, nunca desde el cliente.

### 8.5 Páginas y sus Responsabilidades

#### `/mesa-ayuda/login.astro`
- Formulario de correo + contraseña
- Llama a `POST /api/mesa-ayuda/auth/login`
- Sin `MesaAyudaLayout` (es la única página sin auth guard)
- Usa la paleta institucional: header azul (`--color-brand-blue`), botón dorado (`--color-brand-gold`)

#### `/mesa-ayuda/index.astro`
- Redirige según rol:
  - `admin` → `/mesa-ayuda/admin`
  - `solicitante` → `/mesa-ayuda/dashboard`
  - `agente` → `/mesa-ayuda/agente`
  - `auditor` → `/mesa-ayuda/auditor`

#### `/mesa-ayuda/dashboard.astro` (Solicitante)
- Lista de tickets propios con `StatusBadge` y `SlaIndicator`
- Botón "Radicar nueva solicitud" → `/mesa-ayuda/nuevo-ticket`
- Buscador rápido a la base de conocimiento
- Componente Svelte: `TicketBoard.svelte` filtrado por `creador_id`

#### `/mesa-ayuda/nuevo-ticket.astro`
- Formulario con: Categoría (select), Prioridad (select), Título, Descripción, Adjuntos (imágenes)
- Componente Svelte: `TicketForm.svelte`
- Al crear, llama a `POST /api/mesa-ayuda/tickets` y redirige al detalle

#### `/mesa-ayuda/ticket/[id].astro` (Solicitante)
- Detalle del ticket: estado, historial de trazabilidad pública (no muestra notas internas)
- Permite agregar comentario
- Componente Svelte: `TicketDetail.svelte`

#### `/mesa-ayuda/agente/index.astro` (Agente)
- Tablero con todos los tickets, filtros por prioridad, estado, categoría y fecha
- `SlaIndicator` visible en cada fila — rojo si está en riesgo
- Componente Svelte: `TicketBoard.svelte` sin filtro de usuario
- Acceso rápido al detalle de cada ticket

#### `/mesa-ayuda/agente/ticket/[id].astro` (Agente)
- Igual que la vista del solicitante pero con controles adicionales:
  - Cambiar estado (dropdown)
  - Asignarse el ticket
  - Agregar notas internas (solo visibles para agentes/auditores)
  - Agregar respuesta pública al solicitante
- Componente Svelte: `TicketDetail.svelte` con prop `isAgent={true}`

#### `/mesa-ayuda/auditor/index.astro` (Auditor)
- Métricas: volumen mensual de tickets, tiempo promedio de resolución por categoría
- Tabla con todos los tickets y su historial completo
- Botón "Exportar PDF de evidencia" por ticket → `GET /api/mesa-ayuda/tickets/[id]/exportar`
- Gráficos simples con Chart.js (ya es dependencia del proyecto en `estadisticas.astro`)

#### `/mesa-ayuda/reportes/index.astro` (Auditor / Admin)
- Centro de reportes y exportación a Excel
- Botón principal "Generar reporte Excel" → abre `ExportExcelModal.svelte` con todos los filtros
- Sección "Plantillas guardadas" — lista de filtros frecuentes del usuario para reutilización con un clic
- Sección "Historial de exportaciones" — quién exportó qué y cuándo (lectura desde tabla `exportaciones`)
- Solo accesible por roles `auditor` y `admin`

#### `/mesa-ayuda/admin/index.astro` (Admin)
- Panel principal del administrador con acceso a gestión de usuarios y vista de auditoría
- Tabla de todos los usuarios con filtros por rol, estado (activo/inactivo)
- Botón "Crear usuario" → abre formulario inline o modal
- Acciones por usuario: editar datos, cambiar rol, activar/desactivar, resetear contraseña
- Componente Svelte: `UserManager.svelte`
- Solo accesible por rol `admin`

#### `/mesa-ayuda/kb/index.astro` (Pública)
- Página sin auth guard
- Lista artículos de autoayuda desde `src/data/kb-articles.json`
- Componente Svelte: `KnowledgeSearch.svelte`
- Accesible desde el login y el dashboard del solicitante

### 8.6 MesaAyudaLayout.astro

Layout base para todas las páginas bajo `/mesa-ayuda/*` (excepto login y kb).

```astro
---
// Al inicio del layout, verificar sesión
import { getSession } from '../lib/auth';
const session = await getSession(Astro.cookies);
if (!session) return Astro.redirect('/mesa-ayuda/login');

// Props
interface Props {
  title: string;
  rol?: 'admin' | 'solicitante' | 'agente' | 'auditor'; // para guard de rol específico
}
const { title, rol } = Astro.props;
if (rol && session.rol !== rol) return Astro.redirect('/mesa-ayuda');
---
```

- Header institucional simplificado (logo + nombre de usuario + botón cerrar sesión)
- **No incluye** el `FloatingButton`, `SearchModal`, ni ningún modal del SGC
- **No agrega la ruta a NAVIGATION**
- Usa las mismas fuentes, iconos y tokens CSS que el resto del proyecto

### 8.7 Stores Svelte (mesa-ayuda.ts)

```ts
// src/store/mesa-ayuda.ts
export const currentTicket = writable(null);   // Ticket activo en detalle
export const ticketFilters = writable({        // Filtros del tablero del agente
  estado: 'todos',
  prioridad: 'todas',
  categoria: 'todas'
});
export const isTicketFormOpen = writable(false);
```

### 8.8 Exportación de PDF de Evidencia

El endpoint `GET /api/mesa-ayuda/tickets/[id]/exportar` genera un PDF con:
- Encabezado institucional (logo + nombre del Concejo)
- Datos del ticket: código, categoría, prioridad, fechas, estado final
- Historial completo de trazabilidad (incluyendo notas internas para auditoría)
- Pie de página con fecha de exportación

Usar la librería `pdf-lib` o `puppeteer` — definir al momento de implementar según disponibilidad en el NAS.

### 8.9 Base de Conocimiento (`kb-articles.json`)

Estructura de cada artículo:

```json
{
  "id": "kb-001",
  "titulo": "¿Cómo conectarme a la VPN del Concejo?",
  "categoria": "redes",
  "tags": ["vpn", "conexión", "remoto"],
  "contenido": "Pasos para conectarse a...",
  "updated_at": "2024-01-15"
}
```

La búsqueda es local (filtro sobre el JSON) — no requiere llamada a la BD.

### 8.10 Gestión de Usuarios (Panel Admin)

El rol `admin` tiene acceso completo a la plataforma más un panel exclusivo para gestionar usuarios.

**Funcionalidades del panel:**
- **Listar usuarios** con filtros por rol y estado (activo/inactivo)
- **Crear usuario**: nombre, correo, contraseña temporal, rol, cargo, correo de notificación (opcional)
- **Editar usuario**: cambiar nombre, cargo, rol, correo de notificación, activar/desactivar
- **Resetear contraseña**: genera una contraseña temporal y la envía al correo del usuario

**Endpoints API (solo accesibles por admin):**

| Método | Endpoint | Acción |
|---|---|---|
| `GET` | `/api/mesa-ayuda/usuarios` | Lista todos los usuarios |
| `POST` | `/api/mesa-ayuda/usuarios` | Crea un usuario nuevo (hash bcrypt automático) |
| `PATCH` | `/api/mesa-ayuda/usuarios/[id]` | Edita datos del usuario (nombre, rol, cargo, activo, correo_notificacion) |
| `POST` | `/api/mesa-ayuda/usuarios/[id]/reset-password` | Genera contraseña temporal y la envía por correo |

**Reglas de seguridad:**
- Todos los endpoints de `/api/mesa-ayuda/usuarios/*` verifican que la sesión tenga `rol === 'admin'`
- Un admin no puede desactivarse ni cambiar su propio rol
- Al crear usuario, la contraseña temporal se envía por correo automáticamente
- Las contraseñas siempre se almacenan como hash bcrypt, nunca en texto plano

**Componente Svelte:** `UserManager.svelte`
- Tabla reactiva con búsqueda por nombre/correo
- Modal/formulario inline para crear y editar usuarios
- Confirmación antes de desactivar o resetear contraseña
- Badge de rol con colores diferenciados

### 8.11 Reportes Excel y Trazabilidad

Sistema de exportación a Excel con filtros configurables, plantillas guardadas y auditoría completa.

#### Librería
**`exceljs`** — soporta múltiples hojas, formato rico, freeze panes, colores condicionales y stream para archivos grandes.

#### Estructura del libro Excel generado

Cada export produce un `.xlsx` con 3 hojas:

**Hoja 1 — `Tickets`** (vista plana, una fila por ticket)
- Código, título, categoría, prioridad, estado
- Solicitante (nombre, correo, cargo)
- Agente asignado (nombre, correo)
- Fecha de creación, fecha límite SLA, fecha de cierre
- Tiempo de resolución (calculado)
- ¿SLA cumplido? (sí/no)
- # de comentarios y # de adjuntos

**Hoja 2 — `Trazabilidad`** (una fila por evento del historial)
- Código del ticket + tipo (comentario / respuesta / cambio_estado / asignacion)
- Autor, contenido, fecha
- ¿Es nota interna? (solo si el rol tiene permiso y se marcó "incluir internos")

**Hoja 3 — `Resumen`** (KPIs)
- Total de tickets exportados + filtros aplicados
- Conteo por estado, categoría y prioridad
- Tiempo promedio de resolución por categoría
- Tasa de cumplimiento de SLA
- Top 5 agentes por casos resueltos

#### Filtros disponibles

| Filtro | Tipo | Notas |
|---|---|---|
| `desde` / `hasta` | Rango de fechas (creación) | Por defecto: último mes |
| `estados` | Multi-select | abierto, en_progreso, resuelto, cerrado |
| `categorias` | Multi-select | hardware, software, redes, otro |
| `prioridades` | Multi-select | alta, media, baja |
| `agente_id` | UUID o "todos" | Solo agente/auditor/admin |
| `solicitante_id` | UUID o "todos" | Solo auditor/admin |
| `incluir_internos` | Boolean | Solo agente/auditor/admin |
| `incluir_trazabilidad` | Boolean | Si false, omite la Hoja 2 |
| `scope` | "mios" o "todos" | Para agentes; los solicitantes siempre "mios" |

#### Permisos por rol

| Rol | Alcance permitido | Internos |
|---|---|---|
| `solicitante` | Solo sus tickets (`scope` ignorado) | No |
| `agente` | "Mis casos" o "Todos" | Sí |
| `auditor` | Todos | Sí |
| `admin` | Todos | Sí |

El endpoint **valida los permisos en el servidor** — un solicitante con `scope=todos` recibe 403.

#### Endpoints

| Método | Endpoint | Acción |
|---|---|---|
| `GET` | `/api/mesa-ayuda/tickets/exportar-excel?<filtros>` | Genera y descarga el Excel; registra el evento en `exportaciones` |
| `GET` | `/api/mesa-ayuda/exportaciones` | Lista historial de exports (auditor/admin) |
| `GET` | `/api/mesa-ayuda/plantillas-export` | Lista plantillas del usuario actual |
| `POST` | `/api/mesa-ayuda/plantillas-export` | Crea nueva plantilla (`{ nombre, filtros }`) |
| `DELETE` | `/api/mesa-ayuda/plantillas-export/[id]` | Borra plantilla del usuario |

#### Componente Svelte: `ExportExcelModal.svelte`

Modal reutilizable con:
- Formulario de filtros completo (fechas, estados, categorías, prioridades, agente, solicitante)
- Switches "Incluir notas internas" e "Incluir trazabilidad" (visibles según rol)
- Sección "Plantillas guardadas" → cargar con un clic
- Botón "Guardar como plantilla" → solicita nombre y guarda en `plantillas_export`
- Indicador de carga durante la generación
- Descarga automática al terminar

Visible mediante un botón "📊 Exportar Excel" en:
- `dashboard.astro` (solicitante — solo "mis tickets")
- `agente/index.astro` (toggle "mis casos / todos")
- `auditor/index.astro` y `admin/index.astro` (todos los filtros)
- `reportes/index.astro` (centro de reportes con plantillas e historial)

#### Auditoría de exportaciones

Cada vez que alguien genera un Excel exitosamente, se inserta una fila en `exportaciones`:
```json
{
  "usuario_id": "uuid",
  "filtros": { "desde": "...", "hasta": "...", "estados": [...] },
  "tickets_count": 42,
  "incluyo_internos": true,
  "created_at": "..."
}
```

El panel `/mesa-ayuda/reportes` muestra esta tabla a auditor/admin para que puedan revisar **quién exportó qué y cuándo** — auditoría de la auditoría.

#### Estilos del Excel

- Cabeceras: fondo `#3359A4` (brand blue), texto blanco, negrita
- Filas alternadas en gris muy claro
- Bordes finos en gris medio
- **Coloreo condicional:**
  - SLA vencido (rojo claro `#fee2e2`)
  - Ticket cerrado (gris claro `#f3f4f6`)
  - Prioridad alta (texto rojo `#E30D21`)
- Freeze pane en fila 1 de cada hoja
- Anchos de columna ajustados al contenido
- Encabezado institucional en cada hoja: nombre del Concejo + filtros aplicados + fecha de generación

---

## 9. Agregar un Nuevo Proceso o Sub-página (SGC)

1. Crear el archivo `.astro` en la carpeta correspondiente
2. Usar `ProcesoLayout` o `FormatosLayout` con las props correctas (ver sección 4)
3. Aplicar el `tipo` correcto
4. Añadir la ruta a `NAVIGATION` en `src/lib/navigation.ts`
5. Si el proceso es nuevo, agregar entrada en `src/data/procesos.json`
6. Verificar colores: usar únicamente los tokens definidos en la paleta (sección 2)

---

## 10. Reglas de Desarrollo (Mandatorias)

- **No comentarios en el código** salvo cuando el `WHY` es no obvio.
- **No modificar** `\\NASCONCEJO\ProyectosCMC\PaginaCMC` — es el sistema original en producción en el NAS.
- **Tailwind v4:** no hay `tailwind.config.js`. Los tokens custom están en `@theme {}` dentro de `global.css`. Tokens no definidos ahí no existen.
- **h-screen en layouts:** `ProcesoLayout` y `FormatosLayout` usan `h-screen overflow-hidden` en el contenedor y `min-h-0 overflow-y-auto` en el `<main>`.
- **Svelte solo para estado:** los componentes puramente visuales sin estado van en `.astro`, no en `.svelte`.
- **Animaciones:** agregar clase `animate-on-scroll` a elementos que deben aparecer al scroll — GSAP los captura automáticamente en `BaseLayout.astro`.
- **Aislamiento de la Mesa de Ayuda:** nunca importar componentes de `/mesa-ayuda/` en páginas del SGC ni viceversa. Los layouts son completamente independientes.
- **Supabase solo server-side:** el cliente de Supabase con la `SERVICE_KEY` nunca se expone al cliente. Toda interacción con la BD pasa por los endpoints API bajo `/api/mesa-ayuda/`.
- **JWT en cookie httpOnly:** nunca exponer el token en `localStorage` ni en respuestas JSON. Solo en cookie segura.
- **Correos solo desde API:** las notificaciones por correo se disparan únicamente desde los endpoints del servidor, nunca desde componentes Svelte.
- **Rutas de la Mesa de Ayuda fuera de NAVIGATION:** el array `NAVIGATION` de `navigation.ts` es exclusivo del flujo de procesos del SGC.

---

## 11. Hoja de Ruta de Implementación

### Fase 1 — Infraestructura base
1. Instalar dependencias: `@supabase/supabase-js`, `nodemailer`, `jose` (JWT), `bcryptjs`
2. Crear tablas en Supabase: `usuarios`, `tickets`, `trazabilidad`, `adjuntos`
3. Configurar variables de entorno en `.env`
4. Implementar `src/lib/supabase.ts`, `src/lib/auth.ts`, `src/lib/mailer.ts`
5. Crear `MesaAyudaLayout.astro` con guard de sesión

### Fase 2 — Autenticación
6. Endpoint `POST /api/mesa-ayuda/auth/login` y `logout`
7. Página `/mesa-ayuda/login.astro`
8. Seed inicial de usuarios en Supabase (al menos 1 solicitante, 1 agente, 1 auditor)

### Fase 3 — Portal del Solicitante
9. Dashboard con lista de tickets propios
10. Formulario de nuevo ticket con subida de adjuntos
11. Vista detalle del ticket con historial público

### Fase 4 — Consola del Agente
12. Tablero reactivo con filtros y SLA visual
13. Vista detalle del agente (cambiar estado, notas internas, respuestas)
14. Notificaciones por correo en cada evento

### Fase 5 — Auditoría y Reportes
15. Panel del auditor con métricas y Chart.js
16. Exportación de PDF de evidencia por ticket

### Fase 6 — Base de Conocimiento
17. Poblar `kb-articles.json` con artículos iniciales de autoayuda
18. Componente `KnowledgeSearch.svelte` con búsqueda local

### Fase 7 — Gestión de Usuarios + SMTP Genérico
19. Agregar rol `admin` al tipo `Rol` en `supabase.ts` y campo `correo_notificacion` a la tabla `usuarios`
20. Actualizar `MesaAyudaLayout.astro`: agregar item de navegación "Usuarios" para admin, actualizar redirect en `index.astro`
21. Crear endpoints API de usuarios: `GET/POST /api/mesa-ayuda/usuarios`, `PATCH /api/mesa-ayuda/usuarios/[id]`, `POST /api/mesa-ayuda/usuarios/[id]/reset-password` — todos con guard de rol admin
22. Crear componente `UserManager.svelte`: tabla reactiva con búsqueda, formulario crear/editar, confirmación de acciones
23. Crear página `/mesa-ayuda/admin/index.astro` con el panel de gestión de usuarios
24. Actualizar `mailer.ts` para SMTP genérico: usar `SMTP_FROM_NAME` y `SMTP_FROM_EMAIL`, resolver destinatario desde `correo_notificacion ?? correo`
25. Seed de usuario admin inicial en Supabase
26. Probar flujo completo: crear usuario → recibe contraseña por correo → inicia sesión → resetear contraseña

### Fase 8 — Reportes Excel y Trazabilidad
27. Instalar dependencia: `npm install exceljs`
28. Crear tablas en Supabase: `exportaciones` y `plantillas_export` (ver sección 8.3)
29. Implementar `src/lib/excel.ts`: helper `generarLibroTickets(tickets, trazabilidad, opciones)` con formato institucional, las 3 hojas (Tickets, Trazabilidad, Resumen), estilos y coloreo condicional
30. Crear endpoint `GET /api/mesa-ayuda/tickets/exportar-excel` con todos los filtros, validación de permisos por rol y registro en `exportaciones`
31. Crear endpoints de plantillas: `GET/POST /api/mesa-ayuda/plantillas-export`, `DELETE /api/mesa-ayuda/plantillas-export/[id]`
32. Crear endpoint `GET /api/mesa-ayuda/exportaciones` para historial (auditor/admin)
33. Crear componente `ExportExcelModal.svelte` reutilizable con filtros, plantillas guardadas y descarga automática
34. Crear página `/mesa-ayuda/reportes/index.astro` con centro de reportes, plantillas e historial
35. Agregar botón "Exportar Excel" en dashboard (solicitante), agente, auditor y admin
36. Actualizar `MesaAyudaLayout.astro`: agregar item "Reportes" para auditor/admin
37. Probar flujo completo: aplicar filtros → generar Excel → verificar descarga + registro en `exportaciones` → guardar plantilla → reutilizar plantilla
