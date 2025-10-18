#!/bin/bash

# Digital Bloom - iOS Device Log Parser
# This script monitors and parses logs from the Digital Bloom app running on iOS
# Usage: ./scripts/parse-device-logs.sh [device-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse device name argument
DEVICE_NAME="${1:-zojak-16m}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Digital Bloom - Device Log Monitor${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Detect connected device
echo -e "${CYAN}[INFO]${NC} Detecting device: $DEVICE_NAME..."
DEVICE_LIST=$(xcrun xctrace list devices 2>&1 | grep -i "$DEVICE_NAME" | head -1)

if [ -z "$DEVICE_LIST" ]; then
    echo -e "${RED}[ERROR]${NC} Device '$DEVICE_NAME' not found"
    exit 1
fi

DEVICE_UDID=$(echo "$DEVICE_LIST" | grep -oE '\([0-9A-F-]{36}\)' | tr -d '()')
echo -e "${GREEN}[SUCCESS]${NC} Found device: $DEVICE_NAME (UDID: $DEVICE_UDID)"
echo ""

# Step 2: Stream logs from device
echo -e "${CYAN}[INFO]${NC} Starting log stream..."
echo -e "${YELLOW}[NOTE]${NC} Press Ctrl+C to stop monitoring"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""

# Stream logs and parse for Digital Bloom app messages
xcrun devicectl device info logs \
    --device "$DEVICE_UDID" \
    --style json 2>/dev/null | \
    jq -r 'select(.process == "App" or .subsystem == "com.breakevenllc.digitalbloom") |
           "\(.timestamp) [\(.level)] \(.message)"' | \
    while IFS= read -r line; do
        # Color code based on log level
        if [[ "$line" == *"[ERROR]"* ]] || [[ "$line" == *"error"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ "$line" == *"[WARNING]"* ]] || [[ "$line" == *"warning"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ "$line" == *"[DEBUG]"* ]] || [[ "$line" == *"BTN TOUCH"* ]] || [[ "$line" == *"CANVAS"* ]]; then
            echo -e "${CYAN}$line${NC}"
        elif [[ "$line" == *"ORIENTATION"* ]]; then
            echo -e "${BLUE}$line${NC}"
        else
            echo "$line"
        fi
    done
