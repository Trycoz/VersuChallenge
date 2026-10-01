import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const toNullableDate = (val?: string) => (val && val.trim() !== "" ? val.trim() : null);
const toNullableString = (val?: string) => (val && val.trim() !== "" ? val.trim() : null);
const toInt = (val?: string, def = 0) => {
  if (!val || val.trim() === "") return def;
  const parsed = parseInt(val.trim(), 10);
  return isNaN(parsed) ? def : parsed;
};

async function batchUpsert(tableName: string, rows: any[], onConflict: string, batchSize = 400) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(chunk, { onConflict });
    if (error) {
      throw new Error(`Error en tabla ${tableName} (lote ${i}..${i + chunk.length}): ${error.message}`);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const results: Record<string, number> = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === "object" && "name" in value && typeof value.text === "function") {
        const file = value as File;
        const text = await file.text();
        const filename = file.name.toLowerCase();

        // 1. Clientes
        if (key === "clientes" || filename.includes("cliente")) {
          const raw = parse(text, { columns: true, skip_empty_lines: true, trim: true });
          const rows = raw.map((r: any) => ({
            id_cliente: r.id_cliente?.trim(),
            razon_social: r.razon_social?.trim(),
            id_tributario: toNullableString(r.id_tributario),
            segmento: toNullableString(r.segmento),
            ciudad: toNullableString(r.ciudad),
            contacto_nombre: toNullableString(r.contacto_nombre),
            contacto_email: toNullableString(r.contacto_email),
            contacto_telefono: toNullableString(r.contacto_telefono),
            dias_credito: toInt(r.dias_credito, 30),
            ejecutivo_comercial: toNullableString(r.ejecutivo_comercial),
            fecha_alta: toNullableDate(r.fecha_alta),
            limite_credito: toInt(r.limite_credito, 0),
          }));
          await batchUpsert("clientes", rows, "id_cliente");
          results.clientes = rows.length;
        }

        // 2. Facturas
        if (key === "facturas" || filename.includes("factura")) {
          const raw = parse(text, { columns: true, skip_empty_lines: true, trim: true });
          const rows = raw.map((r: any) => ({
            id_documento: r.id_documento?.trim(),
            tipo: r.tipo?.trim(),
            id_cliente: r.id_cliente?.trim(),
            fecha_emision: toNullableDate(r.fecha_emision),
            fecha_vencimiento: toNullableDate(r.fecha_vencimiento),
            monto_neto: toInt(r.monto_neto, 0),
            impuesto: toInt(r.impuesto, 0),
            monto_total: toInt(r.monto_total, 0),
            documento_referencia: toNullableString(r.documento_referencia),
            en_disputa: r.en_disputa?.toLowerCase() === "si",
            observacion: toNullableString(r.observacion),
          }));
          await batchUpsert("facturas", rows, "id_documento");
          results.facturas = rows.length;
        }

        // 3. Pagos
        if (key === "pagos" || filename.includes("pago")) {
          const raw = parse(text, { columns: true, skip_empty_lines: true, trim: true });
          const rows = raw.map((r: any) => ({
            id_pago: r.id_pago?.trim(),
            id_cliente: r.id_cliente?.trim(),
            fecha_pago: toNullableDate(r.fecha_pago),
            monto: toInt(r.monto, 0),
            medio_pago: toNullableString(r.medio_pago),
            facturas_referencia: toNullableString(r.facturas_referencia),
          }));
          await batchUpsert("pagos", rows, "id_pago");
          results.pagos = rows.length;
        }

        // 4. Obligaciones
        if (key === "obligaciones" || filename.includes("obligacion")) {
          const raw = parse(text, { columns: true, skip_empty_lines: true, trim: true });
          const rows = raw.map((r: any) => ({
            id_obligacion: r.id_obligacion?.trim(),
            tipo: r.tipo?.trim(),
            acreedor: r.acreedor?.trim(),
            descripcion: toNullableString(r.descripcion),
            fecha_vencimiento: toNullableDate(r.fecha_vencimiento),
            monto: toInt(r.monto, 0),
            estado: r.estado?.trim(),
            fecha_pago: toNullableDate(r.fecha_pago),
          }));
          await batchUpsert("obligaciones", rows, "id_obligacion");
          results.obligaciones = rows.length;
        }
      }
    }

    if (Object.keys(results).length === 0) {
      return NextResponse.json(
        { error: "No se reconocieron archivos válidos (clientes, facturas, pagos, obligaciones)" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Datos cargados e idempotentemente sincronizados.",
      results,
    });
  } catch (err: any) {
    console.error("Error en /api/ingest:", err);
    return NextResponse.json(
      { error: err.message || "Error procesando archivos CSV" },
      { status: 500 }
    );
  }
}
