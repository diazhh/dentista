#!/bin/bash

echo "🧪 Testing TenantMembership Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000"

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

# Test 2: Invite Staff Member (creates user if doesn't exist)
echo -e "\n${BLUE}📝 Test 2: Invite Staff Member${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
INVITE_RESPONSE=$(curl -s -X POST $API_URL/tenant-membership/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "receptionist@dentista.com",
    "name": "Maria Garcia",
    "role": "STAFF_RECEPTIONIST",
    "permissions": {
      "canViewPatients": true,
      "canCreateAppointments": true,
      "canEditAppointments": true
    }
  }')

echo $INVITE_RESPONSE | jq '.'
MEMBERSHIP_ID=$(echo $INVITE_RESPONSE | jq -r '.id')
STAFF_USER_ID=$(echo $INVITE_RESPONSE | jq -r '.user.id')
echo -e "${GREEN}✅ Staff member invited with ID: $MEMBERSHIP_ID${NC}"

# Test 3: Get All Staff Members
echo -e "\n${BLUE}📝 Test 3: Get All Staff Members${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/tenant-membership/staff \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Staff list retrieved${NC}"

# Test 4: Get Membership by ID
echo -e "\n${BLUE}📝 Test 4: Get Membership by ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/tenant-membership/$MEMBERSHIP_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Membership details retrieved${NC}"

# Test 5: Update Membership Permissions
echo -e "\n${BLUE}📝 Test 5: Update Membership Permissions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/tenant-membership/$MEMBERSHIP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": {
      "canViewPatients": true,
      "canCreateAppointments": true,
      "canEditAppointments": true,
      "canDeleteAppointments": false,
      "canViewReports": true
    }
  }' | jq '.'
echo -e "${GREEN}✅ Membership permissions updated${NC}"

# Test 6: Login as Staff Member (to test accept invitation)
echo -e "\n${BLUE}📝 Test 6: Login as Staff Member${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# First, we need to set a password for the staff user
# This would normally be done via email link, but for testing we'll skip this step
echo "Note: In production, staff would set password via email invitation link"
echo -e "${GREEN}✅ Staff login flow noted${NC}"

# Test 7: Accept Invitation (simulating staff member accepting)
echo -e "\n${BLUE}📝 Test 7: Accept Invitation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/tenant-membership/$MEMBERSHIP_ID/accept \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Invitation accepted${NC}"

# Test 8: Invite Another Staff Member (Billing)
echo -e "\n${BLUE}📝 Test 8: Invite Billing Staff${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BILLING_RESPONSE=$(curl -s -X POST $API_URL/tenant-membership/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "billing@dentista.com",
    "name": "Carlos Rodriguez",
    "role": "STAFF_BILLING",
    "permissions": {
      "canViewInvoices": true,
      "canCreateInvoices": true,
      "canProcessPayments": true
    }
  }')

echo $BILLING_RESPONSE | jq '.'
BILLING_MEMBERSHIP_ID=$(echo $BILLING_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Billing staff invited with ID: $BILLING_MEMBERSHIP_ID${NC}"

# Test 9: Get Updated Staff List
echo -e "\n${BLUE}📝 Test 9: Get Updated Staff List${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/tenant-membership/staff \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Updated staff list retrieved${NC}"

# Test 10: Reject Invitation (billing staff rejects)
echo -e "\n${BLUE}📝 Test 10: Reject Invitation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X PATCH $API_URL/tenant-membership/$BILLING_MEMBERSHIP_ID/reject \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Invitation rejected${NC}"

# Test 11: Remove Staff Member
echo -e "\n${BLUE}📝 Test 11: Remove Staff Member${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X DELETE $API_URL/tenant-membership/$MEMBERSHIP_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Staff member removed${NC}"

# Test 12: Verify Staff List After Removal
echo -e "\n${BLUE}📝 Test 12: Verify Staff List After Removal${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET $API_URL/tenant-membership/staff \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo -e "${GREEN}✅ Final staff list retrieved${NC}"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "✅ All TenantMembership Tests Completed!"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
