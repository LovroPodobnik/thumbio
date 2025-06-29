/**
 * Selection utilities for rectangle selection and intersection logic
 */

export const createRectFromPoints = (startPoint, endPoint) => {
  return {
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y)
  };
};

export const getIntersectingThumbnails = (rect, thumbnailContainers) => {
  return thumbnailContainers.filter(container => {
    if (!container.userData || !container.userData.id) return false;
    
    const bounds = container.getBounds();
    return (
      rect.x < bounds.x + bounds.width &&
      rect.x + rect.width > bounds.x &&
      rect.y < bounds.y + bounds.height &&
      rect.y + rect.height > bounds.y
    );
  });
};

export const getIntersectingTextLabels = (rect, labelContainers) => {
  return labelContainers.filter(container => {
    if (!container.labelData || !container.labelData.id) return false;
    
    const bounds = container.getBounds();
    return (
      rect.x < bounds.x + bounds.width &&
      rect.x + rect.width > bounds.x &&
      rect.y < bounds.y + bounds.height &&
      rect.y + rect.height > bounds.y
    );
  });
};

export const updateSelectionVisuals = (containers, selectedIds, isSelected) => {
  containers.forEach(container => {
    const id = container.userData?.id || container.labelData?.id;
    if (!id) return;
    
    const shouldBeSelected = selectedIds.has(id);
    container.selected = shouldBeSelected;
    container.selectionOutline.visible = shouldBeSelected;
    
    if (!shouldBeSelected) {
      container.hoverOutline.visible = false;
      if (container.hoverBg) container.hoverBg.visible = false;
    }
  });
};

export const handleSelectionModifiers = (currentSelection, newSelection, modifierKeys) => {
  if (modifierKeys.shiftKey) {
    // Add to selection
    return new Set([...currentSelection, ...newSelection]);
  } else if (modifierKeys.metaKey || modifierKeys.ctrlKey) {
    // Toggle selection
    const result = new Set(currentSelection);
    newSelection.forEach(id => {
      if (result.has(id)) {
        result.delete(id);
      } else {
        result.add(id);
      }
    });
    return result;
  } else {
    // Replace selection
    return new Set(newSelection);
  }
};

export const clearHoverStates = (containers) => {
  containers.forEach(container => {
    if (!container.selected) {
      container.hoverOutline.visible = false;
      if (container.hoverBg) container.hoverBg.visible = false;
    }
  });
};