'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, Building2 } from 'lucide-react';

interface OrganizationCardProps {
  organization: {
    id: string;
    name: string;
    logo: string | null;
    rating: number;
    reliability: number;
    description: string | null;
  };
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization }) => {
  const { id, name, logo, rating, reliability, description } = organization;

  return (
    <div className="group relative bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col h-full">
      
      {/* Top Background Pattern */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-indigo-50 to-indigo-100/50 -z-10" />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Logo + Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center">
              {logo ? (
                <img src={logo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-indigo-300" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-500 text-sm font-medium">
                <Star className="w-4 h-4 fill-current mr-1" />
                {rating > 0 ? rating.toFixed(1) : 'Yangi'}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Badges / Stats */}
        <div className="flex flex-wrap gap-2 mb-4 mt-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ishonchlilik {reliability || 0}%
          </div>
        </div>

        {/* Action area */}
        <div className="pt-4 border-t border-gray-100/60 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors flex items-center gap-1">
            Tashkilot profili <span className="text-lg leading-none">&rarr;</span>
          </span>
        </div>
      </div>

      {/* Hover Overlay Link */}
      <Link href={`/organization/${id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Profilni ko'rish</span>
      </Link>
    </div>
  );
};

