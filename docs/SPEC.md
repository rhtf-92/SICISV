# SPEC.md - Sistema de Control de Ingresos y Salidas de Vehículos (SICISV)

## 1. Concepto & Visión

Sistema integral de control vehicular para empresas que requiere captura simultánea de evidencia fotográfica (vehículo lateral + rostro del conductor) y registro de placa para validar ingresos. El flujo es strictamente secuencial: ninguna etapa puede saltarse. El diseño transmite profesionalismo, seguridad y eficiencia operativa, con una interfaz clara que guía al vigilante paso a paso sin ambigüedades.

**Filosofía:** "Captura primero, registra después, verifica siempre."

## 2. Design Language

### Aesthetic Direction
Estilo **Industrial Security** - Interfaz sobria con acentos de color que indican estados (verde=éxito, ámbar=pendiente, rojo=alerta). Inspirado en dashboards de centros de control y videovigilancia profesionales.

### Color Palette
```
Primary:       #1E3A5F (Azul institucional profundo)
Secondary:     #2D5A87 (Azul medio)
Accent-Success: #10B981 (Verde validación)
Accent-Warning: #F59E0B (Ámbar pendiente)
Accent-Error:   #EF4444 (Rojo error/alerta)
Background:     #F8FAFC (Gris muy claro)
Surface:        #FFFFFF (Blanco)
Text-Primary:   #1E293B (Gris oscuro)
Text-Secondary: #64748B (Gris medio)
```

### Typography
- **Headings:** Inter (700, 600) - Sans-serif técnica y legible
- **Body:** Inter (400, 500) - Consistencia en toda la interfaz
- **Monospace (placas):** JetBrains Mono - Para mejor lectura de placas
- **Fallback:** system-ui, -apple-system, sans-serif

### Spatial System
- Base unit: 8px
- Padding containers: 24px (mobile: 16px)
- Gap entre elementos: 16px
- Border radius: 8px (botones), 12px (cards), 16px (modales)
- Sombras: `0 4px 6px -1px rgba(0,0,0,0.1)` (cards), `0 25px 50px -12px rgba(0,0,0,0.25)` (modales)

### Motion Philosophy
- **Transiciones UI:** 200ms ease-out (hover states)
- **Aparición de elementos:** 300ms ease-out con fade + slide-up sutil
- **Indicadores de progreso:** Animación linear infinita para estados de carga
- **Feedback táctil:** Scale 0.98 en botones presionados
- **No hay animaciones distractoras** - el vigilante necesita claridad, no efectos

### Visual Assets
- **Iconos:** Lucide Icons (línea fina, consistente)
- **Imágenes:** Fotografías reales de alta calidad (min 1920x1080 para evidencia)
- **Estados visuales:** Iconos + texto + color para máxima claridad
- **Indicadores de cámara:** Overlay semi-transparente con guías de encuadre

## 3. Layout & Structure

### Arquitectura de Páginas

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo + Reloj en tiempo real + Usuario + Cerrar    │
├─────────────────────────────────────────────────────────────┤
│  NAVEGACIÓN PRINCIPAL (Tabs)                                │
│  [📋 Registro de Ingreso] [🚪 Registro de Salida] [📊 Historial] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         VISTA PRINCIPAL (Cambia según tab)          │   │
│  │                                                     │   │
│  │  MÓDULO DE CÁMARA                                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │                                             │   │   │
│  │  │        Preview de cámara en vivo            │   │   │
│  │  │        (con guías de encuadre)              │   │   │
│  │  │                                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  PROGRESO DEL FLUJO: ●───○───○───○                │   │
│  │  [1. Foto Vehículo] [2. Foto Conductor] [3. Placa]│   │
│  │                                                     │   │
│  │  [CAPTURAR FOTO]                                   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PANEL DE RESULTADOS / CONFIRMACIÓN                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: Estado de conexión + Versión + Soporte            │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Strategy
- **Desktop (>1024px):** Layout completo con panel lateral para historial
- **Tablet (768-1024px):** Layout apilado, cámara prominente
- **Mobile (<768px):** Flujo vertical, cámara占据 60% de pantalla, controles en zona inferior accesible con pulgar

### Visual Pacing
1. **Zona de cámara (60% viewport):** Énfasis visual máximo, fondo neutro
2. **Indicador de progreso:** Visible pero no intrusivo
3. **Controles:** Botones grandes (mínimo 48px altura) para uso con guantes
4. **Feedback de estado:** Colores claros, iconos universales

## 4. Features & Interactions

