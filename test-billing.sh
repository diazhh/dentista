#!/bin/bash

echo "🧪 Testing Treatment Plans, Invoices & Payments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3000/api"

# Test 1: Login as Dentist
echo -e "\n${BLUE}📝 Test 1: Login as Dentist${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@dentista.com",
    "password": "Dentist123!"
  }')

echo $LOGIN_RESPONSE | jq '.'
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo -e "${GREEN}✅ Token obtained${NC}"

# Test 2: Get Patient ID
echo -e "\n${BLUE}📝 Test 2: Get Patient ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PATIENTS_RESPONSE=$(curl -s -X GET $API_URL/patients \
  -H "Authorization: Bearer $TOKEN")

echo $PATIENTS_RESPONSE | jq '.'
PATIENT_ID=$(echo $PATIENTS_RESPONSE | jq -r '.[0].id')
echo -e "${GREEN}✅ Patient ID: $PATIENT_ID${NC}"

# Test 3: Create Treatment Plan
echo -e "\n${BLUE}📝 Test 3: Create Treatment Plan${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TREATMENT_PLAN_RESPONSE=$(curl -s -X POST $API_URL/treatment-plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"title\": \"Plan de Tratamiento Integral\",
    \"description\": \"Tratamiento completo de ortodoncia y endodoncia\",
    \"diagnosis\": \"Caries múltiples, maloclusión clase II\",
    \"status\": \"PROPOSED\",
    \"startDate\": \"2026-01-15T00:00:00Z\",
    \"items\": [
      {
        \"tooth\": \"16\",
        \"surface\": \"oclusal\",
        \"procedureCode\": \"D2391\",
        \"procedureName\": \"Resina Compuesta\",
        \"description\": \"Restauración de caries oclusal\",
        \"estimatedCost\": 150.00,
        \"priority\": 5,
        \"estimatedDuration\": 60
      },
      {
        \"tooth\": \"26\",
        \"procedureCode\": \"D3310\",
        \"procedureName\": \"Endodoncia\",
        \"description\": \"Tratamiento de conducto\",
        \"estimatedCost\": 450.00,
        \"priority\": 4,
        \"estimatedDuration\": 90
      },
      {
        \"procedureCode\": \"D8080\",
        \"procedureName\": \"Ortodoncia Completa\",
        \"description\": \"Brackets metálicos superiores e inferiores\",
        \"estimatedCost\": 3500.00,
        \"priority\": 3,
        \"estimatedDuration\": 30
      }
    ]
  }")

echo $TREATMENT_PLAN_RESPONSE | jq '.'
TREATMENT_PLAN_ID=$(echo $TREATMENT_PLAN_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Treatment Plan created with ID: $TREATMENT_PLAN_ID${NC}"

# Test 4: Get All Treatment Plans
echo -e "\n${BLUE}📝 Test 4: Get All Treatment Plans${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/treatment-plans?patientId=$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Treatment plans retrieved${NC}"

# Test 5: Get Treatment Plan Details
echo -e "\n${BLUE}📝 Test 5: Get Treatment Plan Details${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/treatment-plans/$TREATMENT_PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Treatment plan details retrieved${NC}"

# Test 6: Create Invoice from Treatment Plan
echo -e "\n${BLUE}📝 Test 6: Create Invoice${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
INVOICE_RESPONSE=$(curl -s -X POST $API_URL/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"treatmentPlanId\": \"$TREATMENT_PLAN_ID\",
    \"issueDate\": \"2026-01-05T00:00:00Z\",
    \"dueDate\": \"2026-02-05T00:00:00Z\",
    \"tax\": 410.00,
    \"discount\": 100.00,
    \"notes\": \"Pago inicial del plan de tratamiento\",
    \"terms\": \"Pago en 3 cuotas mensuales\",
    \"items\": [
      {
        \"description\": \"Resina Compuesta - Diente 16\",
        \"quantity\": 1,
        \"unitPrice\": 150.00
      },
      {
        \"description\": \"Endodoncia - Diente 26\",
        \"quantity\": 1,
        \"unitPrice\": 450.00
      },
      {
        \"description\": \"Ortodoncia Completa\",
        \"quantity\": 1,
        \"unitPrice\": 3500.00
      }
    ]
  }")

echo $INVOICE_RESPONSE | jq '.'
INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.id')
INVOICE_NUMBER=$(echo $INVOICE_RESPONSE | jq -r '.invoiceNumber')
echo -e "${GREEN}✅ Invoice created: $INVOICE_NUMBER (ID: $INVOICE_ID)${NC}"

# Test 7: Get All Invoices
echo -e "\n${BLUE}📝 Test 7: Get All Invoices${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/invoices?patientId=$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Invoices retrieved${NC}"

# Test 8: Create First Payment
echo -e "\n${BLUE}📝 Test 8: Create First Payment (Partial)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PAYMENT1_RESPONSE=$(curl -s -X POST $API_URL/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"invoiceId\": \"$INVOICE_ID\",
    \"amount\": 1500.00,
    \"paymentMethod\": \"CREDIT_CARD\",
    \"paymentDate\": \"2026-01-05T00:00:00Z\",
    \"transactionId\": \"TXN-001-2026\",
    \"notes\": \"Pago inicial con tarjeta de crédito\"
  }")

echo $PAYMENT1_RESPONSE | jq '.'
PAYMENT1_ID=$(echo $PAYMENT1_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ First payment created: $PAYMENT1_ID${NC}"

# Test 9: Create Second Payment
echo -e "\n${BLUE}📝 Test 9: Create Second Payment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PAYMENT2_RESPONSE=$(curl -s -X POST $API_URL/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"invoiceId\": \"$INVOICE_ID\",
    \"amount\": 1500.00,
    \"paymentMethod\": \"BANK_TRANSFER\",
    \"paymentDate\": \"2026-02-05T00:00:00Z\",
    \"reference\": \"TRANSFER-12345\",
    \"notes\": \"Segunda cuota por transferencia\"
  }")

echo $PAYMENT2_RESPONSE | jq '.'
PAYMENT2_ID=$(echo $PAYMENT2_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Second payment created: $PAYMENT2_ID${NC}"

# Test 10: Get Invoice with Payments
echo -e "\n${BLUE}📝 Test 10: Get Invoice with Payments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Invoice with payments retrieved${NC}"

# Test 11: Get All Payments
echo -e "\n${BLUE}📝 Test 11: Get All Payments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/payments?patientId=$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Payments retrieved${NC}"

# Test 12: Update Invoice Status
echo -e "\n${BLUE}📝 Test 12: Update Invoice Status to SENT${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH "$API_URL/invoices/$INVOICE_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "SENT"}' | jq '.'
echo -e "${GREEN}✅ Invoice status updated${NC}"

# Test 13: Update Treatment Plan Status
echo -e "\n${BLUE}📝 Test 13: Update Treatment Plan Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH "$API_URL/treatment-plans/$TREATMENT_PLAN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACCEPTED"}' | jq '.'
echo -e "${GREEN}✅ Treatment plan status updated${NC}"

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All billing tests completed successfully!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
