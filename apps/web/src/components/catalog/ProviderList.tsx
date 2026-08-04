'use client';

import React from 'react';
import { ProviderCard } from './ProviderCard';
import { Frown } from 'lucide-react';

interface ProviderListProps {
  providers: any[];
  emptyMessage?: string;
}

export const ProviderList: React.FC<ProviderListProps> = ({ 
  providers, 
  emptyMessage = "Hozircha bu yo'nalishda mutaxassislar yo'q." 
}) => {
  if (!providers || providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Frown className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Topilmadi</h3>
        <p className="text-sm text-gray-500 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
};
