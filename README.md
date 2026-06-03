# Sistema de Control de Ingresos y Salidas de Vehículos (SICISV)

Sistema full-stack para control vehicular empresarial que requiere captura simultánea de evidencia fotográfica (vehículo lateral + rostro del conductor) y registro de placa, siguiendo un flujo estrictamente secuencial. Incorpora un avanzado sistema de reconocimiento facial impulsado por IA para la validación biométrica automática de conductores.

## Características Principales

- **Flujo Secuencial Estricto**: 
  1. Captura foto lateral del vehículo
  2. Captura foto del conductor (con extracción y validación biométrica facial)
  3. Registro de placa (validación de formato)
  4. Confirmación de ingreso/salida con Facial Match Automático

- **Tecnologías Modernizadas (Actualizado a Mayo 2026)**:
  - **Frontend**: React 19 (última versión estable) + TypeScript 5.7 + Vite 6 + Tailwind CSS 3.4 + Zustand 5
  - **Backend API**: Node.js 20+ + Express 5 + TypeScript 5.7 + Prisma 7
  - **Microservicio de IA**: Python 3.10+ + FastAPI + InsightFace + OpenCV
  - **Base de Datos**: PostgreSQL 18 con extensión `pgvector`
  - **Almacenamiento**: Base64 (demo) / AWS S3 (producción)
  - **Autenticación**: JWT
  - **Offline-First**: PWA con Service Worker y IndexedDB

- **Funcionalidades Clave**:
  - Registro de ingreso con verificación de identidad
  - Registro de salida con comparación de conductor
  - Historial y reportes exportables
  - Manejo de incidentes y anomalías
  - Interfaz optimizada para vigilantes (modo offline, controles grandes)

- **Seguridad**:
  - HTTPS obligatorio
  - Encriptación AES-256 de imágenes
  - JWT con expiración de 8h
  - Validación y sanitización de inputs
  - Auditoría completa de operaciones

## Estado Actual

El sistema está **100% implementado y es completamente funcional (Full-Stack)**. Cuenta con una arquitectura monorepo basada en npm workspaces, un backend robusto en TypeScript con Express y Prisma ORM, y una base de datos real PostgreSQL.

---

## 🛠️ Requisitos del Sistema e Instalación de Prerrequisitos

Para poder compilar y ejecutar el proyecto localmente, su máquina debe contar con los siguientes componentes de entorno instalados y configurados:


### 3. Docker y Docker Compose (Recomendado)
* **Descripción**: Indispensable para levantar de manera ágil el contenedor del microservicio de reconocimiento facial (`facial-service`), automatizando la instalación de dependencias complejas (OpenCV, InsightFace).
* **Instalación**: Siga la documentación oficial de Docker para su entorno.

---

### 1. Node.js (v20 LTS o superior) & npm (v10 o superior)
* **Descripción**: Entorno de tiempo de ejecución de JavaScript para servidores y gestor de paquetes oficial, indispensable para soportar y gestionar la estructura modular monorepo de *npm workspaces* utilizada en este proyecto.
* **Instalación en Linux (Ubuntu/Debian)**:
  ```bash
  # Agregar repositorio oficial para Node.js v20 LTS
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  
  # Instalar el paquete runtime de Node.js
  sudo apt-get install -y nodejs
  ```

### 2. PostgreSQL (v18 o superior) y Cliente `psql`
* **Descripción**: Motor de base de datos relacional SQL robusto y de alto rendimiento. El proyecto aprovecha la herramienta de inicialización de directorios de datos (`initdb`) y el controlador de servicios nativo (`pg_ctl`) para levantar una base de datos PostgreSQL privada en espacio de usuario (puerto `5433`), asegurando aislamiento absoluto del sistema y exención de privilegios administrativos de root.
* **Instalación en Linux (Ubuntu/Debian)**:
  ```bash
  # Agregar el repositorio oficial del PostgreSQL Global Development Group (PGDG)
  sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

  # Actualizar repositorios e instalar PostgreSQL 18 y el cliente
  sudo apt-get update
  sudo apt-get install -y postgresql-18 postgresql-client-18
  ```

