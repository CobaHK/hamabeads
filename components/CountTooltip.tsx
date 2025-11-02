import React from 'react';

interface CountTooltipProps {
  count: number;
  x: number;
  y: number;
}

const CountTooltip: React.FC<CountTooltipProps> = ({ count, x, y }) => {
  return (
    <div 
      className="fixed z-50 px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-md shadow-lg pointer-events-none transform -translate-y-full -translate-x-1/2 animate-fade-in-up"
      style={{ top: y - 15, left: x }}
    >
      {count} {count === 1 ? 'conta' : 'contas'}
    </div>
  );
};

export default CountTooltip;