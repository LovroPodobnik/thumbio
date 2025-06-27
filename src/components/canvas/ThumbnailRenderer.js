import * as PIXI from 'pixi.js';

// Debug flag for conditional logging
const DEBUG = process.env.NODE_ENV !== 'production';

// Helper function to create minimal monochrome badges
const createMinimalTextBadge = (type, x, y) => {
  const container = new PIXI.Container();
  
  // Minimal badge configurations - all subtle and monochrome
  const configs = {
    viral: {
      text: 'VIRAL',
      bg: DesignTokens.badgeBg,
      textColor: DesignTokens.badgeText
    },
    hot: {
      text: 'HOT',
      bg: DesignTokens.badgeBg,
      textColor: DesignTokens.badgeText
    },
    engaged: {
      text: 'TOP',
      bg: DesignTokens.badgeBg,
      textColor: DesignTokens.badgeText
    }
  };
  
  const config = configs[type];
  if (!config) return container;
  
  // Create text with smaller, more subtle styling
  const text = new PIXI.Text({
    text: config.text,
    style: {
      fontSize: 10,  // Slightly larger for readability
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '500',  // Medium weight instead of bold
      fill: config.textColor,
      letterSpacing: 0.5  // Slight letter spacing for cleaner look
    },
    resolution: window.devicePixelRatio || 1
  });
  
  // Calculate badge dimensions based on text
  const padding = 6;  // Smaller padding
  const width = text.width + padding * 2;
  const height = 18;
  
  // Minimal background with no border
  const badge = new PIXI.Graphics();
  badge.roundRect(0, 0, width, height, 3); // Smaller radius
  badge.fill({ color: config.bg, alpha: 1 });
  
  container.addChild(badge);
  
  // Center the text
  text.x = padding;
  text.y = (height - text.height) / 2;
  container.addChild(text);
  
  // Position the container
  container.x = x;
  container.y = y;
  
  return container;
};

// Helper function to create minimal view count display
const createMinimalViewCount = (viewCount, x, y) => {
  const container = new PIXI.Container();
  
  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };
  
  const formattedViews = formatViews(viewCount);
  
  // Create text with better contrast
  const text = new PIXI.Text({
    text: formattedViews + ' views',
    style: {
      fontSize: 11,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '500',  // Medium weight for better readability
      fill: DesignTokens.textPrimary,  // Dark text for contrast
    },
    resolution: window.devicePixelRatio || 1
  });
  
  // Calculate dimensions based on text
  const padding = 8;
  const width = text.width + padding * 2;
  const height = 20;
  
  // White background with subtle border for better contrast
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, width, height, 4);
  bg.fill({ color: DesignTokens.backgroundPrimary, alpha: 0.95 });
  bg.stroke({ width: 1, color: DesignTokens.borderDivider });
  
  container.addChild(bg);
  
  // Center the text
  text.x = padding;
  text.y = (height - text.height) / 2;
  container.addChild(text);
  
  // Position the container
  container.x = x;
  container.y = y;
  
  return container;
};

// Helper function to truncate text to one line with ellipsis
const truncateToOneLine = (text, maxWidth, textStyle) => {
  const avgCharWidth = textStyle.fontSize * 0.5; // Rough estimation
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  
  if (text.length <= maxChars) {
    return text;
  }
  
  // Reserve space for "..." (3 characters)
  const availableSpace = maxChars - 3;
  
  // Find the last space before the cutoff to avoid breaking words
  const truncatePos = text.lastIndexOf(' ', availableSpace);
  
  if (truncatePos > 0) {
    return text.substring(0, truncatePos) + '...';
  } else {
    // If no space found, just cut at character limit
    return text.substring(0, availableSpace) + '...';
  }
};

