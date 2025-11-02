
import React, { useState } from 'react';

interface ConfigModalProps {
  onConfirm: (width: number, height: number) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ onConfirm }) => {
  const [width, setWidth] = useState(29);
  const [height, setHeight] = useState(29);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (width > 0 && width <= 200 && height > 0 && height <= 200) {
      onConfirm(width, height);
    } else {
      setError('As dimensões devem estar entre 1 e 200.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Criar Nova Base</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Defina as dimensões para sua base digital.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Largura</label>
            <input
              type="number"
              id="width"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
              max="200"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Altura</label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
              max="200"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;