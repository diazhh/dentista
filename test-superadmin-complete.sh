#!/bin/bash

# DentiCloud - Complete Super Admin Module Tests
# Tests all super admin endpoints with various scenarios

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 DentiCloud - Super Admin Module Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name=$1
    local command=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    
    response=$(eval $command 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "$response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Get admin token
echo -e "${BLUE}Getting Super Admin token...${NC}"
ADMIN_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@dentista.com","password":"Admin123!"}' | jq -r '.accessToken')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get admin token. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Got admin token${NC}\n"

# Get dentist token for negative tests
DENTIST_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"dentist@dentista.com","password":"Dentist123!"}' | jq -r '.accessToken')

# ============================================
# 1. GET ALL TENANTS TESTS
# ============================================
echo -e "${BLUE}═══ 1. Get All Tenants Tests ═══${NC}\n"

run_test "Get all tenants (default pagination)" \
"curl -s -X GET '$API_URL/admin/tenants' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get all tenants with pagination (page 1, limit 10)" \
"curl -s -X GET '$API_URL/admin/tenants?page=1&limit=10' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get all tenants with pagination (page 2, limit 1)" \
"curl -s -X GET '$API_URL/admin/tenants?page=2&limit=1' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get all tenants without auth (should fail)" \
"curl -s -X GET '$API_URL/admin/tenants' | jq -e '.statusCode == 401'"

run_test "Get all tenants as dentist (should fail)" \
"curl -s -X GET '$API_URL/admin/tenants' \
  -H 'Authorization: Bearer $DENTIST_TOKEN' | jq -e '.statusCode == 403'"

# ============================================
# 2. GET TENANT BY ID TESTS
# ============================================
echo -e "${BLUE}═══ 2. Get Tenant By ID Tests ═══${NC}\n"

# Get tenant IDs
TENANT_LIST=$(curl -s -X GET "$API_URL/admin/tenants" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

TENANT1_ID=$(echo $TENANT_LIST | jq -r '.data[0].id')
TENANT2_ID=$(echo $TENANT_LIST | jq -r '.data[1].id')

run_test "Get tenant 1 details" \
"curl -s -X GET '$API_URL/admin/tenants/$TENANT1_ID' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get tenant 2 details" \
"curl -s -X GET '$API_URL/admin/tenants/$TENANT2_ID' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get non-existent tenant (should fail)" \
"curl -s -w '\n%{http_code}' -X GET '$API_URL/admin/tenants/00000000-0000-0000-0000-000000000000' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' | tail -1 | grep -q '404' && echo 'true' || echo 'false' | jq -e '. == \"true\"'"

run_test "Get tenant details without auth (should fail)" \
"curl -s -X GET '$API_URL/admin/tenants/$TENANT1_ID' | jq -e '.statusCode == 401'"

# ============================================
# 3. UPDATE TENANT SUBSCRIPTION TESTS
# ============================================
echo -e "${BLUE}═══ 3. Update Tenant Subscription Tests ═══${NC}\n"

run_test "Update tenant subscription tier to ENTERPRISE" \
"curl -s -X PUT '$API_URL/admin/tenants/$TENANT1_ID/subscription' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    \"subscriptionTier\": \"ENTERPRISE\",
    \"maxPatients\": 1000,
    \"storageGB\": 50
  }'"

run_test "Update tenant subscription status to ACTIVE" \
"curl -s -X PUT '$API_URL/admin/tenants/$TENANT2_ID/subscription' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    \"subscriptionStatus\": \"ACTIVE\"
  }'"

run_test "Update tenant with multiple fields" \
"curl -s -X PUT '$API_URL/admin/tenants/$TENANT1_ID/subscription' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    \"subscriptionTier\": \"PROFESSIONAL\",
    \"subscriptionStatus\": \"ACTIVE\",
    \"maxPatients\": 500,
    \"storageGB\": 20
  }'"

run_test "Update tenant subscription without auth (should fail)" \
"curl -s -X PUT '$API_URL/admin/tenants/$TENANT1_ID/subscription' \
  -H 'Content-Type: application/json' \
  -d '{\"subscriptionTier\": \"ENTERPRISE\"}' | jq -e '.statusCode == 401'"

