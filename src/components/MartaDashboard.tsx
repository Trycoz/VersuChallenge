"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { CollectionsSummary, CollectionsItem } from "@/lib/financial";
import AiMessageModal from "./AiMessageModal";

interface Props {
  data: CollectionsSummary;
}

export default function MartaDashboard({ data }: Props) {
  const [search, setSearch] = useState("");
  const [selectedAging, setSelectedAging] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [onlyPareto, setOnlyPareto] = useState(false);
  const [hideDisputes, setHideDisputes] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "monto" | "mora">("score");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [selectedItemForAi, setSelectedItemForAi] = useState<CollectionsItem | null>(null);
  const pageSize = 20;

  const formatMoney = (val: number, compact = false) => {
    if (compact) {
      const abs = Math.abs(val);
      if (abs >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
      if (abs >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
      if (abs >= 1000) return `${(val / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(val).toLocaleString("es-CL")}`;
  };

  // Normalize items to ensure score and level always exist even if client has cached data
  const enrichedItems = useMemo(() => {
    return (data.items || []).map((item) => {
      let score = item.score_prioridad;
      let nivel = item.nivel_prioridad;

      if (typeof score !== "number" || isNaN(score)) {
        let m = 10;
        if (item.saldo_pendiente >= 5000000) m = 50;
        else if (item.saldo_pendiente >= 2000000) m = 40;
        else if (item.saldo_pendiente >= 1000000) m = 30;
        else if (item.saldo_pendiente >= 500000) m = 20;

        let d = 20;
        if (item.dias_mora > 60) d = 50;
        else if (item.dias_mora > 30) d = 40;
        else if (item.dias_mora > 15) d = 30;

        const penalty = item.en_disputa ? -25 : 0;
        score = Math.max(5, Math.min(100, m + d + penalty));

        if (score >= 80) nivel = "critica";
        else if (score >= 60) nivel = "alta";
        else if (score >= 40) nivel = "media";
        else nivel = "baja";
      }

      return {
        ...item,
        score_prioridad: score,
        nivel_prioridad: nivel,
      };
    });
  }, [data.items]);

  // Compute live priorityCounts based on enriched items
  const priorityCounts = useMemo(() => {
    const counts = { critica: 0, alta: 0, media: 0, baja: 0 };
    enrichedItems.forEach((item) => {
      if (counts[item.nivel_prioridad] !== undefined) {
        counts[item.nivel_prioridad]++;
      }
    });
    return counts;
  }, [enrichedItems]);

  // Filter and sort
  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesClient = item.razon_social.toLowerCase().includes(q);
        const matchesDoc = item.id_documento.toLowerCase().includes(q);
        const matchesContact = item.contacto_nombre.toLowerCase().includes(q);
        if (!matchesClient && !matchesDoc && !matchesContact) return false;
      }

      // Priority Level filter
      if (selectedPriority !== "all" && item.nivel_prioridad !== selectedPriority) {
        return false;
      }

      // Aging filter
      if (selectedAging !== "all" && item.categoria_aging !== selectedAging) {
        return false;
      }

      // Pareto filter
      if (onlyPareto && !item.es_pareto_80) {
        return false;
      }

      // Dispute filter
      if (hideDisputes && item.en_disputa) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let diff = 0;
      if (sortBy === "score") {
        diff = a.score_prioridad - b.score_prioridad;
        if (diff === 0) diff = a.saldo_pendiente - b.saldo_pendiente;
      } else if (sortBy === "monto") {
        diff = a.saldo_pendiente - b.saldo_pendiente;
      } else {
        diff = a.dias_mora - b.dias_mora;
      }
      return sortOrder === "desc" ? -diff : diff;
    });
  }, [enrichedItems, search, selectedAging, selectedPriority, onlyPareto, hideDisputes, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  const filteredMonto = useMemo(() => {
    return filteredItems.reduce((acc, i) => acc + i.saldo_pendiente, 0);
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* 1. Header de Estrategia */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Estrategia de Cobranza
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Cola de Cobranza Priorizada & Asistente Contextual IA
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Estrategia 80/20 con <strong>Score de Importancia (1–100)</strong> para atacar facturas de alto impacto financiero. Incorpora las reglas comerciales de Rodrigo: protección de cuentas <strong>VIP</strong>, señalización de facturas en <strong>Disputa</strong> y redacción asistida con IA calibrada por canal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setOnlyPareto(!onlyPareto);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${
                onlyPareto
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {onlyPareto ? "✓ Mostrando Foco 80/20" : "Filtrar por Foco 80/20 (Top Cuentas)"}
            </button>
          </div>
        </div>
      </section>

      {/* 2. KPIs de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500 font-medium">Facturas Vencidas</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.totalFacturasVencidas}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Mora total: {formatMoney(data.montoTotalMora)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500 font-medium">Prioridad Crítica (Score 80+)</span>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {priorityCounts.critica} facturas
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Llamar primero hoy
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500 font-medium">Foco 80/20 (Pareto)</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.paretoCount} facturas</p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Concentran {formatMoney(data.paretoMonto)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500 font-medium">Monto Seleccionado</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(filteredMonto)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredItems.length} facturas filtradas
          </span>
        </div>
      </div>

      {/* 3. Filtros por Score, Aging y Búsqueda */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        {/* Row 1: Search & Priority Score Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, documento o contacto..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
            />
          </div>

          {/* Filter by Priority Score */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Score:</span>
            {[
              { id: "all", label: "Todos" },
              { id: "critica", label: `Crítica (${priorityCounts.critica})` },
              { id: "alta", label: `Alta (${priorityCounts.alta})` },
              { id: "media", label: `Media (${priorityCounts.media})` },
              { id: "baja", label: `Baja (${priorityCounts.baja})` },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPriority(p.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  selectedPriority === p.id
                    ? "bg-slate-900 text-white font-medium"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Aging Filter & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          {/* Aging tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] mr-1">Aging:</span>
            {[
              { id: "all", label: "Todos" },
              { id: "1-30", label: `1-30d (${data.agingBuckets["1-30"].count})` },
              { id: "31-60", label: `31-60d (${data.agingBuckets["31-60"].count})` },
              { id: "61-90", label: `61-90d (${data.agingBuckets["61-90"].count})` },
              { id: "+90", label: `+90d (${data.agingBuckets["+90"].count})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedAging(tab.id);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  selectedAging === tab.id
                    ? "bg-slate-800 text-white font-medium"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <label className="flex items-center gap-1.5 cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={hideDisputes}
                onChange={(e) => {
                  setHideDisputes(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Sin disputas</span>
            </label>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Ordenar por:</span>
            <button
              type="button"
              onClick={() => {
                if (sortBy === "score") {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("score");
                  setSortOrder("desc");
                }
              }}
              className={`font-medium flex items-center gap-0.5 ${
                sortBy === "score" ? "text-slate-900 font-bold" : "text-slate-500"
              }`}
            >
              Score {sortBy === "score" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => {
                if (sortBy === "monto") {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("monto");
                  setSortOrder("desc");
                }
              }}
              className={`font-medium flex items-center gap-0.5 ${
                sortBy === "monto" ? "text-slate-900 font-bold" : "text-slate-500"
              }`}
            >
              Monto {sortBy === "monto" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => {
                if (sortBy === "mora") {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("mora");
                  setSortOrder("desc");
                }
              }}
              className={`font-medium flex items-center gap-0.5 ${
                sortBy === "mora" ? "text-slate-900 font-bold" : "text-slate-500"
              }`}
            >
              Mora {sortBy === "mora" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabla de Cobranza con Score */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-28 text-center">Score Prioridad</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Factura</th>
                <th className="py-2.5 px-3 text-right">Mora</th>
                <th className="py-2.5 px-3 text-right">Saldo Pendiente</th>
                <th className="py-2.5 px-3">Contacto</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron facturas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id_documento}
                    className={`hover:bg-slate-50/80 transition ${
                      item.en_disputa ? "bg-amber-50/20" : ""
                    }`}
                  >
                    {/* Ranking */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {item.ranking_prioridad}
                    </td>

                    {/* Score Prioridad */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono">
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded ${
                            item.score_prioridad >= 80
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : item.score_prioridad >= 60
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : item.score_prioridad >= 40
                              ? "bg-slate-100 text-slate-700"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {item.score_prioridad}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-medium">
                          {item.nivel_prioridad}
                        </span>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{item.razon_social}</span>
                        {item.es_vip && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            VIP
                          </span>
                        )}
                        {item.es_pareto_80 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            80/20
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{item.id_cliente}</span>
                        <span>•</span>
                        <span>{item.segmento}</span>
                        <span>•</span>
                        <span>Ejecutivo: {item.ejecutivo_comercial}</span>
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-medium text-slate-900 block">
                        {item.id_documento}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Venc: {item.fecha_vencimiento}
                      </span>
                    </td>

                    {/* Días de mora */}
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-semibold font-mono ${
                          item.dias_mora > 60
                            ? "text-red-700"
                            : item.dias_mora > 30
                            ? "text-amber-700"
                            : "text-slate-800"
                        }`}
                      >
                        {item.dias_mora}d
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {item.categoria_aging}
                      </span>
                    </td>

                    {/* Saldo pendiente */}
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold font-mono text-slate-900 block">
                        {formatMoney(item.saldo_pendiente)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Total: {formatMoney(item.monto_total, true)}
                      </span>
                    </td>

                    {/* Contacto */}
                    <td className="py-2.5 px-3 text-xs">
                      <p className="text-slate-800 font-medium truncate max-w-[140px]">
                        {item.contacto_nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                        {item.contacto_telefono && (
                          <a
                            href={`tel:${item.contacto_telefono}`}
                            className="hover:text-slate-900 flex items-center gap-0.5 text-[11px]"
                            title={item.contacto_telefono}
                          >
                            <Phone className="w-3 h-3" />
                            <span>Llamar</span>
                          </a>
                        )}
                        {item.contacto_email && (
                          <a
                            href={`mailto:${item.contacto_email}?subject=Factura pendiente ${item.id_documento} - Nortia Supply`}
                            className="hover:text-slate-900 flex items-center gap-0.5 text-[11px]"
                            title={item.contacto_email}
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Estado / Disputa */}
                    <td className="py-2.5 px-3 text-center">
                      {item.en_disputa ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          En Disputa
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          Cobranza Normal
                        </span>
                      )}
                    </td>

                    {/* Acción / IA */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedItemForAi(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-[11px] transition cursor-pointer"
                        title="Redactar mensaje contextual con IA"
                      >
                        <Sparkles className="w-3 h-3 text-slate-600" />
                        <span>Mensaje IA</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, filteredItems.length)} de {filteredItems.length} facturas
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Anterior
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Asistente IA */}
      {selectedItemForAi && (
        <AiMessageModal
          item={selectedItemForAi}
          onClose={() => setSelectedItemForAi(null)}
        />
      )}
    </div>
  );
}
