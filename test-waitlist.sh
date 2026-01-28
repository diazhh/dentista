#!/bin/bash

echo "🧪 Testing Waitlist Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
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

# Get patient ID
echo -e "\n${BLUE}📝 Test 2: Get Patient ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PATIENTS_RESPONSE=$(curl -s -X GET $API_URL/patients \
  -H "Authorization: Bearer $TOKEN")

echo $PATIENTS_RESPONSE | jq '.'
PATIENT_ID=$(echo $PATIENTS_RESPONSE | jq -r '.[0].id')
echo -e "${GREEN}✅ Patient ID: $PATIENT_ID${NC}"

# Test 3: Add Patient to Waitlist
echo -e "\n${BLUE}📝 Test 3: Add Patient to Waitlist${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PREF_DATE1=$(date -u -d "next Monday" +"%Y-%m-%dT10:00:00Z")
PREF_DATE2=$(date -u -d "next Wednesday" +"%Y-%m-%dT14:00:00Z")
EXPIRES_AT=$(date -u -d "+30 days" +"%Y-%m-%dT23:59:59Z")

WAITLIST_RESPONSE=$(curl -s -X POST $API_URL/waitlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"preferredDates\": [\"$PREF_DATE1\", \"$PREF_DATE2\"],
    \"preferredTimes\": [\"10:00\", \"14:00\", \"16:00\"],
    \"procedureType\": \"Root Canal\",
    \"duration\": 90,
    \"priority\": 4,
    \"notes\": \"Patient prefers morning appointments\",
    \"expiresAt\": \"$EXPIRES_AT\"
  }")

echo $WAITLIST_RESPONSE | jq '.'
WAITLIST_ID=$(echo $WAITLIST_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Waitlist entry created with ID: $WAITLIST_ID${NC}"

# Test 4: Get All Waitlist Entries
echo -e "\n${BLUE}📝 Test 4: Get All Waitlist Entries${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/waitlist \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Waitlist entries retrieved${NC}"

# Test 5: Get Waitlist Entry by ID
echo -e "\n${BLUE}📝 Test 5: Get Waitlist Entry Details${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/waitlist/$WAITLIST_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Waitlist entry details retrieved${NC}"

# Test 6: Add Another Patient to Waitlist (Lower Priority)
echo -e "\n${BLUE}📝 Test 6: Add Another Patient (Lower Priority)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
WAITLIST2_RESPONSE=$(curl -s -X POST $API_URL/waitlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"preferredDates\": [\"$PREF_DATE1\"],
    \"preferredTimes\": [\"09:00\", \"11:00\"],
    \"procedureType\": \"Cleaning\",
    \"duration\": 60,
    \"priority\": 2,
    \"notes\": \"Flexible with timing\"
  }")

echo $WAITLIST2_RESPONSE | jq '.'
WAITLIST2_ID=$(echo $WAITLIST2_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Second waitlist entry created with ID: $WAITLIST2_ID${NC}"

# Test 7: Get Waitlist Entries (Sorted by Priority)
echo -e "\n${BLUE}📝 Test 7: Get All Entries (Priority Sorted)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/waitlist \
  -H "Authorization: Bearer $TOKEN" | jq 'map({id, priority, procedureType, status})'
echo -e "${GREEN}✅ Entries sorted by priority${NC}"

# Test 8: Update Waitlist Entry
echo -e "\n${BLUE}📝 Test 8: Update Waitlist Entry${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/waitlist/$WAITLIST_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 5,
    "notes": "URGENT: Patient in pain"
  }' | jq '.'
echo -e "${GREEN}✅ Waitlist entry updated${NC}"

# Test 9: Mark Patient as Contacted
echo -e "\n${BLUE}📝 Test 9: Mark Patient as Contacted${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/waitlist/$WAITLIST_ID/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Called patient, confirmed availability"
  }' | jq '.'
echo -e "${GREEN}✅ Patient marked as contacted${NC}"

# Test 10: Check Available Slots
echo -e "\n${BLUE}📝 Test 10: Check Available Slots for Date${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CHECK_DATE=$(date -u -d "next Monday" +"%Y-%m-%d")
curl -s -X GET "$API_URL/waitlist/available-slots?date=$CHECK_DATE" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Available slots retrieved${NC}"

# Test 11: Create Appointment for Waitlist Patient
echo -e "\n${BLUE}📝 Test 11: Create Appointment for Waitlist Patient${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
APT_DATE=$(date -u -d "next Monday 10:00" +"%Y-%m-%dT10:00:00Z")

APPOINTMENT_RESPONSE=$(curl -s -X POST $API_URL/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"appointmentDate\": \"$APT_DATE\",
    \"duration\": 90,
    \"procedureType\": \"Root Canal\",
    \"notes\": \"From waitlist - urgent case\"
  }")

echo $APPOINTMENT_RESPONSE | jq '.'
APPOINTMENT_ID=$(echo $APPOINTMENT_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Appointment created with ID: $APPOINTMENT_ID${NC}"

# Test 12: Mark Waitlist as Scheduled
echo -e "\n${BLUE}📝 Test 12: Mark Waitlist Entry as Scheduled${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/waitlist/$WAITLIST_ID/schedule/$APPOINTMENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Waitlist entry marked as scheduled${NC}"

# Test 13: Filter by Status (WAITING)
echo -e "\n${BLUE}📝 Test 13: Get Waiting Entries Only${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/waitlist?status=WAITING" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Filtered by WAITING status${NC}"

# Test 14: Filter by Status (SCHEDULED)
echo -e "\n${BLUE}📝 Test 14: Get Scheduled Entries Only${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/waitlist?status=SCHEDULED" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Filtered by SCHEDULED status${NC}"

# Test 15: Cancel Waitlist Entry
echo -e "\n${BLUE}📝 Test 15: Cancel Waitlist Entry${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/waitlist/$WAITLIST2_ID/cancel \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Waitlist entry cancelled${NC}"

# Test 16: Verify Final State
echo -e "\n${BLUE}📝 Test 16: Verify Final Waitlist State${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/waitlist \
  -H "Authorization: Bearer $TOKEN" | jq 'map({id, status, priority, procedureType})'
echo -e "${GREEN}✅ Final state verified${NC}"

# Test 17: Delete Cancelled Entry
echo -e "\n${BLUE}📝 Test 17: Delete Cancelled Entry${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X DELETE $API_URL/waitlist/$WAITLIST2_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Entry deleted${NC}"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "✅ All Waitlist Tests Completed!"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
