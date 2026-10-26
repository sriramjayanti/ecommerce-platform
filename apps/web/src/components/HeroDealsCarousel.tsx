import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '@ecommerce/shared';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';

interface HeroDealsCarouselProps {
  banners: Banner[];
}

export const HeroDealsCarousel: React.FC<HeroDealsCarouselProps> = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Read slide animation settings configured by admin
  const animationConfig = (() => {
    try {
      const stored = localStorage.getItem('dailyfresh_slide_animation_settings');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const effectType = animationConfig?.effect || 'slide-horizontal';
  const autoplaySpeed = Number(animationConfig?.interval) || 5000;
  const isAutoplayEnabled = animationConfig?.autoplay !== false;

  const activeBanners = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused || !isAutoplayEnabled) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused, isAutoplayEnabled, autoplaySpeed]);

  if (activeBanners.length === 0) return null;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative bg-slate-950 overflow-hidden shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[380px] md:min-h-[440px] flex items-center bg-slate-900 border border-slate-800 shadow-2xl">
          
          {/* Animated Slides Container */}
          <div
            className={`w-full h-full flex ${
              effectType === 'slide-horizontal'
                ? 'transition-transform duration-700 ease-out'
                : 'transition-opacity duration-700'
            }`}
            style={
              effectType === 'slide-horizontal'
                ? { transform: `translateX(-${currentSlide * 100}%)` }
                : undefined
            }
          >
            {activeBanners.map((banner, idx) => {
              const isCurrent = currentSlide === idx;

              return (
                <div
                  key={banner.id || idx}
                  className={`w-full flex-shrink-0 relative flex items-center min-h-[300px] sm:min-h-[380px] md:min-h-[440px] ${
                    effectType !== 'slide-horizontal'
                      ? isCurrent
                        ? 'opacity-100 relative z-10'
                        : 'opacity-0 absolute inset-0 pointer-events-none'
                      : ''
                  }`}
                >
                  {/* Background Image with Zoom & Dark Gradient */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ${
                      effectType === 'slide-zoom' && isCurrent
                        ? 'scale-110 opacity-55'
                        : 'scale-100 opacity-45'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />

                  {/* Banner Text Content */}
                  <div className="relative z-20 max-w-xl p-6 sm:p-10 md:p-12 space-y-3 sm:space-y-4">
                    {/* Tag / Timer Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-black text-slate-950 uppercase tracking-wider shadow-sm animate-pulse">
                        <Zap className="h-3.5 w-3.5 fill-slate-950" />
                        {banner.tag || '⚡ FRESH WHOLESALE DEALS'}
                      </span>
                      {banner.dealTimer && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300">
                          <Clock className="h-3 w-3" />
                          {banner.dealTimer}
                        </span>
                      )}
                    </div>

                    {/* Banner Headline */}
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                      {banner.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium line-clamp-2">
                      {banner.subtitle}
                    </p>

                    {/* CTA Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        to={banner.linkUrl || '/'}
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
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          {activeBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-950/70 border border-slate-800 text-white hover:bg-amber-400 hover:text-slate-950 transition shadow-lg backdrop-blur-xs z-30"
                title="Previous Slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-950/70 border border-slate-800 text-white hover:bg-amber-400 hover:text-slate-950 transition shadow-lg backdrop-blur-xs z-30"
                title="Next Slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Indicators & Play/Pause Bar */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-950/70 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-slate-800">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="text-slate-400 hover:text-amber-400 transition ml-1 p-0.5"
                title={isPaused ? 'Resume Autoplay' : 'Pause Autoplay'}
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