---

## 🚀 Guía de Arranque y Despliegue de Desarrollo

Siga este orden secuencial para levantar el sistema en un entorno local de desarrollo. Todos los comandos deben ejecutarse desde el directorio raíz del proyecto (`/home/satoshi/GitHub/SICISV`).

### 📦 1. Instalación de Dependencias
Descargue e instale todos los módulos de Node.js requeridos para los workspaces del monorepo (`frontend` y `backend`):
```bash
npm install
```

### 🗄️ 2. Preparación y Arranque de la Base de Datos (PostgreSQL Privado)
Para evitar conflictos de puertos (`5432` ocupado) y requerimientos de privilegios administrativos de root (`sudo`), la base de datos se ejecuta de manera privada bajo el puerto **`5433`**.

#### A. Exportar comandos globales (Paso indispensable)
Antes de ejecutar los comandos de base de datos, agregue la ruta de los ejecutables de PostgreSQL 18 a su variable de entorno de terminal para poder usarlos de manera directa y limpia (sin rutas absolutas):

* **Solo para la sesión de terminal actual**:
  ```bash
  export PATH="/usr/lib/postgresql/18/bin:$PATH"
  ```
* **De forma permanente (Recomendado)**:
  ```bash
  echo 'export PATH="/usr/lib/postgresql/18/bin:$PATH"' >> ~/.bashrc
  source ~/.bashrc
  ```

#### B. Comandos de Inicialización y Control
Una vez exportado el PATH, opere la base de datos de manera limpia desde la raíz del proyecto:

* **Inicializar el clúster de datos** (Solo la primera vez):
  ```bash
  initdb -D pg_data
  ```
* **Iniciar el servidor PostgreSQL (Automático - Recomendado)**:
  Ejecute el script automatizado que valida el estado de la conexión, localiza el ejecutable de PostgreSQL 18 y arranca el servidor local de manera segura:
  ```bash
  npm run db:start
  ```
  O directamente ejecutando el script en terminal:
  ```bash
  ./start_db.sh
  ```
* **Iniciar el servidor PostgreSQL (Manual)**:
  ```bash
  /usr/lib/postgresql/18/bin/pg_ctl -D pg_data -l pg_data/server.log -o "-p 5433 -k /home/satoshi/GitHub/SICISV/pg_data" start
  ```
* **Crear roles y base de datos de desarrollo** (Solo la primera vez):
  ```bash
  psql -h localhost -p 5433 -d postgres -c "CREATE ROLE sicisv WITH LOGIN SUPERUSER PASSWORD 'sicisv_dev';" && psql -h localhost -p 5433 -d postgres -c "CREATE DATABASE sicisv OWNER sicisv;"
  ```
* **Detener el servidor PostgreSQL**:
  ```bash
  pg_ctl -D pg_data stop
  ```

### 🧬 3. Configuración y Semilla de Datos
Aplique las migraciones en la base de datos PostgreSQL generada y cree los registros de usuarios iniciales (semilla):
```bash
# Ejecutar migraciones estructurales
npm run db:migrate

# Poblar base de datos con usuarios de prueba
npm run db:seed
```

### 💻 4. Ejecución del Entorno de Desarrollo (IA + Backend + Frontend)

#### Opción A: Arranque Global con Docker (Recomendado)
Puede levantar la base de datos y el microservicio facial usando Docker Compose:
```bash
npm run docker:up
```

