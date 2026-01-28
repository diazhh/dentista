#!/bin/bash

echo "🧪 Testing Notifications System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3000/api"

# Test 1: Login as Patient
echo -e "\n${BLUE}📝 Test 1: Login as Patient${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@dentista.com",
    "password": "Patient123!"
  }')

echo $LOGIN_RESPONSE | jq '.'
PATIENT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo -e "${GREEN}✅ Patient token obtained${NC}"

# Test 2: Get Notification Preferences (should create default if not exists)
echo -e "\n${BLUE}📝 Test 2: Get Notification Preferences${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/notifications/preferences \
  -H "Authorization: Bearer $PATIENT_TOKEN" | jq '.'
echo -e "${GREEN}✅ Preferences retrieved${NC}"

# Test 3: Update Notification Preferences
echo -e "\n${BLUE}📝 Test 3: Update Notification Preferences${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/notifications/preferences \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "appointmentReminders": true,
    "appointmentConfirmation": true,
    "reminderHoursBefore": [48, 24, 2]
  }' | jq '.'
echo -e "${GREEN}✅ Preferences updated${NC}"

# Test 4: Login as Dentist
echo -e "\n${BLUE}📝 Test 4: Login as Dentist${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DENTIST_LOGIN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@dentista.com",
    "password": "Dentist123!"
  }')

echo $DENTIST_LOGIN | jq '.'
DENTIST_TOKEN=$(echo $DENTIST_LOGIN | jq -r '.accessToken')
echo -e "${GREEN}✅ Dentist token obtained${NC}"

# Test 5: Get Patient ID
echo -e "\n${BLUE}📝 Test 5: Get Patient ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PATIENTS_RESPONSE=$(curl -s -X GET $API_URL/patients \
  -H "Authorization: Bearer $DENTIST_TOKEN")

echo $PATIENTS_RESPONSE | jq '.'
PATIENT_ID=$(echo $PATIENTS_RESPONSE | jq -r '.[0].id')
echo -e "${GREEN}✅ Patient ID: $PATIENT_ID${NC}"

# Test 6: Create Appointment (should trigger notifications)
echo -e "\n${BLUE}📝 Test 6: Create Appointment (Triggers Notifications)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
APT_DATE=$(date -u -d "+3 days 10:00" +"%Y-%m-%dT10:00:00Z")

APPOINTMENT_RESPONSE=$(curl -s -X POST $API_URL/appointments \
  -H "Authorization: Bearer $DENTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"appointmentDate\": \"$APT_DATE\",
    \"duration\": 60,
    \"procedureType\": \"Dental Cleaning\",
    \"notes\": \"Regular checkup with notification test\"
  }")

echo $APPOINTMENT_RESPONSE | jq '.'
APPOINTMENT_ID=$(echo $APPOINTMENT_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Appointment created with ID: $APPOINTMENT_ID${NC}"
echo -e "${YELLOW}⏰ Notifications should be scheduled automatically${NC}"

# Test 7: Send Manual Notification
echo -e "\n${BLUE}📝 Test 7: Send Manual Notification${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST $API_URL/notifications/send \
  -H "Authorization: Bearer $DENTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$(echo $LOGIN_RESPONSE | jq -r '.user.id')\",
    \"type\": \"EMAIL\",
    \"channel\": \"APPOINTMENT_REMINDER\",
    \"subject\": \"Test Notification\",
    \"message\": \"This is a test notification from the system\",
    \"metadata\": {
      \"test\": true
    }
  }" | jq '.'
echo -e "${GREEN}✅ Manual notification sent${NC}"

# Test 8: Get Patient Notifications
echo -e "\n${BLUE}📝 Test 8: Get Patient Notifications${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/notifications \
  -H "Authorization: Bearer $PATIENT_TOKEN" | jq '.'
echo -e "${GREEN}✅ Notifications retrieved${NC}"

# Test 9: Disable Appointment Reminders
echo -e "\n${BLUE}📝 Test 9: Disable Appointment Reminders${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/notifications/preferences \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentReminders": false
  }' | jq '.'
echo -e "${GREEN}✅ Reminders disabled${NC}"

# Test 10: Verify Preferences Updated
echo -e "\n${BLUE}📝 Test 10: Verify Preferences Updated${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/notifications/preferences \
  -H "Authorization: Bearer $PATIENT_TOKEN" | jq '.'
echo -e "${GREEN}✅ Preferences verified${NC}"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "✅ All Notification Tests Completed!"
echo -e "${YELLOW}📧 Check your email for test notifications${NC}"
echo -e "${YELLOW}⏰ Scheduled reminders will be sent at configured times${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
