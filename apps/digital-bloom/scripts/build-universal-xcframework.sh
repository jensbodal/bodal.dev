#!/bin/bash

# Digital Bloom - Universal iOS + watchOS Build Script
# Builds Rust FFI library for ALL platforms: iOS, watchOS, and simulators

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FFI_CRATE="$PROJECT_ROOT/crates/digital-bloom-ffi"
OUTPUT_DIR="$PROJECT_ROOT/ios/Frameworks"

echo "🛠️  Building Digital Bloom for iOS + watchOS..."
echo ""
echo "Target Platforms:"
echo "  📱 iOS Devices (arm64)"
echo "  💻 iOS Simulators (arm64 + x86_64)"
echo "  ⌚ watchOS Devices (arm64 + arm64_32 universal)"
echo "  🖥️  watchOS Simulators (arm64 + x86_64)"
echo ""

# CRITICAL: Use pre-regression nightly for arm64_32
# Rust issue #147776: nightly after Oct 15, 2025 breaks arm64_32 std build
# Solution: Use nightly-2025-10-01 which works perfectly
WORKING_NIGHTLY="nightly-2025-10-01"

# Check if working nightly is installed
if ! rustup toolchain list | grep -q "$WORKING_NIGHTLY"; then
    echo "📦 Installing $WORKING_NIGHTLY..."
    rustup toolchain install "${WORKING_NIGHTLY}-aarch64-apple-darwin"
    rustup component add rust-src --toolchain "${WORKING_NIGHTLY}-aarch64-apple-darwin"
fi

# Create output directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$FFI_CRATE/build/ios"
mkdir -p "$FFI_CRATE/build/watchos"

cd "$FFI_CRATE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Building for iOS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build iOS device (arm64)
echo "📱 Building for iOS device (arm64)..."
cargo +nightly build \
    -Zbuild-std=std,panic_abort \
    --target aarch64-apple-ios \
    --release

IOS_ARM64_SIZE=$(ls -lh target/aarch64-apple-ios/release/libdigital_bloom_ffi.a | awk '{print $5}')
echo "  ✅ Built iOS arm64: $IOS_ARM64_SIZE"

# Build iOS simulators
echo ""
echo "💻 Building for iOS Simulators..."
cargo +nightly build \
    -Zbuild-std=std,panic_abort \
    --target x86_64-apple-ios \
    --release

cargo +nightly build \
    -Zbuild-std=std,panic_abort \
    --target aarch64-apple-ios-sim \
    --release

echo "  ✅ Built iOS simulators"

# Create universal iOS simulator library
lipo -create \
    target/x86_64-apple-ios/release/libdigital_bloom_ffi.a \
    target/aarch64-apple-ios-sim/release/libdigital_bloom_ffi.a \
    -output build/ios/libdigital_bloom_ffi_sim.a

IOS_SIM_SIZE=$(ls -lh build/ios/libdigital_bloom_ffi_sim.a | awk '{print $5}')
echo "  ✅ Universal iOS simulator library: $IOS_SIM_SIZE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⌚ Building for watchOS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build arm64_32 for Series 4-8
echo "⌚ Building for arm64_32 (Series 4-8, SE, Ultra 1)..."
cargo "+$WORKING_NIGHTLY" build \
    -Zbuild-std=std,panic_abort \
    --target arm64_32-apple-watchos \
    --release

ARM64_32_SIZE=$(ls -lh target/arm64_32-apple-watchos/release/libdigital_bloom_ffi.a | awk '{print $5}')
echo "  ✅ Built arm64_32: $ARM64_32_SIZE"

# Build arm64 for Series 9+
echo ""
echo "⌚ Building for arm64 (Series 9+, watchOS 26+)..."
cargo +nightly build \
    -Zbuild-std=std,panic_abort \
    --target aarch64-apple-watchos \
    --release

ARM64_SIZE=$(ls -lh target/aarch64-apple-watchos/release/libdigital_bloom_ffi.a | awk '{print $5}')
echo "  ✅ Built arm64: $ARM64_SIZE"

