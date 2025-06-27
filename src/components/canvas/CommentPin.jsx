import React from 'react';

const CommentPin = ({ 
  comment, 
  index, 
  viewportTransform, 
  draggedComment,
  onMouseDown,
  onEditClick,
  onResolveToggle,
  onDelete,
  onClose,
  editingComment 
}) => {
  const isBeingDragged = draggedComment === comment.id;
  const isEditing = editingComment === comment.id;

  return (
    <div
      className={`absolute z-20 comment-draggable ${
        isBeingDragged ? 'comment-dragging' : ''
      }`}
      style={{
        left: `${comment.x * viewportTransform.scale + viewportTransform.x}px`,
        top: `${comment.y * viewportTransform.scale + viewportTransform.y}px`,
        transform: `scale(${Math.min(1, 1 / viewportTransform.scale)})`,
        transition: isBeingDragged ? 'none' : 'transform 0.1s ease-out'
      }}
      onMouseDown={onMouseDown}
    >
      <div className="relative">
        <button
          className={`comment-pin w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all hover:scale-110 ${
            comment.resolved ? 'bg-green-500' : 'bg-blue-600'
          }`}
          onClick={onEditClick}
        >
          {comment.resolved ? '✓' : index + 1}
        </button>
        
        {/* Comment bubble (shown only when editing/clicked) */}
        <div className={`absolute top-10 left-0 ${
          isEditing ? 'opacity-100' : 'opacity-0'
        } ${
          isBeingDragged ? 'opacity-0 pointer-events-none' : isEditing ? 'pointer-events-auto' : 'pointer-events-none'
        } transition-opacity duration-200`}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-64 pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{comment.author}</span>
              <span className="text-xs text-gray-500">
                {new Date(comment.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={onResolveToggle}
                className="text-xs text-green-600 hover:underline"
              >
                {comment.resolved ? 'Unresolve' : 'Resolve'}
              </button>
              <button 
                onClick={onDelete}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
              <button 
                onClick={onClose}
                className="text-xs text-gray-600 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentPin;