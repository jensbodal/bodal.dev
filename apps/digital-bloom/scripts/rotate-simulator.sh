#!/bin/bash
# Rotate iOS Simulator device
# Usage: ./rotate-simulator.sh [left|right|portrait|landscape]

set -e

DIRECTION="${1:-portrait}"

# Map direction to keyboard shortcuts
# Cmd+Left = rotate left (portrait -> landscape left)
# Cmd+Right = rotate right (portrait -> landscape right)
# Note: Multiple rotations may be needed to reach desired orientation

case "$DIRECTION" in
    "left"|"landscape-left"|"landscape")
        KEYSTROKE="left arrow"
        ;;
    "right"|"landscape-right")
        KEYSTROKE="right arrow"
        ;;
    "portrait")
        # Portrait is default - we'll try to reset by rotating multiple times
        # This is a limitation of the keyboard shortcut approach
        echo "Rotating to portrait orientation..."
        osascript <<'APPLESCRIPT'
tell application "Simulator" to activate
tell application "System Events"
    tell process "Simulator"
        -- Try rotating left twice to get back to portrait (if in landscape)
        keystroke (ASCII character 28) using command down
        delay 0.5
        keystroke (ASCII character 28) using command down
        delay 0.5
    end tell
end tell
APPLESCRIPT
        exit 0
        ;;
    *)
        echo "Unknown direction: $DIRECTION"
        echo "Usage: $0 [left|right|portrait|landscape]"
        exit 1
        ;;
esac

# Rotate using keyboard shortcut
osascript <<APPLESCRIPT
tell application "Simulator" to activate
tell application "System Events"
    tell process "Simulator"
        keystroke "$KEYSTROKE" using command down
        delay 0.5
    end tell
end tell
APPLESCRIPT

echo "Rotated simulator $DIRECTION"