### 4.1 Flujo de Registro de Ingreso (ESTRICTAMENTE SECUENCIAL)

```
PASO 1 → Captura Foto Lateral del Vehículo
├── Requisito: Vehículo visible lateralmente (puerta de entrada)
├── Captura automática al detectar vehículo quieto (opcional)
├── Validación: Imagen mínimo 1920x1080, formato JPEG/WebP
├── Guía visual: Overlay con silueta de vehículo
├── Fallback: Si imagen borrosa, permitir recaptura
└── Estado siguiente: Habilitar "Siguiente" solo con foto válida

PASO 2 → Captura Rostro del Conductor
├── Requisito: Conductor mirando directamente a cámara
├── Guía visual: Oval para posicionar rostro
├── Validación: Rostro detectable (detección facial activa)
├── Ojos abiertos, orientación frontal (±15°)
├── Fallback: Si no detecta rostro, solicitar repositionamiento
└── Estado siguiente: Habilitar "Siguiente" solo con rostro válido

PASO 3 → Registro de Placa
├── Input: Campo de texto con formato de placa
├── Validación: Regex según formato local (ej: XXX-0000)
├── Sugerencia: Autocompletado con histórico de placas
├── Confirmación visual: Placa mostrada en formato grande
└── Estado siguiente: Habilitar "Confirmar Ingreso"

CONFIRMAR INGRESO
├── Resumen visual: Miniaturas de fotovehículo, fotorrostro, placa
├── Botón de confirmación prominent
├── POST a API: { fotoVehiculo, fotoConductor, placa, timestamp, vigilante }
├── Éxito: Modal de confirmación + limpiar formulario
└── Error: Mensaje de error específico + opción de reintentar
```

### 4.2 Flujo de Registro de Salida

```
VERIFICACIÓN DE SALIDA
├── Input: Escaneo o ingreso manual de placa
├── Búsqueda: Consulta en BD de ingresos no saldados
├── Estado 1 - Vehículo NO encontrado:
│   ├── Mensaje: "No existe registro de ingreso para esta placa"
│   ├── Opción: "Registrar como ingreso directo" (con autorizaciones)
│   └── Opción: "Reportar anomalía"
│
├── Estado 2 - Vehículo encontrado, conductor diferente:
│   ├── Mostrar foto del conductor registrado
│   ├── Mostrar foto del conductor actual (captura)
│   ├── Comparación lado a lado
│   ├── Botones: [Confirmar Salida] [Reportar Incidente]
│   └── Log: Registrar incidente en BD
│
├── Estado 3 - Vehículo encontrado, conductor coincide:
│   ├── Mostrar datos del registro original
│   ├── Resumen: Foto vehículo, placa, hora ingreso, vigilante
│   ├── Botón: [Confirmar Salida]
│   └── Log: Registrar salida en BD
```

### 4.3 Historial y Reportes

```
PANTALLA DE HISTORIAL
├── Filtros: Fecha (rango), Placa, Tipo (ingreso/salida), Estado
├── Lista de registros con miniaturas
├── Click en registro: Modal con detalle completo
├── Exportar: CSV, PDF (para reportes semanales)
└── Búsqueda rápida por placa
```

### 4.4 Edge Cases y Manejo de Errores

| Escenario | Comportamiento |
|-----------|----------------|
| Cámara no disponible | Mensaje de error claro + instrucciones + soporte |
| Imagen demasiado oscura | Indicador de iluminación + tips |
| Placa ilegible | Opción de ingreso manual + marcar para revisión |
| Red lenta/caída | Cola local + sincronización cuando恢复了 |
| Registro duplicado | Verificación de timestamp + advertencia |
| Conductor se niega a mostrar rostro | Opción de registrar como "Conductor no visible" + incident log |
| Vehículo sin placa visible | Protocolo de placa no visible + registro especial |

### 4.5 Estados de los Registros

```
INGRESO CREADO → (verde, texto: "Ingreso registrado")
EN PUNTO DE SALIDA → (ámbar, texto: "En proceso de salida")
SALIDA CONFIRMADA → (azul, texto: "Salida completada")
ANOMALÍA REPORTADA → (rojo, texto: "Con anomalía")
REVISION REQUERIDA → (naranja, texto: "Pendiente revisión")
```

## 5. Component Inventory

### 5.1 CameraCapture
- **Apariencia:** Contenedor 16:9 con borde sutil, esquinas redondeadas
- **Estados:**
  - `idle`: Fondo gris con icono de cámara
  - `active`: Preview en vivo con guías de encuadre
  - `capturing`: Flash blanco 100ms
  - `success`: Thumbnail con check verde
  - `error`: Borde rojo + mensaje de error
  - `disabled`: Opacidad 50%, cursor not-allowed
