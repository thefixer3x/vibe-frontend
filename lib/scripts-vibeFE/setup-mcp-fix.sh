#!/bin/bash

# MCP Gateway Setup & Connection Fix Script
# This script will fix your SSE and HTTP connection issues

set -e

echo "🚀 MCP Gateway Connection Fix Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="https://link.seyederick.com"
API_KEY="vibe_frontend_key_2024"
PROJECT_DIR="/root/vibe-frontend"
NGINX_CONFIG="/etc/nginx/sites-available/link.seyederick.com"

echo -e "${BLUE}Step 1: Check Current Status${NC}"
echo "----------------------------------------"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    echo "Please run this script from the correct server or update PROJECT_DIR"
    exit 1
fi

echo -e "${GREEN}✓ Project directory found${NC}"

# Check PM2 process
echo "Checking PM2 process status..."
if pm2 list | grep -q "unified-gateway\|mcp-unified-gateway\|vibe-gateway"; then
    echo -e "${GREEN}✓ MCP gateway process found${NC}"
    pm2 list | grep "gateway"
else
    echo -e "${YELLOW}⚠ MCP gateway process not found${NC}"
fi

echo -e "\n${BLUE}Step 2: Test Gateway Locally${NC}"
echo "----------------------------------------"

# Test local gateway
if curl -s http://localhost:7777/health | grep -q "healthy\|status"; then
    echo -e "${GREEN}✓ Gateway responding locally on port 7777${NC}"
elif curl -s http://localhost:7778/health | grep -q "healthy\|status"; then
    echo -e "${GREEN}✓ Gateway responding locally on port 7778${NC}"
else
    echo -e "${RED}❌ Gateway not responding on either port${NC}"
    echo "Starting/restarting gateway..."
    
    cd $PROJECT_DIR/lib/mcp/gateway
    
    # Kill any existing processes
    pkill -f unified-gateway || true
    
    # Start with PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart unified-gateway 2>/dev/null || pm2 start unified-gateway.ts --name unified-gateway
        sleep 3
        
        # Test again
        if curl -s http://localhost:7777/health | grep -q "healthy\|status"; then
            echo -e "${GREEN}✓ Gateway started successfully${NC}"
        else
            echo -e "${RED}❌ Gateway failed to start${NC}"
            pm2 logs unified-gateway --lines 10
            exit 1
        fi
    else
        echo -e "${YELLOW}PM2 not found, starting manually...${NC}"
        node unified-gateway.ts &
        sleep 3
    fi
fi

echo -e "\n${BLUE}Step 3: Test Without API Key${NC}"
echo "----------------------------------------"