run_test "Update tenant subscription as dentist (should fail)" \
"curl -s -X PUT '$API_URL/admin/tenants/$TENANT1_ID/subscription' \
  -H 'Authorization: Bearer $DENTIST_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{\"subscriptionTier\": \"ENTERPRISE\"}' | jq -e '.statusCode == 403'"

# ============================================
# 4. SUSPEND TENANT TESTS
# ============================================
echo -e "${BLUE}═══ 4. Suspend Tenant Tests ═══${NC}\n"

run_test "Suspend tenant" \
"curl -s -X POST '$API_URL/admin/tenants/$TENANT2_ID/suspend' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Verify tenant is suspended" \
"curl -s -X GET '$API_URL/admin/tenants/$TENANT2_ID' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' | jq -e '.subscriptionStatus == \"CANCELLED\"'"

run_test "Suspend already suspended tenant (should still work)" \
"curl -s -X POST '$API_URL/admin/tenants/$TENANT2_ID/suspend' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Suspend tenant without auth (should fail)" \
"curl -s -X POST '$API_URL/admin/tenants/$TENANT2_ID/suspend' | jq -e '.statusCode == 401'"

# ============================================
# 5. REACTIVATE TENANT TESTS
# ============================================
echo -e "${BLUE}═══ 5. Reactivate Tenant Tests ═══${NC}\n"

run_test "Reactivate suspended tenant" \
"curl -s -X POST '$API_URL/admin/tenants/$TENANT2_ID/reactivate' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Verify tenant is reactivated" \
"curl -s -X GET '$API_URL/admin/tenants/$TENANT2_ID' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' | jq -e '.subscriptionStatus == \"ACTIVE\"'"

run_test "Reactivate already active tenant (should still work)" \
"curl -s -X POST '$API_URL/admin/tenants/$TENANT1_ID/reactivate' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Reactivate tenant without auth (should fail)" \
"curl -s -X POST '$API_URL/admin/tenants/$TENANT1_ID/reactivate' | jq -e '.statusCode == 401'"

# ============================================
# 6. SYSTEM METRICS TESTS
# ============================================
echo -e "${BLUE}═══ 6. System Metrics Tests ═══${NC}\n"

run_test "Get system metrics" \
"curl -s -X GET '$API_URL/admin/metrics/system' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Verify system metrics structure" \
"curl -s -X GET '$API_URL/admin/metrics/system' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' | jq -e 'has(\"totalTenants\") and has(\"activeTenants\")'"

run_test "Get system metrics without auth (should fail)" \
"curl -s -X GET '$API_URL/admin/metrics/system' | jq -e '.statusCode == 401'"

run_test "Get system metrics as dentist (should fail)" \
"curl -s -X GET '$API_URL/admin/metrics/system' \
  -H 'Authorization: Bearer $DENTIST_TOKEN' | jq -e '.statusCode == 403'"

# ============================================
# 7. REVENUE METRICS TESTS
# ============================================
echo -e "${BLUE}═══ 7. Revenue Metrics Tests ═══${NC}\n"

run_test "Get revenue metrics" \
"curl -s -X GET '$API_URL/admin/metrics/revenue' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Verify revenue metrics structure" \
"curl -s -X GET '$API_URL/admin/metrics/revenue' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' | jq -e 'has(\"mrr\") and has(\"arr\")'"

run_test "Get revenue metrics without auth (should fail)" \
"curl -s -X GET '$API_URL/admin/metrics/revenue' | jq -e '.statusCode == 401'"

# ============================================
# 8. ACTIVITY METRICS TESTS
# ============================================
echo -e "${BLUE}═══ 8. Activity Metrics Tests ═══${NC}\n"

run_test "Get activity metrics (default 30 days)" \
"curl -s -X GET '$API_URL/admin/metrics/activity' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get activity metrics for 7 days" \
"curl -s -X GET '$API_URL/admin/metrics/activity?days=7' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Get activity metrics for 90 days" \
"curl -s -X GET '$API_URL/admin/metrics/activity?days=90' \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Verify activity metrics structure" \
"curl -s -X GET '$API_URL/admin/metrics/activity' \
  -H 'Authorization: Bearer $ADMIN_TOKEN' | jq -e 'if type == \"array\" then length >= 0 else false end'"

run_test "Get activity metrics without auth (should fail)" \
"curl -s -X GET '$API_URL/admin/metrics/activity' | jq -e '.statusCode == 401'"

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
