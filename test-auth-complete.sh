#!/bin/bash

# DentiCloud - Complete Authentication Module Tests
# Tests all authentication endpoints with various scenarios

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 DentiCloud - Authentication Module Tests${NC}"
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

# ============================================
# 1. REGISTER ENDPOINT TESTS
# ============================================
echo -e "${BLUE}═══ 1. Register Endpoint Tests ═══${NC}\n"

run_test "Register new dentist user" \
"curl -s -X POST $API_URL/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"newdentist@test.com\",
    \"password\": \"Test123!\",
    \"name\": \"Dr. Test User\",
    \"phone\": \"+1234567899\",
    \"role\": \"DENTIST\",
    \"licenseNumber\": \"DDS-99999\",
    \"specialization\": \"General Dentistry\"
  }'"

run_test "Register duplicate email (should fail)" \
"curl -s -w '\n%{http_code}' -X POST $API_URL/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@dentista.com\",
    \"password\": \"Test123!\",
    \"name\": \"Duplicate User\"
  }' | tail -1 | grep -q '409' && echo 'true' || echo 'false' | jq -e '. == \"true\"'"

run_test "Register with invalid email (should fail)" \
"curl -s -X POST $API_URL/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"invalid-email\",
    \"password\": \"Test123!\",
    \"name\": \"Invalid User\"
  }' | jq -e '.statusCode == 400'"

run_test "Register patient user" \
"curl -s -X POST $API_URL/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"newpatient@test.com\",
    \"password\": \"Patient123!\",
    \"name\": \"Test Patient\",
    \"phone\": \"+1234567898\",
    \"role\": \"PATIENT\"
  }'"

# ============================================
# 2. LOGIN ENDPOINT TESTS
# ============================================
echo -e "${BLUE}═══ 2. Login Endpoint Tests ═══${NC}\n"

run_test "Login as Super Admin" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@dentista.com\",
    \"password\": \"Admin123!\"
  }'"

# Save admin token for later use
ADMIN_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@dentista.com","password":"Admin123!"}' | jq -r '.accessToken')

run_test "Login as Dentist 1" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"dentist@dentista.com\",
    \"password\": \"Dentist123!\"
  }'"

DENTIST_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"dentist@dentista.com","password":"Dentist123!"}' | jq -r '.accessToken')

run_test "Login as Dentist 2" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"dentist2@dentista.com\",
    \"password\": \"Dentist456!\"
  }'"

run_test "Login as Staff" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"staff@dentista.com\",
    \"password\": \"Staff123!\"
  }'"

run_test "Login as Patient 1" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"patient@dentista.com\",
    \"password\": \"Patient123!\"
  }'"

PATIENT_TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@dentista.com","password":"Patient123!"}' | jq -r '.accessToken')

run_test "Login as Patient 2" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"patient2@dentista.com\",
    \"password\": \"Patient456!\"
  }'"

run_test "Login with wrong password (should fail)" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"admin@dentista.com\",
    \"password\": \"WrongPassword123!\"
  }' | jq -e '.statusCode == 401'"

run_test "Login with non-existent email (should fail)" \
"curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    \"email\": \"nonexistent@test.com\",
    \"password\": \"Test123!\"
  }' | jq -e '.statusCode == 401'"

# ============================================
# 3. REFRESH TOKEN TESTS
# ============================================
echo -e "${BLUE}═══ 3. Refresh Token Tests ═══${NC}\n"

# Get refresh token
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@dentista.com","password":"Admin123!"}')

REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refreshToken')

run_test "Refresh access token with valid refresh token" \
"curl -s -X POST $API_URL/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{\"refreshToken\": \"$REFRESH_TOKEN\"}'"

run_test "Refresh with invalid token (should fail)" \
"curl -s -X POST $API_URL/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{\"refreshToken\": \"invalid-token-12345\"}' | jq -e '.statusCode == 401'"

# ============================================
# 4. LOGOUT TESTS
# ============================================
echo -e "${BLUE}═══ 4. Logout Tests ═══${NC}\n"

run_test "Logout with valid refresh token" \
"curl -s -X POST $API_URL/auth/logout \
  -H 'Content-Type: application/json' \
  -d '{\"refreshToken\": \"$REFRESH_TOKEN\"}'"

run_test "Try to use refresh token after logout (should fail)" \
"curl -s -X POST $API_URL/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{\"refreshToken\": \"$REFRESH_TOKEN\"}' | jq -e '.statusCode == 401'"

# ============================================
# 5. PROTECTED ROUTE TESTS
# ============================================
echo -e "${BLUE}═══ 5. Protected Route Tests ═══${NC}\n"

run_test "Access protected route with valid token" \
"curl -s -X GET $API_URL/admin/tenants \
  -H 'Authorization: Bearer $ADMIN_TOKEN'"

run_test "Access protected route without token (should fail)" \
"curl -s -X GET $API_URL/admin/tenants | jq -e '.statusCode == 401'"

run_test "Access protected route with invalid token (should fail)" \
"curl -s -X GET $API_URL/admin/tenants \
  -H 'Authorization: Bearer invalid-token-123' | jq -e '.statusCode == 401'"

run_test "Access admin route as patient (should fail)" \
"curl -s -X GET $API_URL/admin/tenants \
  -H 'Authorization: Bearer $PATIENT_TOKEN' | jq -e '.statusCode == 403'"

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
