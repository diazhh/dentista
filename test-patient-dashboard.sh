#!/bin/bash

# Test Patient Dashboard Endpoints

echo "🔐 Logging in as dentist..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dentist@dentista.com","password":"Dentist123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "✅ Token obtained"

echo ""
echo "📋 Getting first patient..."
PATIENT_ID=$(curl -s -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
echo "✅ Patient ID: $PATIENT_ID"

echo ""
echo "📊 Testing Dashboard Summary Endpoint..."
echo "GET /api/patients/$PATIENT_ID/dashboard/summary"
curl -s -X GET "http://localhost:3000/api/patients/$PATIENT_ID/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "📅 Getting first appointment..."
APPOINTMENT_ID=$(curl -s -X GET "http://localhost:3000/api/appointments?patientId=$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id // empty')

if [ -n "$APPOINTMENT_ID" ]; then
  echo "✅ Appointment ID: $APPOINTMENT_ID"
  echo ""
  echo "🔍 Testing Appointment Detail Endpoint..."
  echo "GET /api/patients/$PATIENT_ID/appointments/$APPOINTMENT_ID/details"
  curl -s -X GET "http://localhost:3000/api/patients/$PATIENT_ID/appointments/$APPOINTMENT_ID/details" \
    -H "Authorization: Bearer $TOKEN" | jq
else
  echo "⚠️  No appointments found for this patient"
fi

echo ""
echo "✅ Dashboard endpoints test completed!"
