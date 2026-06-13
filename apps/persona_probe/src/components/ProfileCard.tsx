import React from 'react';
import { GitHubProfile } from '../types';

interface ProfileCardProps {
  profile: GitHubProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  return (
    <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700 w-full">
      <img
        src={profile.avatar_url}
        alt={profile.login}
        className="w-16 h-16 rounded-full border-2 border-gray-600"
        referrerPolicy="no-referrer"
      />
      <div className="flex flex-col">
        <a
          href={profile.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors"
        >
          @{profile.login}
        </a>
        {profile.bio && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{profile.bio}</p>
        )}
      </div>
    </div>
  );
};
