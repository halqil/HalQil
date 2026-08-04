'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, DollarSign } from 'lucide-react';

interface ServiceTypeCardProps {
  serviceType: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    pricingType: string;
    fixedPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
  categorySlug?: string;
  skillSlug?: string;
  href?: string;
}

export const ServiceTypeCard: React.FC<ServiceTypeCardProps> = ({ serviceType, categorySlug, skillSlug, href }) => {
  const { name, slug, description, pricingType, fixedPrice, minPrice, maxPrice } = serviceType;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(price);
  };

  let displayPrice = 'Kelishilgan narxda';
  if (pricingType === 'FIXED' && fixedPrice) {
    displayPrice = formatPrice(fixedPrice);
  } else if (pricingType === 'RANGE' && minPrice) {
    displayPrice = maxPrice ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}` : `dan ${formatPrice(minPrice)}`;
  } else if (pricingType === 'STARTING_AT' && minPrice) {
    displayPrice = `dan ${formatPrice(minPrice)}`;
  }

  const finalHref = href || `/catalog/${categorySlug}/${skillSlug}/${slug}`;

  return (
    <Link href={finalHref} className="group block h-full">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col h-full relative overflow-hidden">
        
        {/* Hover Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {name}
          </h3>
          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors flex-shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
            {description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100/80 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Boshlang'ich narx</span>
            <span className="text-sm font-semibold text-gray-900">{displayPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
