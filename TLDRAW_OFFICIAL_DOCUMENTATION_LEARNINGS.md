# tldraw Official Documentation Key Learnings

**Learning Context**: Solving custom shape click detection issues through official tldraw documentation research

**Problem Solved**: Making custom shapes with HTMLContainer properly clickable and selectable

---

## Critical Discovery: Official vs. Assumed Patterns

### ❌ What We Initially Assumed (Wrong):
- Use `pointerEvents: 'none'` to let clicks "pass through" to tldraw
- Listen to `'selection-change'` events for selection detection
- Let tldraw handle everything natively without intervention

### ✅ What Official Documentation Revealed (Correct):
- Use `pointerEvents: 'all'` to enable interactions with custom shapes
- Use `stopPropagation()` to prevent unwanted editor interactions
- Handle selection manually when needed for custom behavior

---

## Key Documentation Sources

### 1. **Official Examples Site**: `https://tldraw.dev/examples`
**Most Important Discovery**: `/examples/interactive-shape` - "Clickable custom shape"

### 2. **Official Pattern from Documentation**:
```typescript
// Enable pointer events
style={{ pointerEvents: 'all' }}

// Handle clicks with stopPropagation
onPointerDown={(e) => {
  if (!shape.props.checked) {
    e.stopPropagation()
  }
}}
```

### 3. **Event Map Documentation**: `TLEventMap` Interface
**Critical Finding**: Only these events actually exist:
- `'change'` - General state changes (includes selection)
- `'event'` - Generic event info  
- `'before-event'` - Pre-event handling
- Text/system events (not relevant for our use case)

**Important**: `'selection-change'`, `'select'`, `'deselect'` **DO NOT EXIST** in official API

---

## Detailed Implementation Learnings

### 1. **Correct Event Handling Pattern**

#### ✅ Official Way:
```javascript
// Listen to the actual documented event
editor.on('change', handleSelectionChange);

// Handle clicks with explicit control
const handleClick = (e) => {
  if (!locked && editor) {
    e.stopPropagation(); // Prevent tldraw interference
    editor.select(shape.id); // Manual selection
  }
};
```

#### ❌ What Doesn't Work:
```javascript
// These events don't exist in TLEventMap
editor.on('selection-change', handler); // NOT REAL
editor.on('select', handler); // NOT REAL
editor.on('deselect', handler); // NOT REAL

// This blocks ALL interaction
style={{ pointerEvents: 'none' }} // BREAKS EVERYTHING
```

### 2. **HTMLContainer Best Practices**

#### ✅ Correct Pattern:
```javascript
const CustomShapeComponent = ({ shape }) => {
  const handleClick = (e) => {
    if (!shape.props.locked) {
      e.stopPropagation(); // Critical for custom behavior
      globalEditor.select(shape.id);
    }
  };

  return (
    <div 
      onClick={handleClick}
      onPointerDown={handleClick}
      style={{ 
        pointerEvents: 'all', // Enable interactions
        cursor: 'pointer'
      }}
    >
      {/* Child elements don't need special pointer handling */}
      <img src={thumbnailUrl} />
      <div>Text content</div>
    </div>
  );
};
```

#### ❌ Common Mistakes:
```javascript
// Don't disable pointer events on root
style={{ pointerEvents: 'none' }} // Breaks clicking

// Don't rely on non-existent events
editor.on('selection-change', handler); // Not real

// Don't forget stopPropagation
onClick={handleClick} // Without stopPropagation = conflicts
```

---

## Architecture Insights

### 1. **tldraw's Event Philosophy**
- **Single `'change'` event** covers all state modifications
- **Manual control** preferred over automatic behavior for custom interactions
- **Explicit event handling** rather than implicit event bubbling

### 2. **Shape Interaction Model**
- Shapes can be **fully interactive** with `pointerEvents: 'all'`
- **Developer controls** tldraw behavior via `stopPropagation()`
- **Hybrid approach**: tldraw + custom logic working together

### 3. **HTMLContainer Design Pattern**
- HTMLContainer is meant for **interactive content**
- Not just a display layer - **full HTML interaction capability**
- **Custom behavior** is expected and supported

---

## Documentation Quality Assessment

### ✅ **What's Well Documented**:
- TypeScript interfaces and type definitions
- Basic usage patterns and setup
- Component APIs and props

### ⚠️ **What's Limited**:
- Event handling patterns and examples
- Custom shape interaction best practices  
- Troubleshooting guides for common issues
- Comprehensive examples of complex interactions

