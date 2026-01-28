#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Testing Super Admin Endpoints ==="
echo ""

# Login as admin to get token
echo "1. Login as SUPER_ADMIN user..."
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
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Test get all tenants
echo "2. GET /admin/tenants - Get all tenants..."
curl -s -X GET "$BASE_URL/admin/tenants?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Get first tenant ID for further tests
TENANT_ID=$(curl -s -X GET "$BASE_URL/admin/tenants?page=1&limit=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.data[0].id')

echo "Using Tenant ID: $TENANT_ID"
echo ""

# Test get tenant by ID
echo "3. GET /admin/tenants/:id - Get tenant details..."
curl -s -X GET "$BASE_URL/admin/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test system metrics
echo "4. GET /admin/metrics/system - Get system metrics..."
curl -s -X GET "$BASE_URL/admin/metrics/system" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test revenue metrics
echo "5. GET /admin/metrics/revenue - Get revenue metrics..."
curl -s -X GET "$BASE_URL/admin/metrics/revenue" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test activity metrics
echo "6. GET /admin/metrics/activity - Get tenant activity..."
curl -s -X GET "$BASE_URL/admin/metrics/activity?days=30" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test update tenant subscription
echo "7. PUT /admin/tenants/:id/subscription - Update subscription..."
curl -s -X PUT "$BASE_URL/admin/tenants/$TENANT_ID/subscription" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxPatients": 200,
    "storageGB": 10
  }' | jq '.'
echo ""

# Test suspend tenant (commented out to avoid breaking tests)
# echo "8. POST /admin/tenants/:id/suspend - Suspend tenant..."
# curl -s -X POST "$BASE_URL/admin/tenants/$TENANT_ID/suspend" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
# echo ""

# Test reactivate tenant (commented out)
# echo "9. POST /admin/tenants/:id/reactivate - Reactivate tenant..."
# curl -s -X POST "$BASE_URL/admin/tenants/$TENANT_ID/reactivate" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
# echo ""

# Test with non-admin user (should fail)
echo "8. Testing admin endpoints with non-admin user (should fail)..."
DENTIST_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@dentista.com",
    "password": "Dentist123!"
  }')

DENTIST_TOKEN=$(echo "$DENTIST_LOGIN" | jq -r '.accessToken')

echo "Attempting to access admin endpoint with dentist token..."
curl -s -X GET "$BASE_URL/admin/tenants" \
  -H "Authorization: Bearer $DENTIST_TOKEN" | jq '.'
echo ""

echo "=== Super Admin Tests Complete ==="
