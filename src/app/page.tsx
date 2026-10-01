"use client";

import React, { useState, useEffect } from "react";
import CarolinaDashboard from "@/components/CarolinaDashboard";
import MartaDashboard from "@/components/MartaDashboard";
import CsvUploader from "@/components/CsvUploader";
import LoginForm from "@/components/LoginForm";
import AccountManagerModal from "@/components/AccountManagerModal";
import { supabaseClient } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Settings, LogOut } from "lucide-react";
import { ForecastSummary, CollectionsSummary } from "@/lib/financial";

type TabKey = "carolina" | "cobranzas" | "juan";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("carolina");

  // Auth session state
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAccountManager, setShowAccountManager] = useState(false);

  // Financial data state
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

  // Check Supabase Auth session on mount
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      const user = data.session?.user || null;
      setSessionUser(user);
      setCheckingAuth(false);
      if (user) {
        fetchForecast();
      }
    });

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setSessionUser(user);
      if (user && !forecast) {
        fetchForecast();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "cobranzas") {
      fetchCollections(!collections?.priorityCounts);
    }
  };

  // 1. Initial auth check spinner
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
        <p className="text-xs text-slate-400">Verificando sesión...</p>
      </div>
    );
  }

  // 2. Unauthenticated: render Login Form
  if (!sessionUser) {
    return (
      <LoginForm
        onLoginSuccess={(user) => {
          setSessionUser(user);
          fetchForecast();
        }}
      />
    );
  }

  // 3. Authenticated: render main app
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Clean, uncluttered header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 pt-4 pb-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Logo / Title */}
          <div className="pb-3 flex items-center justify-between w-full md:w-auto">
            <h1 className="font-bold text-base tracking-wider text-slate-900 uppercase">
              Nortia Supply
            </h1>

            {/* Mobile user profile */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAccountManager(true)}
                className="p-1.5 text-slate-600 bg-slate-100 rounded-md"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                  setSessionUser(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
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
              Finanzas
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
              Cobranzas
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
              Carga de CSVs
            </button>
          </nav>

          {/* User profile & actions (Desktop) */}
          <div className="hidden md:flex items-center gap-3 pb-3">
            <button
              type="button"
              onClick={() => setShowAccountManager(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition cursor-pointer"
              title="Administrar cuentas de acceso"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Cuentas</span>
            </button>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-900 block">
                {sessionUser.user_metadata?.name || sessionUser.email}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                {sessionUser.user_metadata?.role || "Usuario"}
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await supabaseClient.auth.signOut();
                setSessionUser(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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

      {/* Account Manager Modal */}
      <AccountManagerModal
        isOpen={showAccountManager}
        onClose={() => setShowAccountManager(false)}
      />
    </div>
  );
}
