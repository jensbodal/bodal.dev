# iOS Simulator Automated Testing Guide

This guide explains how to use the automated iOS Simulator testing framework for Digital Bloom. The framework validates the toolbar rotation bug fix by programmatically interacting with the iOS Simulator using CLI-based cursor control.

## Overview

The testing framework consists of:

1. **setup-simulator.sh** - Boots simulator and positions window at predictable coordinates
2. **get-simulator-coords.sh** - Calculates absolute screen coordinates for UI elements
3. **rotate-simulator.sh** - Rotates simulator orientation using keyboard shortcuts
4. **ios-simulator-validation-test.sh** - Full automated test sequence

## Prerequisites

### 1. Install cliclick

```bash
brew install cliclick
```

### 2. Grant Accessibility Permissions

Your terminal app needs Accessibility permissions to control the mouse cursor:

1. Run this command to open System Preferences:
   ```bash
   open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
   ```

2. Add your terminal app (iTerm, Terminal, etc.) to the list
3. Enable the checkbox next to your terminal app

### 3. Verify cliclick Works

```bash
cliclick p
# Should print current mouse position like: 730,447
```

If you get an error, double-check Accessibility permissions.

## Quick Start

### Run Complete Validation Test

```bash
cd apps/digital-bloom
bun run ios:simulator:test
```

This will:
1. Boot iPhone 16 Pro simulator
2. Position simulator window at (0, 24) with size 430x900
3. Build and install Digital Bloom app
4. Test button clicks in portrait mode
5. Rotate to landscape and test clicks
6. **Rotate back to portrait (critical bug scenario)**
7. Validate toolbar positioning and interactivity
8. Save screenshots to `/tmp/digital-bloom-tests/`

### Individual Commands

```bash
# Setup simulator only
bun run ios:simulator:setup

# Calculate UI coordinates
bun run ios:simulator:coords

# Rotate simulator (while it's running)
bash scripts/rotate-simulator.sh left      # landscape left
bash scripts/rotate-simulator.sh right     # landscape right
bash scripts/rotate-simulator.sh portrait  # back to portrait
```

## How It Works

### 1. Window Positioning

The framework positions the iOS Simulator window at fixed coordinates so that UI element positions are predictable:

- **Window origin**: (0, 24) - top-left corner of screen, below menu bar
- **Window size**: 430x900 - narrow portrait aspect ratio
- **Device**: iPhone 16 Pro (iOS 18.6)

### 2. Coordinate Calculation

UI elements are located using known offsets from the window origin:

```
Toolbar top offset: 55px (0.5rem + safe-area-inset-top)
Mode buttons: 56x56px with 8px gaps
Button Y position: ~83px from window top
```

The `get-simulator-coords.sh` script calculates absolute screen coordinates:

```bash
# Device-relative coordinates
Vine button: (44, 83)

# Absolute screen coordinates (for cliclick)
Window at (0, 24) → Vine button at (44, 107)
```

### 3. Automated Clicking

Using `cliclick`, the test script clicks UI elements:

```bash
# Load coordinates
source /tmp/simulator-coords.sh

# Click gravity button
cliclick $GRAVITY_CLICK
# Expands to: cliclick c:108,107
```

### 4. Rotation Testing

The critical test sequence:

1. **Portrait** → Test clicks → ✓ Works
2. **Rotate to landscape** → Test clicks → ✓ Works
3. **Rotate back to portrait** → Test clicks → **Bug check!**

Before the fix (with `contentInset: 'automatic'`):
- Toolbar visual position would be offset
- Had to click ~47px above where buttons appeared
- `env(safe-area-inset-top)` not updating on rotation

After the fix (removed `contentInset`):
- Toolbar position correct in all orientations
- Buttons clickable at expected coordinates
- Safe area insets update properly

## Test Output

### Screenshots

Saved to `/tmp/digital-bloom-tests/`:

- `01-portrait-initial.png` - Initial portrait mode
- `02-portrait-gravity-clicked.png` - After clicking gravity button
- `03-portrait-bounce-clicked.png` - After clicking bounce button
- `04-landscape.png` - Landscape orientation
- `05-landscape-vine-clicked.png` - Landscape button click
- `06-portrait-after-rotation.png` - **Critical: Portrait after rotation**
- `07-portrait-constellation-clicked.png` - Post-rotation click test
- `08-portrait-lightning-clicked.png` - Second post-rotation click
- `09-diff.png` - Visual diff (if ImageMagick installed)

### Logs

Saved to `/tmp/`:

- `digital-bloom-build.log` - Vite build output
- `digital-bloom-sync.log` - Capacitor sync output
- `digital-bloom-xcodebuild.log` - Xcode build output
- `simulator-coords-output.txt` - Coordinate calculations

### Test Results

```
═══════════════════════════════════════════════════
  Test Results
═══════════════════════════════════════════════════
Tests Passed: 12
Tests Failed: 0

Screenshots saved to: /tmp/digital-bloom-tests/
Logs saved to: /tmp/digital-bloom-*.log

╔═══════════════════════════════════════╗
║  ✓ ALL TESTS PASSED                  ║
║  Toolbar rotation bug appears fixed! ║
╚═══════════════════════════════════════╝
```

## Success Criteria

The test validates:

- ✅ App builds and installs successfully
- ✅ App launches in simulator
- ✅ Mode buttons clickable in portrait mode
- ✅ Mode buttons clickable in landscape mode
- ✅ **Mode buttons clickable after landscape→portrait rotation**
- ✅ Toolbar visually positioned correctly in all orientations
- ✅ No offset between visual position and click zones

## Troubleshooting

### Accessibility Permission Denied

```
Error: Accessibility permission denied
```

**Fix**: Open System Preferences → Security & Privacy → Privacy → Accessibility, and enable your terminal app.

### Simulator Not Found

```
[WARNING] Device 'iPhone 16 Pro' not found
```

**Fix**: Check available simulators:
```bash
xcrun simctl list devices available
```

Update `setup-simulator.sh` to use an available device name.

### Clicks Not Working

If clicks don't interact with UI elements:

1. **Verify coordinates**: Run `bun run ios:simulator:coords` and check output
2. **Manual test**: Use `cliclick p` to check your mouse position matches expectations
3. **Window position**: Ensure simulator window is at (0, 24) - run setup script again
4. **Zoom level**: Make sure simulator isn't scaled/zoomed (View → Physical Size)

### Rotation Not Working

Modern iOS Simulator removed `simctl ui orientation` command. We use keyboard shortcuts instead:

- Cmd+Left = Rotate left (counter-clockwise)
- Cmd+Right = Rotate right (clockwise)

If rotation fails, manually rotate using Simulator menu: Hardware → Rotate Left/Right

### Build Failures

Check logs in `/tmp/digital-bloom-*.log`:

```bash
tail -100 /tmp/digital-bloom-xcodebuild.log
```

Common issues:
- Missing dependencies: Run `bun install`
- Stale build: Run `bun run build` manually
- Xcode issues: Try `xcodebuild clean` in iOS app directory

## Reusable Framework

This testing framework can be adapted for other iOS apps:

### Key Components to Customize

1. **UI Coordinates** (`get-simulator-coords.sh`):
   - Update `TOOLBAR_TOP_OFFSET` based on your app's layout
   - Calculate button positions based on your UI structure
   - Export coordinates for your specific buttons/elements

2. **Test Sequence** (`ios-simulator-validation-test.sh`):
   - Customize test steps for your app's functionality
   - Add/remove screenshot captures
   - Modify success criteria

3. **Device Selection** (`setup-simulator.sh`):
   - Change `DEVICE_NAME` to test different devices
   - Adjust window size for different screen dimensions

### Example: Testing Another App

```bash
# 1. Position simulator
bash setup-simulator.sh "iPhone 15 Pro"

# 2. Calculate your app's coordinates
# Edit get-simulator-coords.sh with your UI layout
bash get-simulator-coords.sh

# 3. Write custom test sequence
# Create my-app-test.sh based on ios-simulator-validation-test.sh

# 4. Run tests
bash my-app-test.sh
```

## Advanced Usage

### Visual Comparison

If you have ImageMagick installed, the test automatically compares screenshots:

```bash
brew install imagemagick

# Test will generate diff image
compare -metric AE \
    01-portrait-initial.png \
    06-portrait-after-rotation.png \
    09-diff.png
```

### Continuous Integration

Run tests in CI/CD:

```yaml
# .github/workflows/ios-simulator-test.yml
- name: Install cliclick
  run: brew install cliclick

- name: Run simulator tests
  run: |
    cd apps/digital-bloom
    bun run ios:simulator:test

- name: Upload screenshots
  uses: actions/upload-artifact@v3
  with:
    name: simulator-screenshots
    path: /tmp/digital-bloom-tests/
```

**Note**: CI runners need Accessibility permissions pre-configured.

### Debugging

Enable verbose output:

```bash
# Add to test script
set -x  # Print all commands

# Run with explicit logging
bash -x scripts/ios-simulator-validation-test.sh 2>&1 | tee test-debug.log
```

## Technical Details

### cliclick Commands

- `cliclick p` - Print current mouse position
- `cliclick m:x,y` - Move cursor to (x,y)
- `cliclick c:x,y` - Click at (x,y)
- `cliclick dc:x,y` - Double-click at (x,y)
- `cliclick t:"text"` - Type text

### AppleScript Integration

Window positioning uses AppleScript:

```applescript
tell application "Simulator" to activate
tell application "System Events"
    tell process "Simulator"
        set position of window 1 to {0, 24}
        set size of window 1 to {430, 900}
    end tell
end tell
```

### Rotation via Keyboard Shortcuts

Since `simctl ui orientation` was removed, we use keyboard shortcuts:

```applescript
tell application "System Events"
    tell process "Simulator"
        keystroke "left arrow" using command down  -- Rotate left
        keystroke "right arrow" using command down -- Rotate right
    end tell
end tell
```

## References

- [cliclick GitHub](https://github.com/BlueM/cliclick)
- [simctl documentation](https://developer.apple.com/documentation/xcode/simctl)
- [iOS Simulator WKWebView safe-area bug](https://github.com/ionic-team/capacitor/issues/5678)
- [Digital Bloom iOS Deployment Guide](./IOS_DEPLOYMENT.md)

## Support

For issues with this testing framework, check:

1. Prerequisites are met (cliclick installed, Accessibility permissions)
2. Simulator is running and visible
3. Window is positioned correctly (run setup script)
4. Coordinates are calculated (run coords script)

If tests fail, review screenshots in `/tmp/digital-bloom-tests/` to diagnose visual issues.
