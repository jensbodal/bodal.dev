# Digital Bloom - iOS Media Controls Testing Checklist

## Overview

This checklist validates the MediaSession plugin integration with Digital Bloom, ensuring proper metadata display and media controls functionality on iOS devices.

**Expected Behavior**: When audio is enabled, iOS media controls should display "Digital Bloom" with app branding instead of "localhost", and play/pause controls should function from lock screen and Control Center.

---

## Prerequisites

- [ ] iOS device running iOS 14.0 or later
- [ ] Digital Bloom app installed on device via `bun run ios:deploy`
- [ ] Device NOT in silent/vibrate mode (audio playback requires ringer on)
- [ ] Background Audio capability enabled in Xcode project

---

## Test Cases

### 1. Initial State (Before Audio Enabled)

**Test Steps**:
1. Launch Digital Bloom app
2. Verify app loads with muted state (default)
3. Lock device or swipe to Control Center
4. Check for media controls

**Expected Results**:
- [ ] App launches successfully with muted audio icon
- [ ] No media controls appear in lock screen
- [ ] No media controls appear in Control Center
- [ ] No "Now Playing" notification

**Status**: ❌ Pass / ❌ Fail

**Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 2. Audio Activation (Unmuting)

**Test Steps**:
1. Launch Digital Bloom app
2. Tap the unmute button (speaker icon) in the UI
3. Observe audio playback starts
4. Verify MediaSession is initialized

**Expected Results**:
- [ ] Audio begins playing (generative tones)
- [ ] Speaker icon changes to indicate unmuted state
- [ ] No console errors in Safari Web Inspector
- [ ] Media session activates (check via Web Inspector console)

**Status**: ❌ Pass / ❌ Fail

**Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 3. Lock Screen Media Controls Appearance

**Test Steps**:
1. With audio playing, lock the device (press power button)
2. Wake device to lock screen (do not unlock)
3. Examine media controls widget

**Expected Results**:
- [ ] Media controls widget appears on lock screen
- [ ] **Title**: "Digital Bloom" is displayed
- [ ] **Artist**: "Generative Audio Art" is displayed
- [ ] **Album**: "Interactive Experience" is displayed
- [ ] **Artwork**: Digital Bloom app icon is shown (NOT generic music icon)
- [ ] **NOT displaying**: "localhost", "localhost:5173", or browser tab info
- [ ] Play/pause button is visible and shows correct state (playing)

**Status**: ❌ Pass / ❌ Fail

**Screenshot/Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 4. Control Center Media Controls

**Test Steps**:
1. With audio playing and device unlocked, swipe down from top-right (iPhone X+) or swipe up from bottom (older iPhones) to open Control Center
2. Locate the media controls widget (usually top-right area)
3. Examine metadata and controls

**Expected Results**:
- [ ] Media controls widget appears in Control Center
- [ ] **Title**: "Digital Bloom"
- [ ] **Artist**: "Generative Audio Art"
- [ ] **Album**: "Interactive Experience"
- [ ] **Artwork**: Digital Bloom app icon
- [ ] **NOT displaying**: "localhost" or browser-related metadata
- [ ] Play/pause button shows correct state

**Status**: ❌ Pass / ❌ Fail

**Screenshot/Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 5. Play/Pause Functionality (Lock Screen)

**Test Steps**:
1. With audio playing, lock device
2. On lock screen, tap the **pause** button in media controls
3. Verify audio stops
4. Tap the **play** button
5. Verify audio resumes
6. Unlock device and check app state

**Expected Results**:
- [ ] Tapping pause stops audio playback
- [ ] Button icon changes from pause to play
- [ ] Tapping play resumes audio playback
- [ ] Button icon changes from play to pause
- [ ] App reflects correct muted/unmuted state when unlocked
- [ ] No audio glitches or delays

**Status**: ❌ Pass / ❌ Fail

**Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 6. Play/Pause Functionality (Control Center)

**Test Steps**:
1. With audio playing, open Control Center
2. Tap the **pause** button in media controls
3. Verify audio stops
4. Tap the **play** button
5. Verify audio resumes
6. Close Control Center and check app

**Expected Results**:
- [ ] Pause button stops audio immediately
- [ ] Play button resumes audio immediately
- [ ] Button states update correctly
- [ ] App UI reflects muted/unmuted state accurately
- [ ] No visual glitches in app when toggling from Control Center

**Status**: ❌ Pass / ❌ Fail

**Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 7. Metadata Display Verification

**Test Steps**:
1. With audio playing, check all media control surfaces:
   - Lock screen
   - Control Center
   - Connected Bluetooth devices (if available)
   - CarPlay (if available)
2. Take screenshots of each

**Expected Results**:
- [ ] **Title**: "Digital Bloom" (consistent across all surfaces)
- [ ] **Artist**: "Generative Audio Art" (consistent)
- [ ] **Album**: "Interactive Experience" (consistent)
- [ ] **Artwork**: Digital Bloom app icon (NOT placeholder or generic icon)
- [ ] **Duration**: Not displayed (live audio stream)
- [ ] **Scrubber**: Not displayed (live audio stream)

