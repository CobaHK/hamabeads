import React from 'react';
import { Tool } from '../types';
import { TOOLS, ToolIcons } from '../constants';

interface ToolbarProps {
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setCurrentTool, onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded-lg shadow-lg flex items-center space-x-1 md:space-x-2 border border-gray-200 dark:border-gray-700">
      {TOOLS.map(({ id, name }) => (
        <button
          key={id}
          title={name}
          onClick={() => setCurrentTool(id)}
          className={`p-2 md:p-3 rounded-md transition-colors duration-150 touch-manipulation ${currentTool === id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          <div className="w-5 h-5 md:w-6 md:h-6">{ToolIcons[id]}</div>
        </button>
      ))}
      <div className="w-px h-6 md:h-8 bg-gray-200 dark:bg-gray-600 mx-0.5 md:mx-1"></div>
      <button onClick={onUndo} disabled={!canUndo} title="Desfazer" className="p-2 md:p-3 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8A5 5 0 009 9V5" /></svg>
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Refazer" className="p-2 md:p-3 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 15l3-3m0 0l-3-3m3 3H8a5 5 0 00-5 5v2" /></svg>
      </button>
    </div>
  );
};

export default Toolbar;