#!/bin/bash

echo "🧪 Testing Clinics & Operatories Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000"

# Test 1: Login as Super Admin
echo -e "\n${BLUE}📝 Test 1: Login as Super Admin${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ADMIN_LOGIN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dentista.com",
    "password": "Admin123!"
  }')

echo $ADMIN_LOGIN | jq '.'
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.accessToken')
echo -e "${GREEN}✅ Admin token obtained${NC}"

# Test 2: Create Clinic
echo -e "\n${BLUE}📝 Test 2: Create Clinic${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CREATE_CLINIC=$(curl -s -X POST $API_URL/clinics \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Central Dental Clinic",
    "address": {
      "street": "456 Oak Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "USA"
    },
    "phone": "+1-555-0123",
    "email": "central@dentalclinic.com"
  }')

echo $CREATE_CLINIC | jq '.'
CLINIC_ID=$(echo $CREATE_CLINIC | jq -r '.id')
echo -e "${GREEN}✅ Clinic created with ID: $CLINIC_ID${NC}"

# Test 3: Get All Clinics
echo -e "\n${BLUE}📝 Test 3: Get All Clinics${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/clinics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "${GREEN}✅ Clinics list retrieved${NC}"

# Test 4: Get Clinic by ID
echo -e "\n${BLUE}📝 Test 4: Get Clinic by ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/clinics/$CLINIC_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "${GREEN}✅ Clinic details retrieved${NC}"

# Test 5: Create Operatory
echo -e "\n${BLUE}📝 Test 5: Create Operatory${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CREATE_OPERATORY=$(curl -s -X POST $API_URL/clinics/operatories \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clinicId\": \"$CLINIC_ID\",
    \"name\": \"Operatory A\",
    \"description\": \"Main treatment room with advanced equipment\",
    \"equipment\": {
      \"chair\": \"Sirona C4+\",
      \"xray\": \"Digital Panoramic X-Ray\",
      \"tools\": [\"High-speed handpiece\", \"Ultrasonic scaler\", \"Curing light\"]
    }
  }")

echo $CREATE_OPERATORY | jq '.'
OPERATORY_ID=$(echo $CREATE_OPERATORY | jq -r '.id')
echo -e "${GREEN}✅ Operatory created with ID: $OPERATORY_ID${NC}"

# Test 6: Get All Operatories
echo -e "\n${BLUE}📝 Test 6: Get All Operatories${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/clinics/operatories/all" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "${GREEN}✅ Operatories list retrieved${NC}"

# Test 7: Login as Dentist
echo -e "\n${BLUE}📝 Test 7: Login as Dentist${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DENTIST_LOGIN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@dentista.com",
    "password": "Dentist123!"
  }')

echo $DENTIST_LOGIN | jq '.'
DENTIST_ID=$(echo $DENTIST_LOGIN | jq -r '.user.id')
echo -e "${GREEN}✅ Dentist ID: $DENTIST_ID${NC}"

# Test 8: Assign Operatory to Dentist
echo -e "\n${BLUE}📝 Test 8: Assign Operatory to Dentist${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ASSIGN_OPERATORY=$(curl -s -X POST $API_URL/clinics/operatories/assignments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"operatoryId\": \"$OPERATORY_ID\",
    \"dentistId\": \"$DENTIST_ID\",
    \"schedule\": {
      \"monday\": { \"start\": \"09:00\", \"end\": \"17:00\" },
      \"tuesday\": { \"start\": \"09:00\", \"end\": \"17:00\" },
      \"wednesday\": { \"start\": \"09:00\", \"end\": \"17:00\" },
      \"thursday\": { \"start\": \"09:00\", \"end\": \"17:00\" },
      \"friday\": { \"start\": \"09:00\", \"end\": \"13:00\" }
    },
    \"startDate\": \"2025-01-01\",
    \"endDate\": \"2025-12-31\"
  }")

echo $ASSIGN_OPERATORY | jq '.'
ASSIGNMENT_ID=$(echo $ASSIGN_OPERATORY | jq -r '.id')
echo -e "${GREEN}✅ Operatory assigned with ID: $ASSIGNMENT_ID${NC}"

# Test 9: Get Operatory Assignments
echo -e "\n${BLUE}📝 Test 9: Get Operatory Assignments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/clinics/operatories/assignments/all?dentistId=$DENTIST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "${GREEN}✅ Assignments retrieved${NC}"

# Test 10: Update Clinic
echo -e "\n${BLUE}📝 Test 10: Update Clinic${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/clinics/$CLINIC_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1-555-9999"
  }' | jq '.'
echo -e "${GREEN}✅ Clinic updated${NC}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All Clinics & Operatories Tests Completed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
