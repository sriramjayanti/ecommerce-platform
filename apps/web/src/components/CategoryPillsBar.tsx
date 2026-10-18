import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@ecommerce/shared';
import { Zap, Sparkles } from 'lucide-react';

interface CategoryPillsBarProps {
  categories: Category[];
}

export const CategoryPillsBar: React.FC<CategoryPillsBarProps> = ({ categories }) => {
  return (
    <div className="bg-white border-b border-slate-200/80 shadow-2xs py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-1">
          
          {/* Top Deals Circular Pill */}
          <Link
            to="/?badge=Deal+of+the+Day"
            className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
          >
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md group-hover:scale-105 transition duration-300">
              <div className="h-full w-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-amber-400">
                <Zap className="h-6 w-6 fill-amber-400 animate-bounce" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-black text-slate-800 mt-1.5 group-hover:text-amber-600 transition tracking-tight">
              Top Deals
            </span>
          </Link>

          {/* Dynamic Categories */}
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug || cat.id}`}
              className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
            >
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-2xs group-hover:border-amber-400 group-hover:shadow-md group-hover:scale-105 transition duration-300 overflow-hidden">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                  alt={cat.name}
                  className="h-full w-full object-cover rounded-full group-hover:scale-110 transition duration-500"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1.5 group-hover:text-amber-600 transition tracking-tight max-w-[80px] sm:max-w-[100px] text-center truncate">
                {cat.name.split(' ')[0]}
              </span>
            </Link>
          ))}

          {/* Wholesale Bulk Store */}
          <Link
            to="/?wholesale=true"
            className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
          >
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md group-hover:scale-105 transition duration-300">
              <div className="h-full w-full rounded-full bg-emerald-950 flex flex-col items-center justify-center text-emerald-300">
                <span className="text-[10px] font-black uppercase text-amber-300">Wholesale</span>
                <span className="text-xs font-black">25%+ OFF</span>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-black text-emerald-800 mt-1.5 group-hover:text-emerald-600 transition tracking-tight">
              Wholesale Slabs
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
