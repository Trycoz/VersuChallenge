import { supabase } from "@/lib/supabase";

export const CUTOFF_DATE = "2026-09-27";
export const INITIAL_BANK_BALANCE = 270000000;

export interface InvoiceReconciliation {
  id_documento: string;
  id_cliente: string;
  tipo: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  monto_total: number;
  nc_monto: number;
  monto_neto_ajustado: number;
  monto_pagado: number;
  saldo_pendiente: number;
  en_disputa: boolean;
  dias_mora: number;
  es_vencida: boolean;
}

export interface CashForecastPoint {
  date: string;
  dayOfWeek: string;
  saldoBase: number;
  saldoConCobranzaMora: number;
  ingresosBase: number;
  ingresosConMora: number;
  egresos: number;
  hito?: string;
  enPeligro: boolean;
}

export interface ForecastSummary {
  cutoffDate: string;
  saldoInicial: number;
  runwayDias: number;
  fechaQuiebre: string | null;
  saldoMinimoBase: number;
  fechaSaldoMinimo: string | null;
  saldoMinimoConMora: number;
  totalCuentasPorCobrar: number;
  totalMora: number;
  totalFuturo: number;
  totalEnDisputa: number;
  totalObligacionesPendientes: number;
  egresosPorTipo: Record<string, number>;
  dailyForecast: CashForecastPoint[];
  weeklyForecast: any[];
  hitosCriticos: Array<{
    fecha: string;
    acreedor: string;
    descripcion: string;
    tipo: string;
    monto: number;
  }>;
}

// Fetch all rows bypassing PostgREST 1000 limit with parallel pagination
export async function fetchAllRows<T = any>(table: string): Promise<T[]> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`Error contando ${table}: ${error.message}`);
  const total = count || 0;
  const batchSize = 1000;
  const promises = [];
  for (let i = 0; i < total; i += batchSize) {
    promises.push(supabase.from(table).select("*").range(i, i + batchSize - 1));
  }
  const results = await Promise.all(promises);
  return results.flatMap((r) => (r.data || []) as T[]);
}

