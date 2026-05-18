import React from 'react';
import { LanguageStat } from '../types';

interface LanguageBarsProps {
  languageStats: LanguageStat[];
}

const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-pink-500',
];

export const LanguageBars: React.FC<LanguageBarsProps> = ({ languageStats }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full">
      <h3 className="text-xl font-bold text-white mb-4">Tech Stack</h3>
      <div className="space-y-4">
        {(languageStats || []).map((stat, index) => (
          <div key={stat.language}>
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>{stat.language}</span>
              <span>{stat.percentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${COLORS[index % COLORS.length]}`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
