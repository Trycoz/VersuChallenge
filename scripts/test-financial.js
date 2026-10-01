// Ponytail: ONE runnable check without framework/fixtures
import assert from "node:assert";
import fs from "node:fs";

if (fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

async function runCheck() {
  const { calculateCashForecast, calculateReconciledInvoices } = await import("../src/lib/financial.ts");
  console.log("🔍 Verificando lógica del motor financiero...");

  const invoices = await calculateReconciledInvoices();
  assert(invoices.length > 5000, "Debe haber más de 5000 facturas");
  
  const pending = invoices.filter(i => i.saldo_pendiente > 0);
  assert(pending.length > 1000, "Debe haber más de 1000 facturas pendientes");

  const overdue = pending.filter(i => i.es_vencida);
  assert(overdue.length >= 400, "Marta debe tener más de 400 facturas vencidas (mora real)");

  const forecast = await calculateCashForecast();
  assert.strictEqual(forecast.saldoInicial, 270000000, "Saldo inicial debe ser 270M");
  assert(forecast.runwayDias > 0 && forecast.runwayDias <= 60, "Runway debe estar entre 0 y 60 días");
  assert(forecast.fechaQuiebre === "2026-10-29", `Fecha quiebre esperada 2026-10-29, obtenida: ${forecast.fechaQuiebre}`);

  console.log("✅ Todos los checks del motor financiero pasaron exitosamente.");
  console.log(`- Facturas pendientes: ${pending.length}`);
  console.log(`- Facturas vencidas (Marta): ${overdue.length}`);
  console.log(`- Fecha de quiebre proyectada: ${forecast.fechaQuiebre} (${forecast.runwayDias} días de runway)`);
}

runCheck().catch(err => {
  console.error("❌ Falló la verificación:", err);
  process.exit(1);
});
