#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Testing Patients Management Complete Features ==="
echo ""

# 1. Login as dentist
echo "1. Logging in as dentist..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@clinic1.com",
    "password": "Password123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. Search patients by documentId
echo "2. Searching patients by document ID (123456)..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/patients/search/query?documentId=123456" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $SEARCH_RESPONSE"
echo ""

# 3. Search patients by firstName
echo "3. Searching patients by first name (Juan)..."
SEARCH_NAME_RESPONSE=$(curl -s -X GET "$BASE_URL/patients/search/query?firstName=Juan" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $SEARCH_NAME_RESPONSE"
echo ""

# 4. Get all patients to get an ID for transfer test
echo "4. Getting all patients..."
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/patients" \
  -H "Authorization: Bearer $TOKEN")

PATIENT_ID=$(echo $PATIENTS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PATIENT_ID" ]; then
  echo "⚠️  No patients found. Creating a test patient first..."
  
  # Create a test user first
  USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testpatient@test.com",
      "name": "Test Patient",
      "password": "Password123!",
      "role": "PATIENT"
    }')
  
  USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -z "$USER_ID" ]; then
    echo "❌ Failed to create test user"
    exit 1
  fi
  
  # Create patient
  CREATE_PATIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/patients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"$USER_ID\",
      \"documentId\": \"TEST123456\",
      \"phone\": \"+1234567890\",
      \"firstName\": \"Test\",
      \"lastName\": \"Patient\",
      \"dateOfBirth\": \"1990-01-01\",
      \"gender\": \"MALE\"
    }")
  
  PATIENT_ID=$(echo $CREATE_PATIENT_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "✅ Test patient created: $PATIENT_ID"
else
  echo "✅ Found patient ID: $PATIENT_ID"
fi
echo ""

# 5. Export patients to CSV
echo "5. Exporting patients to CSV..."
curl -s -X GET "$BASE_URL/patients/export/csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/patients_export.csv

if [ -f /tmp/patients_export.csv ]; then
  echo "✅ CSV exported successfully"
  echo "First 5 lines of CSV:"
  head -5 /tmp/patients_export.csv
else
  echo "❌ CSV export failed"
fi
echo ""

# 6. Test transfer endpoint (will fail if no other dentist exists, but tests the endpoint)
echo "6. Testing transfer endpoint (may fail if no second dentist)..."
TRANSFER_RESPONSE=$(curl -s -X POST "$BASE_URL/patients/$PATIENT_ID/transfer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newDentistId": "00000000-0000-0000-0000-000000000000"
  }')

echo "Response: $TRANSFER_RESPONSE"
echo ""

# 7. Test CSV import (create a sample CSV first)
echo "7. Testing CSV import..."
cat > /tmp/patients_import.csv << EOF
documentId,firstName,lastName,phone,email,dateOfBirth,gender,allergies,medications
CSV001,Carlos,Imported,+1111111111,carlos@import.com,1985-05-15,MALE,Penicillin,None
CSV002,Maria,Imported,+2222222222,maria@import.com,1992-08-20,FEMALE,None,Aspirin
EOF

IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/patients/import/csv" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/patients_import.csv")

echo "Response: $IMPORT_RESPONSE"
echo ""

echo "=== All tests completed ==="
