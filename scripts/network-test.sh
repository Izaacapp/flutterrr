#!/bin/bash
# Network Connectivity Test for Raspberry Pi and Other Devices
# This script tests connectivity to all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the host IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    HOST_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost")
else
    # Linux/Raspberry Pi
    HOST_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
fi

echo "================================================"
echo "Network Connectivity Test"
echo "================================================"
echo "Host IP: $HOST_IP"
echo "Date: $(date)"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    if curl -s -f -m 5 "$url" > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to test with detailed output
test_endpoint_verbose() {
    local name=$1
    local url=$2
    
    echo "----------------------------------------"
    echo "Testing: $name"
    echo "URL: $url"
    echo ""
    
    # Test with curl and show response
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}s" "$url" 2>&1 || echo "CURL_ERROR:$?")
    
    # Extract HTTP code
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    time_total=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    
    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "000" && "$response" == *"API running"* ]]; then
        echo -e "Status: ${GREEN}✓ SUCCESS${NC}"
        echo "HTTP Code: $http_code"
        echo "Response Time: $time_total"
    else
        echo -e "Status: ${RED}✗ FAILED${NC}"
        echo "HTTP Code: $http_code"
        echo "Error: Connection failed"
    fi
    echo ""
}

# Test localhost connectivity first
echo "=== Testing Localhost Connectivity ==="
test_endpoint "API (localhost)" "http://localhost:3000" "API"
test_endpoint "Web (localhost)" "http://localhost:3001" "Web"
test_endpoint "GraphQL (localhost)" "http://localhost:3000/graphql" "GraphQL"
echo ""

# Test host IP connectivity
echo "=== Testing Network Connectivity (IP: $HOST_IP) ==="
test_endpoint "API (network)" "http://$HOST_IP:3000" "API"
test_endpoint "Web (network)" "http://$HOST_IP:3001" "Web"
test_endpoint "GraphQL (network)" "http://$HOST_IP:3000/graphql" "GraphQL"
echo ""

# Detailed health check
echo "=== Detailed Service Health ==="
echo "Checking API health endpoint..."
curl -s "http://$HOST_IP:3000/api/health" | python3 -m json.tool 2>/dev/null || echo "Health check failed"
echo ""

# Network diagnostics
echo "=== Network Diagnostics ==="
echo "Active network interfaces:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig | grep "inet " | grep -v "127.0.0.1"
else
    ip addr | grep "inet " | grep -v "127.0.0.1"
fi
echo ""

echo "Port availability:"
if command -v netstat >/dev/null 2>&1; then
    netstat -an | grep -E ":(3000|3001|27017|80)" | grep LISTEN || echo "No services listening"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep -E ":(3000|3001|27017|80)" || echo "No services listening"
else
    echo "netstat/ss not available"
fi
echo ""

# Docker status (if available)
if command -v docker >/dev/null 2>&1; then
    echo "=== Docker Services Status ==="
    docker-compose ps 2>/dev/null || echo "Docker Compose not running"
    echo ""
fi

# Connectivity recommendations
echo "=== Troubleshooting Tips ==="
echo "If connections fail from Raspberry Pi:"
echo "1. Ensure firewall allows ports 3000, 3001, 27017"
echo "2. Check docker-compose is running: 'make dev-d'"
echo "3. Verify IP address: Host should be $HOST_IP"
echo "4. For mobile/Pi, use: http://$HOST_IP:3000/graphql"
echo "5. Test with: curl -v http://$HOST_IP:3000/api/health"
echo ""

# Test email configuration
echo "=== Email Service Check ==="
curl -s "http://$HOST_IP:3000/api/email-config" | python3 -m json.tool 2>/dev/null || echo "Email config check failed"

echo ""
echo "================================================"
echo "Test completed at $(date)"
echo "================================================"