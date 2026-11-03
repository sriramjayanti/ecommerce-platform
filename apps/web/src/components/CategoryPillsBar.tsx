import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@ecommerce/shared';
import { LayoutGrid } from 'lucide-react';

interface CategoryPillsBarProps {
  categories: Category[];
}

export const CategoryPillsBar: React.FC<CategoryPillsBarProps> = ({ categories }) => {
  return (
    <div className="bg-white border-b border-slate-200/80 shadow-2xs py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-1">
          
          {/* All Categories Circular Pill - Opens Hamburger Menu Drawer */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-category-drawer'))}
            className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
            aria-label="Open Categories Menu"
          >
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md group-hover:scale-105 transition duration-300">
              <div className="h-full w-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-emerald-400">
                <LayoutGrid className="h-6 w-6 stroke-[2.2px]" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-black text-slate-800 mt-1.5 group-hover:text-emerald-600 transition tracking-tight">
              Categories
            </span>
          </button>

          {/* Dynamic Categories Created by Admin */}
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug || cat.id}`}
              className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
            >
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-slate-100 p-0.5 border border-slate-200 shadow-2xs group-hover:border-emerald-500 group-hover:shadow-md group-hover:scale-105 transition duration-300 overflow-hidden">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                  alt={cat.name}
                  className="h-full w-full object-cover rounded-full group-hover:scale-110 transition duration-500"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1.5 group-hover:text-emerald-600 transition tracking-tight max-w-[80px] sm:max-w-[100px] text-center truncate">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
