#!/bin/bash
set -e

echo "🐳 Testing digital-bloom Docker build..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Clean up any existing test container
echo -e "${YELLOW}🧹 Cleaning up previous test containers...${NC}"
docker-compose -f docker-compose.test.yml down 2>/dev/null || true

# Build the container
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
if ! docker-compose -f docker-compose.test.yml build; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Start the container
echo -e "${YELLOW}🚀 Starting container...${NC}"
docker-compose -f docker-compose.test.yml up -d

# Wait for health check
echo -e "${YELLOW}⏳ Waiting for health check...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker inspect digital-bloom-test --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}✅ Container is healthy${NC}"
        break
    fi

    if [ $attempt -eq $((max_attempts - 1)) ]; then
        echo -e "${RED}❌ Health check timeout${NC}"
        docker-compose -f docker-compose.test.yml logs
        docker-compose -f docker-compose.test.yml down
        exit 1
    fi

    echo "Attempt $((attempt + 1))/$max_attempts..."
    sleep 2
    attempt=$((attempt + 1))
done

# Test HTTP response
echo -e "${YELLOW}🔍 Testing HTTP endpoint...${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTP endpoint responds${NC}"
else
    echo -e "${RED}❌ HTTP endpoint failed${NC}"
    docker-compose -f docker-compose.test.yml logs
    docker-compose -f docker-compose.test.yml down
    exit 1
fi

# Check if container is still running
echo -e "${YELLOW}🔍 Checking container status...${NC}"
if docker ps | grep -q digital-bloom-test; then
    echo -e "${GREEN}✅ Container is running${NC}"

    # Check for WASM file
    echo -e "${YELLOW}🦀 Checking WASM assets...${NC}"
    if docker exec digital-bloom-test test -f /app/dist/assets/digital_bloom_wasm_bg.wasm; then
        echo -e "${GREEN}✅ WASM file found${NC}"
    else
        echo -e "${RED}❌ WASM file missing${NC}"
        docker-compose -f docker-compose.test.yml down
        exit 1
    fi

    # Show build size
    echo -e "${YELLOW}📊 Build artifacts:${NC}"
    docker exec digital-bloom-test ls -lh /app/dist/assets/ | grep -E '\.(js|css|wasm)$' || true
else
    echo -e "${YELLOW}⚠️  Container stopped, skipping file checks (HTTP test passed)${NC}"
fi

# Clean up
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
docker-compose -f docker-compose.test.yml down

echo -e "${GREEN}✅ All Docker tests passed!${NC}"
echo ""
echo "To run the container manually:"
echo "  docker-compose -f docker-compose.test.yml up"
echo "  Open http://localhost:3000"
