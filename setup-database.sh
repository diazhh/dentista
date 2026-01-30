#!/bin/bash

# ============================================
# DentiCloud - Database Setup Script
# ============================================
# Este script crea la base de datos PostgreSQL
# y ejecuta las migraciones de Prisma
# ============================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de base de datos
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="dentista_db"
DOCKER_CONTAINER="postgres-instance"

# URL de conexión para Prisma
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   DentiCloud - Database Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Función para verificar si PostgreSQL está corriendo (via Docker)
check_postgres() {
    echo -e "${YELLOW}[1/5] Verificando conexión a PostgreSQL...${NC}"

    # Verificar si el contenedor está corriendo
    if docker ps --format '{{.Names}}' | grep -q "^${DOCKER_CONTAINER}$"; then
        echo -e "${GREEN}✓ Contenedor Docker '${DOCKER_CONTAINER}' está corriendo${NC}"

        # Verificar conexión
        if docker exec $DOCKER_CONTAINER psql -U $DB_USER -c '\q' 2>/dev/null; then
            echo -e "${GREEN}✓ PostgreSQL está accesible en ${DB_HOST}:${DB_PORT}${NC}"
            return 0
        else
            echo -e "${RED}✗ No se puede conectar a PostgreSQL dentro del contenedor${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ El contenedor '${DOCKER_CONTAINER}' no está corriendo${NC}"
        echo -e "${YELLOW}  Iniciando contenedor...${NC}"
        docker start $DOCKER_CONTAINER 2>/dev/null || {
            echo -e "${RED}✗ No se pudo iniciar el contenedor${NC}"
            echo -e "${YELLOW}  Puedes crearlo con: docker run --name postgres-instance -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:latest${NC}"
            return 1
        }
        sleep 3
        echo -e "${GREEN}✓ Contenedor iniciado${NC}"
        return 0
    fi
}

# Función para crear la base de datos
create_database() {
    echo ""
    echo -e "${YELLOW}[2/5] Creando base de datos '${DB_NAME}'...${NC}"

    # Verificar si la base de datos ya existe
    if docker exec $DOCKER_CONTAINER psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        echo -e "${YELLOW}⚠ La base de datos '${DB_NAME}' ya existe.${NC}"
        read -p "¿Deseas eliminarla y recrearla? (s/N): " response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            echo -e "${YELLOW}  Eliminando base de datos existente...${NC}"
            docker exec $DOCKER_CONTAINER psql -U $DB_USER -c "DROP DATABASE IF EXISTS ${DB_NAME};"
            echo -e "${GREEN}✓ Base de datos eliminada${NC}"
        else
            echo -e "${GREEN}✓ Usando base de datos existente${NC}"
            return 0
        fi
    fi

    # Crear la base de datos
    docker exec $DOCKER_CONTAINER psql -U $DB_USER -c "CREATE DATABASE ${DB_NAME};"
    echo -e "${GREEN}✓ Base de datos '${DB_NAME}' creada exitosamente${NC}"
}

# Función para configurar el archivo .env
setup_env() {
    echo ""
    echo -e "${YELLOW}[3/5] Configurando archivo .env...${NC}"

    ENV_FILE="backend/.env"
    ENV_EXAMPLE="backend/.env.example"

    # Si no existe .env, crearlo desde .env.example o desde cero
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo -e "${GREEN}✓ Archivo .env creado desde .env.example${NC}"
        else
            touch "$ENV_FILE"
            echo -e "${GREEN}✓ Archivo .env creado${NC}"
        fi
    fi

    # Actualizar DATABASE_URL en .env
    if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
        # Reemplazar la línea existente
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
        fi
        echo -e "${GREEN}✓ DATABASE_URL actualizada en .env${NC}"
    else
        # Agregar la línea si no existe
        echo "DATABASE_URL=${DATABASE_URL}" >> "$ENV_FILE"
        echo -e "${GREEN}✓ DATABASE_URL agregada a .env${NC}"
    fi

    echo -e "${BLUE}  DATABASE_URL=${DATABASE_URL}${NC}"
}

# Función para instalar dependencias
install_dependencies() {
    echo ""
    echo -e "${YELLOW}[4/5] Instalando dependencias del backend...${NC}"

    cd backend

    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi

    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
    cd ..
}

# Función para ejecutar migraciones
run_migrations() {
    echo ""
    echo -e "${YELLOW}[5/5] Ejecutando migraciones de Prisma...${NC}"

    cd backend

    # Generar cliente Prisma
    echo -e "${BLUE}  Generando cliente Prisma...${NC}"
    npx prisma generate

    # Ejecutar migraciones
    echo -e "${BLUE}  Aplicando migraciones...${NC}"
    npx prisma migrate deploy

    echo -e "${GREEN}✓ Migraciones aplicadas exitosamente${NC}"
    cd ..
}

# Función para mostrar resumen
show_summary() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}   ✓ Setup completado exitosamente!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${BLUE}Base de datos:${NC}"
    echo -e "  Host:      ${DB_HOST}"
    echo -e "  Puerto:    ${DB_PORT}"
    echo -e "  Usuario:   ${DB_USER}"
    echo -e "  Database:  ${DB_NAME}"
    echo -e "  Container: ${DOCKER_CONTAINER}"
    echo ""
    echo -e "${BLUE}Próximos pasos:${NC}"
    echo -e "  1. cd backend && npm run start:dev"
    echo -e "  2. En otra terminal: cd frontend && npm run dev"
    echo -e "  3. Visita http://localhost:3001"
    echo ""
    echo -e "${BLUE}Comandos útiles:${NC}"
    echo -e "  - Ver DB:     cd backend && npx prisma studio"
    echo -e "  - Seed:       cd backend && npm run prisma:seed"
    echo -e "  - Logs DB:    docker logs ${DOCKER_CONTAINER}"
    echo ""
}

# ============================================
# MAIN
# ============================================

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde el directorio raíz del proyecto (dentista/)${NC}"
    exit 1
fi

# Verificar que Docker está disponible
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado${NC}"
    exit 1
fi

# Ejecutar pasos
check_postgres || exit 1
create_database
setup_env
install_dependencies
run_migrations
show_summary
