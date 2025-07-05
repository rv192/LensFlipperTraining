import React from 'react';
import { FONT_SIZE_CONFIG } from '../utils/constants';
import './FontSizeSelector.css';

const FontSizeSelector = ({ currentSize, onSizeChange }) => {
  const sizes = Object.keys(FONT_SIZE_CONFIG);

  return (
    <div className="font-size-selector">
      <div className="font-size-label">字体</div>
      <div className="font-size-options">
        {sizes.map((size) => (
          <button
            key={size}
            className={`font-size-option ${currentSize === size ? 'active' : ''}`}
            onClick={() => onSizeChange(size)}
            title={`${FONT_SIZE_CONFIG[size].name}字体`}
          >
            {FONT_SIZE_CONFIG[size].name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontSizeSelector;
