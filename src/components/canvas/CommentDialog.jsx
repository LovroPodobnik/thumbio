import React, { useState } from 'react';

const CommentDialog = ({
  position,
  viewportTransform,
  onSubmit,
  onCancel
}) => {
  const [comment, setComment] = useState('');

  return (
    <div
      className="absolute z-30"
      style={{
        left: `${position.x * viewportTransform.scale + viewportTransform.x}px`,
        top: `${position.y * viewportTransform.scale + viewportTransform.y}px`
      }}
    >
      <div className="bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 w-72">
        <textarea
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded resize-none focus:outline-none focus:border-blue-400"
          placeholder="Add a comment..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(comment);
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">Enter to submit, Esc to cancel</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(comment)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentDialog;