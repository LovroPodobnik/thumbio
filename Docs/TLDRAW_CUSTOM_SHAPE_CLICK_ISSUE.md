# tldraw Custom Shape Click Detection Issue & Solution

**Problem**: Custom shapes with HTML content not responding to clicks in the center area, only on edges

**Impact**: Poor user experience where users must click precisely on shape borders to select custom shapes

---

## Issue Description

When creating custom shapes in tldraw using `HTMLContainer` and complex HTML content (images, overlays, text), clicks in the center of the shape don't register for selection. Users can only select the shape by clicking on the very edges where no HTML child elements exist.

### Symptoms:
- ✅ Clicks on shape borders work (blue selection indicator appears)
- ❌ Clicks on the center/content area don't work
- ❌ Clicks on images, text overlays, or other HTML elements don't work
- ❌ Users forced to click precisely on thin border areas

---

## Root Cause Analysis

The issue occurs because **HTML child elements inside custom shapes intercept mouse events** before they can reach tldraw's hit detection system.

### Technical Details:

1. **tldraw's Hit Detection**: Uses the shape's `getGeometry()` method to determine clickable areas
2. **HTML Event Bubbling**: Child HTML elements receive click events first
3. **Event Interception**: Child elements consume the click event, preventing it from reaching tldraw
4. **Pointer Events**: By default, all HTML elements are interactive (`pointerEvents: 'auto'`)

### Example Problem Code:

```javascript
// ❌ PROBLEMATIC: Child elements block clicks
const CustomShapeComponent = ({ shape }) => {
  return (
    <HTMLContainer>
      <div style={{ width: 320, height: 180 }}>
        {/* This image blocks clicks in the center */}
        <img src={thumbnailUrl} style={{ width: '100%', height: '100%' }} />
        
        {/* These overlays block clicks on edges */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <span>VIRAL</span>
        </div>
        
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div>Title text here</div>
        </div>
      </div>
    </HTMLContainer>
  );
};
```

---

## Solution

Set `pointerEvents: 'none'` on **ALL child HTML elements** inside the custom shape to allow clicks to pass through to tldraw's hit detection.

### Fixed Code:

```javascript
// ✅ SOLUTION: All child elements allow click pass-through
const CustomShapeComponent = ({ shape }) => {
  return (
    <HTMLContainer>
      <div style={{ width: 320, height: 180 }}>
        {/* Image allows clicks to pass through */}
        <img 
          src={thumbnailUrl} 
          style={{ 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none', // Critical fix
            userSelect: 'none'
          }} 
        />
        
        {/* Overlays allow clicks to pass through */}
        <div style={{ 
          position: 'absolute', 
          top: 8, 
          right: 8,
          pointerEvents: 'none' // Critical fix
        }}>
          <span>VIRAL</span>
        </div>
        
        {/* Text overlay allows clicks to pass through */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          pointerEvents: 'none' // Critical fix
        }}>
          <div>Title text here</div>
        </div>
      </div>
    </HTMLContainer>
  );
};
```

---

## Implementation Steps

### 1. Identify All Child Elements
Audit your custom shape component for all HTML elements:
- Images (`<img>`)
- Text overlays (`<div>`, `<span>`)
- Badges and indicators
- Background overlays
- Any positioned elements

### 2. Apply Pointer Events Fix
Add `pointerEvents: 'none'` to every child element's style:

```javascript
style={{
  // ... other styles
  pointerEvents: 'none', // Essential for click pass-through
  userSelect: 'none'     // Recommended: prevent text selection
}}
```

### 3. Verify Hit Testing (Optional)
Ensure your shape utility has proper geometry definition:

```javascript
class CustomShapeUtil extends ShapeUtil {
  getGeometry(shape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      x: 0,
      y: 0
    });
  }
  
  // Optional: Explicit hit testing
  hitTestPoint(shape, point) {
    return this.getGeometry(shape).hitTestPoint(point);
  }
}
```

### 4. Test Click Areas
Verify clicks work in all areas:
- Center of images ✅
- Text overlay areas ✅  
- Badge/indicator areas ✅
- Border areas ✅

---

