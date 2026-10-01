"use client";

import React, { useState, useEffect } from "react";
import CsvUploader from "@/components/CsvUploader";
import { Activity, Database, RefreshCw, CheckCircle, ShieldAlert } from "lucide-react";

export default function HomePage() {
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

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
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-cyan-500/20 shadow-lg">
              N
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                Nortia Supply
              </h1>
              <p className="text-xs text-slate-400">
                Control de Flujo de Caja & Gestión de Mora
              </p>
            </div>
          </div>

          {/* System Health pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={checkHealth}
              disabled={loadingHealth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition"
              title="Monitoreo en tiempo real"
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
                  ? `Supabase Conectado (${health?.clientesCount ?? 0} clientes)`
                  : health?.database === "connected" && !health?.tablesReady
                  ? "Supabase Conectado (Tablas pendientes)"
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Banner de estado */}
        <section className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/30 rounded-2xl p-6 shadow-2xl">
          <div className="max-w-3xl">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
              Módulo de Ingesta & Monitoreo ERP
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">
              Ingesta Diaria de Datos (ERP CSV)
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Juan (TI) puede arrastrar aquí los 4 archivos CSV diarios generados por el ERP sin depender de APIs externas. El proceso es <strong className="text-cyan-300">100% idempotente</strong> y actualiza la base de datos de Nortia de forma segura.
            </p>
          </div>
        </section>

        {/* Uploader Card */}
        <section>
          <CsvUploader onUploadComplete={checkHealth} />
        </section>
      </main>
    </div>
  );
}
