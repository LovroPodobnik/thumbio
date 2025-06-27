import React from 'react';

const SelectionIndicator = ({ count }) => {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-background-primary border border-border-secondary rounded-lg p-4">
      <div className="text-body-bold">{count} items selected</div>
    </div>
  );
};

export default SelectionIndicator;