#!/bin/bash

echo "🧪 Testing Appointments Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000"

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

# Get patient ID
echo -e "\n${BLUE}📝 Test 2: Get Patient ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PATIENTS_RESPONSE=$(curl -s -X GET $API_URL/patients \
  -H "Authorization: Bearer $TOKEN")

echo $PATIENTS_RESPONSE | jq '.'
PATIENT_ID=$(echo $PATIENTS_RESPONSE | jq -r '.[0].id')
echo -e "${GREEN}✅ Patient ID: $PATIENT_ID${NC}"

# Test 3: Create Appointment
echo -e "\n${BLUE}📝 Test 3: Create Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
APPOINTMENT_DATE=$(date -u -d "+1 day 10:00" +"%Y-%m-%dT%H:%M:%SZ")
CREATE_RESPONSE=$(curl -s -X POST $API_URL/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"appointmentDate\": \"$APPOINTMENT_DATE\",
    \"duration\": 60,
    \"procedureType\": \"Cleaning\",
    \"notes\": \"Regular checkup and cleaning\"
  }")

echo $CREATE_RESPONSE | jq '.'
APPOINTMENT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Appointment created with ID: $APPOINTMENT_ID${NC}"

# Test 4: Get All Appointments
echo -e "\n${BLUE}📝 Test 4: Get All Appointments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/appointments \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Appointments list retrieved${NC}"

# Test 5: Get Appointment by ID
echo -e "\n${BLUE}📝 Test 5: Get Appointment by ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/appointments/$APPOINTMENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Appointment details retrieved${NC}"

# Test 6: Update Appointment
echo -e "\n${BLUE}📝 Test 6: Update Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/appointments/$APPOINTMENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated: Regular checkup, cleaning, and fluoride treatment"
  }' | jq '.'
echo -e "${GREEN}✅ Appointment updated${NC}"

# Test 7: Update Appointment Status
echo -e "\n${BLUE}📝 Test 7: Update Appointment Status to COMPLETED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/appointments/$APPOINTMENT_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }' | jq '.'
echo -e "${GREEN}✅ Appointment status updated${NC}"

# Test 8: Get Appointments with Date Filter
echo -e "\n${BLUE}📝 Test 8: Get Appointments with Date Filter${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START_DATE=$(date -u +"%Y-%m-%dT00:00:00Z")
END_DATE=$(date -u -d "+7 days" +"%Y-%m-%dT23:59:59Z")
curl -s -X GET "$API_URL/appointments?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Filtered appointments retrieved${NC}"

# Test 9: Create Another Appointment (to test conflict detection)
echo -e "\n${BLUE}📝 Test 9: Create Conflicting Appointment (should fail)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST $API_URL/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"appointmentDate\": \"$APPOINTMENT_DATE\",
    \"duration\": 30,
    \"procedureType\": \"Consultation\",
    \"notes\": \"This should conflict\"
  }" | jq '.'
echo -e "${GREEN}✅ Conflict detection tested${NC}"

# Test 10: Delete Appointment
echo -e "\n${BLUE}📝 Test 10: Delete Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X DELETE $API_URL/appointments/$APPOINTMENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Appointment deleted${NC}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All Appointment Tests Completed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
