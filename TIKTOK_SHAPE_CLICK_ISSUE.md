# TikTok Shape Click Detection Issue

## Problem Statement

TikTok shapes in the tldraw canvas are not responding to clicks in the center/content area. Users can only select these shapes by clicking on the very edges/borders, which creates a poor user experience. This issue does not affect YouTube thumbnail shapes, which work correctly.

## Symptoms

- ❌ Clicks on the center/content area of TikTok shapes don't work
- ❌ Clicks on images, text overlays, or other HTML elements don't register
- ✅ Clicks on shape borders work (selection indicator appears)
- ✅ YouTube thumbnail shapes can be clicked anywhere and work correctly

## Context

- **Framework**: tldraw v3.13.4 (@tldraw/tldraw)
- **Shape Type**: Custom shape using `ShapeUtil` class
- **Shape ID**: 'tiktok-video'
- **Working Example**: YouTube thumbnail shapes (type: 'youtube-thumbnail') work correctly

## Investigation Summary

### 1. Code Structure Comparison

Both TikTok and YouTube shapes follow the same pattern:

```javascript
// Both use HTMLContainer wrapper
component(shape) {
  return (
    <HTMLContainer>
      <ShapeComponent shape={shape} />
    </HTMLContainer>
  );
}
```

### 2. Applied Fixes (Following TLDRAW_CUSTOM_SHAPE_CLICK_ISSUE.md)

All documented solutions have been implemented:

1. **✅ All child elements have `pointerEvents: 'none'`**
   ```javascript
   // Every child element has this style
   style={{ pointerEvents: 'none' }}
   ```

2. **✅ Root container does NOT have `pointerEvents: 'none'`**
   ```javascript
   // Root div allows clicks
   <div style={{ 
     // ... other styles
     // NO pointerEvents: 'none' here
   }}>
   ```

3. **✅ Correct import path**
   ```javascript
   import { ShapeUtil, T, HTMLContainer, Rectangle2d } from '@tldraw/tldraw';
   ```

4. **✅ Shape registration in all canvas files**
   ```javascript
   const shapeUtils = useMemo(() => [ThumbnailShapeUtil, TikTokShapeUtil], []);
   ```

### 3. Technical Implementation Details

#### TikTok Shape Structure
```javascript
export class TikTokShapeUtil extends ShapeUtil {
  static type = 'tiktok-video';
  static props = tiktokShapeProps;
  
  isAspectRatioLocked = () => true;

  getGeometry(shape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      x: 0,
      y: 0
    });
  }

  // Custom hit testing methods added
  hitTestPoint(shape, point) {
    const bounds = this.getGeometry(shape);
    return bounds.hitTestPoint(point);
  }

  hitTestLineSegment(shape, A, B) {
    const bounds = this.getGeometry(shape);
    return bounds.hitTestLineSegment(A, B);
  }
}
```

### 4. Current Component Structure

The TikTok shape component follows the exact same pattern as the working YouTube shape:
- Uses inline styles only (no Tailwind classes)
- Has `cursor: 'default'` on the root element
- All overlays and child elements have `pointerEvents: 'none'`
- Proper userSelect properties including vendor prefixes

## Remaining Issues to Investigate

### 1. Shape Creation
Check how TikTok shapes are being created and positioned:
```javascript
// In TldrawCanvasHybrid.jsx
return {
  id: createShapeId(`tiktok-${video.id}`),
  type: 'tiktok-video',
  x: platformLayout.startX + col * (platformLayout.itemWidth + platformLayout.spacing),
  y: platformLayout.startY + row * (platformLayout.itemHeight + platformLayout.spacing),
  props: { /* ... */ }
};
```

### 2. Browser Console
- Check for any JavaScript errors when clicking TikTok shapes
- Look for any tldraw-specific warnings or errors
- Verify the shape is actually being rendered with the correct type

### 3. tldraw Version Compatibility
- Current version: @tldraw/tldraw@3.13.4
- Check if there are any known issues with custom shapes in this version
- Review tldraw changelog for any breaking changes

### 4. Shape State Inspection
Use browser DevTools to:
1. Inspect the rendered HTML structure
2. Verify all elements have correct pointer-events values
3. Check computed styles for any overrides
4. Test event propagation with Event Listeners panel

### 5. Potential Areas to Explore

1. **Z-index or Layering Issues**
   - Are TikTok shapes rendered at a different layer?
   - Is something overlaying the shapes?

2. **Shape Bounds Calculation**
   - Is the shape's actual bounds matching its visual representation?
   - Try adding debug logging to hitTestPoint method

3. **Event Handler Conflicts**
   - Are there any event handlers on parent elements?
   - Check for stopPropagation or preventDefault calls

4. **Shape Props Differences**
   - Compare the exact props between working YouTube and non-working TikTok shapes
   - Look for any undefined or null values

## Testing Recommendations

1. **Minimal Test Case**
   Create a standalone tldraw instance with only TikTok shapes to isolate the issue

2. **Cross-Browser Testing**
   - Chrome/Chromium
   - Firefox
   - Safari
   - Edge

3. **Debug Mode**
   Add console logging to track:
   ```javascript
   hitTestPoint(shape, point) {
     console.log('TikTok hitTest:', shape.id, point);
     const bounds = this.getGeometry(shape);
     const result = bounds.hitTestPoint(point);
     console.log('Hit test result:', result);
     return result;
   }
   ```

4. **Shape Inspector**
   Use tldraw's editor API to inspect shape state:
   ```javascript
   const shapes = editor.getCurrentPageShapes();
   const tiktokShapes = shapes.filter(s => s.type === 'tiktok-video');
   console.log('TikTok shapes:', tiktokShapes);
   ```

## Files to Review

1. `/src/components/canvas/shapes/TikTokShapeUtil.js` - Shape definition
2. `/src/components/canvas/TldrawCanvasHybrid.jsx` - Shape creation logic
3. `/src/components/canvas/ContentImportSidebar.jsx` - Import flow
4. `/Docs/TLDRAW_CUSTOM_SHAPE_CLICK_ISSUE.md` - Original solution that worked for YouTube

## Next Steps

1. **Verify Shape Registration**
   - Confirm the shape is registered before any shapes are created
   - Check if shape utils are being recreated unexpectedly

2. **Test with tldraw Examples**
   - Compare with official tldraw custom shape examples
   - Try implementing a minimal custom shape to verify the setup

3. **Review tldraw Source**
   - Check how built-in shapes handle click detection
   - Look for any special handling for HTMLContainer shapes

4. **Contact tldraw Community**
   - Post in tldraw Discord or GitHub discussions
   - Provide minimal reproduction example

## Conclusion

Despite implementing all known solutions and matching the working YouTube shape implementation exactly, TikTok shapes still have click detection issues. The problem appears to be specific to something in the TikTok shape implementation or how it's being created/rendered, rather than the common pointer-events issue.

The next research team should focus on runtime debugging and comparing the actual rendered DOM and event handling between working YouTube shapes and non-working TikTok shapes.