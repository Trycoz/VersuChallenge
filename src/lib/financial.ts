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
