# Digital Bloom - Orientation Touch Event Debugging Plan

## Problem
- Landscape mode: Works initially, but after rotation becomes janky/slow
- Portrait mode: Buttons not clickable after rotating from landscape

## Architecture Analysis

### Z-Index Stack
```
z-50: Settings cog, Audio feedback
z-40: Bottom bar
z-30: Physics indicator
z-20: Intro overlay
z-10: Toolbar container
z-1:  Canvas
```

### Pointer Events Flow
```
#toolbar-container: pointer-events-none (lets canvas receive touch)
  └─ #modeSelector: pointer-events-auto (enables button area)
      └─ .mode-button: touch-action-manipulation (prevents 300ms delay)
          └─ SVG/span children: inherits pointer-events
```

### Touch Event Handling
```
1. Canvas has touchstart/move/end listeners with {passive: false}
2. Buttons have click event listeners
3. JavaScript checks e.target === canvas before preventDefault()
```

## Potential Issues

### Issue 1: SVG Event Target
When touching a button, `e.target` might be:
- `<svg>` element
- `<path>` element
- `<span class="text-label">` element
- NOT the `<button>` element

### Issue 2: iOS Viewport During Rotation
iOS recalculates viewport and safe areas during orientation change, which can cause:
- Hit test failures
- Layout thrashing
- Event listener confusion

### Issue 3: Canvas Resize Timing
The `resizeCanvas()` function runs on window resize, which:
- Modifies canvas.width/height
- Triggers style recalculation
- Might conflict with touch event propagation

### Issue 4: Click vs Touch Events
Buttons use `click` events which:
- Have 300ms delay on iOS (even with touch-action)
- Don't work well during rapid orientation changes
- Might not fire if view is transforming

## Proposed Solutions

### Solution 1: Pointer-Events on SVG Children
```css
.mode-button svg,
.mode-button span {
    pointer-events: none; /* Let button receive events */
}
```

### Solution 2: Direct Touch Events on Buttons
```javascript
modeButtons.forEach(button => {
    button.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent click delay
        e.stopPropagation(); // Don't let canvas see this
        handleModeButtonClick(button);
    }, { passive: false });
});
```

### Solution 3: Debounced Resize
```javascript
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
});
```

### Solution 4: Orientation Change Handler
```javascript
window.addEventListener('orientationchange', () => {
    // Disable interaction during transition
    canvas.style.pointerEvents = 'none';
    setTimeout(() => {
        resizeCanvas();
        canvas.style.pointerEvents = 'auto';
    }, 300);
});
```

## Testing Plan

1. Add console.log to track event targets
2. Add visual feedback when buttons receive events
3. Test each solution incrementally
4. Validate in both orientations
5. Test rotation transitions

## Implementation Order

1. ✅ Add pointer-events: none to SVG children
2. ✅ Switch buttons to touchstart events
3. ✅ Add orientation change handler
4. ✅ Test and validate
5. ✅ Clean up and commit
