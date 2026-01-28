#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Testing Auth Refresh Token & Logout Endpoints ==="
echo ""

# Login as admin to get tokens
echo "1. Login as admin user..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dentista.com",
    "password": "Admin123!"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken')

echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
echo ""

# Wait a bit
sleep 2

# Test refresh token endpoint
echo "2. Testing refresh token endpoint..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Refresh Response:"
echo "$REFRESH_RESPONSE" | jq '.'
echo ""

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')
NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.refreshToken')

echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
echo "New Refresh Token: ${NEW_REFRESH_TOKEN:0:50}..."
echo ""

# Test using new access token
echo "3. Testing new access token with /auth/profile..."
curl -s -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" | jq '.'
echo ""

# Test logout
echo "4. Testing logout endpoint..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$NEW_REFRESH_TOKEN\"
  }")

echo "Logout Response:"
echo "$LOGOUT_RESPONSE" | jq '.'
echo ""

# Try to use refresh token after logout (should fail)
echo "5. Testing refresh token after logout (should fail)..."
FAILED_REFRESH=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$NEW_REFRESH_TOKEN\"
  }")

echo "Failed Refresh Response:"
echo "$FAILED_REFRESH" | jq '.'
echo ""

echo "=== Auth Refresh & Logout Tests Complete ==="