**Status**: ❌ Pass / ❌ Fail

**Screenshots**:
```
Lock Screen: _______________________________
Control Center: ____________________________
Bluetooth Device: __________________________
CarPlay: ___________________________________
```

---

### 8. Background Audio Behavior

**Test Steps**:
1. With audio playing, press home button to return to home screen
2. Wait 10 seconds
3. Lock device
4. Wait 30 seconds
5. Check if audio is still playing
6. Open another app (e.g., Safari, Messages)
7. Verify audio continues

**Expected Results**:
- [ ] Audio continues playing when app is backgrounded
- [ ] Audio continues playing when device is locked
- [ ] Media controls remain functional while backgrounded
- [ ] Audio continues when switching to other apps
- [ ] No audio interruptions or gaps
- [ ] App maintains playback session without timeouts

**Status**: ❌ Pass / ❌ Fail

**Notes**:
```
_____________________________________________
_____________________________________________
```

---

### 9. App Icon vs "localhost" Verification

**Critical Test**: This is the primary goal of the MediaSession integration.

**Test Steps**:
1. Launch Digital Bloom app
2. Enable audio (unmute)
3. Lock device immediately
4. Examine lock screen media controls
5. Check artwork section specifically

**Expected Results**:
- [ ] **PASS**: Digital Bloom app icon is displayed as artwork
- [ ] **FAIL**: "localhost" text appears
- [ ] **FAIL**: Generic music/browser icon appears
- [ ] **FAIL**: Blank artwork section
- [ ] **PASS**: Title reads "Digital Bloom" (not "localhost:5173" or URL)

**Status**: ❌ Pass / ❌ Fail

**If FAILED, see Troubleshooting Section**

**Screenshot**:
```
_____________________________________________
_____________________________________________
```

---

### 10. Edge Cases and Stress Tests

#### 10.1 Rapid Mute/Unmute Toggling

**Test Steps**:
1. Rapidly toggle mute/unmute 10 times in quick succession
2. Check media controls state
3. Verify no crashes or UI glitches

**Expected Results**:
- [ ] App handles rapid toggling without crashes
- [ ] Media controls update correctly
- [ ] Final state matches app UI state
- [ ] No audio glitches or stuck playback

**Status**: ❌ Pass / ❌ Fail

---

#### 10.2 Incoming Call Interruption

**Test Steps**:
1. Start audio playback
2. Receive or make a phone call
3. End call
4. Check if audio resumes

**Expected Results**:
- [ ] Audio pauses during call
- [ ] Media controls reflect paused state
- [ ] Audio does NOT automatically resume after call (expected behavior)
- [ ] User can manually resume via media controls or app

**Status**: ❌ Pass / ❌ Fail

---

#### 10.3 System Audio Interruption (e.g., Siri)

**Test Steps**:
1. Start audio playback
2. Activate Siri ("Hey Siri" or hold home button)
3. Dismiss Siri
4. Check audio state

**Expected Results**:
- [ ] Audio pauses during Siri
- [ ] Audio does NOT automatically resume after Siri
- [ ] Media controls remain functional
- [ ] User can resume playback

**Status**: ❌ Pass / ❌ Fail

---

#### 10.4 App Termination and Restart

**Test Steps**:
1. Start audio playback
2. Force-quit app (swipe up in app switcher)
3. Relaunch app
4. Check media controls state

**Expected Results**:
- [ ] Media controls disappear after app termination
- [ ] App relaunches in muted state (default)
- [ ] No stale media controls or zombie sessions
- [ ] Fresh MediaSession is created when audio is re-enabled

**Status**: ❌ Pass / ❌ Fail

---

## Troubleshooting

### Issue: "localhost" still appears in media controls

**Possible Causes**:
1. **MediaSession not initialized**: Check Safari Web Inspector console for errors
2. **Metadata not set early enough**: Ensure `updateMetadata()` is called immediately after enabling audio
3. **Capacitor plugin not registered**: Verify `capacitor.config.ts` includes MediaSession plugin
4. **iOS cache**: Old metadata may be cached by the OS

**Solutions**:
- [ ] Rebuild and redeploy app: `bun run ios:deploy`
- [ ] Check `src/audio-manager.ts` for MediaSession initialization
- [ ] Verify `Plugins.MediaSession` is imported and used
- [ ] Restart device to clear iOS media cache
- [ ] Check Xcode console for native plugin errors

---

### Issue: Media controls don't appear at all

**Possible Causes**:
1. **Background Audio capability missing**: Check Xcode project settings
2. **Audio not actually playing**: Verify Tone.js context is running
3. **Silent mode enabled**: Device ringer must be on for audio playback
4. **iOS permissions**: Media controls require active audio session

**Solutions**:
- [ ] Open Xcode: `bun run digital-bloom:ios:open`
- [ ] Navigate to: App Target → Signing & Capabilities
- [ ] Verify "Background Modes" capability is enabled
- [ ] Ensure "Audio, AirPlay, and Picture in Picture" is checked
- [ ] Rebuild app after capability changes
- [ ] Turn off silent mode on device
- [ ] Check that audio is audible (not just silent audio stream)