// Design System Color Mapping for PIXI.js
// Aligned with minimal Radix-inspired design system
const DesignTokens = {
  // Backgrounds
  backgroundPrimary: 0xFFFFFF,     // White
  backgroundSecondary: 0xFAFAFA,   // Neutral-5 (very subtle gray)
  
  // Borders  
  borderDivider: 0xE4E4E7,         // Neutral-20 (subtle divider)
  borderPrimary: 0xE4E4E7,         // Same as divider for consistency
  borderFocus: 0x3B82F6,           // Blue for focus states
  
  // Text (approximated for PIXI)
  textPrimary: 0x09090B,           // Neutral-95 (almost black)
  textSecondary: 0x71717A,         // Neutral-60 (medium gray)
  textTertiary: 0xA1A1AA,          // Neutral-40 (light gray)
  
  // Brand colors (used sparingly)
  brandPrimary: 0x09090B,          // Black for primary actions
  brandPrimaryHover: 0x18181B,     // Slightly lighter black
  
  // Minimal semantic colors
  destructive: 0xDC2626,           // Red-600 (only for errors)
  success: 0x16A34A,               // Green-600 (rarely used)
  
  // Badge colors - all subtle and monochrome
  badgeBg: 0xF4F4F5,               // Neutral-10 (very light gray)
  badgeText: 0x71717A,             // Neutral-60 (same as text-secondary)
  viewCountBg: 0x09090B,           // Black with opacity
  durationBg: 0x09090B,            // Black with opacity
  
  // Neutral scale
  neutral0: 0xFFFFFF,              // White
  neutral5: 0xFAFAFA,              // Almost white
  neutral10: 0xF4F4F5,             // Very light gray
  neutral20: 0xE4E4E7,             // Light gray
  neutral40: 0xA1A1AA,             // Medium gray
  neutral60: 0x71717A,             // Dark gray
  neutral80: 0x3F3F46,             // Very dark gray
  neutral90: 0x18181B,             // Almost black
  neutral95: 0x09090B,             // Black
  neutral100: 0x09090B,            // Black (same as neutral95 for compatibility)
};

