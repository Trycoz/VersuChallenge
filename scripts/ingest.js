import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

if (fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (fs.existsSync(".env")) {
  process.loadEnvFile(".env");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const DATA_DIR = path.resolve(process.cwd(), "data");

const toNullableDate = (val) => (val && val.trim() !== "" ? val.trim() : null);
const toNullableString = (val) => (val && val.trim() !== "" ? val.trim() : null);
const toInt = (val, def = 0) => {
  if (!val || val.trim() === "") return def;
  const parsed = parseInt(val.trim(), 10);
  return isNaN(parsed) ? def : parsed;
};

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

async function batchUpsert(tableName, rows, onConflict, batchSize = 400) {
  console.log(`➡️  Cargando ${rows.length} registros en tabla '${tableName}'...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(tableName)
      .upsert(chunk, { onConflict });

    if (error) {
      throw new Error(`Error en tabla ${tableName} (lote ${i} - ${i + chunk.length}): ${error.message}`);
    }
  }
  console.log(`✅ ${tableName} completado (${rows.length} registros).`);
}

async function main() {
  console.log("🚀 Iniciando ingesta idempotente de datos para Nortia Supply...");

  // 1. Clientes
  const rawClientes = readCsv("clientes.csv");
  const clientes = rawClientes.map((r) => ({
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
  await batchUpsert("clientes", clientes, "id_cliente");

  // 2. Facturas
  const rawFacturas = readCsv("facturas.csv");
  const facturas = rawFacturas.map((r) => ({
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
  await batchUpsert("facturas", facturas, "id_documento");

  // 3. Pagos
  const rawPagos = readCsv("pagos.csv");
  const pagos = rawPagos.map((r) => ({
    id_pago: r.id_pago?.trim(),
    id_cliente: r.id_cliente?.trim(),
    fecha_pago: toNullableDate(r.fecha_pago),
    monto: toInt(r.monto, 0),
    medio_pago: toNullableString(r.medio_pago),
    facturas_referencia: toNullableString(r.facturas_referencia),
  }));
  await batchUpsert("pagos", pagos, "id_pago");

  // 4. Obligaciones
  const rawObligaciones = readCsv("obligaciones.csv");
  const obligaciones = rawObligaciones.map((r) => ({
    id_obligacion: r.id_obligacion?.trim(),
    tipo: r.tipo?.trim(),
    acreedor: r.acreedor?.trim(),
    descripcion: toNullableString(r.descripcion),
    fecha_vencimiento: toNullableDate(r.fecha_vencimiento),
    monto: toInt(r.monto, 0),
    estado: r.estado?.trim(),
    fecha_pago: toNullableDate(r.fecha_pago),
  }));
  await batchUpsert("obligaciones", obligaciones, "id_obligacion");

  console.log("\n🎉 ¡Ingesta finalizada exitosamente! Todos los datos están sincronizados en Supabase.");
}

main().catch((err) => {
  console.error("❌ Error durante la ingesta:", err);
  process.exit(1);
});
