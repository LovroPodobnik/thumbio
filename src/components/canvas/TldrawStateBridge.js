import { createShapeId } from '@tldraw/tldraw';

/**
 * TldrawStateBridge - Connects tldraw editor with existing YouTube canvas state
 * 
 * This bridge handles:
 * - Importing YouTube thumbnails as tldraw shapes
 * - Syncing selection between tldraw and React state
 * - Converting between data formats
 * - Persisting canvas state
 */
export class TldrawStateBridge {
  constructor(tldrawEditor, canvasActions, selectionActions) {
    this.editor = tldrawEditor;
    this.canvasActions = canvasActions;
    this.selectionActions = selectionActions;
    
    // Track shape ID mappings
    this.videoIdToShapeId = new Map();
    this.shapeIdToVideoId = new Map();
    
    // Setup bidirectional sync
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for bidirectional state sync
   */
  setupEventListeners() {
    if (!this.editor) return;

    // Listen to tldraw selection changes
    this.editor.on('selection-change', this.handleTldrawSelectionChange.bind(this));
    
    // Listen to shape changes (position, properties)
    this.editor.on('change', this.handleTldrawChange.bind(this));
  }

  /**
   * Import YouTube thumbnails from existing canvas state
   */
  importYouTubeThumbnails(youtubeThumbnails, thumbnailPositions = {}) {
    if (!this.editor || !youtubeThumbnails.length) return;

    console.log('Importing', youtubeThumbnails.length, 'YouTube thumbnails');

    const shapes = youtubeThumbnails.map((thumbnail, index) => {
      const shapeId = createShapeId(`youtube-${thumbnail.id.videoId}`);
      
      // Store mappings
      this.videoIdToShapeId.set(thumbnail.id.videoId, shapeId);
      this.shapeIdToVideoId.set(shapeId, thumbnail.id.videoId);

      // Get position from existing state or default positioning
      const position = thumbnailPositions[thumbnail.id.videoId] || {
        x: 100 + (index % 4) * 350, // Grid layout
        y: 100 + Math.floor(index / 4) * 220
      };

      return {
        id: shapeId,
        type: 'youtube-thumbnail',
        x: position.x,
        y: position.y,
        props: {
          videoId: thumbnail.id.videoId,
          title: thumbnail.snippet.title,
          thumbnailUrl: this.getBestThumbnailUrl(thumbnail),
          channelName: thumbnail.snippet.channelTitle,
          views: this.parseViewCount(thumbnail.statistics?.viewCount),
          engagement: this.calculateEngagement(thumbnail.statistics),
          isViral: this.isVideoViral(thumbnail.statistics),
          zScore: this.calculateZScore(thumbnail.statistics),
          w: 320,
          h: 180,
          locked: false,
          showMetrics: true
        }
      };
    });

    // Create shapes in tldraw
    this.editor.createShapes(shapes);
    
    // Fit view to content
    setTimeout(() => {
      this.editor.zoomToFit();
    }, 100);

    console.log('Successfully imported thumbnails as tldraw shapes');
  }

  /**
   * Handle selection changes from tldraw
   */
  handleTldrawSelectionChange() {
    const selectedShapeIds = this.editor.getSelectedShapeIds();
    
    // Filter for YouTube thumbnail shapes
    const selectedVideoIds = selectedShapeIds
      .map(shapeId => this.shapeIdToVideoId.get(shapeId))
      .filter(Boolean);

    console.log('tldraw selection changed:', selectedVideoIds);

    // Update React state selection
    if (this.selectionActions?.setSelection) {
      this.selectionActions.setSelection(selectedVideoIds);
    }
  }

  /**
   * Handle any changes in tldraw (position, properties, etc.)
   */
  handleTldrawChange() {
    // For now, let's simplify and disable this to avoid API issues
    // We can add position tracking later once the basic integration works
    console.log('tldraw change detected - position tracking disabled for now');
  }

  /**
   * Update selection from React state (when thumbnails selected via UI)
   */
  syncSelectionFromReactState(selectedVideoIds) {
    if (!this.editor) return;

    const shapeIds = selectedVideoIds
      .map(videoId => this.videoIdToShapeId.get(videoId))
      .filter(Boolean);

    // Temporarily remove listener to avoid infinite loop
    this.editor.off('selection-change', this.handleTldrawSelectionChange);
    
    // Update tldraw selection
    this.editor.select(...shapeIds);
    
    // Re-add listener
    setTimeout(() => {
      this.editor.on('selection-change', this.handleTldrawSelectionChange.bind(this));
    }, 0);
  }

  /**
   * Toggle lock state for selected thumbnails
   */
  toggleLockSelected(selectedVideoIds) {
    if (!this.editor || !selectedVideoIds.length) return;

    const updates = selectedVideoIds.map(videoId => {
      const shapeId = this.videoIdToShapeId.get(videoId);
      const shape = this.editor.getShape(shapeId);
      
      if (shape) {
        return {
          id: shapeId,
          type: shape.type,
          props: {
            ...shape.props,
            locked: !shape.props.locked
          }
        };
      }
      return null;
    }).filter(Boolean);

    this.editor.updateShapes(updates);
  }

  /**
   * Update metrics display for selected thumbnails
   */
  toggleMetricsDisplay(selectedVideoIds, showMetrics) {
    if (!this.editor || !selectedVideoIds.length) return;

    const updates = selectedVideoIds.map(videoId => {
      const shapeId = this.videoIdToShapeId.get(videoId);
      const shape = this.editor.getShape(shapeId);
      
      if (shape) {
        return {
          id: shapeId,
          type: shape.type,
          props: {
            ...shape.props,
            showMetrics: showMetrics !== undefined ? showMetrics : !shape.props.showMetrics
          }
        };
      }
      return null;
    }).filter(Boolean);

    this.editor.updateShapes(updates);
  }

  /**
   * Get the best available thumbnail URL
   */
  getBestThumbnailUrl(thumbnail) {
    const thumbnails = thumbnail.snippet.thumbnails;
    
    // Priority: maxres > high > medium > default
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    return thumbnails.default?.url || '';
  }

  /**
   * Parse view count string to number
   */
  parseViewCount(viewCountStr) {
    if (!viewCountStr) return 0;
    return parseInt(viewCountStr, 10) || 0;
  }

  /**
   * Calculate engagement percentage
   */
  calculateEngagement(statistics) {
    if (!statistics) return 0;
    
    const views = parseInt(statistics.viewCount || '0', 10);
    const likes = parseInt(statistics.likeCount || '0', 10);
    const comments = parseInt(statistics.commentCount || '0', 10);
    
    if (views === 0) return 0;
    
    const engagementActions = likes + comments;
    return Math.round((engagementActions / views) * 100 * 100) / 100; // 2 decimal places
  }

  /**
   * Determine if video is viral based on metrics
   */
  isVideoViral(statistics) {
    if (!statistics) return false;
    
    const views = parseInt(statistics.viewCount || '0', 10);
    const engagement = this.calculateEngagement(statistics);
    
    // Simple viral criteria (can be customized)
    return views > 1000000 && engagement > 5;
  }

  /**
   * Calculate z-score for performance ranking
   */
  calculateZScore(statistics) {
    if (!statistics) return 0;
    
    // Simplified z-score calculation
    // In real implementation, this would compare against channel averages
    const views = parseInt(statistics.viewCount || '0', 10);
    const engagement = this.calculateEngagement(statistics);
    
    // Combine views and engagement into a simple score
    return Math.round((Math.log10(views + 1) + engagement / 10) * 100) / 100;
  }

  /**
   * Export current tldraw state for persistence
   */
  exportCanvasState() {
    if (!this.editor) return null;

    const allShapes = this.editor.getShapes();
    const thumbnailShapes = allShapes.filter(shape => shape.type === 'youtube-thumbnail');
    
    const thumbnailPositions = {};
    const thumbnailSettings = {};
    
    thumbnailShapes.forEach(shape => {
      const videoId = this.shapeIdToVideoId.get(shape.id);
      if (videoId) {
        thumbnailPositions[videoId] = { x: shape.x, y: shape.y };
        thumbnailSettings[videoId] = {
          locked: shape.props.locked,
          showMetrics: shape.props.showMetrics
        };
      }
    });

    return {
      thumbnailPositions,
      thumbnailSettings,
      viewport: {
        camera: this.editor.getCamera(),
        zoom: this.editor.getZoomLevel()
      }
    };
  }

  /**
   * Import canvas state and restore positions/settings
   */
  importCanvasState(canvasState) {
    if (!this.editor || !canvasState) return;

    // Restore viewport
    if (canvasState.viewport) {
      if (canvasState.viewport.camera) {
        this.editor.setCamera(canvasState.viewport.camera);
      }
    }

    // Update shape settings
    if (canvasState.thumbnailSettings) {
      const updates = [];
      
      Object.entries(canvasState.thumbnailSettings).forEach(([videoId, settings]) => {
        const shapeId = this.videoIdToShapeId.get(videoId);
        const shape = this.editor.getShape(shapeId);
        
        if (shape) {
          updates.push({
            id: shapeId,
            type: shape.type,
            props: {
              ...shape.props,
              ...settings
            }
          });
        }
      });
      
      if (updates.length > 0) {
        this.editor.updateShapes(updates);
      }
    }
  }

  /**
   * Cleanup when bridge is destroyed
   */
  destroy() {
    if (this.editor) {
      this.editor.off('selection-change', this.handleTldrawSelectionChange);
      this.editor.off('change', this.handleTldrawChange);
    }
    
    this.videoIdToShapeId.clear();
    this.shapeIdToVideoId.clear();
  }
}