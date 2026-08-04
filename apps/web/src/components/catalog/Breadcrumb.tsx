'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-sm text-gray-500 mb-6 bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/40 shadow-sm w-max max-w-full overflow-x-auto hide-scrollbar">
      <Link href="/" className="hover:text-primary-600 transition-colors flex items-center">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="text-gray-900 font-medium whitespace-nowrap">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary-600 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
