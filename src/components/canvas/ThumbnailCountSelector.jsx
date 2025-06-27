import React from 'react';

const ThumbnailCountSelector = ({ value, onChange }) => {
  return (
    <div className="absolute top-4 left-4 z-10">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-background-primary border border-border-secondary rounded-lg px-3 py-2 text-compact"
      >
        <option value="10">10 Thumbnails</option>
        <option value="20">20 Thumbnails</option>
        <option value="30">30 Thumbnails</option>
        <option value="40">40 Thumbnails</option>
        <option value="50">50 Thumbnails (Max)</option>
      </select>
    </div>
  );
};

export default ThumbnailCountSelector;