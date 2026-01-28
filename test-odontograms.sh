#!/bin/bash

echo "🧪 Testing Odontograms Module"
echo "===================================="

# Login as dentist
echo -e "\n1️⃣ Logging in as dentist..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dentist@dentista.com","password":"Dentist123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"

# Get patient
echo -e "\n2️⃣ Getting patient..."
PATIENTS=$(curl -s -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN")

PATIENT_ID=$(echo $PATIENTS | jq -r '.[0].id')
PATIENT_NAME=$(echo $PATIENTS | jq -r '.[0].firstName + " " + .[0].lastName')

echo "✅ Patient: $PATIENT_NAME (ID: $PATIENT_ID)"

# Create odontogram with teeth data
echo -e "\n3️⃣ Creating odontogram..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/odontograms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": \"$PATIENT_ID\",
    \"notes\": \"Initial dental examination\",
    \"teeth\": [
      {
        \"toothNumber\": 11,
        \"condition\": \"HEALTHY\",
        \"surfaces\": [],
        \"notes\": \"Good condition\"
      },
      {
        \"toothNumber\": 16,
        \"condition\": \"CAVITY\",
        \"surfaces\": [\"OCCLUSAL\", \"MESIAL\"],
        \"notes\": \"Small cavity detected\",
        \"color\": \"#ff0000\"
      },
      {
        \"toothNumber\": 21,
        \"condition\": \"FILLED\",
        \"surfaces\": [\"MESIAL\"],
        \"notes\": \"Previous filling in good condition\"
      },
      {
        \"toothNumber\": 36,
        \"condition\": \"CROWN\",
        \"surfaces\": [],
        \"notes\": \"Porcelain crown\"
      }
    ]
  }")

ODONTOGRAM_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [ "$ODONTOGRAM_ID" = "null" ] || [ -z "$ODONTOGRAM_ID" ]; then
  echo "❌ Creation failed"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Odontogram created successfully"
echo "   ID: $ODONTOGRAM_ID"
echo "   Patient: $(echo $CREATE_RESPONSE | jq -r '.patient.firstName + " " + .patient.lastName')"
echo "   Teeth count: $(echo $CREATE_RESPONSE | jq '.teeth | length')"
echo "   Date: $(echo $CREATE_RESPONSE | jq -r '.date')"

# List all odontograms
echo -e "\n4️⃣ Listing all odontograms..."
ODONTOGRAMS=$(curl -s -X GET http://localhost:3000/api/odontograms \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo $ODONTOGRAMS | jq '. | length')
echo "✅ Found $COUNT odontogram(s)"

# Get odontogram by ID
echo -e "\n5️⃣ Getting odontogram by ID..."
ODONTOGRAM=$(curl -s -X GET "http://localhost:3000/api/odontograms/$ODONTOGRAM_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Odontogram details:"
echo "   Patient: $(echo $ODONTOGRAM | jq -r '.patient.firstName + " " + .patient.lastName')"
echo "   Notes: $(echo $ODONTOGRAM | jq -r '.notes')"
echo "   Teeth:"
echo $ODONTOGRAM | jq -r '.teeth[] | "     - Tooth #\(.toothNumber): \(.condition) \(if .surfaces | length > 0 then "[\(.surfaces | join(", "))]" else "" end)"'

# Get latest odontogram for patient
echo -e "\n6️⃣ Getting latest odontogram for patient..."
LATEST=$(curl -s -X GET "http://localhost:3000/api/odontograms/patient/$PATIENT_ID/latest" \
  -H "Authorization: Bearer $TOKEN")

if [ "$(echo $LATEST | jq -r '.id')" != "null" ]; then
  echo "✅ Latest odontogram found"
  echo "   Date: $(echo $LATEST | jq -r '.date')"
  echo "   Teeth count: $(echo $LATEST | jq '.teeth | length')"
else
  echo "❌ No odontogram found for patient"
fi

# Filter by patient
echo -e "\n7️⃣ Filtering odontograms by patient..."
FILTERED=$(curl -s -X GET "http://localhost:3000/api/odontograms?patientId=$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTERED | jq '. | length')
echo "✅ Found $FILTERED_COUNT odontogram(s) for patient"

# Update odontogram
echo -e "\n8️⃣ Updating odontogram..."
UPDATE_RESPONSE=$(curl -s -X PATCH "http://localhost:3000/api/odontograms/$ODONTOGRAM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"notes\": \"Updated: Treatment plan created\",
    \"teeth\": [
      {
        \"toothNumber\": 11,
        \"condition\": \"HEALTHY\",
        \"surfaces\": []
      },
      {
        \"toothNumber\": 16,
        \"condition\": \"FILLED\",
        \"surfaces\": [\"OCCLUSAL\", \"MESIAL\"],
        \"notes\": \"Cavity filled today\"
      },
      {
        \"toothNumber\": 21,
        \"condition\": \"FILLED\",
        \"surfaces\": [\"MESIAL\"]
      },
      {
        \"toothNumber\": 36,
        \"condition\": \"CROWN\",
        \"surfaces\": []
      },
      {
        \"toothNumber\": 46,
        \"condition\": \"MISSING\",
        \"surfaces\": [],
        \"notes\": \"Extracted previously\"
      }
    ]
  }")

echo "✅ Odontogram updated"
echo "   New notes: $(echo $UPDATE_RESPONSE | jq -r '.notes')"
echo "   New teeth count: $(echo $UPDATE_RESPONSE | jq '.teeth | length')"

# Delete odontogram
echo -e "\n9️⃣ Deleting odontogram..."
DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/odontograms/$ODONTOGRAM_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Odontogram deleted"
echo "   Message: $(echo $DELETE_RESPONSE | jq -r '.message')"

# Verify deletion
echo -e "\n🔟 Verifying deletion..."
FINAL_ODONTOGRAMS=$(curl -s -X GET http://localhost:3000/api/odontograms \
  -H "Authorization: Bearer $TOKEN")

FINAL_COUNT=$(echo $FINAL_ODONTOGRAMS | jq '. | length')
echo "✅ Final odontogram count: $FINAL_COUNT"

echo -e "\n✅ All tests completed successfully!"
echo "===================================="
