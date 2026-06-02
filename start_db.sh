#!/bin/bash

# start_db.sh - Script para iniciar la base de datos PostgreSQL 18 de SICISV
# Diseñado por el Arquitecto de Software Senior

PORT=5433
DB_DIR="pg_data"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/pg_data/server.log"
SOCKET_DIR="$SCRIPT_DIR/pg_data"
PG_CTL="/usr/lib/postgresql/18/bin/pg_ctl"

echo "🔍 Verificando estado de la base de datos en puerto $PORT..."

# Comprobar si ya está corriendo
if pg_isready -h localhost -p $PORT > /dev/null 2>&1; then
    echo "✅ La base de datos ya está corriendo y aceptando conexiones en el puerto $PORT."
    exit 0
fi

echo "🚀 Iniciando base de datos PostgreSQL 18 local..."

# Verificar si existe el ejecutable pg_ctl
if [ ! -f "$PG_CTL" ]; then
    echo "❌ Error: No se encontró el ejecutable pg_ctl en $PG_CTL."
    echo "Asegúrese de tener PostgreSQL 18 instalado en la ruta estándar de Ubuntu/Debian."
    exit 1
fi

# Iniciar PostgreSQL
"$PG_CTL" -D "$SCRIPT_DIR/$DB_DIR" -l "$LOG_FILE" -o "-p $PORT -k $SOCKET_DIR" start

# Esperar a que esté lista
echo "⏳ Esperando a que el servidor se inicialice..."
for i in {1..10}; do
    if pg_isready -h localhost -p $PORT > /dev/null 2>&1; then
        echo "✅ Base de datos iniciada con éxito y lista para conexiones en puerto $PORT."
        exit 0
    fi
    sleep 1
done

echo "❌ Error: La base de datos no se inició correctamente en el tiempo esperado."
echo "Revise los registros de error en: $LOG_FILE"
exit 1
