#!/bin/bash
# Test Claude Desktop SSE flow

echo "Testing Claude Desktop SSE connection flow..."
echo ""

# Step 1: Open SSE connection
echo "1. Opening SSE stream..."
curl -N -s https://link.seyederick.com/sse > /tmp/sse-stream.log &
SSE_PID=$!

sleep 2

# Get session ID from stream
SESSION_ID=$(grep -oP '"sessionId":"[^"]+' /tmp/sse-stream.log | head -1 | cut -d'"' -f4)
echo "   Session ID: $SESSION_ID"

if [ -z "$SESSION_ID" ]; then
    echo "   ERROR: No session ID received!"
    kill $SSE_PID 2>/dev/null
    exit 1
fi

# Step 2: Send initialize request
echo ""
echo "2. Sending initialize request..."
INIT_RESPONSE=$(curl -s -X POST https://link.seyederick.com/messages \
    -H "Content-Type: application/json" \
    -d "{
        \"sessionId\": \"$SESSION_ID\",
        \"method\": \"initialize\",
        \"id\": 1,
        \"params\": {
            \"protocolVersion\": \"2024-11-05\",
            \"capabilities\": {},
            \"clientInfo\": {
                \"name\": \"claude-desktop\",
                \"version\": \"0.7.0\"
            }
        }
    }")

echo "   Response: $INIT_RESPONSE"

# Step 3: Wait for SSE response
sleep 2
echo ""
echo "3. SSE stream output:"
cat /tmp/sse-stream.log

# Cleanup
kill $SSE_PID 2>/dev/null
rm -f /tmp/sse-stream.log

echo ""
echo "Test complete!"
