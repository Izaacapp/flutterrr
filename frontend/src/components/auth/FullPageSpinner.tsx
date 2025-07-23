import React from 'react';
import './FullPageSpinner.css';

export const FullPageSpinner: React.FC = () => {
  return (
    <div className="full-page-spinner">
      <div className="spinner-container">
        <div className="spinner-logo">
          ✈️
        </div>
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="spinner-text">
          Authenticating...
        </p>
        <div className="spinner-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};