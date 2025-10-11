#!/bin/bash

# Test SSE MCP Connection
# Usage: ./test-sse.sh [base_url]

BASE_URL="${1:-http://localhost:7777}"

echo "🧪 Testing MCP Gateway SSE Connection"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "${BASE_URL}/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$HEALTH" | jq -r '.status, .protocols.sse' 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: SSE Connection
echo "2️⃣  Testing SSE stream connection..."
SESSION_ID="test_$(date +%s)"

# Start SSE in background and capture output
SSE_LOG=$(mktemp)
curl -N -s "${BASE_URL}/sse?sessionId=${SESSION_ID}" > "$SSE_LOG" &
SSE_PID=$!

# Wait for connection
sleep 2

if ps -p $SSE_PID > /dev/null; then
    echo -e "${GREEN}✓ SSE stream connected${NC}"
    echo "Session ID: $SESSION_ID"
    echo "First event:"
    head -n 2 "$SSE_LOG"
else
    echo -e "${RED}✗ SSE connection failed${NC}"
    exit 1
fi
echo ""

# Test 3: Initialize
echo "3️⃣  Testing MCP initialize..."
INIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
    -H "Content-Type: application/json" \
    -d "{
        \"sessionId\": \"${SESSION_ID}\",
        \"method\": \"initialize\",
        \"id\": 1,
        \"params\": {
            \"protocolVersion\": \"2024-11-05\",
            \"capabilities\": {},
            \"clientInfo\": {
                \"name\": \"test-client\",
                \"version\": \"1.0.0\"
            }
        }
    }")

if echo "$INIT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Initialize successful${NC}"
    
    # Wait for SSE response
    sleep 1
    echo "SSE Response:"
    grep "initialize" "$SSE_LOG" | tail -n 1 | sed 's/^data: //' | jq .
else
    echo -e "${RED}✗ Initialize failed${NC}"
    echo "$INIT_RESPONSE"
fi
echo ""

# Test 4: List Tools
echo "4️⃣  Testing tools/list..."
TOOLS_RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
    -H "Content-Type: application/json" \
    -d "{
        \"sessionId\": \"${SESSION_ID}\",
        \"method\": \"tools/list\",
        \"id\": 2
    }")

if echo "$TOOLS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Tools list successful${NC}"
    
    # Wait for SSE response
    sleep 2
    echo "SSE Response (first 5 lines):"
    grep "tools/list" -A 5 "$SSE_LOG" | tail -n 5 | sed 's/^data: //' | head -n 1 | jq -r '.result.tools | length' 2>/dev/null || echo "Parsing..."
else
    echo -e "${RED}✗ Tools list failed${NC}"
    echo "$TOOLS_RESPONSE"
fi
echo ""

# Test 5: Direct JSON-RPC (no SSE)
echo "5️⃣  Testing direct JSON-RPC endpoint..."
JSONRPC_RESPONSE=$(curl -s -X POST "${BASE_URL}/mcp" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/list"
    }')

if echo "$JSONRPC_RESPONSE" | jq -e '.result.tools' > /dev/null 2>&1; then
    TOOL_COUNT=$(echo "$JSONRPC_RESPONSE" | jq -r '.result.tools | length')
    echo -e "${GREEN}✓ JSON-RPC endpoint working${NC}"
    echo "Total tools available: $TOOL_COUNT"
else
    echo -e "${YELLOW}⚠ JSON-RPC endpoint returned unexpected format${NC}"
    echo "$JSONRPC_RESPONSE" | jq . 2>/dev/null || echo "$JSONRPC_RESPONSE"
fi
echo ""

# Cleanup
echo "🧹 Cleaning up..."
kill $SSE_PID 2>/dev/null
rm -f "$SSE_LOG"

echo ""
echo "======================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📝 Claude Desktop Config:"
echo "{
  \"mcpServers\": {
    \"seyederick-mcp\": {
      \"url\": \"${BASE_URL}/sse\"
    }
  }
}"

