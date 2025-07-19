#!/bin/bash
# Email Delivery Test Script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="${1:-test@example.com}"

echo "================================================"
echo "Email Delivery Test"
echo "================================================"
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Check API health first
echo "Checking API health..."
health_response=$(curl -s "$API_URL/api/health")
health_status=$(echo "$health_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'UNKNOWN'))" 2>/dev/null || echo "ERROR")

if [ "$health_status" != "UP" ]; then
    echo -e "${RED}✗ API is not healthy${NC}"
    echo "Response: $health_response"
    exit 1
fi
echo -e "${GREEN}✓ API is healthy${NC}"

# Check email configuration
echo ""
echo "Checking email configuration..."
email_config=$(curl -s "$API_URL/api/email-config")
email_configured=$(echo "$email_config" | python3 -c "import sys, json; print(json.load(sys.stdin).get('configured', False))" 2>/dev/null || echo "false")

echo "Email Configuration:"
echo "$email_config" | python3 -m json.tool 2>/dev/null || echo "$email_config"

# Send test email
echo ""
echo "Sending test email..."
test_response=$(curl -s -X POST "$API_URL/api/test-email" \
    -H "Content-Type: application/json" \
    -d "{\"to\": \"$TEST_EMAIL\"}")

test_success=$(echo "$test_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$test_success" = "True" ]; then
    echo -e "${GREEN}✓ Test email sent successfully!${NC}"
    echo ""
    echo "Response:"
    echo "$test_response" | python3 -m json.tool 2>/dev/null || echo "$test_response"
    
    # Extract OTP if present
    otp=$(echo "$test_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('details', {}).get('otp', 'N/A'))" 2>/dev/null || echo "N/A")
    if [ "$otp" != "N/A" ]; then
        echo ""
        echo -e "${YELLOW}Test OTP Code: $otp${NC}"
    fi
else
    echo -e "${RED}✗ Failed to send test email${NC}"
    echo ""
    echo "Response:"
    echo "$test_response" | python3 -m json.tool 2>/dev/null || echo "$test_response"
    exit 1
fi

echo ""
echo "================================================"
echo "Email test completed successfully!"
echo "================================================"