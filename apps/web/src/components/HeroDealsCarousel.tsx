import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '@ecommerce/shared';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeroDealsCarouselProps {
  banners: Banner[];
}

export const HeroDealsCarousel: React.FC<HeroDealsCarouselProps> = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeBanners = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentSlide] || activeBanners[0];

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="relative bg-slate-950 overflow-hidden shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="relative rounded-3xl overflow-hidden min-h-[280px] sm:min-h-[360px] md:min-h-[420px] flex items-center bg-slate-900 border border-slate-800 shadow-2xl">
          
          {/* Background Image with Gradient Overlay */}
          <img
            src={current.imageUrl}
            alt={current.title}
            className="absolute inset-0 h-full w-full object-cover opacity-45 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />

          {/* Banner Content */}
          <div className="relative z-10 max-w-xl p-6 sm:p-10 md:p-12 space-y-3 sm:space-y-4">
            {/* Tag / Timer */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-black text-slate-950 uppercase tracking-wider shadow-sm">
                <Zap className="h-3.5 w-3.5 fill-slate-950" />
                {current.tag || '⚡ GRAND FESTIVAL SALE'}
              </span>
              {current.dealTimer && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300">
                  <Clock className="h-3 w-3" />
                  {current.dealTimer}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {current.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium line-clamp-2">
              {current.subtitle}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={current.linkUrl || '/'}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-6 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <span>Shop Deals Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/?wholesale=true"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 px-4 py-3 text-xs sm:text-sm font-bold text-slate-200 transition"
              >
                <span>Wholesale Quantity Slabs</span>
              </Link>
            </div>
          </div>

          {/* Navigation Arrows */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-950/70 border border-slate-800 text-white hover:bg-amber-400 hover:text-slate-950 transition shadow-lg backdrop-blur-xs z-20"
                title="Previous Deal"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-950/70 border border-slate-800 text-white hover:bg-amber-400 hover:text-slate-950 transition shadow-lg backdrop-blur-xs z-20"
                title="Next Deal"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-800">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
