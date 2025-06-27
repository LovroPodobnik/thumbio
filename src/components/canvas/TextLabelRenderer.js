import * as PIXI from 'pixi.js';

// Design tokens matching the existing system
const DesignTokens = {
  backgroundPrimary: 0xFFFFFF,
  backgroundSecondary: 0xF5F5F5,
  borderDivider: 0xEBEBEB,
  textPrimary: 0x141414,
  textSecondary: 0x707070,
  brandBlue: 0x2563EB,
  brandBlueHover: 0x3B82F6,
  neutral0: 0xFFFFFF,
  neutral100: 0x141414,
};

// Text label size presets
export const LABEL_SIZES = {
  SMALL: { fontSize: 16, padding: 12, name: 'Small' },
  MEDIUM: { fontSize: 24, padding: 16, name: 'Medium' },
  LARGE: { fontSize: 32, padding: 20, name: 'Large' },
  XL: { fontSize: 48, padding: 24, name: 'Extra Large' }
};

// Default label style
export const DEFAULT_LABEL_STYLE = {
  size: 'LARGE',
  color: '#141414', // textPrimary
  bold: true,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderColor: '#EBEBEB'
};

/**
 * Create a text label container for the canvas
 * @param {Object} labelData - Label configuration
 * @returns {PIXI.Container} - The label container
 */
export const createTextLabelContainer = (labelData) => {
  const container = new PIXI.Container();
  container.eventMode = 'dynamic';
  container.cursor = 'move';
  container.interactive = true; // Ensure container is interactive
  

  
  const sizeConfig = LABEL_SIZES[labelData.style.size] || LABEL_SIZES.LARGE;
  
  // Create text element
  const text = new PIXI.Text({
    text: labelData.text,
    style: {
      fontSize: sizeConfig.fontSize,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: labelData.style.bold ? '700' : '400',
      fill: labelData.style.color || DEFAULT_LABEL_STYLE.color,
      lineHeight: sizeConfig.fontSize * 1.2,
    },
    resolution: window.devicePixelRatio || 1
  });
  text.eventMode = 'passive'; // Let events pass through to container
  
  // Calculate background dimensions
  const bgWidth = text.width + sizeConfig.padding * 2;
  const bgHeight = text.height + sizeConfig.padding * 1.5;
  
  // Create background
  const background = new PIXI.Graphics();
  background.eventMode = 'passive'; // Let events pass through to container
  background.roundRect(0, 0, bgWidth, bgHeight, 8);
  
  // Parse background color with alpha
  const bgColor = labelData.style.backgroundColor || DEFAULT_LABEL_STYLE.backgroundColor;
  const bgAlpha = bgColor.includes('rgba') ? parseFloat(bgColor.match(/[\d.]+(?=\))/)[0]) : 1;
  const bgHex = parseInt(labelData.style.color.replace('#', '0x')) || 0xFFFFFF;
  
  background.fill({ color: DesignTokens.backgroundPrimary, alpha: bgAlpha });
  background.stroke({ width: 1, color: DesignTokens.borderDivider });
  
  // Add hover effect background (hidden by default)
  const hoverBg = new PIXI.Graphics();
  hoverBg.eventMode = 'passive'; // Let events pass through to container
  hoverBg.roundRect(-2, -2, bgWidth + 4, bgHeight + 4, 10);
  hoverBg.stroke({ width: 2, color: DesignTokens.brandBlue, alpha: 0.5 });
  hoverBg.visible = false;
  
  // Selection outline
  const selectionOutline = new PIXI.Graphics();
  selectionOutline.eventMode = 'passive'; // Let events pass through to container
  selectionOutline.roundRect(-2, -2, bgWidth + 4, bgHeight + 4, 10);
  selectionOutline.stroke({ width: 2, color: DesignTokens.brandBlue });
  selectionOutline.visible = false;
  
  // Position text in center of background
  text.x = sizeConfig.padding;
  text.y = sizeConfig.padding * 0.75;
  
  // Add elements to container
  container.addChild(hoverBg);
  container.addChild(selectionOutline);
  container.addChild(background);
  container.addChild(text);
  
  // Store references
  container.background = background;
  container.textElement = text;
  container.hoverBg = hoverBg;
  container.selectionOutline = selectionOutline;
  container.labelData = labelData;
  container.selected = false;
  
  // Set container position
  container.x = labelData.x;
  container.y = labelData.y;
  
  // Set hit area to match the background size
  container.hitArea = new PIXI.Rectangle(0, 0, bgWidth, bgHeight);
  
  return container;
};

