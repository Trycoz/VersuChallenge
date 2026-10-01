"use client";

import React, { useState, useEffect } from "react";
import CarolinaDashboard from "@/components/CarolinaDashboard";
import CsvUploader from "@/components/CsvUploader";
import {
  Activity,
  TrendingDown,
  PhoneCall,
  Users,
  Settings,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ForecastSummary } from "@/lib/financial";

type TabKey = "carolina" | "marta" | "rodrigo" | "juan";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("carolina");
  const [forecast, setForecast] = useState<ForecastSummary | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

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

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/healthz");
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setHealth({ status: "error", error: err.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchForecast();
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-cyan-500/20">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                  NORTIA SUPPLY
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                  Cashflow Control
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Solución Integral de Liquidez, Cobranzas & ERP
              </p>
            </div>
          </div>

          {/* System Health Monitor */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                checkHealth();
                fetchForecast();
              }}
              disabled={loadingHealth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition shadow-sm"
              title="Monitoreo 24/7 de base de datos"
            >
              <Activity
                className={`w-3.5 h-3.5 ${
                  health?.status === "healthy"
                    ? "text-emerald-400 animate-pulse"
                    : "text-amber-400"
                }`}
              />
              <span>
                {health?.status === "healthy"
                  ? `Supabase Conectado (${health?.clientesCount ?? 1200} clientes)`
                  : "Verificando conexión..."}
              </span>
              <RefreshCw
                className={`w-3 h-3 text-slate-400 ${
                  loadingHealth ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stakeholder Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 pt-1">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-slate-800/60 pt-2 pb-1">
            {/* Tab Carolina */}
            <button
              type="button"
              onClick={() => setActiveTab("carolina")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "carolina"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Carolina — Finanzas & Forecast</span>
              {forecast?.runwayDias && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {forecast.runwayDias}d Runway
                </span>
              )}
            </button>

            {/* Tab Marta */}
            <button
              type="button"
              onClick={() => setActiveTab("marta")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "marta"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Marta — Cobranzas (80/20)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                496 en mora
              </span>
            </button>

            {/* Tab Rodrigo */}
            <button
              type="button"
              onClick={() => setActiveTab("rodrigo")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "rodrigo"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Rodrigo — Cuentas Clave & IA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                VIP / Disputas
              </span>
            </button>

            {/* Tab Juan */}
            <button
              type="button"
              onClick={() => setActiveTab("juan")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                activeTab === "juan"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Juan — Ingesta ERP & Sistema</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* TAB 1: CAROLINA */}
        {activeTab === "carolina" && (
          <div>
            {loadingForecast ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm text-slate-400">
                  Calculando conciliación financiera y proyección diaria de caja...
                </p>
              </div>
            ) : forecastError ? (
              <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-xl text-center max-w-md mx-auto my-12">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-rose-200">Error de cálculo</h3>
                <p className="text-xs text-rose-300 mt-1">{forecastError}</p>
                <button
                  type="button"
                  onClick={fetchForecast}
                  className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
                >
                  Reintentar
                </button>
              </div>
            ) : forecast ? (
              <CarolinaDashboard forecast={forecast} />
            ) : null}
          </div>
        )}

        {/* TAB 2: MARTA PLACEHOLDER (COMING NEXT) */}
        {activeTab === "marta" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Cola de Cobranza Priorizada de Marta (Matriz 80/20)
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Módulo de priorización inteligente para cobrar primero las <strong>496 facturas vencidas</strong> ($547M) que salvan la caja de Nortia antes del quiebre del 29 de octubre.
            </p>
            <p className="text-xs text-cyan-400">
              ⚡ En desarrollo en la siguiente fase.
            </p>
          </div>
        )}

        {/* TAB 3: RODRIGO & IA PLACEHOLDER (COMING NEXT) */}
        {activeTab === "rodrigo" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Cuentas Clave & Asistente de Cobranza con IA
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Protección de clientes VIP, filtros de facturas en disputa y generación de mensajes de cobro personalizados con IA calibrando el tono adecuado (diplomático vs. firme).
            </p>
            <p className="text-xs text-cyan-400">
              ⚡ En desarrollo en la siguiente fase.
            </p>
          </div>
        )}

        {/* TAB 4: JUAN (CSV UPLOAD & SYSTEM) */}
        {activeTab === "juan" && (
          <div className="space-y-6">
            <section className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/30 rounded-2xl p-6 shadow-2xl">
              <div className="max-w-3xl">
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
                  Módulo de Ingesta & Monitoreo ERP (Juan - TI)
                </span>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Ingesta Diaria de Datos (ERP CSV)
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Juan puede arrastrar aquí los 4 archivos CSV exportados diariamente por el ERP. La carga es <strong className="text-cyan-300">100% idempotente</strong> (`UPSERT`) y actualiza automáticamente los saldos sin duplicar registros.
                </p>
              </div>
            </section>

            <CsvUploader
              onUploadComplete={() => {
                checkHealth();
                fetchForecast();
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Nortia Supply — Sistema de Control de Liquidez & Cobranzas • Diseñado para Carolina, Marta, Rodrigo y Juan
      </footer>
    </div>
  );
}
