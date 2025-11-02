import React from 'react';

interface DimensionDisplayProps {
  width: number;
  height: number;
}

const DimensionDisplay: React.FC<DimensionDisplayProps> = ({ width, height }) => {
  return (
    <div className="absolute bottom-4 md:bottom-auto md:top-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 z-20 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
      <div className="flex items-center space-x-2 md:space-x-3">
        <span>Largura: <span className="font-semibold text-gray-900 dark:text-white">{width}</span></span>
        <span>Altura: <span className="font-semibold text-gray-900 dark:text-white">{height}</span></span>
      </div>
    </div>
  );
};

export default DimensionDisplay;