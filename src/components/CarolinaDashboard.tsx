"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  CheckCircle2,
  Clock,
  Building2,
  FileWarning,
} from "lucide-react";
import { ForecastSummary } from "@/lib/financial";

interface Props {
  forecast: ForecastSummary;
}

export default function CarolinaDashboard({ forecast }: Props) {
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(60);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [moraRecoveryPct, setMoraRecoveryPct] = useState<number>(40); // 40% default what-if recovery

  // Format currency
  const formatMoney = (val: number, compact = false) => {
    if (compact) {
      const abs = Math.abs(val);
      if (abs >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
      if (abs >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
      if (abs >= 1000) return `${(val / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(val).toLocaleString("es-CL")}`;
  };

  // Filter daily points based on horizon
  const filteredDaily = useMemo(() => {
    return forecast.dailyForecast.slice(0, horizonDays);
  }, [forecast.dailyForecast, horizonDays]);

  // Filter weekly points based on horizon
  const filteredWeekly = useMemo(() => {
    const weeksCount = Math.ceil(horizonDays / 7);
    return forecast.weeklyForecast.slice(0, weeksCount);
  }, [forecast.weeklyForecast, horizonDays]);

  // Recalculate simulation with dynamic what-if recovery slider
  const simulatedData = useMemo(() => {
    const dailyPoints = filteredDaily;
    const totalRecoverableMora = forecast.totalMora - forecast.totalEnDisputa;
    const additionalDailyCash = ((totalRecoverableMora * (moraRecoveryPct / 100)) / 45);

    let runningSimCash = forecast.saldoInicial;
    let simRunway = horizonDays;
    let simQuiebre: string | null = null;
    let simMinCash = runningSimCash;

    const data = dailyPoints.map((pt, idx) => {
      const extraMora = idx < 45 ? additionalDailyCash : 0;
      runningSimCash += pt.ingresosBase + extraMora - pt.egresos;

      if (runningSimCash < simMinCash) simMinCash = runningSimCash;
      if (runningSimCash < 0 && !simQuiebre) {
        simQuiebre = pt.date;
        simRunway = idx + 1;
      }

      return {
        ...pt,
        saldoSimulado: runningSimCash,
        flujoNeto: pt.ingresosBase - pt.egresos,
      };
    });

    return {
      points: data,
      simRunway,
      simQuiebre,
      simMinCash,
    };
  }, [filteredDaily, moraRecoveryPct, forecast]);

  // Expense breakdown percentages
  const expenseCategories = useMemo(() => {
    const total = forecast.totalObligacionesPendientes || 1;
    const labels: Record<string, { name: string; color: string }> = {
      proveedor: { name: "Proveedores", color: "bg-blue-500" },
      sueldos: { name: "Sueldos y RRHH", color: "bg-purple-500" },
      credito_bancario: { name: "Crédito Bancario (Corto Plazo)", color: "bg-amber-500" },
      impuestos: { name: "Impuestos (IVA / PPM)", color: "bg-rose-500" },
      arriendo: { name: "Arriendo Bodega & Oficinas", color: "bg-cyan-500" },
      servicios: { name: "Servicios Básicos & Fletes", color: "bg-emerald-500" },
    };

    return Object.entries(forecast.egresosPorTipo)
      .map(([tipo, monto]) => ({
        tipo,
        name: labels[tipo]?.name || tipo,
        color: labels[tipo]?.color || "bg-slate-500",
        monto,
        pct: Math.round((monto / total) * 100),
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [forecast]);

  return (
    <div className="space-y-6">
      {/* 1. Alerta Ejecutiva de Liquidez para Carolina */}
      <section className="relative overflow-hidden bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                  Diagnóstico Crítico de Caja
                </span>
                <span className="text-xs text-slate-400">
                  Corte: 27/09/2026 • Saldo inicial: {formatMoney(forecast.saldoInicial)}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                La caja quiebra el{" "}
                <span className="text-rose-400 underline decoration-rose-500/50">
                  {forecast.fechaQuiebre || "2026-10-29"}
                </span>{" "}
                ({forecast.runwayDias} días de runway)
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                El <strong>29 de octubre</strong> vence el pago de{" "}
                <span className="text-amber-300 font-semibold">$395.000.000</span> a{" "}
                <em>Aceros del Pacífico</em> (importación extraordinaria de acero para temporada alta). Sin cobranza de facturas vencidas, la caja cae a terreno negativo y alcanza un déficit acumulado de{" "}
                <span className="text-rose-400 font-semibold">{formatMoney(forecast.saldoMinimoBase)}</span>.
              </p>
            </div>
          </div>

          <div className="shrink-0 bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-right">
            <p className="text-xs text-slate-400">Runway Contractual</p>
            <p className="text-3xl font-black text-rose-400">{forecast.runwayDias} días</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tiempo para negociar</p>
          </div>
        </div>
      </section>

      {/* 2. Cuatro Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Saldo en Banco (Corte)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {formatMoney(forecast.saldoInicial)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Al cierre del 27-sep-2026</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cuentas por Cobrar Total</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400 tracking-tight">
            {formatMoney(forecast.totalCuentasPorCobrar)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-amber-400 font-medium">
              {formatMoney(forecast.totalMora, true)} en mora
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {formatMoney(forecast.totalFuturo, true)} al día
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Obligaciones (3 Meses)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 tracking-tight">
            {formatMoney(forecast.totalObligacionesPendientes)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Incluye crédito bancario y sueldos</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Déficit Estructural Neto</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatMoney(forecast.totalCuentasPorCobrar + forecast.saldoInicial - forecast.totalObligacionesPendientes)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span className="text-slate-400">Brecha de liquidez total</span>
          </div>
        </div>
      </div>

      {/* 3. Gráfico Principal de Proyección & Controles */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Header del Gráfico con Toggles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Curva de Proyección de Saldo de Caja
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulación diaria/semanal con detección del umbral de quiebre ($0).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="inline-flex p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("daily")}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === "daily"
                    ? "bg-cyan-600 text-white font-medium shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Diario
              </button>
              <button
                type="button"
                onClick={() => setViewMode("weekly")}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === "weekly"
                    ? "bg-cyan-600 text-white font-medium shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Semanal (Lunes)
              </button>
            </div>

            {/* Horizon Filter */}
            <div className="inline-flex p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setHorizonDays(d as any)}
                  className={`px-3 py-1 rounded-md transition ${
                    horizonDays === d
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d} días
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* What-If Slider (Simulador de Sensibilidad de Cobranza) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Simulador "¿Qué pasa si Marta cobra la mora?"
              </h4>
              <p className="text-xs text-slate-400">
                Mueve el porcentaje de recuperación de facturas vencidas ({formatMoney(forecast.totalMora)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={moraRecoveryPct}
              onChange={(e) => setMoraRecoveryPct(Number(e.target.value))}
              className="w-48 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-sm font-bold text-cyan-400 min-w-[50px] text-right">
              {moraRecoveryPct}%
            </span>
            <div className="text-xs border-l border-slate-800 pl-4 text-slate-300">
              Runway resultante:{" "}
              <strong
                className={
                  simulatedData.simRunway >= horizonDays
                    ? "text-emerald-400"
                    : simulatedData.simRunway > 32
                    ? "text-amber-400"
                    : "text-rose-400"
                }
              >
                {simulatedData.simRunway >= horizonDays
                  ? `> ${horizonDays} días (¡Caja a salvo!)`
                  : `${simulatedData.simRunway} días`}
              </strong>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span>Escenario Contractual (Sin mora adicional)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span>Escenario Simulado (Con {moraRecoveryPct}% de cobranza)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-rose-500 border border-dashed border-rose-500" />
            <span className="text-rose-400 font-semibold">Límite de Quiebre ($0)</span>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={viewMode === "daily" ? simulatedData.points : filteredWeekly}
              margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSaldoBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSimulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={viewMode === "daily" ? "date" : "semanaLabel"}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => (viewMode === "daily" ? val.slice(5) : val.slice(0, 10))}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => formatMoney(val, true)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1 z-50">
                        <p className="font-bold text-white border-b border-slate-800 pb-1">
                          {label}
                        </p>
                        <p className="text-cyan-400">
                          Saldo Contractual:{" "}
                          <strong>
                            {formatMoney(viewMode === "daily" ? data.saldoBase : data.saldoFinalSemana)}
                          </strong>
                        </p>
                        {viewMode === "daily" && (
                          <p className="text-emerald-400">
                            Saldo Simulado (+{moraRecoveryPct}% mora):{" "}
                            <strong>{formatMoney(data.saldoSimulado)}</strong>
                          </p>
                        )}
                        <p className="text-slate-400">
                          Ingresos: +
                          {formatMoney(viewMode === "daily" ? data.ingresosBase : data.totalIngresos)}
                        </p>
                        <p className="text-rose-400">
                          Egresos: -
                          {formatMoney(viewMode === "daily" ? data.egresos : data.totalEgresos)}
                        </p>
                        {data.hito && (
                          <div className="mt-2 pt-1 border-t border-slate-800 text-amber-300 font-medium">
                            📌 {data.hito}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey={viewMode === "daily" ? "saldoBase" : "saldoFinalSemana"}
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSaldoBase)"
                name="Saldo Base"
              />
              {viewMode === "daily" && (
                <Area
                  type="monotone"
                  dataKey="saldoSimulado"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorSimulado)"
                  name="Simulado con Cobranza"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Dos Columnas: Desglose de Egresos & Agenda de Vencimientos Críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Egresos por Tipo */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Estructura de Obligaciones (Próximos 3 meses)
            </h3>
            <span className="text-xs text-slate-400">
              Total: {formatMoney(forecast.totalObligacionesPendientes)}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Los proveedores concentran el 64% de los egresos, sumado a las cuotas mensuales del crédito bancario que Nortia pidió para pagar deudas anteriores.
          </p>

          <div className="space-y-3 pt-2">
            {expenseCategories.map((cat) => (
              <div key={cat.tipo} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">{cat.name}</span>
                  <span className="text-slate-400 font-mono">
                    {formatMoney(cat.monto)} ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Columna Derecha: Agenda de Vencimientos Críticos */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Vencimientos Críticos a Negociar (Top Pagos)
            </h3>
            <span className="text-xs text-rose-400 font-semibold">Prioridad Carolina</span>
          </div>

          <p className="text-xs text-slate-400">
            Pagos individuales de mayor cuantía que deben renegociarse con anticipación para evitar el quiebre de caja:
          </p>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
            {forecast.hitosCriticos.map((hito, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  hito.monto >= 100000000
                    ? "bg-rose-950/20 border-rose-800/60"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-semibold">{hito.fecha}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase">
                      {hito.tipo}
                    </span>
                  </div>
                  <p className="font-bold text-slate-200 truncate">{hito.acreedor}</p>
                  <p className="text-[11px] text-slate-400 truncate">{hito.descripcion}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-white text-sm font-mono">
                    {formatMoney(hito.monto)}
                  </p>
                  {hito.fecha === "2026-10-29" && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] bg-rose-500 text-white font-black animate-pulse">
                      QUIEBRE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
