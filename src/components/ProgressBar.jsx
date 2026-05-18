/**
 * ProgressBar Component - Enhanced for adaptive assessment
 * Shows progress with path indicators and dynamic step counts
 */

import React from 'react';

function ProgressBar({ 
  current, 
  total, 
  path, 
  showStepNumbers = true,
  showPathIndicator = false 
}) {
  // Use current step directly (1-based), fallback to old behavior for compatibility  
  const currentStep = current || 1;
  const totalSteps = total || 8;
  const percentage = Math.round((currentStep / totalSteps) * 100);

  const getPathDescription = (pathLetter) => {
    switch(pathLetter) {
      case "A": return "Essential Assessment";
      case "B": return "Complete Assessment";  
      case "C": return "Expert Assessment";
      default: return "AI Level Assessment";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Path indicator */}
      {showPathIndicator && path && (
        <div className="text-center mb-3">
          <span className="text-xs text-blue-400/60 font-medium">
            Path {path} • {getPathDescription(path)}
          </span>
        </div>
      )}
      
      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 bg-gray-800/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {/* Step numbers */}
        {showStepNumbers && (
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Step {currentStep}</span>
            <span>{totalSteps} total</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressBar;