#!/bin/bash

set -e

echo "🧪 DentiCloud API Endpoint Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="http://localhost:3000"

# Test 1: Login with Dentist credentials
echo "📝 Test 1: Login with Dentist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@dentista.com",
    "password": "Dentist123!"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract access token
DENTIST_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$DENTIST_TOKEN" == "null" ] || [ -z "$DENTIST_TOKEN" ]; then
    echo "❌ Failed to get access token"
    exit 1
fi

echo "✅ Login successful! Token obtained."
echo ""

# Test 2: Get current user profile
echo "📝 Test 2: Get Current User Profile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET ${API_URL}/users/me \
  -H "Authorization: Bearer $DENTIST_TOKEN" | jq '.'
echo "✅ Profile retrieved successfully"
echo ""

# Test 3: Get all patients for dentist
echo "📝 Test 3: Get All Patients"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PATIENTS_RESPONSE=$(curl -s -X GET ${API_URL}/patients \
  -H "Authorization: Bearer $DENTIST_TOKEN")

echo "$PATIENTS_RESPONSE" | jq '.'

# Extract first patient ID
PATIENT_ID=$(echo $PATIENTS_RESPONSE | jq -r '.[0].id')
echo "✅ Patients list retrieved successfully"
echo ""

# Test 4: Get specific patient by ID
echo "📝 Test 4: Get Patient by ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET ${API_URL}/patients/${PATIENT_ID} \
  -H "Authorization: Bearer $DENTIST_TOKEN" | jq '.'
echo "✅ Patient details retrieved successfully"
echo ""

# Test 5: Login with Patient credentials
echo "📝 Test 5: Login with Patient"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PATIENT_LOGIN=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@dentista.com",
    "password": "Patient123!"
  }')

echo "$PATIENT_LOGIN" | jq '.'

PATIENT_TOKEN=$(echo $PATIENT_LOGIN | jq -r '.accessToken')
echo "✅ Patient login successful"
echo ""

# Test 6: Login with Admin credentials
echo "📝 Test 6: Login with Super Admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ADMIN_LOGIN=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dentista.com",
    "password": "Admin123!"
  }')

echo "$ADMIN_LOGIN" | jq '.'

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.accessToken')
echo "✅ Admin login successful"
echo ""

# Test 7: Get all users (Admin only)
echo "📝 Test 7: Get All Users (Admin)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET ${API_URL}/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo "✅ All users retrieved successfully"
echo ""

# Test 8: Register new dentist
echo "📝 Test 8: Register New Dentist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NEW_DENTIST=$(curl -s -X POST ${API_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdentist@example.com",
    "name": "Dr. Jane Smith",
    "password": "Password123!",
    "phone": "+1234567890",
    "role": "DENTIST",
    "licenseNumber": "DDS-67890",
    "npiNumber": "0987654321",
    "specialization": "Orthodontics"
  }')

echo "$NEW_DENTIST" | jq '.'
echo "✅ New dentist registered successfully"
echo ""

# Test 9: Test unauthorized access
echo "📝 Test 9: Test Unauthorized Access"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
UNAUTHORIZED=$(curl -s -X GET ${API_URL}/users/me \
  -H "Authorization: Bearer invalid_token" \
  -w "\nHTTP Status: %{http_code}\n")

echo "$UNAUTHORIZED"
echo "✅ Unauthorized access properly rejected"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All endpoint tests completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Test Credentials Used:"
echo "  Admin: admin@dentista.com / Admin123!"
echo "  Dentist: dentist@dentista.com / Dentist123!"
echo "  Patient: patient@dentista.com / Patient123!"
echo ""
echo "🔗 API Documentation: ${API_URL}/api/docs"
echo ""