#### Opción B: Arranque Concurrente Local
Inicie el backend en Node y el frontend en Vite:
```bash
npm run dev
```
* **Vite Frontend**: [http://localhost:5173/](http://localhost:5173/)
* **Express Backend**: [http://localhost:3001/](http://localhost:3001/)
* **Facial API**: [http://localhost:3002/](http://localhost:3002/)

#### Opción C: Arranque Individual por Terminal
Si desea monitorear logs específicos de manera aislada:
```bash
# Iniciar únicamente el Backend
npm run dev:backend

# Iniciar únicamente el Frontend (en otra terminal)
npm run dev:frontend
```

---

## 🔍 5. Inspección y Verificación de Tablas

### Visualmente (Prisma Studio)
La forma más interactiva de auditar las tablas (`User`, `Entry`, `Exit`, `Incident`) es abriendo la interfaz web de Prisma:
```bash
npm run db:studio
```
Abra en el navegador: [http://localhost:5555/](http://localhost:5555/)

### Vía CLI (`psql`)
```bash
psql -h localhost -p 5433 -U sicisv -d sicisv
```
*(Contraseña: `sicisv_dev`)*

---

## 🧪 Auditoría y Verificación del Stack Tecnológico

Para garantizar y certificar que todos los servicios y dependencias operan en las versiones modernizadas correctas (React 19, Express 5, Prisma 7 y PostgreSQL 18) y con total estabilidad, ejecute las siguientes pruebas de verificación:

### 1. Verificación del Motor de Base de Datos (PostgreSQL 18 & Prisma 7)
* **Versión del Servidor PostgreSQL**:
  Asegúrese de que el clúster local de desarrollo está iniciado y consulte la versión en consola:
  ```bash
  psql -h localhost -p 5433 -U sicisv -d sicisv -c "SELECT version();"
  ```
  *Deberá retornar una cadena que inicie con `PostgreSQL 18.x`*.
* **Versión de Prisma ORM**:
  Compruebe que la CLI y el motor de generación cargan la estructura modular `prisma.config.ts` y reportan la última versión estable:
  ```bash
  npx prisma -v
  ```
  *Deberá reportar `@prisma/client : 7.8.0` y `prisma : 7.8.0`*.

### 2. Verificación del Servidor API (Express 5 & TypeScript 5.7)
* **Verificación de Compilación Estricta**:
  Compile los controladores del backend para descartar incompatibilidades de tipado con Express 5:
  ```bash
  npm run build:backend
  ```
  *Deberá finalizar con éxito (código de salida 0) y sin errores*.
* **Auditoría de Versión Activa**:
  Consulte la resolución de dependencias físicas del espacio de trabajo del backend:
  ```bash
  npm list express --workspace=backend
  ```
  *Confirmará el uso de `express@5.0.0` (o superior)*.
* **Integración y Autenticación E2E**:
  Inicie los servicios (`npm run dev`) y ejecute una consulta de autenticación simulada contra los endpoints reales:
  ```bash
  curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"vigilante","password":"guard123"}'
  ```
  *Deberá retornar un JSON con `"success": true` y el token JWT firmado*.

### 3. Verificación de Interfaz e Tooling (React 19 & Vite 6)
* **Auditoría de Versión Activa**:
  Inspeccione los paquetes de interfaz de usuario cargados en node_modules del frontend:
  ```bash
  npm list react vite --workspace=frontend
  ```
  *Deberá constatar `react@19.0.0` y `vite@6.2.0` (o superiores)*.
* **Verificación del Compilado de Producción**:
  Empaquete el Frontend completo utilizando la configuración de compilado óptimo de Vite 6:
  ```bash
  npm run build:frontend
  ```
  *Deberá generar exitosamente el bundle optimizado en la carpeta `dist/` sin advertencias de dependencias*.

---

## 🔑 Credenciales de Acceso Sembradas

| Rol | Usuario | Contraseña | Nombre Real |
| :--- | :--- | :--- | :--- |
| **Vigilante (Guard)** | `vigilante` | `guard123` | Carlos García |
| **Supervisor** | `supervisor` | `super123` | Sofía Rodríguez |
| **Administrador** | `admin` | `admin123` | Administrador SICISV |

---

## 📄 Documentación Técnica

Consulte `docs/SPEC.md` para profundizar en:
- Arquitectura detallada
- Modelo de datos SQL y diagramas de flujos
- Especificación técnica del ciclo de vida de registros
- Consideraciones de seguridad y despliegue en producción