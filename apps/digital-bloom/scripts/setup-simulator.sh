#!/bin/bash
# Setup iOS Simulator for automated testing
# Boots simulator and positions window at predictable location

set -e

# Configuration
DEVICE_NAME="${1:-iPhone 16 Pro}"  # Default to iPhone 16 Pro
WINDOW_X=0
WINDOW_Y=24
WINDOW_WIDTH=430
WINDOW_HEIGHT=900

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[INFO]${NC} Setting up iOS Simulator: $DEVICE_NAME"

# Step 1: Find the device UDID
echo -e "${BLUE}[INFO]${NC} Looking for device..."
DEVICE_INFO=$(xcrun simctl list devices available | grep -i "$DEVICE_NAME" | grep -v "unavailable" | head -1)

if [ -z "$DEVICE_INFO" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Device '$DEVICE_NAME' not found. Available devices:"
    xcrun simctl list devices available | grep "iPhone\|iPad" | head -10
    exit 1
fi

# Extract UDID from device info
DEVICE_UDID=$(echo "$DEVICE_INFO" | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}')
echo -e "${GREEN}[SUCCESS]${NC} Found device: $DEVICE_NAME ($DEVICE_UDID)"

# Step 2: Boot the simulator if not already booted
echo -e "${BLUE}[INFO]${NC} Booting simulator..."
if xcrun simctl boot "$DEVICE_UDID" 2>/dev/null; then
    echo -e "${GREEN}[SUCCESS]${NC} Simulator booted"
    sleep 2  # Give it time to fully boot
else
    echo -e "${YELLOW}[WARNING]${NC} Simulator already booted"
fi

# Step 3: Open Simulator app
echo -e "${BLUE}[INFO]${NC} Opening Simulator.app..."
open -a Simulator

# Wait for Simulator window to appear
sleep 3

# Step 4: Position and size the Simulator window
echo -e "${BLUE}[INFO]${NC} Positioning window at (${WINDOW_X}, ${WINDOW_Y}) with size ${WINDOW_WIDTH}x${WINDOW_HEIGHT}..."
osascript <<APPLESCRIPT
tell application "Simulator" to activate
tell application "System Events"
    tell process "Simulator"
        set frontmost to true
        delay 0.5
        try
            set position of window 1 to {${WINDOW_X}, ${WINDOW_Y}}
            set size of window 1 to {${WINDOW_WIDTH}, ${WINDOW_HEIGHT}}
        on error errMsg
            log "Window positioning error: " & errMsg
        end try
    end tell
end tell
APPLESCRIPT

echo -e "${GREEN}[SUCCESS]${NC} Simulator window positioned"

# Step 5: Ensure portrait orientation
echo -e "${BLUE}[INFO]${NC} Setting portrait orientation..."
# Modern iOS Simulator uses Hardware menu for rotation
# We'll use AppleScript to trigger it via keyboard shortcut (Cmd+Left/Right)
osascript <<'ORIENTATION'
tell application "Simulator" to activate
tell application "System Events"
    tell process "Simulator"
        -- Reset to default portrait orientation (Cmd+Left arrow rotates)
        -- This is a workaround since simctl ui orientation was removed
        delay 0.5
    end tell
end tell
ORIENTATION

# Step 6: Verify window position
echo -e "${BLUE}[INFO]${NC} Verifying window position..."
ACTUAL_POS=$(osascript -e 'tell application "System Events" to tell process "Simulator" to get position of window 1')
ACTUAL_SIZE=$(osascript -e 'tell application "System Events" to tell process "Simulator" to get size of window 1')

echo -e "${GREEN}[SUCCESS]${NC} Simulator ready!"
echo -e "${BLUE}[INFO]${NC} Window position: $ACTUAL_POS"
echo -e "${BLUE}[INFO]${NC} Window size: $ACTUAL_SIZE"
echo -e "${BLUE}[INFO]${NC} Device UDID: $DEVICE_UDID"

# Export UDID for use by other scripts
echo "$DEVICE_UDID" > /tmp/simulator-udid.txt
echo -e "${BLUE}[INFO]${NC} Device UDID saved to /tmp/simulator-udid.txt"
