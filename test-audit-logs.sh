#!/bin/bash

API_URL="http://localhost:3000/api"

echo "🧪 Testing Audit Logs Endpoints"
echo "================================"

# Login as Super Admin
echo -e "\n1️⃣ Logging in as Super Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dentista.com",
    "password": "Admin123!"
  }')

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "✅ Logged in successfully"

# Get tenant ID for testing
echo -e "\n2️⃣ Getting tenant ID..."
TENANTS_RESPONSE=$(curl -s -X GET "$API_URL/admin/tenants?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
TENANT_ID=$(echo $TENANTS_RESPONSE | jq -r '.data[0].id')
echo "✅ Tenant ID: $TENANT_ID"

# Perform some actions to generate audit logs
echo -e "\n3️⃣ Updating tenant subscription (generates audit log)..."
curl -s -X PUT "$API_URL/admin/tenants/$TENANT_ID/subscription" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionTier": "PROFESSIONAL",
    "maxPatients": 200
  }' | jq '.'

echo -e "\n4️⃣ Suspending tenant (generates audit log)..."
curl -s -X POST "$API_URL/admin/tenants/$TENANT_ID/suspend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n5️⃣ Reactivating tenant (generates audit log)..."
curl -s -X POST "$API_URL/admin/tenants/$TENANT_ID/reactivate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Test audit log endpoints
echo -e "\n6️⃣ Getting all audit logs..."
curl -s -X GET "$API_URL/admin/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n7️⃣ Getting audit logs filtered by action (UPDATE)..."
curl -s -X GET "$API_URL/admin/audit-logs?action=UPDATE&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n8️⃣ Getting audit logs filtered by entity (Tenant)..."
curl -s -X GET "$API_URL/admin/audit-logs?entity=Tenant&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n9️⃣ Getting audit logs filtered by tenant..."
curl -s -X GET "$API_URL/admin/audit-logs?tenantId=$TENANT_ID&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n🔟 Getting audit log statistics..."
curl -s -X GET "$API_URL/admin/audit-logs/statistics" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo -e "\n✅ All audit log tests completed!"
