#!/bin/bash

echo "🧪 Testing Documents & Files Module"
echo "===================================="

# Login as dentist
echo -e "\n1️⃣ Logging in as dentist..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dentist@dentista.com","password":"Dentist123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"
echo "   User ID: $USER_ID"
echo "   Token: ${TOKEN:0:50}..."

# Get patients to use in document upload
echo -e "\n2️⃣ Getting patients..."
PATIENTS=$(curl -s -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN")

PATIENT_ID=$(echo $PATIENTS | jq -r '.[0].id')
PATIENT_NAME=$(echo $PATIENTS | jq -r '.[0].firstName + " " + .[0].lastName')

echo "✅ Patient found: $PATIENT_NAME (ID: $PATIENT_ID)"

# Create a test file
echo -e "\n3️⃣ Creating test file..."
TEST_FILE="/tmp/test-document.txt"
echo "This is a test document for patient $PATIENT_NAME" > $TEST_FILE
echo "Created on: $(date)" >> $TEST_FILE
echo "✅ Test file created: $TEST_FILE"

# Upload document
echo -e "\n4️⃣ Uploading document..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_FILE" \
  -F "patientId=$PATIENT_ID" \
  -F "type=MEDICAL_RECORD" \
  -F "title=Test Medical Record" \
  -F "description=Test document uploaded via API" \
  -F "tags[]=test" \
  -F "tags[]=medical")

DOCUMENT_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')

if [ "$DOCUMENT_ID" = "null" ] || [ -z "$DOCUMENT_ID" ]; then
  echo "❌ Upload failed"
  echo "Response: $UPLOAD_RESPONSE"
  exit 1
fi

echo "✅ Document uploaded successfully"
echo "   Document ID: $DOCUMENT_ID"
echo "   Title: $(echo $UPLOAD_RESPONSE | jq -r '.title')"
echo "   Type: $(echo $UPLOAD_RESPONSE | jq -r '.type')"
echo "   File: $(echo $UPLOAD_RESPONSE | jq -r '.fileName')"
echo "   Size: $(echo $UPLOAD_RESPONSE | jq -r '.fileSize') bytes"

# List all documents
echo -e "\n5️⃣ Listing all documents..."
DOCUMENTS=$(curl -s -X GET http://localhost:3000/api/documents \
  -H "Authorization: Bearer $TOKEN")

DOCUMENT_COUNT=$(echo $DOCUMENTS | jq '. | length')
echo "✅ Found $DOCUMENT_COUNT document(s)"

# Get document by ID
echo -e "\n6️⃣ Getting document by ID..."
DOCUMENT=$(curl -s -X GET "http://localhost:3000/api/documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Document details:"
echo "   Title: $(echo $DOCUMENT | jq -r '.title')"
echo "   Patient: $(echo $DOCUMENT | jq -r '.patient.firstName + " " + .patient.lastName')"
echo "   Type: $(echo $DOCUMENT | jq -r '.type')"
echo "   Created: $(echo $DOCUMENT | jq -r '.createdAt')"

# Filter by type
echo -e "\n7️⃣ Filtering documents by type (MEDICAL_RECORD)..."
FILTERED=$(curl -s -X GET "http://localhost:3000/api/documents?type=MEDICAL_RECORD" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTERED | jq '. | length')
echo "✅ Found $FILTERED_COUNT MEDICAL_RECORD document(s)"

# Download document
echo -e "\n8️⃣ Downloading document..."
DOWNLOAD_FILE="/tmp/downloaded-document.txt"
curl -s -X GET "http://localhost:3000/api/documents/$DOCUMENT_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$DOWNLOAD_FILE"

if [ -f "$DOWNLOAD_FILE" ]; then
  echo "✅ Document downloaded successfully"
  echo "   File: $DOWNLOAD_FILE"
  echo "   Content preview:"
  head -n 2 "$DOWNLOAD_FILE" | sed 's/^/   /'
else
  echo "❌ Download failed"
fi

# Update document
echo -e "\n9️⃣ Updating document metadata..."
UPDATE_RESPONSE=$(curl -s -X PATCH "http://localhost:3000/api/documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Medical Record",
    "description": "Updated description via API"
  }')

echo "✅ Document updated"
echo "   New title: $(echo $UPDATE_RESPONSE | jq -r '.title')"
echo "   New description: $(echo $UPDATE_RESPONSE | jq -r '.description')"

# Delete document
echo -e "\n🔟 Deleting document..."
DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Document deleted"
echo "   Message: $(echo $DELETE_RESPONSE | jq -r '.message')"

# Verify deletion
echo -e "\n1️⃣1️⃣ Verifying deletion..."
FINAL_DOCUMENTS=$(curl -s -X GET http://localhost:3000/api/documents \
  -H "Authorization: Bearer $TOKEN")

FINAL_COUNT=$(echo $FINAL_DOCUMENTS | jq '. | length')
echo "✅ Final document count: $FINAL_COUNT"

# Cleanup
rm -f $TEST_FILE $DOWNLOAD_FILE

echo -e "\n✅ All tests completed successfully!"
echo "===================================="
