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
import { ForecastSummary } from "@/lib/financial";

interface Props {
  forecast: ForecastSummary;
}

export default function CashflowForecast({ forecast }: Props) {
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(60);
  const [moraRecoveryPct, setMoraRecoveryPct] = useState<number>(40);
  const [includeDisputes, setIncludeDisputes] = useState<boolean>(false);

  // Currency formatting helper
  const formatMoney = (val: number, compact = false) => {
    if (compact) {
      const abs = Math.abs(val);
      if (abs >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
      if (abs >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
      if (abs >= 1000) return `${(val / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(val).toLocaleString("es-CL")}`;
  };

  // Filter daily points by horizon
  const filteredDaily = useMemo(() => {
    return forecast.dailyForecast.slice(0, horizonDays);
  }, [forecast.dailyForecast, horizonDays]);

  // Dynamic sensitivity simulation with recovery slider & disputes toggle
  const simulatedData = useMemo(() => {
    const dailyPoints = filteredDaily;
    const baseMora = includeDisputes
      ? forecast.totalMora
      : Math.max(0, forecast.totalMora - forecast.totalEnDisputa);
    const totalRecoverableMora = baseMora;
    const additionalDailyCash = (totalRecoverableMora * (moraRecoveryPct / 100)) / 45;

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
      totalRecoverableMora,
    };
  }, [filteredDaily, moraRecoveryPct, includeDisputes, forecast]);

  // Dynamic KPIs aggregated for the selected horizon (30, 60, or 90 days)
  const horizonMetrics = useMemo(() => {
    const slice = filteredDaily;
    const obligaciones = slice.reduce((sum, p) => sum + p.egresos, 0);
    const ingresosFuturos = slice.reduce((sum, p) => sum + p.ingresosBase, 0);

    // Mora considerada según el toggle de disputas
    const moraConsiderada = includeDisputes
      ? forecast.totalMora
      : Math.max(0, forecast.totalMora - forecast.totalEnDisputa);

    const totalCxC = moraConsiderada + ingresosFuturos;
    const brecha = forecast.saldoInicial + totalCxC - obligaciones;
    const saldoBaseFinal = slice[slice.length - 1]?.saldoBase ?? forecast.saldoInicial;
    const saldoSimuladoFinal = simulatedData.points[simulatedData.points.length - 1]?.saldoSimulado ?? forecast.saldoInicial;

    return {
      obligaciones,
      ingresosFuturos,
      moraConsiderada,
      totalCxC,
      brecha,
      saldoBaseFinal,
      saldoSimuladoFinal,
    };
  }, [filteredDaily, forecast, simulatedData, includeDisputes]);

  // Expense categories aggregation
  const expenseCategories = useMemo(() => {
    const total = forecast.totalObligacionesPendientes || 1;
    const labels: Record<string, string> = {
      proveedor: "Proveedores",
      sueldos: "Sueldos y RRHH",
      credito_bancario: "Crédito Bancario",
      impuestos: "Impuestos (IVA / PPM)",
      arriendo: "Arriendo Bodega y Oficinas",
      servicios: "Servicios Básicos y Logística",
    };

    return Object.entries(forecast.egresosPorTipo)
      .map(([tipo, monto]) => ({
        tipo,
        name: labels[tipo] || tipo,
        monto,
        pct: Math.round((monto / total) * 100),
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [forecast]);

  return (
    <div className="space-y-6">
      {/* 1. Alerta Ejecutiva */}
      <section className="bg-red-50/70 border border-red-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
              Diagnóstico de Liquidez
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Quiebre de caja proyectado: {forecast.fechaQuiebre || "2026-10-29"} ({forecast.runwayDias} días de runway)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              El 29 de octubre vence el pago de $395.000.000 a <em>Aceros del Pacífico Importadora S.A.</em> Sin recuperar facturas vencidas, el saldo en banco cae a terreno negativo con un déficit proyectado de {formatMoney(forecast.saldoMinimoBase)}.
            </p>
          </div>

          <div className="shrink-0 text-left md:text-right">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Runway Contractual</span>
            <p className="text-2xl font-bold text-red-700">{forecast.runwayDias} días</p>
            <span className="text-[11px] text-slate-400">Hasta 29/10/2026</span>
          </div>
        </div>
      </section>

      {/* 2. Cuatro Hero KPIs Adaptados al Horizonte */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Métricas Clave ({horizonDays} días)
            </span>
            <p className="text-[11px] text-slate-500">
              Proyección acumulada desde el corte hasta el {filteredDaily[filteredDaily.length - 1]?.date || "horizonte"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Horizonte:</span>
            <div className="inline-flex bg-slate-100 p-0.5 rounded text-xs">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setHorizonDays(d as any)}
                  className={`px-3 py-1 rounded transition cursor-pointer ${horizonDays === d
                      ? "bg-white font-semibold text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                    }`}
                >
                  {d} días
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 font-medium">Saldo en Banco (Inicial)</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatMoney(forecast.saldoInicial)}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Saldo base al cierre: <strong className={horizonMetrics.saldoBaseFinal < 0 ? "text-red-600 font-mono" : "text-emerald-700 font-mono"}>{formatMoney(horizonMetrics.saldoBaseFinal, true)}</strong>
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 font-medium">Cuentas por Cobrar ({horizonDays}d)</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatMoney(horizonMetrics.totalCxC)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-amber-700 font-medium">{formatMoney(horizonMetrics.moraConsiderada, true)} mora</span>
              <span>•</span>
              <span>{formatMoney(horizonMetrics.ingresosFuturos, true)} al día</span>
              <span className="text-[10px] text-slate-400">
                ({includeDisputes ? "con disputas" : "sin disputas"})
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 font-medium">Obligaciones ({horizonDays}d)</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatMoney(horizonMetrics.obligaciones)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Compromisos en {horizonDays} días</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 font-medium">Brecha Neta ({horizonDays}d)</span>
            <p className={`text-2xl font-bold mt-1 ${horizonMetrics.brecha >= 0 ? "text-slate-900" : "text-red-600"}`}>
              {formatMoney(horizonMetrics.brecha)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {horizonMetrics.brecha >= 0
                ? (includeDisputes ? "Superávit (mora + disputas)" : "Superávit (mora sin disputas)")
                : "Déficit acumulado del período"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Gráfico Principal de Proyección & Controles */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Proyección Temporal de Flujo de Caja
            </h3>
            <p className="text-xs text-slate-500">
              Línea continua: saldo base • Línea verde discontinua: con recuperación de cobranza
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Horizonte sincronizado */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded text-xs">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setHorizonDays(d as any)}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${horizonDays === d ? "bg-white font-medium text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                >
                  {d} días
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simulador de Sensibilidad & Control de Facturas Conflictivas / En Disputa */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="font-semibold text-slate-800">Mora Objetivo:</span>
              <span className="text-slate-600 font-mono ml-1">
                {formatMoney(simulatedData.totalRecoverableMora)}
              </span>
            </div>

            {/* Botón Toggle Facturas en Disputa / Conflictivas */}
            <button
              type="button"
              onClick={() => setIncludeDisputes(!includeDisputes)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] border font-medium transition cursor-pointer ${includeDisputes
                  ? "bg-amber-100 border-amber-300 text-amber-900 shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              title="Haz clic para incluir o excluir facturas en disputa/conflicto legal o comercial"
            >
              <span className={`w-2 h-2 rounded-full ${includeDisputes ? "bg-amber-600" : "bg-slate-300"}`} />
              <span>Facturas en conflicto ({formatMoney(forecast.totalEnDisputa, true)}):</span>
              <strong className={includeDisputes ? "text-amber-800" : "text-slate-500"}>
                {includeDisputes ? "Consideradas" : "Excluidas (Conservador)"}
              </strong>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 hidden sm:inline">Sensibilidad:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={moraRecoveryPct}
              onChange={(e) => setMoraRecoveryPct(Number(e.target.value))}
              className="w-32 sm:w-36 h-1 bg-slate-300 rounded appearance-none cursor-pointer accent-slate-900"
            />
            <span className="font-mono font-bold text-slate-900 w-10 text-right">{moraRecoveryPct}%</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              Runway:{" "}
              <strong className={simulatedData.simRunway >= horizonDays ? "text-emerald-700" : "text-slate-900"}>
                {simulatedData.simRunway >= horizonDays ? `> ${horizonDays} días` : `${simulatedData.simRunway} días`}
              </strong>
            </span>
          </div>
        </div>

        {/* Gráfico Recharts */}
        <div className="h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={simulatedData.points}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(val) => formatMoney(val, true)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded shadow-sm text-xs space-y-1">
                        <p className="font-bold text-slate-900 border-b border-slate-100 pb-0.5">{label}</p>
                        <p className="text-slate-900">
                          Saldo Base: <strong>{formatMoney(data.saldoBase)}</strong>
                        </p>
                        <p className="text-emerald-700">
                          Saldo con Cobranza: <strong>{formatMoney(data.saldoSimulado)}</strong>
                        </p>
                        <p className="text-slate-500">
                          Ingresos: +{formatMoney(data.ingresosBase)}
                        </p>
                        <p className="text-red-600">
                          Egresos: -{formatMoney(data.egresos)}
                        </p>
                        {data.hito && (
                          <p className="text-amber-800 text-[11px] pt-1 border-t border-slate-100">{data.hito}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#dc2626" strokeWidth={1} strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="saldoBase"
                stroke="#0f172a"
                strokeWidth={1.5}
                fill="transparent"
                name="Saldo Base"
              />
              <Area
                type="monotone"
                dataKey="saldoSimulado"
                stroke="#059669"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="transparent"
                name="Simulado con Cobranza"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Estructura de Egresos & Agenda de Vencimientos Críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna Izquierda: Egresos por Tipo */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Estructura de Obligaciones (3 meses)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total: {formatMoney(forecast.totalObligacionesPendientes)}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {expenseCategories.map((cat) => (
              <div key={cat.tipo} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700">{cat.name}</span>
                  <span className="text-slate-500 font-mono">
                    {formatMoney(cat.monto)} ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Columna Derecha: Agenda de Vencimientos Críticos */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Próximos Pagos Relevantes
            </h3>
            <span className="text-[11px] text-slate-400">Ordenados por monto</span>
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {forecast.hitosCriticos.map((hito, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded border border-slate-100 bg-slate-50/50 text-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <span className="font-mono text-slate-900 font-medium">{hito.fecha}</span>
                    <span>•</span>
                    <span className="capitalize">{hito.tipo}</span>
                  </div>
                  <p className="font-semibold text-slate-800 truncate">{hito.acreedor}</p>
                  <p className="text-[11px] text-slate-400 truncate">{hito.descripcion}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-slate-900 font-mono">
                    {formatMoney(hito.monto)}
                  </p>
                  {hito.fecha === "2026-10-29" && (
                    <span className="text-[10px] text-red-700 font-bold uppercase block">
                      Quiebre
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
