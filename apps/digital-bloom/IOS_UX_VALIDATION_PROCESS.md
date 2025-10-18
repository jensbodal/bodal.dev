# iOS UX Validation Process

## Overview
This document describes the validation process for UX changes in the Digital Bloom iOS app, ensuring proper behavior across device orientations.

## When to Use This Process
- UI element positioning changes (toolbar, buttons, icons, etc.)
- Orientation-specific CSS modifications
- Safe area inset adjustments
- Any visual changes that may behave differently in portrait vs landscape

## Validation Steps

### 1. Automated Simulator Testing
Before deploying to a physical device, use the iOS Simulator validation test to capture screenshots:

```bash
cd apps/digital-bloom
./scripts/ios-simulator-validation-test.sh
```

**What it validates:**
- Initial portrait mode layout
- Mode button interactions (Gravity, Bounce, etc.)
- Landscape rotation behavior
- Portrait mode after rotation (to detect sticky positioning bugs)
- UI element overlap detection

**Screenshot output:** `/tmp/digital-bloom-tests/`

### 2. Screenshot Analysis
Review captured screenshots for:
- Settings icon position in both orientations
- Toolbar positioning across orientations
- Bottom bar visibility and overlap
- Safe area inset handling (home indicator space)

**Key measurements:**
- **Bottom bar height**: ~80-100px
- **Safe area inset (portrait)**: ~34px (iPhone home indicator)
- **Safe area inset (landscape)**: 0px
- **Minimum clearance for settings icon**: 120px from bottom in landscape

### 3. CSS Positioning Guidelines

#### Settings Icon
```css
/* Portrait mode */
@media (orientation: portrait) {
    #settingsCog {
        bottom: calc(6rem + env(safe-area-inset-bottom, 34px)) !important;
    }
}

/* Landscape mode */
@media (orientation: landscape) and (max-height: 500px) {
    #settingsCog {
        bottom: 7.5rem !important; /* ~120px to clear bottom bar */
    }
}
```

**Rationale:**
- Portrait: 6rem (~96px) + safe area keeps icon well above bottom bar
- Landscape: 7.5rem (~120px) provides clearance for bottom bar (~80-100px)

#### Toolbar
```css
/* Portrait mode */
@media (orientation: portrait) {
    #toolbar-container {
        padding-top: calc(0.5rem + env(safe-area-inset-top)) !important;
    }
}

/* Landscape mode */
@media (orientation: landscape) and (max-height: 500px) {
    #toolbar-container {
        padding-top: calc(0.25rem + env(safe-area-inset-top)) !important;
    }
}
```

### 4. Physical Device Testing
After simulator validation, deploy to a physical device for real-world testing:

```bash
cd apps/digital-bloom
bun run ios:deploy
```

**Manual testing checklist:**
- [ ] Portrait mode: Settings icon visible, proper spacing from bottom
- [ ] Landscape mode: Settings icon doesn't overlap bottom bar
- [ ] Rotation: Portrait → Landscape → Portrait (verify no sticky positioning)
- [ ] Bottom bar: Open/close doesn't cause icon overlap
- [ ] Settings icon: Fade behavior works (opacity: 0.3 when bottom bar open)
- [ ] Toolbar: Proper spacing from top in both orientations

### 5. Common Issues and Fixes

#### Issue: Settings icon overlaps bottom bar in landscape
**Symptoms:** Icon positioned at 4rem (~64px) overlaps with 80-100px bottom bar

**Fix:** Increase landscape bottom spacing to 7.5rem (~120px)
```css
@media (orientation: landscape) and (max-height: 500px) {
    #settingsCog {
        bottom: 7.5rem !important;
    }
}
```

#### Issue: Toolbar offset bug after rotation
**Symptoms:** Toolbar padding sticks at landscape value when returning to portrait

**Fix:** Use explicit `!important` overrides in media queries
```css
@media (orientation: portrait) {
    #toolbar-container {
        padding-top: calc(0.5rem + env(safe-area-inset-top)) !important;
    }
}
```

**Root cause:** iOS WKWebView doesn't properly update `env(safe-area-inset-*)` values during orientation changes. Explicit media query overrides force correct positioning.

#### Issue: Safe area insets not updating
**Symptoms:** UI elements positioned incorrectly after rotation

**Investigation steps:**
1. Check Capacitor configuration (`capacitor.config.ts`)
2. Verify `contentInset: 'automatic'` is removed
3. Add explicit media query overrides with `!important`
4. Test with simulator validation script

## Memory Updates
After completing UX validation:

1. **Document measurements**: Update this file with any new spacing values discovered
2. **Screenshot archive**: Keep successful validation screenshots in `/tmp/digital-bloom-tests/`
3. **Git commit**: Include validation steps and reasoning in commit message
4. **CLAUDE.md updates**: Add new patterns to project-specific instructions if needed

## Automation Improvements
Future enhancements to validation process:
- [ ] Automated visual diff comparison between screenshots
- [ ] Landscape screenshot capture (currently fails due to simulator backgrounding)
- [ ] Integration with CI/CD for automated UX regression testing
- [ ] Measurement validation (assert bottom bar height, safe areas, etc.)

## Device-Specific Notes

### iPhone 16 Pro (Simulator)
- Screen size: 430x900 (portrait), 900x430 (landscape)
- Safe area top: varies with Dynamic Island
- Safe area bottom: 34px (portrait), 0px (landscape)

### Testing Devices
- **Primary**: zojak-16m (physical iPhone)
- **Simulator**: iPhone 16 Pro (iOS 18.0)

## Last Updated
2025-10-17 - Settings icon landscape overlap fix (7.5rem spacing)
