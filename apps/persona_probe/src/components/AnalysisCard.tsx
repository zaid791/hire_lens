import React from 'react';
import { GeminiAnalysis } from '../types';

interface AnalysisCardProps {
  analysis: GeminiAnalysis;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  return (
    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full space-y-6">
      {/* Archetype Badge */}
      <div className="inline-block bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full text-lg font-bold border border-blue-700">
        🏷️ {analysis.archetype}
      </div>

      {/* Personality Summary */}
      <blockquote className="border-l-4 border-gray-500 pl-4 py-2 text-gray-300 italic text-lg">
        "{analysis.personality_summary}"
      </blockquote>

      {/* Top Strengths */}
      <div>
        <h4 className="text-white font-semibold mb-2">Top Strengths</h4>
        <ul className="space-y-1">
          {(analysis.top_strengths || []).map((strength, index) => (
            <li key={index} className="text-gray-300">✅ {strength}</li>
          ))}
        </ul>
      </div>

      {/* Blind Spot */}
      <div className="bg-amber-900/20 border border-amber-700 p-4 rounded-lg">
        <h4 className="text-amber-400 font-semibold mb-1">📈 Growth Area:</h4>
        <p className="text-amber-100">{analysis.blind_spot}</p>
      </div>

      {/* Recruiter Pitch */}
      <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
        <h4 className="text-green-400 font-semibold mb-1">💼 Recruiter View:</h4>
        <p className="text-green-100">{analysis.recruiter_pitch}</p>
      </div>
    </div>
  );
};
