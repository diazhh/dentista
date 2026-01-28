#!/bin/bash

# Script de prueba para endpoints de Gestión de Planes
# Autor: Sistema SuperAdmin
# Fecha: 2026-01-05

echo "🧪 Testing Subscription Plans Endpoints"
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

# 2. Listar todos los planes activos
echo -e "\n${BLUE}2. Listar planes activos${NC}"
curl -s -X GET "http://localhost:3000/api/admin/plans" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Listar todos los planes (incluyendo inactivos)
echo -e "\n${BLUE}3. Listar todos los planes (incluyendo inactivos)${NC}"
ALL_PLANS=$(curl -s -X GET "http://localhost:3000/api/admin/plans?includeInactive=true" \
  -H "Authorization: Bearer $TOKEN")
echo $ALL_PLANS | jq '.'
PLAN_COUNT=$(echo $ALL_PLANS | jq 'length')
echo -e "${GREEN}Total de planes: $PLAN_COUNT${NC}"

# 4. Obtener estadísticas de planes
echo -e "\n${BLUE}4. Estadísticas de planes${NC}"
curl -s -X GET "http://localhost:3000/api/admin/plans/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Obtener un plan específico
echo -e "\n${BLUE}5. Obtener plan específico (Starter)${NC}"
STARTER_ID=$(echo $ALL_PLANS | jq -r '.[] | select(.code=="STARTER") | .id')
curl -s -X GET "http://localhost:3000/api/admin/plans/$STARTER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Crear un nuevo plan
echo -e "\n${BLUE}6. Crear nuevo plan (Premium)${NC}"
NEW_PLAN=$(curl -s -X POST "http://localhost:3000/api/admin/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium",
    "code": "PREMIUM",
    "description": "Plan premium con todas las funcionalidades",
    "monthlyPrice": 149.99,
    "yearlyPrice": 1499.99,
    "maxPatients": 1000,
    "maxUsers": 20,
    "storageGB": 50,
    "features": ["odontograms", "treatment_plans", "invoicing", "whatsapp", "advanced_reports", "api_access"],
    "isPublic": true,
    "sortOrder": 4
  }')
echo $NEW_PLAN | jq '.'
NEW_PLAN_ID=$(echo $NEW_PLAN | jq -r '.id')
echo -e "${GREEN}✅ Plan creado con ID: $NEW_PLAN_ID${NC}"

# 7. Actualizar un plan
echo -e "\n${BLUE}7. Actualizar plan Premium${NC}"
curl -s -X PUT "http://localhost:3000/api/admin/plans/$NEW_PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Plan premium actualizado con todas las funcionalidades avanzadas",
    "monthlyPrice": 139.99
  }' | jq '.'

# 8. Desactivar un plan
echo -e "\n${BLUE}8. Desactivar plan Premium${NC}"
curl -s -X POST "http://localhost:3000/api/admin/plans/$NEW_PLAN_ID/deactivate" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 9. Activar un plan
echo -e "\n${BLUE}9. Activar plan Premium${NC}"
curl -s -X POST "http://localhost:3000/api/admin/plans/$NEW_PLAN_ID/activate" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 10. Intentar eliminar un plan (debería fallar si hay tenants usándolo)
echo -e "\n${BLUE}10. Eliminar plan Premium${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/admin/plans/$NEW_PLAN_ID" \
  -H "Authorization: Bearer $TOKEN")
echo $DELETE_RESPONSE | jq '.'

if echo $DELETE_RESPONSE | jq -e '.message' > /dev/null; then
  echo -e "${GREEN}✅ Plan eliminado exitosamente${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo eliminar el plan (puede estar en uso)${NC}"
fi

# 11. Verificar estadísticas finales
echo -e "\n${BLUE}11. Estadísticas finales${NC}"
curl -s -X GET "http://localhost:3000/api/admin/plans/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n${GREEN}✅ Pruebas completadas${NC}"
echo "========================================"
echo -e "${YELLOW}Credenciales de prueba:${NC}"
echo "  Email: admin@dentista.com"
echo "  Password: Admin123!"
echo ""
echo -e "${YELLOW}Planes creados en seed:${NC}"
echo "  - Starter (100 pacientes, 3 usuarios, 5GB)"
echo "  - Professional (500 pacientes, 10 usuarios, 20GB)"
echo "  - Enterprise (ilimitado, 100GB)"
echo "  - Test Plan (Inactive) - para pruebas"
echo ""
echo -e "${YELLOW}Frontend:${NC}"
echo "  Accede a: http://localhost:5173/superadmin/plans"
echo "  (Asegúrate de que el frontend esté corriendo con 'npm run dev')"