export const createThumbnailContainer = (thumb, selectedIds, isLocked = false) => {
  
  const container = new PIXI.Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';
  
  // Minimal card background with subtle border
  const bg = new PIXI.Graphics();
  bg.roundRect(0, 0, 320, 244, 8); // Increased height for padding, consistent radius
  bg.fill(DesignTokens.backgroundPrimary);
  bg.stroke({ width: 1, color: DesignTokens.borderDivider });
  container.addChild(bg);
  
  // Minimal selection outline
  const selectionOutline = new PIXI.Graphics();
  selectionOutline.roundRect(-1, -1, 322, 246, 9);
  selectionOutline.stroke({ width: 2, color: DesignTokens.brandPrimary });
  selectionOutline.visible = selectedIds.has(thumb.id);
  container.addChild(selectionOutline);
  
  // Store references
  container.bgGraphics = bg;
  container.selectionOutline = selectionOutline;
  
  // Thumbnail image placeholder or actual image
  const thumbnailContainer = new PIXI.Container();
  thumbnailContainer.x = 0;
  thumbnailContainer.y = 0;
  
  // Check if we have a real thumbnail URL
  if (thumb.thumbnail && thumb.thumbnail.startsWith('http')) {
    let textureLoaded = false;
    
    try {
      
      // Use PixiJS Assets API for better texture loading in v8
      PIXI.Assets.load(thumb.thumbnail).then((texture) => {
        
        if (!textureLoaded && thumbnailContainer.parent) {
          // Configure texture for high-DPI rendering
          texture.source.resolution = window.devicePixelRatio || 1;
          // Use LINEAR for smooth scaling of photos/thumbnails
          texture.source.scaleMode = 'linear';
          
          // Create sprite with loaded texture
          const sprite = new PIXI.Sprite(texture);
          sprite.width = 320;
          sprite.height = 180;
          
          // Mask to round corners - match container radius
          const mask = new PIXI.Graphics();
          mask.roundRect(0, 0, 320, 180, 8);
          mask.fill(0xFFFFFF);
          sprite.mask = mask;
          
          thumbnailContainer.addChild(sprite);
          thumbnailContainer.addChild(mask);
          textureLoaded = true;
        }
      }).catch((error) => {
        if (DEBUG) {
          console.error('[ThumbnailRenderer] Error loading texture via Assets API:', error);
          console.error('[ThumbnailRenderer] Failed URL:', thumb.thumbnail);
        }
        
        if (!textureLoaded && thumbnailContainer.parent) {
          const placeholderGraphics = new PIXI.Graphics();
          placeholderGraphics.roundRect(0, 0, 320, 180, 6);
          placeholderGraphics.fill(DesignTokens.destructive); // Design system red for errors
          
          // Add error text with design system typography
          const errorText = new PIXI.Text({
            text: 'Failed to load',
            style: {
              fontSize: 12, // text-sm equivalent
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: '400',
              fill: DesignTokens.neutral0, // White text on red background
            },
            resolution: window.devicePixelRatio || 1
          });
          errorText.x = 160 - errorText.width / 2;
          errorText.y = 90 - errorText.height / 2;
          
          thumbnailContainer.addChild(placeholderGraphics);
          thumbnailContainer.addChild(errorText);
          textureLoaded = true;
        }
      });
      
      // Fallback timeout
      setTimeout(() => {
        if (!textureLoaded) {
          
          const placeholderGraphics = new PIXI.Graphics();
          placeholderGraphics.roundRect(0, 0, 320, 180, 6);
          placeholderGraphics.fill(DesignTokens.neutral40); // Neutral gray for timeout
          
          const errorText = new PIXI.Text({
            text: 'Loading timeout',
            style: {
              fontSize: 14, // text-compact equivalent
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: '500',
              fill: DesignTokens.neutral100, // Dark text on yellow background
            },
            resolution: window.devicePixelRatio || 1
          });
          errorText.x = 160 - errorText.width / 2;
          errorText.y = 90 - errorText.height / 2;
          
          thumbnailContainer.addChild(placeholderGraphics);
          thumbnailContainer.addChild(errorText);
          textureLoaded = true;
        }
      }, 5000); // 5 second timeout
    } catch (error) {
      if (DEBUG) {
        console.error('[ThumbnailRenderer] Exception while creating sprite:', error);
        console.error('[ThumbnailRenderer] Falling back to placeholder');
      }
      
      // Fallback to placeholder on error
      const placeholderGraphics = new PIXI.Graphics();
      const colorHex = thumb.colors?.[0] || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      const color = parseInt(colorHex.replace('#', ''), 16);
      
      placeholderGraphics.roundRect(0, 0, 320, 180, 8);
      placeholderGraphics.fill(color);
      thumbnailContainer.addChild(placeholderGraphics);
    }
  } else {
    
    // Professional fallback placeholder
    const placeholderGraphics = new PIXI.Graphics();
    const colorHex = thumb.colors?.[0] || '#F5F5F5'; // Default to background secondary
    const color = parseInt(colorHex.replace('#', ''), 16) || DesignTokens.backgroundSecondary;
    
    placeholderGraphics.roundRect(0, 0, 320, 180, 8);
    placeholderGraphics.fill(color);
    thumbnailContainer.addChild(placeholderGraphics);
  }
  
  container.addChild(thumbnailContainer);
  
  // Minimal duration badge (bottom right)
  const durationBg = new PIXI.Graphics();
  durationBg.roundRect(264, 158, 48, 18, 3); // Smaller and more subtle
  durationBg.fill({ color: DesignTokens.durationBg, alpha: 0.8 }); // Slightly transparent
  
  const duration = new PIXI.Text({
    text: thumb.duration || '10:24',
    style: {
      fontSize: 10, // Smaller text
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '500', // Medium weight
      fill: DesignTokens.neutral0, // White text
    },
    resolution: window.devicePixelRatio || 1
  });
  duration.x = 270;
  duration.y = 160; // Centered in smaller badge
  
  container.addChild(durationBg);
  container.addChild(duration);
  
  // Modern performance badges with icons
  if (thumb.metrics) {
    const { viewCount = 0, likeCount = 0, commentCount = 0 } = thumb.metrics;
    
    // Calculate performance tiers
    const isHighViews = viewCount > 100000; // 100K+ views
    const isViralViews = viewCount > 1000000; // 1M+ views
    const engagement = viewCount > 0 ? ((likeCount + commentCount) / viewCount * 100) : 0;
    const isHighEngagement = engagement > 2; // 2%+ engagement rate
    
    let currentX = 8; // Starting X position for badges
    
    // Clean text-based VIRAL badge (top left)
    if (isViralViews) {
      const viralBadge = createMinimalTextBadge('viral', currentX, 8);
      container.addChild(viralBadge);
      currentX += viralBadge.width + 8; // Dynamic spacing based on badge width
    } else if (isHighViews) {
      // Clean text-based HOT badge
      const hotBadge = createMinimalTextBadge('hot', currentX, 8);
      container.addChild(hotBadge);
      currentX += hotBadge.width + 8; // Dynamic spacing based on badge width
    }
    
    // Clean text-based ENGAGED badge (positioned next to other badges)
    if (isHighEngagement) {
      const engagedBadge = createMinimalTextBadge('engaged', currentX, 8);
      container.addChild(engagedBadge);
    }
    
    // Clean minimal view count display (top right, moved inside bounds)
    if (viewCount > 1000) {
      // Create the view count display first to get its width
      const viewCountDisplay = createMinimalViewCount(viewCount, 0, 8);
      // Position it so it's fully inside the container with padding
      viewCountDisplay.x = 312 - viewCountDisplay.width - 8; // Right align with 8px padding
      container.addChild(viewCountDisplay);
    }
  }
  
  // Minimal title text
  const titleText = truncateToOneLine(thumb.title, 304, {
    fontSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '400',
  });

  const title = new PIXI.Text({
    text: titleText,
    style: {
      fontSize: 12, // text-sm equivalent
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '400', // Regular weight
      fill: DesignTokens.textSecondary, // Secondary text
    },
    resolution: window.devicePixelRatio || 1
  });
  title.x = 8;
  title.y = 196; // Added gap after thumbnail (180 + 16px gap)
  container.addChild(title);
  
  // Minimal channel text
  const channelText = truncateToOneLine(thumb.channelName || 'Unknown Channel', 304, {
    fontSize: 11,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '400',
  });
  
  const channel = new PIXI.Text({
    text: channelText,
    style: {
      fontSize: 11, // text-xs equivalent
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '400', // Regular weight
      fill: DesignTokens.textTertiary, // Even more subtle
    },
    resolution: window.devicePixelRatio || 1
  });
  channel.x = 8;
  channel.y = 214; // Adjusted for new title position
  container.addChild(channel);
  
  // Subtle hover effect
  const hoverOutline = new PIXI.Graphics();
  hoverOutline.roundRect(0, 0, 320, 244, 8);
  hoverOutline.stroke({ width: 1, color: DesignTokens.textTertiary, alpha: 0.3 });
  hoverOutline.visible = false;
  container.addChild(hoverOutline);
  
  // Apply minimal visibility if locked (keeps it selectable but much less distracting)
  if (isLocked) {
    // Apply grayscale filter to desaturate colors
    const colorMatrix = new PIXI.ColorMatrixFilter();
    colorMatrix.desaturate(); // Remove all color saturation
    container.filters = [colorMatrix];
    
    // Reduce opacity significantly to make it very subtle
    container.alpha = 0.25; // 25% opacity - minimal distraction but still visible
    
    // Add very small lock indicator in corner (barely noticeable)
    const lockIcon = new PIXI.Graphics();
    // Tiny lock icon in top-right corner
    lockIcon.roundRect(292, 12, 12, 9, 1.5);
    lockIcon.fill({ color: DesignTokens.neutral100, alpha: 0.6 }); // Very subtle dark background
    lockIcon.stroke({ width: 0.5, color: DesignTokens.neutral0, alpha: 0.7 }); // Subtle white border
    
    // Mini lock shackle (very simple design)
    lockIcon.rect(296, 9, 1.5, 6);
    lockIcon.fill({ color: DesignTokens.neutral0, alpha: 0.7 });
    lockIcon.rect(301.5, 9, 1.5, 6);
    lockIcon.fill({ color: DesignTokens.neutral0, alpha: 0.7 });
    lockIcon.rect(296, 9, 7, 1.5);
    lockIcon.fill({ color: DesignTokens.neutral0, alpha: 0.7 });
    
    container.addChild(lockIcon);
    
    // Keep normal cursor since it's still interactive
    container.cursor = 'pointer';
  }
  
  // Store data
  container.userData = { id: thumb.id, data: thumb };
  container.selected = selectedIds.has(thumb.id);
  container.hoverOutline = hoverOutline;
  container.isLocked = isLocked;
  
  return container;
};

