#!/bin/bash

# Script de prueba para endpoints de Email (SMTP + Plantillas)
# Autor: Sistema SuperAdmin
# Fecha: 2026-01-05

echo "🧪 Testing Email Module Endpoints"
echo "========================================"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Login como SuperAdmin
echo -e "\n${BLUE}1. Login como SuperAdmin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dentista.com","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Login exitoso${NC}"
else
  echo "❌ Error en login"
  exit 1
fi

# 2. Listar todas las configuraciones SMTP
echo -e "\n${BLUE}2. Listar configuraciones SMTP${NC}"
CONFIGS=$(curl -s -X GET "http://localhost:3000/api/admin/email/config/all" \
  -H "Authorization: Bearer $TOKEN")
echo $CONFIGS | jq '.'
CONFIG_COUNT=$(echo $CONFIGS | jq 'length')
echo -e "${GREEN}Total de configuraciones: $CONFIG_COUNT${NC}"

# 3. Listar todas las plantillas de email
echo -e "\n${BLUE}3. Listar plantillas de email${NC}"
TEMPLATES=$(curl -s -X GET "http://localhost:3000/api/admin/email/templates?includeInactive=true" \
  -H "Authorization: Bearer $TOKEN")
echo $TEMPLATES | jq '.'
TEMPLATE_COUNT=$(echo $TEMPLATES | jq 'length')
echo -e "${GREEN}Total de plantillas: $TEMPLATE_COUNT${NC}"

# 4. Obtener estadísticas de plantillas
echo -e "\n${BLUE}4. Estadísticas de plantillas${NC}"
curl -s -X GET "http://localhost:3000/api/admin/email/templates/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Obtener una plantilla específica (WELCOME)
echo -e "\n${BLUE}5. Obtener plantilla WELCOME${NC}"
WELCOME_ID=$(echo $TEMPLATES | jq -r '.[] | select(.type=="WELCOME") | .id')
if [ -n "$WELCOME_ID" ] && [ "$WELCOME_ID" != "null" ]; then
  curl -s -X GET "http://localhost:3000/api/admin/email/templates/$WELCOME_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
else
  echo "Plantilla WELCOME no encontrada"
fi

# 6. Listar logs de emails
echo -e "\n${BLUE}6. Listar logs de emails (últimos 20)${NC}"
LOGS=$(curl -s -X GET "http://localhost:3000/api/admin/email/logs?limit=20" \
  -H "Authorization: Bearer $TOKEN")
echo $LOGS | jq '.'
LOG_COUNT=$(echo $LOGS | jq 'length')
echo -e "${GREEN}Total de logs: $LOG_COUNT${NC}"

# 7. Crear una nueva configuración SMTP (ejemplo con Gmail)
echo -e "\n${BLUE}7. Crear configuración SMTP de ejemplo${NC}"
NEW_CONFIG=$(curl -s -X POST "http://localhost:3000/api/admin/email/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "noreply@denticloud.com",
    "smtpPassword": "your-app-password-here",
    "smtpSecure": true,
    "fromEmail": "noreply@denticloud.com",
    "fromName": "DentiCloud",
    "replyToEmail": "soporte@denticloud.com"
  }')
echo $NEW_CONFIG | jq '.'
NEW_CONFIG_ID=$(echo $NEW_CONFIG | jq -r '.id')

if [ -n "$NEW_CONFIG_ID" ] && [ "$NEW_CONFIG_ID" != "null" ]; then
  echo -e "${GREEN}✅ Configuración SMTP creada con ID: $NEW_CONFIG_ID${NC}"
  
  # 8. Actualizar la configuración
  echo -e "\n${BLUE}8. Actualizar configuración SMTP${NC}"
  curl -s -X PUT "http://localhost:3000/api/admin/email/config/$NEW_CONFIG_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "fromName": "DentiCloud - Sistema Dental"
    }' | jq '.'
  
  # 9. Eliminar la configuración de prueba
  echo -e "\n${BLUE}9. Eliminar configuración SMTP de prueba${NC}"
  curl -s -X DELETE "http://localhost:3000/api/admin/email/config/$NEW_CONFIG_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
else
  echo -e "${YELLOW}⚠️  No se pudo crear la configuración SMTP${NC}"
fi

# 10. Crear una nueva plantilla de email
echo -e "\n${BLUE}10. Crear nueva plantilla de email${NC}"
NEW_TEMPLATE=$(curl -s -X POST "http://localhost:3000/api/admin/email/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "USER_CREATED",
    "name": "Usuario Creado",
    "description": "Email de bienvenida para nuevos usuarios",
    "subject": "Bienvenido a {{tenantName}} - {{userName}}",
    "htmlBody": "<html><body><h1>Hola {{userName}}</h1><p>Tu cuenta ha sido creada en {{tenantName}}.</p></body></html>",
    "textBody": "Hola {{userName}}, tu cuenta ha sido creada en {{tenantName}}.",
    "variables": ["userName", "tenantName"]
  }')
echo $NEW_TEMPLATE | jq '.'
NEW_TEMPLATE_ID=$(echo $NEW_TEMPLATE | jq -r '.id')

if [ -n "$NEW_TEMPLATE_ID" ] && [ "$NEW_TEMPLATE_ID" != "null" ]; then
  echo -e "${GREEN}✅ Plantilla creada con ID: $NEW_TEMPLATE_ID${NC}"
  
  # 11. Actualizar la plantilla
  echo -e "\n${BLUE}11. Actualizar plantilla${NC}"
  curl -s -X PUT "http://localhost:3000/api/admin/email/templates/$NEW_TEMPLATE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "description": "Email de bienvenida para nuevos usuarios del sistema"
    }' | jq '.'
  
  # 12. Desactivar la plantilla
  echo -e "\n${BLUE}12. Desactivar plantilla${NC}"
  curl -s -X POST "http://localhost:3000/api/admin/email/templates/$NEW_TEMPLATE_ID/deactivate" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  
  # 13. Activar la plantilla
  echo -e "\n${BLUE}13. Activar plantilla${NC}"
  curl -s -X POST "http://localhost:3000/api/admin/email/templates/$NEW_TEMPLATE_ID/activate" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  
  # 14. Eliminar la plantilla de prueba
  echo -e "\n${BLUE}14. Eliminar plantilla de prueba${NC}"
  curl -s -X DELETE "http://localhost:3000/api/admin/email/templates/$NEW_TEMPLATE_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
else
  echo -e "${YELLOW}⚠️  No se pudo crear la plantilla${NC}"
fi

echo -e "\n${GREEN}✅ Pruebas completadas${NC}"
echo "========================================"
echo -e "${YELLOW}Credenciales de prueba:${NC}"
echo "  Email: admin@dentista.com"
echo "  Password: Admin123!"
echo ""
echo -e "${YELLOW}Plantillas creadas en seed:${NC}"
echo "  - WELCOME - Bienvenida a nuevos tenants"
echo "  - TRIAL_EXPIRING - Notificación de trial expirando"
echo "  - PASSWORD_RESET - Restablecer contraseña"
echo "  - PAYMENT_SUCCESS - Confirmación de pago"
echo ""
echo -e "${YELLOW}Frontend:${NC}"
echo "  Configuración SMTP: http://localhost:5173/superadmin/email/config"
echo "  Plantillas: http://localhost:5173/superadmin/email/templates"
echo "  Logs: http://localhost:5173/superadmin/email/logs"
echo "  (Asegúrate de que el frontend esté corriendo con 'npm run dev')"
