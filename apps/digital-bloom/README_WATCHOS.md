# Digital Bloom watchOS - Quick Start

## ⚡ TL;DR - Deploy to Your Watch in 3 Steps

### 1. Enable Developer Mode (ONE TIME - 2 min)
On Apple Watch (baw_9):
- Settings → Privacy & Security → Developer Mode → **ON**
- Watch will restart

### 2. Run from Xcode (1 min)
```bash
open ios/App/App.xcworkspace
```
- Select **"App"** scheme
- Select **"zojak-16m"** device  
- Click **Run** (⌘R)

### 3. Automatic Installation ✨
- iOS app → Installs on iPhone
- Watch app → **Automatically** installs on Watch (embedded!)
- Both apps launch and are ready to use

**That's it!** The companion app embedding handles everything.

---

## 🎮 Using the Watch App

**Tap screen** → Creates particles
**Rotate Digital Crown** → Cycles through 7 modes:
1. Vine
2. Gravity  
3. Bounce
4. Burst
5. Lightning
6. Constellation
7. Vortex

**Display shows:**
- Current mode name
- Active particle count

---

## 📦 For TestFlight Distribution

```bash
# In Xcode:
1. Product → Archive
2. Organizer → Distribute App
3. Choose "TestFlight & App Store"

# Result:
✅ iOS app uploaded
✅ Watch app automatically bundled (embedded)
✅ Testers install via TestFlight app
✅ No Developer Mode required for testers!
```

---

## 📋 Technical Details

**Version:** 1.0.0 (Build 5)

**watchOS App:**
- Architecture: arm64 only
- Deployment: watchOS 9.0+
- Compatibility: Apple Watch Series 4+
- Bundle: com.breakevenllc.digitalbloom.watchkitapp
- Size: 465KB
- Physics: Rust FFI (100% code reuse from iOS)

**Supported Devices:**
- ✅ Series 9 (baw_9) - Your watch!
- ✅ Series 8 (baw_8) - Your other watch!
- ✅ Series 7, 6, 5, 4
- ✅ SE (2nd gen)
- ✅ Ultra 1 & 2

**Not Supported:**
- ❌ Series 3 and earlier (arm64_32 only, Rust limitation)

---

## 🔧 Build Commands (If Needed)

**Build watchOS app:**
```bash
xcodebuild -project ios/App/App.xcodeproj \
  -target "Digital Bloom Watch Watch App" \
  -sdk watchos \
  -configuration Release \
  -arch arm64 \
  clean build
```

**Install directly (after Developer Mode enabled):**
```bash
xcrun devicectl device install app \
  --device E4F8C12D-71A2-5FC0-A4C7-61CA20BD37E0 \
  "ios/App/build/Release-watchos/Digital Bloom Watch Watch App.app"
```

---

## 📚 Documentation

- `WATCHOS_IMPLEMENTATION.md` - Full technical analysis
- `DEVICE_DEPLOYMENT.md` - Deployment guide
- `WATCHOS_PROGRESS.md` - Build status

---

## ❓ Troubleshooting

**"Developer Mode disabled" error:**
- → Enable on watch: Settings → Privacy & Security → Developer Mode
- → **If Developer Mode option doesn't appear:**
  1. Connect iPhone to Mac via USB cable
  2. In Xcode: **Window → Devices and Simulators** (⌘⇧2)
  3. **Important:** Go to **Window → Devices → Run Diagnostics** menu
  4. This triggers the Developer Mode flow on the watch
  5. Trust the computer prompt on both iPhone and Watch
  6. Now Settings → Privacy & Security → Developer Mode should appear
  7. Toggle ON and restart watch

**Provisioning profile error (0xe8008012):**
- → In Xcode, go to **Window → Devices → Run Diagnostics** to trigger device registration
- → Alternatively, add device manually at https://developer.apple.com/account/resources/devices/list
- → Rebuild with **-allowProvisioningUpdates** flag

**Watch app doesn't install:**
- → Make sure you run the **iOS app** (scheme: "App", not "Digital Bloom Watch Watch App")
- → The companion app embedding handles installation automatically
- → Check Watch app on iPhone to toggle "Show App on Apple Watch"

**Build errors:**
- → Check `WATCHOS_IMPLEMENTATION.md` for detailed fixes
- → All current issues resolved, build works!

---

**Made with ❤️ using Rust + SwiftUI**
