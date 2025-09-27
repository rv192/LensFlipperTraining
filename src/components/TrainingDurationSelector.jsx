import React from 'react';
import { TRAINING_DURATION_OPTIONS } from '../utils/constants';
import './TrainingDurationSelector.css';

const TrainingDurationSelector = ({ currentDuration, onDurationChange, disabled = false }) => {
  const handleDurationChange = (event) => {
    const newDuration = parseInt(event.target.value);
    onDurationChange(newDuration);
  };

  return (
    <div className="duration-selector">
      <label className="duration-label">训练时长:</label>
      <select 
        className="duration-select"
        value={currentDuration}
        onChange={handleDurationChange}
        disabled={disabled}
      >
        {Object.entries(TRAINING_DURATION_OPTIONS).map(([key, option]) => (
          <option key={key} value={option.seconds}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TrainingDurationSelector;