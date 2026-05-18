import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [username, setUsername] = useState('');

  const handleSearch = () => {
    if (username.trim()) {
      onSearch(username.trim());
    }
  };

  return (
    <div className="flex justify-center items-center w-full p-4">
      <div className={`flex w-full max-w-md gap-2 p-1 rounded-lg bg-gray-900 border ${isLoading ? 'border-blue-500 animate-pulse' : 'border-gray-700'}`}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter GitHub username..."
          disabled={isLoading}
          className="flex-grow bg-transparent text-white px-4 py-2 outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !username.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </div>
  );
};
