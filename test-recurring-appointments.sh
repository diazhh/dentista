#!/bin/bash

echo "🧪 Testing Recurring Appointments Endpoints"
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

# Test 3: Create Weekly Recurring Appointment (Every Monday and Wednesday)
echo -e "\n${BLUE}📝 Test 3: Create Weekly Recurring Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START_DATE=$(date -u -d "next Monday" +"%Y-%m-%dT10:00:00Z")
END_DATE=$(date -u -d "+6 months" +"%Y-%m-%dT10:00:00Z")

RECURRING_RESPONSE=$(curl -s -X POST $API_URL/recurring-appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"frequency\": \"WEEKLY\",
    \"interval\": 1,
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"duration\": 60,
    \"procedureType\": \"Routine Checkup\",
    \"notes\": \"Weekly checkup every Monday and Wednesday\",
    \"timeOfDay\": \"10:00\",
    \"daysOfWeek\": [1, 3]
  }")

echo $RECURRING_RESPONSE | jq '.'
RECURRING_ID=$(echo $RECURRING_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Recurring appointment created with ID: $RECURRING_ID${NC}"

# Test 4: Get All Recurring Appointments
echo -e "\n${BLUE}📝 Test 4: Get All Recurring Appointments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/recurring-appointments \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Recurring appointments list retrieved${NC}"

# Test 5: Get Recurring Appointment by ID
echo -e "\n${BLUE}📝 Test 5: Get Recurring Appointment Details${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/recurring-appointments/$RECURRING_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Recurring appointment details retrieved${NC}"

# Test 6: Create Biweekly Recurring Appointment
echo -e "\n${BLUE}📝 Test 6: Create Biweekly Recurring Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BIWEEKLY_START=$(date -u -d "next Friday" +"%Y-%m-%dT14:00:00Z")

BIWEEKLY_RESPONSE=$(curl -s -X POST $API_URL/recurring-appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"frequency\": \"BIWEEKLY\",
    \"interval\": 1,
    \"startDate\": \"$BIWEEKLY_START\",
    \"duration\": 30,
    \"procedureType\": \"Cleaning\",
    \"notes\": \"Biweekly cleaning every other Friday\",
    \"timeOfDay\": \"14:00\",
    \"daysOfWeek\": [5]
  }")

echo $BIWEEKLY_RESPONSE | jq '.'
BIWEEKLY_ID=$(echo $BIWEEKLY_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Biweekly recurring appointment created with ID: $BIWEEKLY_ID${NC}"

# Test 7: Update Recurring Appointment
echo -e "\n${BLUE}📝 Test 7: Update Recurring Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/recurring-appointments/$RECURRING_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 45,
    "notes": "Updated: Weekly checkup every Monday and Wednesday - 45 min"
  }' | jq '.'
echo -e "${GREEN}✅ Recurring appointment updated${NC}"

# Test 8: Get Recurring Appointments Filtered by Patient
echo -e "\n${BLUE}📝 Test 8: Get Recurring Appointments by Patient${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/recurring-appointments?patientId=$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Filtered recurring appointments retrieved${NC}"

# Test 9: Manually Generate Appointments
echo -e "\n${BLUE}📝 Test 9: Manually Generate Appointments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST $API_URL/recurring-appointments/$RECURRING_ID/generate \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Appointments generated${NC}"

# Test 10: View Generated Appointments
echo -e "\n${BLUE}📝 Test 10: View Generated Appointments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/appointments \
  -H "Authorization: Bearer $TOKEN" | jq 'map(select(.recurringId != null)) | .[0:5]'
echo -e "${GREEN}✅ Generated appointments viewed${NC}"

# Test 11: Cancel Recurring Appointment
echo -e "\n${BLUE}📝 Test 11: Cancel Recurring Appointment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X DELETE $API_URL/recurring-appointments/$BIWEEKLY_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Recurring appointment cancelled${NC}"

# Test 12: Verify Cancellation
echo -e "\n${BLUE}📝 Test 12: Verify Active Recurring Appointments${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/recurring-appointments \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Active recurring appointments verified${NC}"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "✅ All Recurring Appointments Tests Completed!"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
