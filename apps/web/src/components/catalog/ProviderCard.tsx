'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, Briefcase } from 'lucide-react';

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    avatar: string | null;
    reliability: number;
    rating: number;
    workMode: string;
    skills?: {
      id: string;
      name: string;
      price_from: number | null;
      price_to: number | null;
    }[];
  };
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const { id, name, avatar, reliability, rating, workMode, skills } = provider;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(price);
  };

  // Compute display price based on skills
  let displayPrice = 'Kelishilgan narxda';
  if (skills && skills.length > 0) {
    const prices = skills.filter(s => s.price_from !== null).map(s => s.price_from as number);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      displayPrice = `dan ${formatPrice(minPrice)}`;
    }
  }

  return (
    <div className="group relative bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col h-full">
      
      {/* Top Background Pattern */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary-50 to-primary-100/50 -z-10" />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Avatar + Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 font-semibold text-xl">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* If we had isOnline, we'd show it here. Removing since it's not in the simple response */}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
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

        {/* Badges / Stats */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ishonchlilik {reliability || 0}%
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
            <Briefcase className="w-3.5 h-3.5" />
            {workMode === 'INDEPENDENT' ? 'Mustaqil usta' : workMode === 'ORGANIZED' ? 'Firma xodimi' : workMode === 'UNORGANIZED' ? 'Firma xodimi emas' : 'Aralash'}
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-4 border-t border-gray-100/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Xizmat narxi</p>
            <p className="text-sm font-semibold text-gray-900">{displayPrice}</p>
          </div>
        </div>
      </div>

      {/* Hover Overlay Link */}
      <Link href={`/provider/${id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Profilni ko'rish</span>
      </Link>
    </div>
  );
};