# Test health endpoint without API key
HEALTH_RESPONSE=$(curl -s $GATEWAY_URL/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy\|status"; then
    echo -e "${GREEN}✓ Gateway accessible without API key${NC}"
    REQUIRES_API_KEY=false
elif echo "$HEALTH_RESPONSE" | grep -q "Access denied\|Unauthorized"; then
    echo -e "${YELLOW}⚠ Gateway requires API key${NC}"
    REQUIRES_API_KEY=true
else
    echo -e "${RED}❌ Unexpected response: $HEALTH_RESPONSE${NC}"
    REQUIRES_API_KEY=true
fi

echo -e "\n${BLUE}Step 4: Test With API Key${NC}"
echo "----------------------------------------"

if [ "$REQUIRES_API_KEY" = true ]; then
    # Test with API keys
    for key in "vibe_frontend_key_2024" "lano_master_key_2024"; do
        echo "Testing with API key: $key"
        RESPONSE=$(curl -s -H "X-API-Key: $key" $GATEWAY_URL/health)
        
        if echo "$RESPONSE" | grep -q "healthy\|status"; then
            echo -e "${GREEN}✓ API key works: $key${NC}"
            API_KEY="$key"
            break
        else
            echo -e "${RED}❌ API key failed: $key${NC}"
            echo "Response: $RESPONSE"
        fi
    done
fi

echo -e "\n${BLUE}Step 5: Test All Endpoints${NC}"
echo "----------------------------------------"

HEADERS=""
if [ "$REQUIRES_API_KEY" = true ]; then
    HEADERS="-H X-API-Key:$API_KEY"
fi

# Test health endpoint
echo "Testing health endpoint..."
HEALTH=$(curl -s $HEADERS $GATEWAY_URL/health)
if echo "$HEALTH" | grep -q "healthy\|status"; then
    echo -e "${GREEN}✓ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
    echo "Response: $HEALTH"
fi

# Test SSE endpoint
echo "Testing SSE endpoint..."
timeout 5s curl -s $HEADERS $GATEWAY_URL/sse > /dev/null &
SSE_PID=$!
sleep 2
if ps -p $SSE_PID > /dev/null; then
    echo -e "${GREEN}✓ SSE endpoint accepting connections${NC}"
    kill $SSE_PID 2>/dev/null || true
else
    echo -e "${RED}❌ SSE endpoint failed${NC}"
fi

# Test HTTP MCP endpoint
echo "Testing HTTP MCP endpoint..."
MCP_RESPONSE=$(curl -s $HEADERS -X POST $GATEWAY_URL/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')

if echo "$MCP_RESPONSE" | grep -q "result\|tools"; then
    TOOL_COUNT=$(echo "$MCP_RESPONSE" | jq -r '.result.tools | length' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ HTTP MCP endpoint working ($TOOL_COUNT tools)${NC}"
else
    echo -e "${RED}❌ HTTP MCP endpoint failed${NC}"
    echo "Response: $MCP_RESPONSE"
fi

echo -e "\n${BLUE}Step 6: Generate Frontend Configuration${NC}"
echo "----------------------------------------"

# Create .env.local file
ENV_FILE="$PROJECT_DIR/.env.local"
cat > "$ENV_FILE" << EOF
# MCP Gateway Configuration
NEXT_PUBLIC_MCP_GATEWAY_URL=$GATEWAY_URL
NEXT_PUBLIC_MCP_API_KEY=$API_KEY
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MCP=true
EOF

echo -e "${GREEN}✓ Created .env.local file${NC}"
echo "Configuration:"
cat "$ENV_FILE"

echo -e "\n${BLUE}Step 7: Test Frontend Connection${NC}"
echo "----------------------------------------"

# Create test script for frontend
TEST_FILE="$PROJECT_DIR/test-mcp-connection.js"
cat > "$TEST_FILE" << 'EOF'
// Test MCP connection from frontend
const https = require('https');

const config = {
  gatewayUrl: process.env.NEXT_PUBLIC_MCP_GATEWAY_URL || 'https://link.seyederick.com',
  apiKey: process.env.NEXT_PUBLIC_MCP_API_KEY || 'vibe_frontend_key_2024'
};

console.log('Testing MCP connection with config:', config);

// Test health endpoint
const testHealth = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'link.seyederick.com',
      path: '/health',
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Test MCP tools list
const testToolsList = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });

    const options = {
      hostname: 'link.seyederick.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Run tests
(async () => {
  try {
    console.log('\n1. Testing health endpoint...');
    const health = await testHealth();
    console.log('✓ Health response:', health);

    console.log('\n2. Testing tools list...');
    const tools = await testToolsList();
    if (tools.result && tools.result.tools) {
      console.log(`✓ Found ${tools.result.tools.length} tools`);
      console.log('Sample tools:', tools.result.tools.slice(0, 3).map(t => t.name));
    } else {
      console.log('❌ Tools list failed:', tools);
    }

    console.log('\n✅ MCP connection test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();
EOF

echo -e "${GREEN}✓ Created test script${NC}"

# Run the test
echo "Running frontend connection test..."
cd $PROJECT_DIR
node test-mcp-connection.js

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Copy the files created in your vibe-frontend project:"
echo "   - lib/mcp/client.ts (Updated MCP client)"
echo "   - components/MCPConnectionTest.tsx (Test component)"
echo "   - pages/mcp-test.tsx (Test page)"
echo "   - pages/api/mcp-proxy.ts (API proxy)"
echo "   - .env.local (Environment config)"
echo ""
echo "2. Install dependencies in your Next.js project:"
echo "   npm install"
echo ""
echo "3. Run your development server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000/mcp-test to test connections"
echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo "Gateway URL: $GATEWAY_URL"
echo "API Key: $API_KEY"
echo "SSE Endpoint: $GATEWAY_URL/sse"
echo "HTTP Endpoint: $GATEWAY_URL/mcp"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo "- If SSE/HTTP still fail, check nginx configuration"
echo "- For CORS issues, add your frontend domain to gateway CORS settings"
echo "- Check PM2 logs: pm2 logs unified-gateway"
echo "- Verify firewall settings on your server"