- **Interacciones:** Click para capturar (móvil), Enter (teclado), Space (accesibilidad)

### 5.2 ProgressStepper
- **Apariencia:** 3-4 pasos horizontales con conectores
- **Estados por paso:**
  - `pending`: Círculo vacío, texto gris
  - `active`: Círculo con número, texto bold, borde azul
  - `completed`: Círculo con check, fondo verde
  - `error`: Círculo con X, fondo rojo
- **Animaciones:** Transición suave entre estados (200ms)

### 5.3 PlateInput
- **Apariencia:** Input grande (48px altura), fuente monospace, formato automático
- **Estados:**
  - `empty`: Borde gris, placeholder "Ingrese placa"
  - `typing`: Borde azul, texto en tiempo real
  - `valid`: Borde verde, icono check
  - `invalid`: Borde rojo, mensaje de error
  - `loading`: Spinner + "Verificando..."
- **Validación:** Formato regex + verificación en BD en tiempo real

### 5.4 ConfirmationCard
- **Apariencia:** Card elevada con sombras, miniaturas de evidencia
- **Contenido:** Foto vehículo (left), Foto conductor (center), Placa (right)
- **Estados:**
  - `reviewing`: Fondo blanco, borde gris
  - `confirming`: Borde azul brillante, loader
  - `success`: Fondo verde claro, check grande
  - `error`: Fondo rojo claro, mensaje de error
- **Botones:** [Cancelar] (secundario), [Confirmar] (primario)

### 5.5 VehicleComparison
- **Apariencia:** Layout 2 columnas para сравнение фото
- **Contenido:** Foto registrada vs Foto actual
- **Elementos:** Labels "Registrado" vs "Actual", timestamp, botón de acción
- **Interacciones:** Zoom en las fotos, expandir a pantalla completa

