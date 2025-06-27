import React, { useState, useRef, useEffect } from 'react';

const TextLabelEditDialog = ({ 
  label, 
  position, 
  viewportTransform, 
  onSave, 
  onCancel 
}) => {
  const [text, setText] = useState(label.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim());
    }
  };

  // Calculate position for the dialog
  const dialogStyle = {
    position: 'absolute',
    left: `${position.x * viewportTransform.scale + viewportTransform.x}px`,
    top: `${position.y * viewportTransform.scale + viewportTransform.y}px`,
    transform: 'translate(-50%, -100%)',
    marginTop: '-10px'
  };

  return (
    <div 
      style={dialogStyle}
      className="z-50"
    >
      <form 
        onSubmit={handleSubmit}
        className="bg-background-primary border border-border-divider rounded-lg shadow-xl p-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onCancel();
            }
          }}
          className="w-64 px-3 py-2 text-body bg-background-primary border border-border-divider rounded focus:outline-none focus:ring-2 focus:ring-background-brand focus:border-transparent"
          placeholder="Enter label text..."
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 py-1.5 bg-background-brand text-text-on-brand text-caption-bold rounded hover:bg-background-brand-hover transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-1.5 bg-background-secondary text-text-primary text-caption-bold rounded hover:bg-neutral-20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextLabelEditDialog;