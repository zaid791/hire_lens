import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse w-full max-w-4xl mx-auto">
      {/* ProfileCard Skeleton */}
      <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="w-16 h-16 rounded-full bg-gray-700" />
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-700 rounded" />
          <div className="h-4 w-48 bg-gray-700 rounded" />
        </div>
      </div>

      {/* StatsCards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-32" />
        ))}
      </div>

      {/* LanguageBars Skeleton */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-48" />

      {/* AnalysisCard Skeleton */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 h-64" />
    </div>
  );
};