---

### Issue: Play/pause buttons don't work

**Possible Causes**:
1. **Action handlers not registered**: MediaSession requires explicit action handlers
2. **Audio context suspended**: Tone.js context may be in suspended state
3. **Plugin communication failure**: Capacitor bridge may not be forwarding events

**Solutions**:
- [ ] Check `src/audio-manager.ts` for `setActionHandler` calls
- [ ] Verify `handlePlay()` and `handlePause()` methods exist
- [ ] Add console.log statements to action handlers for debugging
- [ ] Check Safari Web Inspector for JavaScript errors
- [ ] Test direct mute/unmute in app UI first
- [ ] Review Capacitor plugin documentation for MediaSession

---

### Issue: Artwork not displaying (generic icon shown)

**Possible Causes**:
1. **Artwork URL incorrect**: iOS requires absolute HTTP/HTTPS URL or data URI
2. **Icon file missing**: App icon may not be properly bundled
3. **iOS icon cache**: Old icon may be cached

**Solutions**:
- [ ] Verify artwork URL in `updateMetadata()` call
- [ ] Check that `public/icon.png` exists
- [ ] Regenerate iOS icons: `bun run ios:icons`
- [ ] Ensure icon URL is absolute, not relative
- [ ] Use 512x512 PNG for best quality
- [ ] Consider using data URI instead of URL reference

---

### Issue: Audio stops when app is backgrounded

**Possible Causes**:
1. **Background Audio capability not enabled**: Most common issue
2. **Audio session category incorrect**: iOS requires specific audio session configuration
3. **Capacitor background settings**: May need additional configuration

**Solutions**:
- [ ] Enable Background Modes in Xcode (see "Media controls don't appear" section)
- [ ] Check `Info.plist` for `UIBackgroundModes` key with `audio` value
- [ ] Verify Capacitor.config.ts iOS-specific settings
- [ ] Test with device plugged in (debugging restrictions may apply)
- [ ] Check iOS console logs for background task warnings

---

## Debugging Tools

### Safari Web Inspector (JavaScript Console)

**Setup**:
1. Connect iOS device to Mac via USB
2. On device: Settings → Safari → Advanced → Enable "Web Inspector"
3. On Mac: Safari → Develop → [Your Device] → [Digital Bloom]
4. Open Console tab

**Useful Console Commands**:
```javascript
// Check if MediaSession is available
console.log('MediaSession available:', 'mediaSession' in navigator);

// Check current metadata
console.log('Current metadata:', navigator.mediaSession.metadata);

// Check playback state
console.log('Playback state:', navigator.mediaSession.playbackState);

// Check if Capacitor plugin is loaded
console.log('MediaSession plugin:', Capacitor.Plugins.MediaSession);
```

---

### Xcode Console (Native Logs)

**Setup**:
1. Open Xcode
2. Window → Devices and Simulators
3. Select your connected device
4. Click "View Device Logs"

**Look for**:
- MediaSession plugin registration logs
- Audio session errors
- Background mode warnings
- Capacitor bridge communication

---

## Test Results Summary

**Date**: _______________
**Tester**: _______________
**Device**: _______________
**iOS Version**: _______________
**App Version**: _______________

**Overall Results**:
- Total Tests: 10 core + 4 edge cases = 14
- Passed: _____ / 14
- Failed: _____ / 14
- Pass Rate: _____%

**Critical Test (App Icon vs localhost)**:
- [ ] ✅ PASS - Digital Bloom branding displayed correctly
- [ ] ❌ FAIL - "localhost" or generic icon still appearing

**Recommendation**:
- [ ] ✅ Ready for production
- [ ] ⚠️ Minor issues, acceptable for release
- [ ] ❌ Blocking issues, requires fixes before release

**Notes**:
```
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## Next Steps

### If All Tests Pass:
1. [ ] Update app version: `bun run version:patch`
2. [ ] Commit changes with descriptive message
3. [ ] Create release build for TestFlight/App Store
4. [ ] Update documentation with media controls feature

### If Tests Fail:
1. [ ] Document specific failures in this checklist
2. [ ] Review Troubleshooting section
3. [ ] Check Safari Web Inspector and Xcode console logs
4. [ ] File issues in project tracker with screenshots
5. [ ] Iterate on fixes and re-test

---

## Additional Resources

- **Capacitor MediaSession Plugin**: [Documentation](https://capacitorjs.com/docs/apis/mediasession)
- **Web MediaSession API**: [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)
- **iOS Background Audio**: [Apple Developer Docs](https://developer.apple.com/documentation/avfoundation/media_playback_and_selection/creating_a_basic_video_player_ios_and_tvos/enabling_background_audio)
- **Digital Bloom Audio Manager**: `apps/digital-bloom/src/audio-manager.ts`

---

**Version**: 1.0.0
**Last Updated**: 2025-10-24