### 🔍 **Best Learning Resources Found**:
1. **`/examples/interactive-shape`** - Essential for click handling
2. **`TLEventMap` interface** - Shows actual available events
3. **GitHub repository** - Real implementation examples
4. **TypeScript definitions** - Authoritative API reference

---

## Practical Implementation Guidelines

### 1. **For Clickable Custom Shapes**:
```javascript
// Always use this pattern
<div 
  onClick={handleClick}
  onPointerDown={handleClick}
  style={{ pointerEvents: 'all' }}
>
  {/* Content */}
</div>

const handleClick = (e) => {
  e.stopPropagation();
  editor.select(shape.id);
};
```

### 2. **For Selection Detection**:
```javascript
// Use the real documented event
useEffect(() => {
  if (!editor) return;
  
  const handleChange = () => {
    const selectedShapes = editor.getSelectedShapes();
    // Handle selection changes
  };
  
  editor.on('change', handleChange);
  return () => editor.off('change', handleChange);
}, [editor]);
```

### 3. **For Shape Utilities**:
```javascript
class CustomShapeUtil extends ShapeUtil {
  // These methods work as documented
  canSelect(shape) {
    return !shape.props.locked;
  }
  
  hitTestPoint(shape, point) {
    return this.getGeometry(shape).hitTestPoint(point);
  }
}
```

---

## Performance Considerations

### 1. **Event Listener Efficiency**
- Use `'change'` event (single listener) instead of multiple non-existent events
- Debounce expensive operations triggered by `'change'`
- Keep selection updates immediate for UX

### 2. **Interaction Optimization**
- `stopPropagation()` only when necessary
- `pointerEvents: 'all'` enables efficient click detection
- No need for complex event routing with proper setup

---

## Common Pitfalls & Solutions

### 1. **"Clicks Don't Work" Issue**
**Cause**: Using `pointerEvents: 'none'` everywhere
**Solution**: Use `pointerEvents: 'all'` and `stopPropagation()`

### 2. **"Events Not Firing" Issue**  
**Cause**: Using non-existent event names
**Solution**: Use documented `'change'` event only

### 3. **"Selection Conflicts" Issue**
**Cause**: Not using `stopPropagation()`
**Solution**: Always use `e.stopPropagation()` in custom handlers

---

## Testing Approach

### 1. **Verify Event Availability**
```javascript
// Check what events actually exist
console.log(Object.keys(editor.eventMap || {}));
```

### 2. **Debug Click Detection**
```javascript
// Verify clicks are reaching your handler
const handleClick = (e) => {
  console.log('Click received:', e.target);
  e.stopPropagation();
  editor.select(shape.id);
};
```

### 3. **Validate Selection Changes**
```javascript
// Monitor actual selection changes
editor.on('change', () => {
  const selected = editor.getSelectedShapes();
  console.log('Selection:', selected.length);
});
```

---

## Key Takeaways for Other Developers

### 1. **Don't Assume Event Names**
- Check `TLEventMap` interface for actual available events
- Many expected events (like `'selection-change'`) don't exist

### 2. **Embrace Explicit Control**
- tldraw expects developers to use `stopPropagation()` for custom behavior
- Don't fight the framework - work with its explicit control model

### 3. **HTMLContainer is Powerful**
- It's designed for full interactivity, not just display
- Use `pointerEvents: 'all'` to unlock its potential

### 4. **Documentation Exploration Strategy**
- Start with `/examples` for working patterns
- Check TypeScript interfaces for authoritative APIs
- Verify assumptions by testing actual event names

### 5. **The Fundamental Pattern**
```javascript
// This pattern solves 90% of custom shape interaction needs
<div 
  onClick={(e) => { e.stopPropagation(); /* custom logic */ }}
  style={{ pointerEvents: 'all' }}
>
  {/* Interactive content */}
</div>
```

---

## Conclusion

The most important learning was that **tldraw's official patterns are often the opposite of what seems intuitive**:

- Enable interactions (`pointerEvents: 'all'`) instead of disabling them
- Use explicit control (`stopPropagation()`) instead of relying on event bubbling  
- Use documented events (`'change'`) instead of assumed ones (`'selection-change'`)

This experience highlighted the critical importance of **consulting official documentation early** rather than making assumptions about how a framework should work. The 15 minutes spent finding the right documentation example saved hours of debugging incorrect approaches.

**For future tldraw projects**: Always start with the `/examples` section and verify event names against the TypeScript interfaces before implementing custom behavior.