### 5.6 StatusBadge
- **Variantes por color:**
  - Success (#10B981): Ingreso/Salida completada
  - Warning (#F59E0B): Pendiente/En proceso
  - Error (#EF4444): Anomalía
  - Info (#3B82F6): Estado general
- **Apariencia:** Pill shape, icono + texto, padding 4px 12px

### 5.7 NavigationTabs
- **Apariencia:** Tabs horizontales con indicador de línea inferior
- **Estados:**
  - `inactive`: Texto gris, sin fondo
  - `active`: Texto azul, borde inferior azul
  - `hover`: Fondo gris claro
- **Badge:** Contador de registros pendientes por tab

### 5.8 TimestampDisplay
- **Apariencia:** Formato legible, actualización en tiempo real
- **Formatos:**
  - Fecha: DD/MM/YYYY
  - Hora: HH:mm:ss (formato 24h)
- **Zona horaria:** Local del servidor (documentado en config)

## 6. Technical Approach

### 6.1 Stack Tecnológico

```
FRONTEND
├── Framework: React 18+ con TypeScript
├── Build: Vite
├── Estilos: Tailwind CSS
├── Estado: Zustand (ligero, predictable)
├── Cámaras: WebRTC / MediaDevices API
├── PWA: Service Worker para offline
└── Testing: Vitest + React Testing Library

BACKEND (API Gateway)
├── Runtime: Node.js 20 LTS
├── Framework: Express.js
├── Lenguaje: TypeScript
├── Validación: Zod
├── ORM: Prisma
└── Autenticación: JWT (simple, para vigilantes)


MICROSERVICIO FACIAL (IA)
├── Runtime: Python 3.10+
├── Framework: FastAPI
├── Motor Biométrico: InsightFace
└── Algoritmo: Redes Neuronales Convolucionales (Extracción de Embeddings)

BASE DE DATOS
├── PostgreSQL (recomendado) o SQLite (para demo)
├── Tablas: vehicles, entries, exits, incidents, users, known_driver
├── Extensiones: pgvector (búsqueda de similitud)
└── Almacenamiento: Base64 (demo) / S3 (producción)

INFRAESTRUCTURA (Opcional para producción)
├── Docker + Docker Compose
├── Nginx (reverse proxy)
└── HTTPS (obligatorio para cámaras)
```

### 6.2 Modelo de Datos

```sql
-- Tabla de Usuarios (Vigilantes)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'guard', -- 'guard', 'support', 'admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Registros de Ingreso
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(20) NOT NULL,
    vehicle_photo TEXT NOT NULL,
    driver_photo TEXT NOT NULL,
    driver_embedding vector(512),
    entry_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guard_id UUID REFERENCES users(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    device_info TEXT, -- User agent, device ID
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabla de Conductores Conocidos (Biometría)
CREATE TABLE "KnownDriver" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fullName" VARCHAR(255),
    "licensePlate" VARCHAR(20) NOT NULL,
    "vehiclePhoto" TEXT NOT NULL,
    "driverPhoto" TEXT NOT NULL,
    embedding vector(512),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Registros de Salida
CREATE TABLE exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID UNIQUE REFERENCES entries(id), -- Relación 1-a-1 estricta
    exit_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guard_id UUID REFERENCES users(id),
    driver_photo_exit TEXT, -- Foto del conductor al salir (comparación)
    is_driver_match BOOLEAN, -- Verificación de conductor
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    device_info TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Incidentes
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES entries(id),
    incident_type VARCHAR(50) NOT NULL, -- 'driver_mismatch', 'unregistered_exit', 'plate_not_visible', 'conductor_refused', 'other'
    description TEXT,
    reported_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved'
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_entries_plate ON entries(license_plate);
CREATE INDEX idx_entries_timestamp ON entries(entry_timestamp);
CREATE INDEX idx_entries_guard ON entries(guard_id);
CREATE INDEX idx_exits_entry ON exits(entry_id);
CREATE INDEX idx_exits_guard ON exits(guard_id);
CREATE INDEX idx_incidents_entry ON incidents(entry_id);
CREATE INDEX idx_incidents_reported ON incidents(reported_by);
CREATE INDEX idx_incidents_status ON incidents(status);
```

### 6.3 API Endpoints

```
AUTH
POST   /api/auth/login          - Inicio de sesión (retorna JWT)
POST   /api/auth/logout         - Cerrar sesión
GET    /api/auth/me             - Usuario actual

ENTRIES (Ingresos)
GET    /api/entries             - Listar ingresos (con filtros)
GET    /api/entries/:id         - Detalle de ingreso
POST   /api/entries             - Crear nuevo ingreso (captura de datos)
GET    /api/entries/unsettled   - Ingresos sin salida (para verificar salida)

EXITS (Salidas)
GET    /api/exits               - Listar salidas
GET    /api/exits/:id           - Detalle de salida
POST   /api/exits               - Registrar salida (verificación)

INCIDENTS (Incidentes)
GET    /api/incidents           - Listar incidentes
POST   /api/incidents           - Reportar incidente
PATCH  /api/incidents/:id       - Actualizar estado de incidente


FACIAL RECOGNITION (Microservicio Proxy)
POST   /api/facial/recognize    - Analiza rostro y devuelve embedding
POST   /api/facial/register-profile - Registra un nuevo perfil biométrico

DASHBOARD
GET    /api/dashboard/stats     - Estadísticas generales
GET    /api/dashboard/recent    - Registros recientes
```

### 6.4 Request/Response Examples

```typescript
// POST /api/entries - Crear ingreso
interface CreateEntryRequest {
  licensePlate: string;
  vehiclePhoto: string; // Base64 o URL
  driverPhoto: string;  // Base64 o URL
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface CreateEntryResponse {
  success: boolean;
  data: {
    id: string;
    licensePlate: string;
    entryTimestamp: string;
    message: string;
  };
  error?: string;
}

// POST /api/exits - Registrar salida
interface CreateExitRequest {
  licensePlate: string; // Para buscar el ingreso
  driverPhotoExit?: string; // Foto del conductor al salir (opcional)
  latitude?: number;
  longitude?: number;
  notes?: string;
}

interface CreateExitResponse {
  success: boolean;
  data: {
    id: string;
    entryId: string;
    exitTimestamp: string;
    driverMatch: boolean;
    message: string;
  };
  verification?: {
    entryDriverPhoto: string;
    exitDriverPhoto?: string;
    matchConfidence?: number;
  };
  error?: string;
}
```

### 6.5 Consideraciones de Seguridad y Robustez

1. **Control de Acceso Basado en Roles (RBAC) y Separación de Funciones (SoD)**:
   - Tres roles técnicos estrictos: `guard` (vigilantes operativos de garita), `support` (soporte técnico y auditoría), y `admin` (control total).
   - Bloqueo en frontend y backend: la API de Express valida la firma del token JWT y restringe los endpoints según el rol (`authorize(['rol1', 'rol2'])`).
   - El frontend renderiza únicamente las pestañas permitidas y cuenta con un hook de guardia en `App.tsx` que redirige inmediatamente a vistas seguras autorizadas ante intentos de navegación manuales o en caliente.
   - **Flujo de Privacidad Estricta de Incidentes**: Para evitar colusiones en garita, el vigilante (`guard`) puede reportar incidentes, pero una vez enviados, pierde visibilidad del listado o historial de incidentes.
2. **Seguridad JWT en Producción**:
   - Validación del arranque de backend: si corre en `production` y falta la variable `JWT_SECRET` o coincide con la clave de desarrollo por defecto, el proceso aborta inmediatamente (`process.exit(1)`) para evitar despliegues inseguros.
   - Duración de tokens restringida a un máximo de 8 horas.
3. **Robustez de Consultas y Paginación**:
   - Sanitización en endpoints de consulta: los parámetros `page` y `limit` se parsean con límites obligatorios (`Math.max(1, ...)` y límites superiores DoS de `100` registros) para evitar excepciones `NaN` que puedan tumbar el backend.
4. **Integridad de Reportes y Protección contra CSV Injection**:
   - Sanitización de celdas en descargas: se implementa una función de escapado estricta (`escapeCSV`) sobre campos de texto (IDs, Placas, Vigilantes, Notas) que duplica comillas dobles y envuelve los valores entre comillas dobles para evitar corrupciones de celdas en Excel o inyecciones de fórmulas.
5. **Transmisión de imágenes:** HTTPS obligatorio, compresión antes de enviar.
6. **Almacenamiento:** Base64 nativo en PostgreSQL (con migración programada a almacenamiento de objetos a mediano plazo para escalabilidad de disco).

### 6.6 Offline-First Strategy (PWA)

```
1. Service Worker intercepta requests
2. Si offline: guarda en IndexedDB
3. UI muestra "Modo offline" claramente
4. Al recuperar conexión: sync automático
5. Conflictos: última escritura gana + log
```

## 7. Flujo de Usuario Detallado

### Registro de Ingreso (Mobile-First)

```
┌─────────────────────────────────────┐
│     📋 REGISTRO DE INGRESO          │
│     🕐 14:32:05                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      [CÁMARA EN VIVO]       │   │
│  │                             │   │
│  │    ┌─────────────────┐     │   │
│  │    │  guía vehículo  │     │   │
│  │    └─────────────────┘     │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  PASO 1 de 3: Foto del Vehículo    │
│                                     │
│  ●────────○────────○                │
│                                     │
│  [    📷 CAPTURAR FOTO    ]         │
│                                     │
└─────────────────────────────────────┘
```

### Después de captura de vehículo:

```
┌─────────────────────────────────────┐
│  ✓ Foto Vehículo Capturada          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [Thumbnail del vehículo]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ●────────●────────○                │
│  Vehículo  Conductor  Placa        │
│                                     │
│  [    📷 CAPTURAR CONDUCTOR    ]    │
│                                     │
└─────────────────────────────────────┘
```

### Verificación de Salida

```
┌─────────────────────────────────────┐
│     🚪 VERIFICACIÓN DE SALIDA       │
│     🕐 16:45:22                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔍 Ingrese o escanee placa  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ABC-1234                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [        BUSCAR REGISTRO        ]  │
│                                     │
└─────────────────────────────────────┘
```

### Si conductor no coincide:

```
┌─────────────────────────────────────┐
│     ⚠️ ALERTA: CONDUCTOR DIFERENTE │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────┐     ┌───────────┐   │
│  │  REGIS-   │     │  ACTUAL   │   │
│  │  TRADO    │     │           │   │
│  │  [Foto]   │     │  [Foto]   │   │
│  └───────────┘     └───────────┘   │
│                                     │
│  Placa: ABC-1234                    │
│  Ingreso: 14:32 (hace 2h 13min)    │
│                                     │
│  [REPORTAR INCIDENTE]              │
│  [CONFIRMAR SALIDA IGUALMENTE]     │
│                                     │
└─────────────────────────────────────┘
```

## 8. Métricas y KPIs del Sistema

| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| Tiempo promedio de registro | Ingreso → Confirmación | < 60 segundos |
| Tasa de identificación facial | % fotos con rostro detectable | > 95% |
| Precisión de verificación | Matching correcto de conductores | > 99% |
| Disponibilidad del sistema | Uptime mensual | > 99.5% |
| Tiempo de respuesta API | Latencia promedio | < 200ms |

---

*Documento de Arquitectura Técnica - Sistema de Control de Ingresos y Salidas de Vehículos v1.0*
