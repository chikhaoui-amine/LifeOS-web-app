
import React, { ReactNode } from 'react';

interface SettingSectionProps {
  title?: string;
  children: ReactNode;
}

export const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => {
  return (
    <div className="mb-6">
      {title && (
        <h2 className="px-1 mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {children}
      </div>
    </div>
  );
};
