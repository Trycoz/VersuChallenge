"use client";

import React from "react";

export function ForecastSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Alerta Ejecutiva Skeleton */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl w-full">
          <div className="h-3 w-36 bg-slate-300 rounded" />
          <div className="h-6 w-3/4 bg-slate-300/80 rounded" />
          <div className="h-3 w-full bg-slate-200 rounded" />
        </div>
        <div className="space-y-1.5 md:text-right shrink-0">
          <div className="h-3 w-28 bg-slate-200 rounded md:ml-auto" />
          <div className="h-8 w-20 bg-slate-300 rounded md:ml-auto" />
          <div className="h-2.5 w-24 bg-slate-200 rounded md:ml-auto" />
        </div>
      </div>

      {/* 2. Cuatro Hero KPIs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-7 w-36 bg-slate-300 rounded" />
            <div className="h-2.5 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Gráfico Principal Skeleton */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-1.5">
            <div className="h-4 w-52 bg-slate-300 rounded" />
            <div className="h-3 w-72 bg-slate-200 rounded" />
          </div>
          <div className="h-7 w-44 bg-slate-100 rounded" />
        </div>

        {/* Sensibilidad bar mockup */}
        <div className="h-10 bg-slate-50 border border-slate-100 rounded p-3 flex justify-between items-center">
          <div className="h-3 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-200 rounded" />
        </div>

        {/* Chart canvas skeleton */}
        <div className="h-72 w-full bg-slate-50/70 border border-slate-100 rounded flex flex-col justify-end p-4 gap-4">
          <div className="flex items-end justify-between h-48 px-4 gap-3">
            {[40, 65, 80, 60, 45, 30, 20, 15, 10, 5, 0].map((h, idx) => (
              <div
                key={idx}
                className="w-full bg-slate-200/70 rounded-t"
                style={{ height: `${Math.max(10, h)}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between border-t border-slate-200/60 pt-2 px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-2.5 w-8 bg-slate-200 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Columnas Inferiores Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna Izquierda */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <div className="h-3.5 w-44 bg-slate-300 rounded" />
            <div className="h-3.5 w-24 bg-slate-200 rounded" />
          </div>
          <div className="space-y-3 pt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
                <div className="h-1.5 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <div className="h-3.5 w-44 bg-slate-300 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 rounded border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-2.5 w-28 bg-slate-200 rounded" />
                  <div className="h-3.5 w-40 bg-slate-300 rounded" />
                </div>
                <div className="h-4 w-20 bg-slate-300 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollectionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header de Estrategia Skeleton */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl w-full">
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-6 w-3/4 bg-slate-300 rounded" />
          <div className="h-3 w-full bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-48 bg-slate-200 rounded shrink-0" />
      </div>

      {/* 2. KPIs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-7 w-24 bg-slate-300 rounded" />
            <div className="h-2.5 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Filtros Skeleton */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="h-8 w-72 bg-slate-100 rounded" />
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-7 w-16 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 w-14 bg-slate-100 rounded" />
            ))}
          </div>
          <div className="h-4 w-36 bg-slate-100 rounded" />
        </div>
      </div>

      {/* 4. Tabla Skeleton */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        {/* Table header */}
        <div className="bg-slate-50 border-b border-slate-200 py-3 px-4 flex items-center justify-between">
          <div className="h-3 w-6 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-36 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
        </div>

        {/* 7 table rows */}
        <div className="divide-y divide-slate-100">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="h-3 w-6 bg-slate-100 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded" />
              <div className="space-y-1 w-44">
                <div className="h-3.5 w-36 bg-slate-300 rounded" />
                <div className="h-2.5 w-24 bg-slate-100 rounded" />
              </div>
              <div className="space-y-1 w-20">
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-2 w-12 bg-slate-100 rounded" />
              </div>
              <div className="h-3.5 w-12 bg-slate-200 rounded" />
              <div className="h-3.5 w-20 bg-slate-300 rounded" />
              <div className="space-y-1 w-28">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-2.5 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-20 bg-slate-100 rounded" />
              <div className="h-6 w-20 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Table footer / pagination mockup */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-between items-center">
          <div className="h-3 w-36 bg-slate-200 rounded" />
          <div className="h-6 w-28 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function AuthCheckSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans animate-pulse">
      {/* Topbar skeleton */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-0 flex items-end justify-between gap-4">
          <div className="pb-3 flex items-center gap-4">
            <div className="h-4 w-32 bg-slate-800 rounded" />
          </div>
          <div className="flex space-x-6 pb-3">
            <div className="h-4 w-16 bg-slate-300 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
          <div className="flex items-center gap-3 pb-3">
            <div className="h-6 w-16 bg-slate-100 rounded" />
            <div className="space-y-1 text-right">
              <div className="h-3 w-24 bg-slate-200 rounded ml-auto" />
              <div className="h-2 w-16 bg-slate-100 rounded ml-auto" />
            </div>
            <div className="h-7 w-7 bg-slate-100 rounded" />
          </div>
        </div>
      </header>

      {/* Body skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <ForecastSkeleton />
      </main>
    </div>
  );
}