// Export function to update thumbnail event mode
export const updateThumbnailEventMode = (container, isDrawingMode) => {
  if (isDrawingMode) {
    container.eventMode = 'none'; // Make transparent to events in drawing mode
  } else {
    container.eventMode = 'static'; // Normal interaction mode
  }
};

export const setupThumbnailInteractions = (container, callbacks) => {
  const { onHover, onHoverOut, onSelect, onDragStart, onDragMove, onDragEnd, isDrawingMode } = callbacks;
  
  // Initial setup - set event mode based on current drawing state
  updateThumbnailEventMode(container, isDrawingMode && isDrawingMode());
  
  // Store reference to check drawing mode for hover effects
  container._isDrawingMode = isDrawingMode;
  
  container.on('pointerover', () => {
    // Don't change hover state or cursor when drawing mode is active
    if (container._isDrawingMode && container._isDrawingMode()) {
      return;
    }
    
    if (!container.selected) {
      container.hoverOutline.visible = true;
      // Remove scale effect for cleaner look
    }
    container.cursor = 'pointer';
    if (onHover) onHover(container);
  });
  
  container.on('pointerout', () => {
    // Always clean up hover state, but respect drawing mode
    if (!(container._isDrawingMode && container._isDrawingMode())) {
      container.hoverOutline.visible = false;
      if (onHoverOut) onHoverOut(container);
    }
  });
  
  let dragData = null;
  let isDragging = false;
  
  container.on('pointerdown', (e) => {
    // This should not fire in drawing mode due to eventMode = 'none'
    
    // Normal thumbnail interaction (selection/dragging)
    if (onSelect) onSelect(container, e);
    if (onDragStart) {
      dragData = onDragStart(container, e);
      isDragging = true;
    }
    e.stopPropagation(); // Stop propagation for normal interactions
  });
  
  container.on('pointermove', (e) => {
    // Only handle thumbnail dragging if not in drawing mode
    if (isDragging && dragData && onDragMove && !(container._isDrawingMode && container._isDrawingMode())) {
      onDragMove(container, e, dragData);
    }
  });
  
  container.on('pointerup', () => {
    // Only handle thumbnail drag end if not in drawing mode
    if (isDragging && dragData && onDragEnd && !(container._isDrawingMode && container._isDrawingMode())) {
      onDragEnd(container, dragData);
    }
    isDragging = false;
    dragData = null;
  });
  
  container.on('pointerupoutside', () => {
    // Only handle thumbnail drag end if not in drawing mode
    if (isDragging && dragData && onDragEnd && !(container._isDrawingMode && container._isDrawingMode())) {
      onDragEnd(container, dragData);
    }
    isDragging = false;
    dragData = null;
  });
};