"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CarouselSlide {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string | null;
  author: string;
  readingTime: number;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next, isPaused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative h-[400px] overflow-hidden rounded-lg md:h-[500px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <Link
          key={slide.id}
          href={`/post/${slide.slug}`}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
          )}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src={slide.coverImage}
              alt={slide.title}
              fill
              sizes="(min-width: 1024px) 80vw, 100vw"
              priority={i === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          </div>

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <div className="mx-auto max-w-3xl">
              {slide.category && (
                <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                  {slide.category}
                </span>
              )}
              <h2 className="display-serif mt-3 text-2xl font-bold leading-tight text-white md:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/80 md:text-base">
                {slide.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-white/70">
                <span>By {slide.author}</span>
                <span>·</span>
                <span>{slide.readingTime} min read</span>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-colors hover:bg-white/40"
            aria-label="Previous slide"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-colors hover:bg-white/40"
            aria-label="Next slide"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrent(i);
                }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current ? "w-8 bg-primary" : "w-2 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
