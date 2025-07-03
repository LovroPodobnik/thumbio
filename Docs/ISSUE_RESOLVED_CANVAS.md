Got it. I’ll gather and organize documentation from the official [tldraw.dev](https://tldraw.dev) reference for the `Editor` class, including its methods, usage examples, and any notes on shape interactions or hit-testing. I’ll let you know when it’s ready.


# Resolving the TikTok Shape Click Detection Issue

To address the TikTok shape’s click detection problem, we need to ensure the shape’s **hit-testing and pointer events** are correctly configured. After reviewing tldraw’s documentation and known best practices for custom shapes, two potential causes (and fixes) emerge:

## 1. Ensure the Shape’s Geometry is “Filled”

The symptom where only the edges of a shape are clickable (and not the interior) often indicates that the shape’s geometry is treated as hollow (no fill). By default, if a shape’s geometry isn’t marked as filled, the tldraw editor might only register clicks on the outline. In tldraw’s custom shape examples, they explicitly mark the geometry as filled. For example, the official docs use:

```js
getGeometry(shape) {
  return new Rectangle2d({
    width: shape.props.w,
    height: shape.props.h,
    isFilled: true,
  })
}
```

This `isFilled: true` flag ensures the entire rectangle area is clickable. In your TikTok shape util, **add or set** the `isFilled: true` property when constructing the `Rectangle2d` geometry. This will inform tldraw’s hit-testing logic that the shape’s interior counts as a hit target (not just the border).

**Why this matters:** Without `isFilled: true`, a Rectangle2d may default to being hollow (only its stroke/edges considered). Even though you overrode `hitTestPoint` to use `bounds.hitTestPoint(point)`, that method likely respects the fill setting. Setting `isFilled: true` makes `hitTestPoint` return `true` for points in the interior region, thus allowing center clicks to select the shape.

## 2. Verify Pointer Events on the HTML Container

You’ve correctly set all child elements inside the shape to `pointer-events: none` so that clicks pass through to the shape’s container. The **container itself** needs to accept pointer events. Typically, not specifying `pointer-events` on the container (or using the default `auto`) is sufficient. However, the tldraw documentation notes that when using an `HTMLContainer`, **you must explicitly manage pointer event settings for custom shapes**:

> “If your shape returns HTML elements, wrap it in an HTMLContainer. Note that you must set `pointerEvents` manually on the shapes you wish to receive pointer events.”

In practice, this means ensuring the root HTML container element **is not inadvertently set to ignore events**. In your code, double-check that the `<HTMLContainer>` (or its top-level wrapper `<div>`) has no `pointerEvents: 'none'`. If in doubt, you can explicitly add `style={{ pointerEvents: 'all' }}` to the container. While `'auto'` is the default for HTML elements, some developers have found that explicitly using `'all'` on the container helps reinforce that the container should capture clicks.

**Note:** The `HTMLContainer` provided by tldraw likely already attaches the necessary event handlers via the `events` prop internally. But if you override the `component` method manually (as shown in your snippet), make sure you integrate the `events` and `ref` from shape util. For example, using `TLShapeUtil.Component` pattern or spreading `...events` on the container ensures the editor’s pointer event handlers are bound. If your implementation doesn’t do this, the shape might not respond to clicks. However, since your YouTube shape works with a similar pattern, the key difference is likely not in event binding, but in the geometry/fill as per point 1 above.

## 3. Cross-Verify with Official Examples

To further solidify the fix, it’s helpful to compare with a working custom shape example:

* **tldraw Card Shape Example:** In tldraw’s docs, a simple custom shape (“card”) uses an `HTMLContainer` for rendering. Its geometry is defined with `isFilled: true`, and the component returns an `<HTMLContainer>` containing content. Notably, that example’s content is just text (which by default doesn’t intercept events), and no extra pointer-event styling is applied to the container aside from wrapping it. This suggests that having the geometry filled is crucial for click hit-testing.

* **Clickable Custom Shape Example:** The interactive shape example (with a button inside) actually sets `pointerEvents: 'all'` on the container to allow inner interactions. In your case, you don’t need inner element interactivity (just selection), so pointer events on children remain `none`. But it reinforces that the container must accept events (either by default or explicitly).

Given that your YouTube thumbnail shape is working, mirror its implementation exactly for TikTok after applying the above changes. In particular, verify if the YouTube shape’s `getGeometry` includes `isFilled: true` or if it uses some base util (some base shape utils set filled by default).

## 4. Additional Debugging Steps (if issues persist)

If after making the above adjustments the TikTok shape is **still** not clickable in the center, consider the following debugging actions:

* **Inspect the Rendered DOM:** Use DevTools to ensure the TikTok shape’s HTML structure matches the YouTube shape’s structure. Check that the outer `<div>` (or container element) covering the shape spans the full width/height and has no `pointer-events: none`. All inner elements (images, text) should show `pointer-events: none` in computed styles. No unexpected overlay elements should be on top of the shape.

* **Use Editor API to Confirm Shape Util Registration:** In the console, call `editor.hasShapeUtil({ type: 'tiktok-video' })` or simply ensure `editor.getShape('tiktok-video', someId)` returns the shape. The Editor’s `hasShapeUtil` method returns true if the shape type is registered. A false here would indicate the shape util wasn’t properly added to the `shapeUtils` prop or was added too late. (Given your setup, this is likely fine, since edges respond.)

* **Check Shape Bounds vs. Content:** Log out the geometry bounds and compare to the shape’s props. If the content (image or overlay) is larger or offset relative to the shape’s reported `w`/`h`, clicks in some areas might fall outside the official bounds. Ensure that `shape.props.w` and `h` truly correspond to the clickable area you expect.

* **Upgrade tldraw if Applicable:** Although version 3.13.4 is recent, consider testing with the latest patch release. It’s possible a bug related to HTMLContainer shapes was present. (For instance, a known update improved selecting “hollow” shapes by clicking inside them, which might be relevant if geometry wasn’t filled.)

* **Community Insight:** As a last resort, reaching out on the tldraw Discord or GitHub Discussions with a minimal reproducible example can uncover any subtle library issues or overlooked details. Often others have encountered similar custom shape quirks.

## 5. Conclusion

**Likely Fix:** Setting the shape’s geometry as filled (`isFilled: true`) is the most probable resolution for the TikTok shape’s click issue. This aligns with official documentation and ensures the editor’s hit-testing treats the entire shape area as clickable. In combination with the correct pointer event settings (container accepting events, children ignoring them), your TikTok shapes should become selectable with clicks anywhere on their content.

By applying these changes and testing again, you should find that the TikTok video shapes respond just as reliably to center clicks as the YouTube thumbnail shapes do. Good luck, and happy coding!

**Sources:**

* tldraw Documentation – *Creating Custom Shapes* (geometry and HTML container usage)
* tldraw Documentation – *Clickable Custom Shape Example* (pointer events on container)
* tldraw Editor API Reference – *Shape Util Registration* (for verification)
