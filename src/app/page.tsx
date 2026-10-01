"use client";

import React, { useState, useEffect } from "react";
import CarolinaDashboard from "@/components/CarolinaDashboard";
import MartaDashboard from "@/components/MartaDashboard";
import CsvUploader from "@/components/CsvUploader";
import { Loader2, AlertCircle } from "lucide-react";
import { ForecastSummary, CollectionsSummary } from "@/lib/financial";

type TabKey = "carolina" | "cobranzas" | "juan";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("carolina");

  const [forecast, setForecast] = useState<ForecastSummary | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [collections, setCollections] = useState<CollectionsSummary | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);

  const fetchForecast = async () => {
    setLoadingForecast(true);
    setForecastError(null);
    try {
      const res = await fetch("/api/forecast");
      if (!res.ok) throw new Error("Error al consultar la proyección de caja");
      const data = await res.json();
      setForecast(data);
    } catch (err: any) {
      setForecastError(err.message || "Error al cargar datos financieros");
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchCollections = async (force = false) => {
    if (collections && !force && collections.priorityCounts) return;
    setLoadingCollections(true);
    setCollectionsError(null);
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Error al consultar la cola de cobranza");
      const data = await res.json();
      setCollections(data);
    } catch (err: any) {
      setCollectionsError(err.message || "Error al cargar cola de cobranza");
    } finally {
      setLoadingCollections(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "cobranzas") {
      fetchCollections(!collections?.priorityCounts);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Clean, uncluttered header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Logo / Title */}
          <div className="pb-3">
            <h1 className="font-bold text-base tracking-wider text-slate-900 uppercase">
              Nortia Supply
            </h1>
          </div>

          {/* Clean text tabs */}
          <nav className="flex space-x-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleTabChange("carolina")}
              className={`pb-3 text-sm font-medium transition border-b-2 shrink-0 ${
                activeTab === "carolina"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Carolina — Finanzas
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("cobranzas")}
              className={`pb-3 text-sm font-medium transition border-b-2 shrink-0 ${
                activeTab === "cobranzas"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Marta & Rodrigo — Cobranzas
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("juan")}
              className={`pb-3 text-sm font-medium transition border-b-2 shrink-0 ${
                activeTab === "juan"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Juan — ERP
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* TAB 1: CAROLINA */}
        {activeTab === "carolina" && (
          <div>
            {loadingForecast ? (
              <div className="h-96 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                <p className="text-xs text-slate-400">Cargando proyección...</p>
              </div>
            ) : forecastError ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center max-w-sm mx-auto my-12">
                <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                <p className="text-xs text-red-700">{forecastError}</p>
                <button
                  type="button"
                  onClick={fetchForecast}
                  className="mt-3 px-3 py-1 bg-slate-900 text-white rounded text-xs cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            ) : forecast ? (
              <CarolinaDashboard forecast={forecast} />
            ) : null}
          </div>
        )}

        {/* TAB 2: MARTA & RODRIGO */}
        {activeTab === "cobranzas" && (
          <div>
            {loadingCollections ? (
              <div className="h-96 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                <p className="text-xs text-slate-400">Calculando cola priorizada y matriz 80/20...</p>
              </div>
            ) : collectionsError ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center max-w-sm mx-auto my-12">
                <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                <p className="text-xs text-red-700">{collectionsError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCollections(null);
                    fetchCollections();
                  }}
                  className="mt-3 px-3 py-1 bg-slate-900 text-white rounded text-xs cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            ) : collections ? (
              <MartaDashboard data={collections} />
            ) : null}
          </div>
        )}

        {/* TAB 3: JUAN (ERP) */}
        {activeTab === "juan" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Ingesta de Archivos ERP
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Carga diaria de CSVs de clientes, facturas, pagos y obligaciones.
              </p>
            </div>
            <CsvUploader
              onUploadComplete={() => {
                setCollections(null);
                fetchForecast();
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Nortia Supply
      </footer>
    </div>
  );
}