## Common Mistakes to Avoid

### ❌ Don't Do This:
```javascript
// Forgetting child elements
<img src={url} /> // Missing pointerEvents: 'none'

// Only fixing some elements
<img style={{ pointerEvents: 'none' }} />
<div>Text</div> // This will still block clicks

// Using event handlers instead
<div onClick={(e) => e.stopPropagation()}> // Wrong approach
```

### ✅ Do This:
```javascript
// Fix ALL child elements
<img style={{ pointerEvents: 'none' }} />
<div style={{ pointerEvents: 'none' }}>
  <span style={{ pointerEvents: 'none' }}>Text</span>
</div>

// Let tldraw handle selection natively
// No custom click handlers needed
```

---

## Alternative Solutions

### Option 1: CSS Class Approach
```css
.tldraw-shape-content * {
  pointer-events: none;
  user-select: none;
}
```

### Option 2: Event Capture (Not Recommended)
```javascript
// Less reliable, harder to maintain
<div onPointerDown={(e) => {
  e.preventDefault();
  e.stopPropagation();
  editor.select(shape.id);
}}>
```

---

## Browser Compatibility

The `pointerEvents: 'none'` solution works across all modern browsers:
- ✅ Chrome/Chromium
- ✅ Firefox  
- ✅ Safari
- ✅ Edge

---

## Testing Checklist

When implementing this fix, verify:

- [ ] Clicks work in the center of images
- [ ] Clicks work on text overlay areas
- [ ] Clicks work on badge/indicator areas  
- [ ] Clicks work on shape borders
- [ ] Selection indicators appear correctly
- [ ] Multiple selection still works (Shift+click)
- [ ] Drag selection still works
- [ ] Mobile touch selection works

---

## Performance Impact

✅ **Minimal Performance Impact**: `pointerEvents: 'none'` is a CSS property that doesn't affect rendering performance.

✅ **Better UX**: Users can click anywhere on the shape for selection.

✅ **Simplified Code**: No need for custom click handlers or complex event management.

---

## Related Issues

This solution also fixes:
- Drag selection issues with custom shapes
- Touch selection on mobile devices  
- Inconsistent selection behavior
- Complex event handler conflicts

---

## Example: YouTube Thumbnail Custom Shape

Complete working example of a complex custom shape with proper click handling:

```javascript
const ThumbnailShapeComponent = ({ shape }) => {
  const { props } = shape;
  const { thumbnailUrl, title, channelName, views, isViral, w, h, locked } = props;

  return (
    <div style={{ 
      width: w, 
      height: h, 
      position: 'relative',
      border: locked ? '2px solid #ef4444' : '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#f3f4f6',
      cursor: locked ? 'not-allowed' : 'default',
      userSelect: 'none'
    }}>
      {/* Main thumbnail image */}
      <img
        src={thumbnailUrl}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: locked ? 0.6 : 1,
          pointerEvents: 'none', // Critical: Let clicks pass through
          userSelect: 'none'
        }}
      />
      
      {/* Viral badge overlay */}
      {isViral && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#ef4444',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          pointerEvents: 'none' // Critical: Let clicks pass through
        }}>
          VIRAL
        </div>
      )}
      
      {/* Title and metadata overlay */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        color: 'white',
        padding: '8px',
        fontSize: '12px',
        pointerEvents: 'none' // Critical: Let clicks pass through
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
          {title.length > 40 ? title.substring(0, 40) + '...' : title}
        </div>
        <div style={{ opacity: 0.8 }}>
          {channelName} • {views} views
        </div>
      </div>
      
      {/* Lock indicator */}
      {locked && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          pointerEvents: 'none' // Critical: Let clicks pass through
        }}>
          🔒 LOCKED
        </div>
      )}
    </div>
  );
};
```

---

## Summary

**The Issue**: HTML child elements in custom tldraw shapes block click events.

**The Fix**: Add `pointerEvents: 'none'` to ALL child HTML elements.

**The Result**: Users can click anywhere on custom shapes for reliable selection.

This is a common issue when building complex custom shapes in tldraw, and this simple CSS solution provides a reliable fix that works across all browsers and input methods.