# Build watchOS simulators
echo ""
echo "🖥️  Building for watchOS Simulators..."
cargo +nightly build \
    -Zbuild-std=std,panic_abort \
    --target x86_64-apple-watchos-sim \
    --release

cargo +nightly build \
    -Zbuild-std=std,panic_abort \
    --target aarch64-apple-watchos-sim \
    --release

echo "  ✅ Built watchOS simulators"

# Create universal watchOS device library (arm64_32 + arm64)
echo ""
echo "🔗 Creating universal libraries..."
lipo -create \
    target/arm64_32-apple-watchos/release/libdigital_bloom_ffi.a \
    target/aarch64-apple-watchos/release/libdigital_bloom_ffi.a \
    -output build/watchos/libdigital_bloom_ffi_device.a

WATCHOS_DEVICE_SIZE=$(ls -lh build/watchos/libdigital_bloom_ffi_device.a | awk '{print $5}')
echo "  ✅ Universal watchOS device library: $WATCHOS_DEVICE_SIZE"

# Create universal watchOS simulator library
lipo -create \
    target/x86_64-apple-watchos-sim/release/libdigital_bloom_ffi.a \
    target/aarch64-apple-watchos-sim/release/libdigital_bloom_ffi.a \
    -output build/watchos/libdigital_bloom_ffi_sim.a

WATCHOS_SIM_SIZE=$(ls -lh build/watchos/libdigital_bloom_ffi_sim.a | awk '{print $5}')
echo "  ✅ Universal watchOS simulator library: $WATCHOS_SIM_SIZE"

# Verify architectures
echo ""
echo "🔍 Verifying architecture support..."
echo ""
echo "iOS Device:"
lipo -info target/aarch64-apple-ios/release/libdigital_bloom_ffi.a
echo ""
echo "iOS Simulator:"
lipo -detailed_info build/ios/libdigital_bloom_ffi_sim.a
echo ""
echo "watchOS Device (Universal):"
lipo -detailed_info build/watchos/libdigital_bloom_ffi_device.a
echo ""
echo "watchOS Simulator:"
lipo -detailed_info build/watchos/libdigital_bloom_ffi_sim.a

# Create XCFramework with ALL platforms
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Creating Universal XCFramework..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf "$OUTPUT_DIR/DigitalBloomFFI.xcframework"

xcodebuild -create-xcframework \
    -library target/aarch64-apple-ios/release/libdigital_bloom_ffi.a \
    -headers include \
    -library build/ios/libdigital_bloom_ffi_sim.a \
    -headers include \
    -library build/watchos/libdigital_bloom_ffi_device.a \
    -headers include \
    -library build/watchos/libdigital_bloom_ffi_sim.a \
    -headers include \
    -output "$OUTPUT_DIR/DigitalBloomFFI.xcframework"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ✅ ✅ BUILD SUCCESS! ✅ ✅ ✅"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 XCFramework: $OUTPUT_DIR/DigitalBloomFFI.xcframework"
echo ""
echo "🎯 Supported Platforms:"
echo ""
echo "📱 iOS:"
echo "   ✅ iPhone (arm64)"
echo "   ✅ iOS Simulator (x86_64 + arm64)"
echo ""
echo "⌚ watchOS:"
echo "   ✅ Apple Watch Series 4-8 (arm64_32)"
echo "   ✅ Apple Watch SE 1st & 2nd gen (arm64_32)"
echo "   ✅ Apple Watch Ultra 1st gen (arm64_32)"
echo "   ✅ Apple Watch Series 9-10 (arm64)"
echo "   ✅ Apple Watch Ultra 2 (arm64)"
echo "   ✅ watchOS Simulator (x86_64 + arm64)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open ios/App/App.xcworkspace in Xcode"
echo "   2. Build and run (⌘R)"
echo "   3. Deploy to iPhone + Apple Watch!"
echo ""