/**
 * Update text label content and style
 * @param {PIXI.Container} container - The label container
 * @param {string} newText - New text content
 * @param {Object} newStyle - New style configuration
 */
export const updateTextLabel = (container, newText, newStyle) => {
  if (!container.textElement) return;
  
  const sizeConfig = LABEL_SIZES[newStyle.size] || LABEL_SIZES.LARGE;
  
  // Update text
  container.textElement.text = newText;
  container.textElement.style = {
    fontSize: sizeConfig.fontSize,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: newStyle.bold ? '700' : '400',
    fill: newStyle.color || DEFAULT_LABEL_STYLE.color,
    lineHeight: sizeConfig.fontSize * 1.2,
  };
  
  // Recalculate and update background
  const bgWidth = container.textElement.width + sizeConfig.padding * 2;
  const bgHeight = container.textElement.height + sizeConfig.padding * 1.5;
  
  // Redraw background
  container.background.clear();
  container.background.roundRect(0, 0, bgWidth, bgHeight, 8);
  
  const bgAlpha = newStyle.backgroundColor.includes('rgba') 
    ? parseFloat(newStyle.backgroundColor.match(/[\d.]+(?=\))/)[0]) 
    : 1;
  
  container.background.fill({ color: DesignTokens.backgroundPrimary, alpha: bgAlpha });
  container.background.stroke({ width: 1, color: DesignTokens.borderDivider });
  
  // Update hover background
  container.hoverBg.clear();
  container.hoverBg.roundRect(-2, -2, bgWidth + 4, bgHeight + 4, 10);
  container.hoverBg.stroke({ width: 2, color: DesignTokens.brandBlue, alpha: 0.5 });
  
  // Update selection outline
  container.selectionOutline.clear();
  container.selectionOutline.roundRect(-2, -2, bgWidth + 4, bgHeight + 4, 10);
  container.selectionOutline.stroke({ width: 2, color: DesignTokens.brandBlue });
  
  // Update stored data
  container.labelData.text = newText;
  container.labelData.style = newStyle;
  
  // Update hit area to match new background size
  container.hitArea = new PIXI.Rectangle(0, 0, bgWidth, bgHeight);
};

/**
 * Setup interactions for text label
 * @param {PIXI.Container} container - The label container
 * @param {Object} callbacks - Callback functions
 */
export const setupTextLabelInteractions = (container, callbacks) => {
  const { onSelect, onDragStart, onDragMove, onDragEnd, onDoubleClick } = callbacks;
  
  let dragData = null;
  let isDragging = false;
  
  container.on('pointerover', () => {
    if (!container.selected) {
      container.hoverBg.visible = true;
    }
    container.cursor = 'move';
  });
  
  container.on('pointerout', () => {
    container.hoverBg.visible = false;
  });
  
  let lastClickTime = 0;
  
  container.on('pointerdown', (e) => {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;
    
    // Check for double-click (within 300ms)
    if (timeSinceLastClick < 300) {
      // Double click - edit
      if (onDoubleClick) {
        onDoubleClick(container);
      }
      lastClickTime = 0; // Reset to prevent triple-click
    } else {
      // Single click - select and start drag immediately
      if (onSelect) onSelect(container, e);
      
      // Start drag
      if (onDragStart) {
        dragData = onDragStart(container, e);
        isDragging = !!dragData;
      }
      
      lastClickTime = currentTime;
    }
    
    e.stopPropagation();
  });
  
  container.on('pointermove', (e) => {
    if (isDragging && dragData && onDragMove) {
      onDragMove(container, e, dragData);
    }
  });
  
  container.on('pointerup', () => {
    if (isDragging && dragData && onDragEnd) {
      onDragEnd(container, dragData);
    }
    isDragging = false;
    dragData = null;
  });
  
  container.on('pointerupoutside', () => {
    if (isDragging && dragData && onDragEnd) {
      onDragEnd(container, dragData);
    }
    isDragging = false;
    dragData = null;
  });
};

/**
 * Create a label data object
 * @param {string} text - Label text
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} style - Style overrides
 * @returns {Object} - Label data
 */
export const createLabelData = (text, x, y, style = {}) => {
  return {
    id: Date.now() + Math.random(), // Unique ID
    text: text || 'New Label',
    x: x || 100,
    y: y || 100,
    style: {
      ...DEFAULT_LABEL_STYLE,
      ...style
    },
    createdAt: new Date().toISOString()
  };
};