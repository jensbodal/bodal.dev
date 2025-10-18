# iOS Deployment Workflow

Automated scripts for building, deploying, and monitoring the Digital Bloom iOS app.

## Quick Start

### Deploy to Device

```bash
# Deploy to default device (zojak-16m)
bun run ios:deploy

# Deploy to specific device
cd apps/digital-bloom
./scripts/build-and-deploy-ios.sh "your-device-name"
```

### Monitor Device Logs

```bash
# Monitor logs from default device
bun run ios:logs

# Monitor logs from specific device
cd apps/digital-bloom
./scripts/parse-device-logs.sh "your-device-name"
```

## Available Scripts

### `bun run ios:deploy`
**Full automated deployment workflow:**
1. Detects connected iOS device
2. Builds web assets with Vite
3. Syncs with Capacitor
4. Builds iOS app with Xcode
5. Installs app to device
6. Launches app

**Features:**
- ✅ Colored output for easy reading
- ✅ Error detection and reporting
- ✅ Build warning/error counts
- ✅ Automatic app path detection
- ✅ Step-by-step progress tracking

**Usage:**
```bash
cd apps/digital-bloom
bun run ios:deploy                           # Uses default device (zojak-16m)
./scripts/build-and-deploy-ios.sh iPad-Pro  # Specify device name
```

### `bun run ios:logs`
**Real-time device log monitoring:**
- Streams logs from connected iOS device
- Filters for Digital Bloom app messages
- Color-codes log levels:
  - 🔴 **Red**: Errors
  - 🟡 **Yellow**: Warnings
  - 🔵 **Cyan**: Debug messages (BTN TOUCH, CANVAS)
  - 🔷 **Blue**: Orientation changes
  - ⚪ **White**: Info messages

**Usage:**
```bash
cd apps/digital-bloom
bun run ios:logs                        # Monitor default device
./scripts/parse-device-logs.sh iPad-Pro # Monitor specific device
```

**Press Ctrl+C to stop monitoring**

## Workflow Details

### Build Pipeline

The deployment script executes these steps automatically:

#### 1. Device Detection
```bash
xcrun xctrace list devices
```
- Searches for connected device by name
- Extracts device UDID
- Verifies device is available

#### 2. Web Build
```bash
bun run build
```
- Compiles TypeScript/React with Vite
- Bundles WASM modules
- Generates production assets in `dist/`

#### 3. Capacitor Sync
```bash
bun run cap:sync ios
```
- Copies web assets to iOS app
- Updates native configuration
- Syncs plugins and dependencies

#### 4. Xcode Build
```bash
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -destination "platform=iOS,name=$DEVICE_NAME" \
  -allowProvisioningUpdates \
  build
```
- Compiles Swift/Objective-C code
- Links frameworks
- Signs app with provisioning profile
- Generates `.app` bundle

#### 5. Installation
```bash
xcrun devicectl device install app \
  --device $DEVICE_UDID \
  $APP_PATH
```
- Installs app to device via USB
- Updates existing installation if present
- Generates new bundle container

#### 6. Launch
```bash
xcrun devicectl device process launch \
  --device $DEVICE_UDID \
  com.breakevenllc.digitalbloom
```
- Launches app on device
- App appears on screen immediately

### Log Parsing

The log parser script:

1. **Connects to Device**
   ```bash
   xcrun devicectl device info logs --device $DEVICE_UDID
   ```

2. **Filters Messages**
   - Process: "App"
   - Subsystem: "com.breakevenllc.digitalbloom"

3. **Parses JSON Output**
   ```bash
   jq -r 'select(.process == "App") | "\(.timestamp) [\(.level)] \(.message)"'
   ```

4. **Color Codes Output**
   - Highlights errors, warnings, debug messages
   - Makes orientation changes easy to spot
   - Filters noise from other apps

## Debug Messages

The app includes debug logging to help diagnose issues:

### Button Touch Events
```
BTN TOUCH: vine
BTN TOUCH: gravity
BTN TOUCH: bounce
```
Indicates a mode button was successfully tapped.

### Canvas Touch Events
```
CANVAS START: CANVAS#artCanvas
CANVAS START: DIV#toolbar-container
```
Shows what element received a touch event.

### Orientation Changes
```
ORIENTATION CHANGE: 0
ORIENTATION FIXED: 1179x2556
```
Tracks device rotation and viewport updates.

### Touch Event Flow
```
[Mode Button] touchstart event: {target: button, mode: "vine"}
[Canvas] handleDrawStart: {targetTag: "CANVAS", isCanvas: true}
```
Detailed event debugging for troubleshooting.

## Troubleshooting

### Device Not Found
**Error:** `Device 'zojak-16m' not found`

**Solutions:**
1. Check device is connected via USB
2. Trust computer on device (Settings → General → Device Management)
3. List available devices: `xcrun xctrace list devices`
4. Use exact device name from list

### Build Failed
**Error:** `BUILD SUCCEEDED` not found in logs

**Solutions:**
1. Check Xcode is installed: `xcode-select --install`
2. Open Xcode and accept license
3. Check provisioning profile in Xcode
4. Review build logs for specific errors

### App Install Failed
**Error:** `App installation failed`

**Solutions:**
1. Unlock device
2. Check device has enough storage
3. Trust developer certificate on device
4. Check app ID matches provisioning profile

### No Logs Appearing
**Solutions:**
1. Launch app manually to ensure it's running
2. Check device is still connected
3. Restart log monitor script
4. Check app has necessary entitlements

## Advanced Usage

### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Deploy to Test Device
  run: |
    cd apps/digital-bloom
    ./scripts/build-and-deploy-ios.sh "Test-iPad"
  env:
    APPLE_DEVELOPMENT_TEAM: ${{ secrets.APPLE_TEAM_ID }}
```

### Custom Device Configuration

Edit script to add device-specific configurations:

```bash
case "$DEVICE_NAME" in
  "zojak-16m")
    DEVICE_TYPE="ipad"
    ;;
  "iPhone-Pro")
    DEVICE_TYPE="iphone"
    ;;
esac
```

### Log Filtering

Customize log parser to show specific messages:

```bash
# Show only button events
./scripts/parse-device-logs.sh | grep "BTN TOUCH"

# Show only errors
./scripts/parse-device-logs.sh | grep -i error

# Save logs to file
./scripts/parse-device-logs.sh > logs/$(date +%Y%m%d-%H%M%S).log
```

## File Structure

```
apps/digital-bloom/
├── scripts/
│   ├── build-and-deploy-ios.sh  # Main deployment script
│   ├── parse-device-logs.sh     # Log monitoring script
│   ├── generate-ios-icons.sh    # Icon generation
│   └── sync-version.js          # Version syncing
├── ios/
│   └── App/
│       ├── App.xcworkspace      # Xcode workspace
│       └── App/                 # iOS app source
├── dist/                        # Built web assets
└── IOS_DEPLOYMENT.md           # This file
```

## Requirements

- **macOS** with Xcode installed
- **iOS device** connected via USB
- **Bun** package manager
- **Xcode Command Line Tools**: `xcode-select --install`
- **Valid provisioning profile** for development

## Support

For issues with:
- **Build process**: Check Xcode logs and provisioning
- **Deployment**: Verify device connection and trust
- **Logs**: Ensure app is running and device connected
- **Debug overlay**: Check app/digital-bloom/src/main.ts debug functions
