#!/bin/bash

# iOS Icon Generator
# Generates all required iOS app icon sizes from a source image
# Requires ImageMagick: brew install imagemagick

set -e

SOURCE_IMAGE="${1:-public/icon-512.svg}"
OUTPUT_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

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

echo "Generating iOS icons from $SOURCE_IMAGE..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clean up any existing icons to avoid orphaned files
rm -f "$OUTPUT_DIR"/*.png

# iOS icon sizes (size@scale)
# Force RGB colorspace for all conversions
MAGICK_OPTS="-colorspace sRGB -type TrueColorAlpha"

# iPhone
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 40x40 "$OUTPUT_DIR/icon-20@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 60x60 "$OUTPUT_DIR/icon-20@3x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 58x58 "$OUTPUT_DIR/icon-29@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 87x87 "$OUTPUT_DIR/icon-29@3x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 80x80 "$OUTPUT_DIR/icon-40@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 120x120 "$OUTPUT_DIR/icon-40@3x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 120x120 "$OUTPUT_DIR/icon-60@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 180x180 "$OUTPUT_DIR/icon-60@3x.png"

# iPad
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 20x20 "$OUTPUT_DIR/icon-20.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 29x29 "$OUTPUT_DIR/icon-29.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 40x40 "$OUTPUT_DIR/icon-40.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 76x76 "$OUTPUT_DIR/icon-76.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 152x152 "$OUTPUT_DIR/icon-76@2x.png"
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 167x167 "$OUTPUT_DIR/icon-83.5@2x.png"

# App Store
magick "$SOURCE_IMAGE" $MAGICK_OPTS -resize 1024x1024 "$OUTPUT_DIR/icon-1024.png"

# Create Contents.json
cat > "$OUTPUT_DIR/Contents.json" << 'EOF'
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

echo "✓ iOS icons generated successfully in $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x scripts/generate-ios-icons.sh"
echo "2. If you don't have ImageMagick: brew install imagemagick"
echo "3. Run: ./scripts/generate-ios-icons.sh"
echo "4. Open Xcode: npx cap open ios"