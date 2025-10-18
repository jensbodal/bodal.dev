#!/bin/bash

# Digital Bloom - Automated iOS Build and Deploy Script
# This script builds the app, installs it to a connected device, and launches it
# Usage: ./scripts/build-and-deploy-ios.sh [device-name]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse device name argument
DEVICE_NAME="${1:-zojak-16m}"  # Default to zojak-16m if not provided

log_info "Starting iOS build and deploy workflow for device: $DEVICE_NAME"

# Step 1: Detect connected devices
log_info "Step 1/6: Detecting connected iOS devices..."
DEVICE_LIST=$(xcrun xctrace list devices 2>&1 | grep -i "$DEVICE_NAME" | head -1)

if [ -z "$DEVICE_LIST" ]; then
    log_error "Device '$DEVICE_NAME' not found. Connected devices:"
    xcrun xctrace list devices 2>&1 | grep -i "iPad\|iPhone" | head -10
    exit 1
fi

# Extract device UDID (simpler approach using awk)
DEVICE_UDID=$(echo "$DEVICE_LIST" | awk -F'[()]' '{print $(NF-1)}')
log_success "Found device: $DEVICE_NAME (UDID: $DEVICE_UDID)"

# Step 2: Build web assets
log_info "Step 2/6: Building web assets with Vite..."
cd "$(dirname "$0")/.."  # Go to digital-bloom directory
bun run build

if [ $? -eq 0 ]; then
    log_success "Web assets built successfully"
else
    log_error "Web build failed"
    exit 1
fi

# Step 3: Sync with Capacitor
log_info "Step 3/6: Syncing with Capacitor..."
bun run cap:sync ios

if [ $? -eq 0 ]; then
    log_success "Capacitor sync completed"
else
    log_error "Capacitor sync failed"
    exit 1
fi

# Step 4: Build iOS app with Xcode
log_info "Step 4/6: Building iOS app with Xcode..."
cd ios/App

BUILD_LOG=$(mktemp)
xcodebuild \
    -workspace App.xcworkspace \
    -scheme App \
    -destination "platform=iOS,name=$DEVICE_NAME" \
    -allowProvisioningUpdates \
    build 2>&1 | tee "$BUILD_LOG"

# Check for build success
if grep -q "BUILD SUCCEEDED" "$BUILD_LOG"; then
    log_success "iOS build succeeded"
else
    log_error "iOS build failed. Check logs above for details."
    rm "$BUILD_LOG"
    exit 1
fi

# Parse warnings and errors
WARNING_COUNT=$(grep -c "warning:" "$BUILD_LOG" || true)
ERROR_COUNT=$(grep -c "error:" "$BUILD_LOG" || true)

if [ "$WARNING_COUNT" -gt 0 ]; then
    log_warning "Build completed with $WARNING_COUNT warning(s)"
fi

if [ "$ERROR_COUNT" -gt 0 ]; then
    log_error "Build completed with $ERROR_COUNT error(s)"
fi

rm "$BUILD_LOG"

# Find the built app
APP_PATH="$HOME/Library/Developer/Xcode/DerivedData/App-fggbdvcwxwgqzmepwkwzcomnzhsw/Build/Products/Debug-iphoneos/App.app"

if [ ! -d "$APP_PATH" ]; then
    log_error "Built app not found at expected path: $APP_PATH"
    log_info "Searching for app in DerivedData..."
    APP_PATH=$(find "$HOME/Library/Developer/Xcode/DerivedData" -name "App.app" -path "*/Debug-iphoneos/*" | head -1)

    if [ -z "$APP_PATH" ]; then
        log_error "Could not find built app"
        exit 1
    fi

    log_success "Found app at: $APP_PATH"
fi

# Step 5: Install app to device
log_info "Step 5/6: Installing app to device..."
xcrun devicectl device install app \
    --device "$DEVICE_UDID" \
    "$APP_PATH" 2>&1

if [ $? -eq 0 ]; then
    log_success "App installed successfully"
else
    log_error "App installation failed"
    exit 1
fi

# Step 6: Launch app on device
log_info "Step 6/6: Launching app on device..."
xcrun devicectl device process launch \
    --device "$DEVICE_UDID" \
    com.breakevenllc.digitalbloom 2>&1

if [ $? -eq 0 ]; then
    log_success "App launched successfully on $DEVICE_NAME"
else
    log_error "App launch failed"
    exit 1
fi

log_success "=========================================="
log_success "Digital Bloom deployment complete!"
log_success "Device: $DEVICE_NAME"
log_success "Bundle ID: com.breakevenllc.digitalbloom"
log_success "=========================================="
