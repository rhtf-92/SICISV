# Sistema de Control de Ingresos y Salidas de Vehículos (SICISV)

Sistema full-stack para control vehicular empresarial que requiere captura simultánea de evidencia fotográfica (vehículo lateral + rostro del conductor) y registro de placa, siguiendo un flujo estrictamente secuencial.

## Características Principales

- **Flujo Secuencial Estricto**: 
  1. Captura foto lateral del vehículo
  2. Captura foto del conductor (con detección facial)
  3. Registro de placa (validación de formato)
  4. Confirmación de ingreso/salida

- **Tecnologías**:
  - **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
  - **Backend Especificado**: Node.js 20 + Express + TypeScript + Prisma + PostgreSQL
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

Este repositorio contiene la **implementación frontend completa** basada en las especificaciones técnicas. El backend según la especificación en `docs/SPEC.md` debe implementarse posteriormente para tener un sistema fully functional.

## Documentación Técnica

Consulte `docs/SPEC.md` para:
- Arquitectura detallada
- Modelo de datos SQL
- Endpoints API especificados
- Flujos de usuario detallados
- Consideraciones de seguridad y despliegue