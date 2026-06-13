import React from 'react';
import { FullProfile } from '../types';

interface StatsCardsProps {
  profile: FullProfile;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ profile }) => {
  const topLanguage = profile.languageStats && profile.languageStats.length > 0 ? profile.languageStats[0] : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {/* Total Public Repos */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
        <div className="text-4xl mb-2">📦</div>
        <div className="text-3xl font-bold text-white mb-1">
          {profile.profile.public_repos}
        </div>
        <div className="text-sm text-gray-400">Public Repos</div>
      </div>

      {/* Top Language */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-blue-400 mb-1">
          {topLanguage ? `${topLanguage.percentage}%` : 'N/A'}
        </div>
        <div className="text-lg font-semibold text-white mb-1">
          {topLanguage ? topLanguage.language : 'No Data'}
        </div>
        <div className="text-sm text-gray-400">Top Language</div>
      </div>

      {/* Commit Pattern */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
        <div className="text-xl font-bold text-white mb-1">
          {profile.commitPattern?.most_active_day || 'N/A'}
        </div>
        <div className="text-sm font-semibold text-green-400 mb-1">
          {profile.commitPattern?.pattern_label || 'No Data'}
        </div>
        <div className="text-sm text-gray-400">Most Active Day</div>
      </div>
    </div>
  );
};
