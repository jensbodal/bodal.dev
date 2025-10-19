#!/bin/bash

# iOS & watchOS Icon Generator
# Generates all required iOS and watchOS app icon sizes from a source image
# Requires ImageMagick: brew install imagemagick

set -e

SOURCE_IMAGE="${1:-public/icon-512.svg}"
IOS_OUTPUT_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
WATCH_OUTPUT_DIR="ios/App/Digital Bloom Watch Watch App/Assets.xcassets/AppIcon.appiconset"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image not found at $SOURCE_IMAGE"
    echo "Usage: $0 [source-image-path]"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick not found. Install with: brew install imagemagick"
    exit 1
fi

echo "Generating iOS & watchOS icons from $SOURCE_IMAGE..."

# Create output directories
mkdir -p "$IOS_OUTPUT_DIR"
mkdir -p "$WATCH_OUTPUT_DIR"

# Clean up any existing icons to avoid orphaned files
rm -f "$IOS_OUTPUT_DIR"/*.png
rm -f "$WATCH_OUTPUT_DIR"/*.png

# Icon sizes (size@scale)
# Force RGB colorspace for all conversions
MAGICK_OPTS="-colorspace sRGB -type TrueColorAlpha"

echo "📱 Generating iOS icons..."

# iPhone
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 40x40 "$IOS_OUTPUT_DIR/icon-20@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 60x60 "$IOS_OUTPUT_DIR/icon-20@3x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 58x58 "$IOS_OUTPUT_DIR/icon-29@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 87x87 "$IOS_OUTPUT_DIR/icon-29@3x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 80x80 "$IOS_OUTPUT_DIR/icon-40@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 120x120 "$IOS_OUTPUT_DIR/icon-40@3x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 120x120 "$IOS_OUTPUT_DIR/icon-60@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 180x180 "$IOS_OUTPUT_DIR/icon-60@3x.png"

# iPad
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 20x20 "$IOS_OUTPUT_DIR/icon-20.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 29x29 "$IOS_OUTPUT_DIR/icon-29.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 40x40 "$IOS_OUTPUT_DIR/icon-40.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 76x76 "$IOS_OUTPUT_DIR/icon-76.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 152x152 "$IOS_OUTPUT_DIR/icon-76@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 167x167 "$IOS_OUTPUT_DIR/icon-83.5@2x.png"

# App Store
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 1024x1024 "$IOS_OUTPUT_DIR/icon-1024.png"

echo "⌚ Generating watchOS icons..."

# watchOS App Store
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 1024x1024 "$WATCH_OUTPUT_DIR/watch-icon-1024.png"

# Create iOS Contents.json
echo "📝 Creating iOS Contents.json..."
cat > "$IOS_OUTPUT_DIR/Contents.json" << 'EOF'
{
  "images": [
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "icon-20@2x.png",
      "scale": "2x"
    },
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "icon-20@3x.png",
      "scale": "3x"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "filename": "icon-29@2x.png",
      "scale": "2x"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "filename": "icon-29@3x.png",
      "scale": "3x"
    },
    {
      "size": "40x40",
      "idiom": "iphone",
      "filename": "icon-40@2x.png",
      "scale": "2x"
    },
    {
      "size": "40x40",
      "idiom": "iphone",
      "filename": "icon-40@3x.png",
      "scale": "3x"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "filename": "icon-60@2x.png",
      "scale": "2x"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "filename": "icon-60@3x.png",
      "scale": "3x"
    },
    {
      "size": "20x20",
      "idiom": "ipad",
      "filename": "icon-20.png",
      "scale": "1x"
    },
    {
      "size": "20x20",
      "idiom": "ipad",
      "filename": "icon-20@2x.png",
      "scale": "2x"
    },
    {
      "size": "29x29",
      "idiom": "ipad",
      "filename": "icon-29.png",
      "scale": "1x"
    },
    {
      "size": "29x29",
      "idiom": "ipad",
      "filename": "icon-29@2x.png",
      "scale": "2x"
    },
    {
      "size": "40x40",
      "idiom": "ipad",
      "filename": "icon-40.png",
      "scale": "1x"
    },
    {
      "size": "40x40",
      "idiom": "ipad",
      "filename": "icon-40@2x.png",
      "scale": "2x"
    },
    {
      "size": "76x76",
      "idiom": "ipad",
      "filename": "icon-76.png",
      "scale": "1x"
    },
    {
      "size": "76x76",
      "idiom": "ipad",
      "filename": "icon-76@2x.png",
      "scale": "2x"
    },
    {
      "size": "83.5x83.5",
      "idiom": "ipad",
      "filename": "icon-83.5@2x.png",
      "scale": "2x"
    },
    {
      "size": "1024x1024",
      "idiom": "ios-marketing",
      "filename": "icon-1024.png",
      "scale": "1x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
EOF

# Create watchOS Contents.json
echo "📝 Creating watchOS Contents.json..."
cat > "$WATCH_OUTPUT_DIR/Contents.json" << 'EOF'
{
  "images" : [
    {
      "filename" : "watch-icon-1024.png",
      "idiom" : "universal",
      "platform" : "watchos",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo ""
echo "✅ iOS icons generated successfully in $IOS_OUTPUT_DIR"
echo "✅ watchOS icons generated successfully in $WATCH_OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x scripts/generate-ios-icons.sh"
echo "2. If you don't have ImageMagick: brew install imagemagick"
echo "3. Run: ./scripts/generate-ios-icons.sh"
echo "4. Open Xcode: npx cap open ios"
echo ""
echo "📊 Icon Summary:"
echo "  📱 iOS:     16 icons (iPhone, iPad, App Store)"
echo "  ⌚ watchOS:  1 icon (App Store 1024x1024)"