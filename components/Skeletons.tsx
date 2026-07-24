"use client";

import React from "react";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded-xl border border-white/10 relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#c3f400]/10 to-transparent animate-[shimmer_1.8s_infinite]" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Top Leagues Skeleton */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <SkeletonBox className="w-28 h-4 rounded-md" />
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <SkeletonBox className="w-16 h-16 rounded-full" />
              <SkeletonBox className="w-10 h-3 rounded-sm" />
            </div>
          ))}
        </div>
      </section>

      {/* Live Section Skeleton */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-2">
            <SkeletonBox className="w-32 h-6 rounded-md" />
            <SkeletonBox className="w-24 h-3 rounded-full" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} className="w-16 h-7 rounded-full" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between h-[210px] relative overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <SkeletonBox className="w-14 h-6 rounded-full" />
                <SkeletonBox className="w-20 h-4 rounded-md" />
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <SkeletonBox className="w-14 h-14 rounded-full" />
                  <SkeletonBox className="w-20 h-4 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-10 h-12 rounded-lg" />
                  <SkeletonBox className="w-4 h-6 rounded-sm" />
                  <SkeletonBox className="w-10 h-12 rounded-lg" />
                </div>
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <SkeletonBox className="w-14 h-14 rounded-full" />
                  <SkeletonBox className="w-20 h-4 rounded-md" />
                </div>
              </div>
              <SkeletonBox className="w-full h-1.5 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Finished Matches Skeleton */}
      <section>
        <SkeletonBox className="w-48 h-6 rounded-md mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between h-[150px]"
            >
              <div className="flex justify-between items-center">
                <SkeletonBox className="w-12 h-5 rounded-full" />
                <SkeletonBox className="w-24 h-4 rounded-md" />
              </div>
              <div className="flex justify-between items-center py-1">
                <div className="flex flex-col items-center gap-1.5 w-1/3">
                  <SkeletonBox className="w-10 h-10 rounded-full" />
                  <SkeletonBox className="w-16 h-3 rounded-md" />
                </div>
                <SkeletonBox className="w-24 h-8 rounded-lg" />
                <div className="flex flex-col items-center gap-1.5 w-1/3">
                  <SkeletonBox className="w-10 h-10 rounded-full" />
                  <SkeletonBox className="w-16 h-3 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function MatchDetailSkeleton() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stadium Hero Skeleton */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-[#c3f400]/20 relative overflow-hidden bg-[#131313]/90">
        <div className="flex justify-between items-center mb-8">
          <SkeletonBox className="w-24 h-8 rounded-full" />
          <SkeletonBox className="w-36 h-6 rounded-full" />
          <SkeletonBox className="w-10 h-8 rounded-full" />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 my-6">
          <div className="flex flex-col items-center gap-3 w-full md:w-1/3">
            <SkeletonBox className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl" />
            <SkeletonBox className="w-32 h-6 rounded-md" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <SkeletonBox className="w-28 h-8 rounded-full" />
            <div className="flex items-center gap-4 my-2">
              <SkeletonBox className="w-16 h-20 rounded-2xl" />
              <SkeletonBox className="w-6 h-8 rounded-sm" />
              <SkeletonBox className="w-16 h-20 rounded-2xl" />
            </div>
            <SkeletonBox className="w-20 h-5 rounded-full" />
          </div>

          <div className="flex flex-col items-center gap-3 w-full md:w-1/3">
            <SkeletonBox className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl" />
            <SkeletonBox className="w-32 h-6 rounded-md" />
          </div>
        </div>
      </div>

      {/* Tabs & Stats Skeleton */}
      <div className="space-y-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} className="w-28 h-10 rounded-xl flex-shrink-0" />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <SkeletonBox className="w-10 h-4 rounded-sm" />
                <SkeletonBox className="w-28 h-4 rounded-sm" />
                <SkeletonBox className="w-10 h-4 rounded-sm" />
              </div>
              <SkeletonBox className="w-full h-2.5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GamesSkeleton() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* User Stats Card Skeleton */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#c3f400]/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <SkeletonBox className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2 w-full">
            <SkeletonBox className="w-40 h-6 rounded-md" />
            <SkeletonBox className="w-56 h-4 rounded-md" />
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <SkeletonBox className="w-28 h-12 rounded-2xl" />
          <SkeletonBox className="w-28 h-12 rounded-2xl" />
        </div>
      </div>

      {/* Game Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card rounded-3xl p-6 border border-white/10 h-[240px] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <SkeletonBox className="w-14 h-14 rounded-2xl" />
              <SkeletonBox className="w-20 h-6 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBox className="w-36 h-6 rounded-md" />
              <SkeletonBox className="w-full h-4 rounded-md" />
            </div>
            <SkeletonBox className="w-full h-11 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
