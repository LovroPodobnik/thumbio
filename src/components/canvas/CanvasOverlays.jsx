import React from 'react';
import CommentPin from './CommentPin';
import CommentDialog from './CommentDialog';
import ThumbnailActions from './ThumbnailActions';
import SelectionIndicator from './SelectionIndicator';
import RemoteCursors from './RemoteCursors';

/**
 * CanvasOverlays Component
 * 
 * Renders all overlay elements on top of the canvas:
 * - Comment pins and dialogs
 * - Thumbnail action buttons
 * - Selection indicators
 * - Remote multiplayer cursors
 */
const CanvasOverlays = ({
  // Comment props
  comments,
  pendingCommentPos,
  editingComment,
  draggedComment,
  viewportTransform,
  onCommentSubmit,
  onCommentMouseDown,
  onCommentEdit,
  onCommentResolve,
  onCommentDelete,
  onCommentClose,
  onCommentCancel,

  // Thumbnail props
  selectedThumbnails,
  thumbnailPositions,
  lockedThumbnails,
  onThumbnailInfoClick,
  onThumbnailCritiqueClick,
  onThumbnailToggleVisibility,

  // Selection props
  selectionCount,

  // Multiplayer props
  isMultiplayerEnabled,
  remoteCursors
}) => {
  return (
    <>
      {/* Comment pins on canvas */}
      {comments.map((comment, index) => (
        <CommentPin
          key={comment.id}
          comment={comment}
          index={index}
          viewportTransform={viewportTransform}
          draggedComment={draggedComment}
          editingComment={editingComment}
          onMouseDown={(e) => onCommentMouseDown(e, comment.id)}
          onEditClick={() => onCommentEdit(comment.id)}
          onResolveToggle={() => onCommentResolve(comment.id)}
          onDelete={() => onCommentDelete(comment.id)}
          onClose={onCommentClose}
        />
      ))}
      
      {/* Comment input dialog */}
      {pendingCommentPos && (
        <CommentDialog
          position={pendingCommentPos}
          viewportTransform={viewportTransform}
          onSubmit={onCommentSubmit}
          onCancel={onCommentCancel}
        />
      )}

      {/* Thumbnail action buttons for selected thumbnails */}
      {selectedThumbnails.map(thumb => {
        const savedPos = thumbnailPositions[thumb.id];
        const position = {
          x: savedPos ? savedPos.x : thumb.x,
          y: savedPos ? savedPos.y : thumb.y
        };
        
        return (
          <ThumbnailActions
            key={`actions-${thumb.id}`}
            thumbnail={thumb}
            position={position}
            viewportTransform={viewportTransform}
            isLocked={lockedThumbnails.has(thumb.id)}
            onInfoClick={onThumbnailInfoClick}
            onCritiqueClick={() => onThumbnailCritiqueClick(thumb)}
            onToggleVisibility={() => onThumbnailToggleVisibility(thumb.id)}
          />
        );
      })}

      {/* Selection indicator for multiple items */}
      {selectionCount > 1 && (
        <SelectionIndicator count={selectionCount} />
      )}

      {/* Remote Cursors Layer */}
      {isMultiplayerEnabled && (
        <RemoteCursors 
          cursors={remoteCursors} 
          viewportTransform={viewportTransform}
        />
      )}
    </>
  );
};

export default CanvasOverlays;