export async function calculateReconciledInvoices(): Promise<InvoiceReconciliation[]> {
  const [facturas, pagos] = await Promise.all([
    fetchAllRows("facturas"),
    fetchAllRows("pagos"),
  ]);

  // Map credit notes to reference documents
  const ncsByDoc: Record<string, number> = {};
  facturas
    .filter((f) => f.tipo === "nota_credito" && f.documento_referencia)
    .forEach((nc) => {
      ncsByDoc[nc.documento_referencia] = (ncsByDoc[nc.documento_referencia] || 0) + Number(nc.monto_total);
    });

  // Invoice map
  const invoiceMap: Record<string, any> = {};
  facturas
    .filter((f) => f.tipo === "factura")
    .forEach((f) => {
      const ncSum = ncsByDoc[f.id_documento] || 0; // negative amount
      const netoAjustado = Math.max(0, Number(f.monto_total) + ncSum);
      invoiceMap[f.id_documento] = {
        ...f,
        monto_total: Number(f.monto_total),
        nc_monto: ncSum,
        monto_neto_ajustado: netoAjustado,
        monto_pagado: 0,
      };
    });

  // Allocate payments
  pagos.forEach((p) => {
    if (!p.facturas_referencia) return;
    const refs = p.facturas_referencia.split(",").map((r: string) => r.trim()).filter(Boolean);
    let remMonto = Number(p.monto);

    for (const ref of refs) {
      if (invoiceMap[ref]) {
        const due = invoiceMap[ref].monto_neto_ajustado - invoiceMap[ref].monto_pagado;
        const toPay = Math.min(due, remMonto);
        invoiceMap[ref].monto_pagado += toPay;
        remMonto -= toPay;
      }
    }
  });

  const cutoff = new Date(CUTOFF_DATE).getTime();

  return Object.values(invoiceMap).map((inv) => {
    const saldo = Math.max(0, inv.monto_neto_ajustado - inv.monto_pagado);
    let diasMora = 0;
    let esVencida = false;

    if (inv.fecha_vencimiento) {
      const vencTime = new Date(inv.fecha_vencimiento).getTime();
      if (vencTime < cutoff) {
        esVencida = true;
        diasMora = Math.floor((cutoff - vencTime) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id_documento: inv.id_documento,
      id_cliente: inv.id_cliente,
      tipo: inv.tipo,
      fecha_emision: inv.fecha_emision,
      fecha_vencimiento: inv.fecha_vencimiento,
      monto_total: inv.monto_total,
      nc_monto: inv.nc_monto,
      monto_neto_ajustado: inv.monto_neto_ajustado,
      monto_pagado: inv.monto_pagado,
      saldo_pendiente: saldo,
      en_disputa: !!inv.en_disputa,
      dias_mora: diasMora,
      es_vencida: esVencida,
    };
  });
}

export async function calculateCashForecast(): Promise<ForecastSummary> {
  const [reconciledInvoices, obligaciones] = await Promise.all([
    calculateReconciledInvoices(),
    fetchAllRows("obligaciones"),
  ]);

  const pendingInvoices = reconciledInvoices.filter((i) => i.saldo_pendiente > 0);

  // Group pending obligations by due date
  const pendingObs = obligaciones.filter((o) => o.fecha_vencimiento > CUTOFF_DATE);
  const obsByDate: Record<string, number> = {};
  const egresosPorTipo: Record<string, number> = {};

  pendingObs.forEach((o) => {
    const d = o.fecha_vencimiento;
    const m = Number(o.monto);
    obsByDate[d] = (obsByDate[d] || 0) + m;
    egresosPorTipo[o.tipo] = (egresosPorTipo[o.tipo] || 0) + m;
  });

  // Calculate totals
  const totalCuentasPorCobrar = pendingInvoices.reduce((a, b) => a + b.saldo_pendiente, 0);
  const totalMora = pendingInvoices.filter((i) => i.es_vencida).reduce((a, b) => a + b.saldo_pendiente, 0);
  const totalFuturo = pendingInvoices.filter((i) => !i.es_vencida).reduce((a, b) => a + b.saldo_pendiente, 0);
  const totalEnDisputa = pendingInvoices.filter((i) => i.en_disputa).reduce((a, b) => a + b.saldo_pendiente, 0);
  const totalObligacionesPendientes = pendingObs.reduce((a, b) => a + Number(b.monto), 0);

  // Future collections without disputes
  const futureReceivablesByDate: Record<string, number> = {};
  pendingInvoices
    .filter((i) => !i.en_disputa && !i.es_vencida && i.fecha_vencimiento)
    .forEach((i) => {
      const d = i.fecha_vencimiento!;
      futureReceivablesByDate[d] = (futureReceivablesByDate[d] || 0) + i.saldo_pendiente;
    });

  // Overdue recovery curve (if Marta recovers overdue debt spread over 45 days)
  const recoverableOverdue = totalMora - pendingInvoices.filter((i) => i.es_vencida && i.en_disputa).reduce((a, b) => a + b.saldo_pendiente, 0);
  const dailyMoraRecovery = (recoverableOverdue * 0.5) / 45; // 50% recovery over 45 days

  // Build daily timeline from 2026-09-28 to 2026-12-27 (90 days)
  const startDate = new Date("2026-09-28T00:00:00Z");
  const endDate = new Date("2026-12-27T00:00:00Z");

  const dailyForecast: CashForecastPoint[] = [];
  let currentSaldoBase = INITIAL_BANK_BALANCE;
  let currentSaldoConMora = INITIAL_BANK_BALANCE;

  let runwayDias = 90;
  let fechaQuiebre: string | null = null;
  let saldoMinimoBase = currentSaldoBase;
  let fechaSaldoMinimo: string | null = null;
  let saldoMinimoConMora = currentSaldoConMora;

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = dayNames[d.getUTCDay()];

    const incBase = futureReceivablesByDate[dateStr] || 0;
    const daysSinceCutoff = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const incMora = daysSinceCutoff <= 45 ? dailyMoraRecovery : 0;
    const incConMora = incBase + incMora;

    const exp = obsByDate[dateStr] || 0;

    currentSaldoBase += incBase - exp;
    currentSaldoConMora += incConMora - exp;

    if (currentSaldoBase < saldoMinimoBase) {
      saldoMinimoBase = currentSaldoBase;
      fechaSaldoMinimo = dateStr;
    }
    if (currentSaldoConMora < saldoMinimoConMora) {
      saldoMinimoConMora = currentSaldoConMora;
    }

    if (currentSaldoBase < 0 && !fechaQuiebre) {
      fechaQuiebre = dateStr;
      runwayDias = daysSinceCutoff + 1;
    }

    // Check key events on this date
    let hito: string | undefined;
    if (exp >= 100000000) {
      const topObs = pendingObs.find((o) => o.fecha_vencimiento === dateStr && Number(o.monto) >= 100000000);
      if (topObs) {
        hito = `${topObs.acreedor}: $${Math.round(Number(topObs.monto) / 1000000)}M (${topObs.descripcion || topObs.tipo})`;
      }
    }

    dailyForecast.push({
      date: dateStr,
      dayOfWeek,
      saldoBase: currentSaldoBase,
      saldoConCobranzaMora: currentSaldoConMora,
      ingresosBase: incBase,
      ingresosConMora: Math.round(incConMora),
      egresos: exp,
      hito,
      enPeligro: currentSaldoBase < 0,
    });
  }

  // Weekly Aggregation (Lunes de Finanzas para Carolina)
  const weeklyForecast: any[] = [];
  for (let i = 0; i < dailyForecast.length; i += 7) {
    const chunk = dailyForecast.slice(i, i + 7);
    const firstDay = chunk[0];
    const lastDay = chunk[chunk.length - 1];
    const totalIngresos = chunk.reduce((a, b) => a + b.ingresosBase, 0);
    const totalEgresos = chunk.reduce((a, b) => a + b.egresos, 0);
    const minSaldoSemana = Math.min(...chunk.map((c) => c.saldoBase));

    weeklyForecast.push({
      semanaLabel: `Semana ${Math.floor(i / 7) + 1} (${firstDay.date.slice(5)})`,
      fechaInicio: firstDay.date,
      fechaFin: lastDay.date,
      saldoFinalSemana: lastDay.saldoBase,
      saldoConMora: lastDay.saldoConCobranzaMora,
      minSaldoSemana,
      totalIngresos,
      totalEgresos,
      flujoNeto: totalIngresos - totalEgresos,
      enPeligro: minSaldoSemana < 0,
    });
  }

  // Critical Outflows (Top 8 sorted by amount)
  const hitosCriticos = pendingObs
    .map((o) => ({
      fecha: o.fecha_vencimiento,
      acreedor: o.acreedor,
      descripcion: o.descripcion || "",
      tipo: o.tipo,
      monto: Number(o.monto),
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 8);

  return {
    cutoffDate: CUTOFF_DATE,
    saldoInicial: INITIAL_BANK_BALANCE,
    runwayDias,
    fechaQuiebre,
    saldoMinimoBase,
    fechaSaldoMinimo,
    saldoMinimoConMora,
    totalCuentasPorCobrar,
    totalMora,
    totalFuturo,
    totalEnDisputa,
    totalObligacionesPendientes,
    egresosPorTipo,
    dailyForecast,
    weeklyForecast,
    hitosCriticos,
  };
}

export interface CollectionsItem {
  id_documento: string;
  id_cliente: string;
  razon_social: string;
  contacto_nombre: string;
  contacto_email: string;
  contacto_telefono: string;
  ejecutivo_comercial: string;
  segmento: string;
  limite_credito: number;
  es_vip: boolean;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  monto_total: number;
  saldo_pendiente: number;
  dias_mora: number;
  en_disputa: boolean;
  categoria_aging: "1-30" | "31-60" | "61-90" | "+90";
  es_pareto_80: boolean;
  ranking_prioridad: number;
  score_prioridad: number;
  nivel_prioridad: "critica" | "alta" | "media" | "baja";
}

export interface CollectionsSummary {
  totalFacturasVencidas: number;
  montoTotalMora: number;
  paretoCount: number;
  paretoMonto: number;
  agingBuckets: {
    "1-30": { count: number; monto: number };
    "31-60": { count: number; monto: number };
    "61-90": { count: number; monto: number };
    "+90": { count: number; monto: number };
  };
  priorityCounts: {
    critica: number;
    alta: number;
    media: number;
    baja: number;
  };
  disputas: { count: number; monto: number };
  items: CollectionsItem[];
}

export async function getCollectionsQueue(): Promise<CollectionsSummary> {
  const [invoices, clientes] = await Promise.all([
    calculateReconciledInvoices(),
    fetchAllRows("clientes"),
  ]);

  const clientMap = new Map<string, any>();
  clientes.forEach((c) => clientMap.set(c.id_cliente, c));

  // Filter only overdue invoices with pending balance
  const overdue = invoices.filter((i) => i.es_vencida && i.saldo_pendiente > 0);

  // Sort descending by saldo_pendiente for Pareto calculation
  overdue.sort((a, b) => b.saldo_pendiente - a.saldo_pendiente);

  const totalMora = overdue.reduce((acc, i) => acc + i.saldo_pendiente, 0);
  let accumulated = 0;
  let paretoCount = 0;
  const pareto80Set = new Set<string>();

  for (let i = 0; i < overdue.length; i++) {
    accumulated += overdue[i].saldo_pendiente;
    pareto80Set.add(overdue[i].id_documento);
    if (accumulated >= totalMora * 0.8 && paretoCount === 0) {
      paretoCount = i + 1;
      break;
    }
  }

  const agingBuckets = {
    "1-30": { count: 0, monto: 0 },
    "31-60": { count: 0, monto: 0 },
    "61-90": { count: 0, monto: 0 },
    "+90": { count: 0, monto: 0 },
  };

  const priorityCounts = {
    critica: 0,
    alta: 0,
    media: 0,
    baja: 0,
  };

  let disputasCount = 0;
  let disputasMonto = 0;

  const items: CollectionsItem[] = overdue.map((inv) => {
    const client = clientMap.get(inv.id_cliente) || {};
    let cat: "1-30" | "31-60" | "61-90" | "+90" = "1-30";
    if (inv.dias_mora <= 30) cat = "1-30";
    else if (inv.dias_mora <= 60) cat = "31-60";
    else if (inv.dias_mora <= 90) cat = "61-90";
    else cat = "+90";

    agingBuckets[cat].count++;
    agingBuckets[cat].monto += inv.saldo_pendiente;

    if (inv.en_disputa) {
      disputasCount++;
      disputasMonto += inv.saldo_pendiente;
    }

    const limiteCredito = Number(client.limite_credito || 0);
    const esVip = limiteCredito >= 5000000;

    // Calculation of Priority Score (1-100) based on Amount + Days overdue + Dispute
    // ponytail: transparent scoring rule without complex models
    let montoPoints = 10;
    if (inv.saldo_pendiente >= 5000000) montoPoints = 50;
    else if (inv.saldo_pendiente >= 2000000) montoPoints = 40;
    else if (inv.saldo_pendiente >= 1000000) montoPoints = 30;
    else if (inv.saldo_pendiente >= 500000) montoPoints = 20;

    let moraPoints = 20;
    if (inv.dias_mora > 60) moraPoints = 50;
    else if (inv.dias_mora > 30) moraPoints = 40;
    else if (inv.dias_mora > 15) moraPoints = 30;

    const penalty = inv.en_disputa ? -25 : 0;
    const score = Math.max(5, Math.min(100, montoPoints + moraPoints + penalty));

    let nivel: "critica" | "alta" | "media" | "baja" = "baja";
    if (score >= 80) nivel = "critica";
    else if (score >= 60) nivel = "alta";
    else if (score >= 40) nivel = "media";

    priorityCounts[nivel]++;

    return {
      id_documento: inv.id_documento,
      id_cliente: inv.id_cliente,
      razon_social: client.razon_social || "Cliente " + inv.id_cliente,
      contacto_nombre: client.contacto_nombre || "Sin contacto",
      contacto_email: client.contacto_email || "",
      contacto_telefono: client.contacto_telefono || "",
      ejecutivo_comercial: client.ejecutivo_comercial || "No asignado",
      segmento: client.segmento || "Estándar",
      limite_credito: limiteCredito,
      es_vip: esVip,
      fecha_emision: inv.fecha_emision,
      fecha_vencimiento: inv.fecha_vencimiento,
      monto_total: inv.monto_total,
      saldo_pendiente: inv.saldo_pendiente,
      dias_mora: inv.dias_mora,
      en_disputa: inv.en_disputa,
      categoria_aging: cat,
      es_pareto_80: pareto80Set.has(inv.id_documento),
      ranking_prioridad: 0, // Assigned after sorting by score
      score_prioridad: score,
      nivel_prioridad: nivel,
    };
  });

  // Sort primarily by priority score descending, secondary by amount descending
  items.sort((a, b) => {
    if (b.score_prioridad !== a.score_prioridad) {
      return b.score_prioridad - a.score_prioridad;
    }
    return b.saldo_pendiente - a.saldo_pendiente;
  });

  items.forEach((item, idx) => {
    item.ranking_prioridad = idx + 1;
  });

  return {
    totalFacturasVencidas: overdue.length,
    montoTotalMora: totalMora,
    paretoCount,
    paretoMonto: Math.round(totalMora * 0.8),
    agingBuckets,
    priorityCounts,
    disputas: { count: disputasCount, monto: disputasMonto },
    items,
  };
}


