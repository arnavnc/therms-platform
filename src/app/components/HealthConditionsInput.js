'use client';
import { useState } from 'react';

export default function HealthConditionsInput({ conditions, setConditions }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newCondition = inputValue.trim();
      if (!conditions.includes(newCondition)) {
        setConditions([...conditions, newCondition]);
      }
      setInputValue('');
    }
  };

  const removeCondition = (indexToRemove) => {
    setConditions(conditions.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {conditions.map((condition, index) => (
          <span
            key={index}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
          >
            {condition}
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Type a condition and press Enter"
      />
    </div>
  );
}