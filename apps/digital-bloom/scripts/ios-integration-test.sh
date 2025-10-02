#!/bin/bash
# iOS Integration Test Script
# Builds app, launches in simulator, and verifies it's working

set -e

SIMULATOR_ID="1046AD2B-7404-49D6-9F96-D471CE699988"
BUNDLE_ID="com.breakevenllc.digitalbloom"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m' # No Color

echo "🚀 Starting iOS Integration Test..."

# Step 1: Build
echo -e "${COLOR_YELLOW}📦 Building app...${COLOR_NC}"
cd "$(dirname "$0")/.."
bun run ios:build > /dev/null 2>&1

# Step 2: Boot simulator
echo -e "${COLOR_YELLOW}📱 Booting simulator...${COLOR_NC}"
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || echo "Simulator already booted"

# Step 3: Find latest build
BUILD_PATH=$(find ~/Library/Developer/Xcode/DerivedData/App-*/Build/Products/Debug-iphonesimulator/App.app -type d -depth 0 2>/dev/null | xargs ls -dt 2>/dev/null | head -1)
if [ -z "$BUILD_PATH" ]; then
    echo -e "${COLOR_RED}❌ Build not found${COLOR_NC}"
    exit 1
fi

# Step 4: Install
echo -e "${COLOR_YELLOW}📲 Installing app...${COLOR_NC}"
xcrun simctl install "$SIMULATOR_ID" "$BUILD_PATH"

# Step 5: Launch with console logging
echo -e "${COLOR_YELLOW}🎬 Launching app...${COLOR_NC}"
xcrun simctl launch --console "$SIMULATOR_ID" "$BUNDLE_ID" > /tmp/app-launch.log 2>&1 &
LAUNCH_PID=$!

# Step 6: Wait and check logs
sleep 3
echo -e "${COLOR_YELLOW}🔍 Checking for JavaScript initialization...${COLOR_NC}"

# Check for WebKit JavaScript execution logs (runJavaScriptInFrameInScriptWorld indicates JS is running)
if xcrun simctl spawn "$SIMULATOR_ID" log show --last 10s --predicate 'process == "App"' 2>/dev/null | grep -q "runJavaScriptInFrameInScriptWorld"; then
    echo -e "${COLOR_GREEN}✅ JavaScript is running!${COLOR_NC}"
else
    echo -e "${COLOR_RED}❌ JavaScript NOT detected${COLOR_NC}"

    # Take screenshot for debugging
    xcrun simctl io "$SIMULATOR_ID" screenshot /tmp/failed-launch.png
    echo -e "${COLOR_YELLOW}📸 Screenshot saved to /tmp/failed-launch.png${COLOR_NC}"

    # Show recent logs
    echo -e "${COLOR_YELLOW}📋 Recent logs:${COLOR_NC}"
    xcrun simctl spawn "$SIMULATOR_ID" log show --last 10s --predicate 'process == "App"' 2>/dev/null | tail -20

    exit 1
fi

# Step 7: Take success screenshot
xcrun simctl io "$SIMULATOR_ID" screenshot /tmp/success-launch.png
echo -e "${COLOR_GREEN}✅ Integration test PASSED${COLOR_NC}"
echo -e "${COLOR_GREEN}📸 Screenshot: /tmp/success-launch.png${COLOR_NC}"
