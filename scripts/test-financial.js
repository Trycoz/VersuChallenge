// Ponytail: ONE runnable check without framework/fixtures
import assert from "node:assert";

async function runCheck() {
  console.log("🔍 Verificando lógica del motor financiero (/api/forecast & /api/collections)...");

  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const [forecastRes, collectionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/forecast`),
    fetch(`${baseUrl}/api/collections`),
  ]);

  assert(forecastRes.ok, "API /api/forecast debe responder 200 OK");
  assert(collectionsRes.ok, "API /api/collections debe responder 200 OK");

  const forecast = await forecastRes.json();
  const collections = await collectionsRes.json();

  assert.strictEqual(forecast.saldoInicial, 270000000, "Saldo inicial debe ser $270.000.000");
  assert(forecast.runwayDias > 0 && forecast.runwayDias <= 60, "Runway debe estar entre 0 y 60 días");
  assert(forecast.fechaQuiebre === "2026-10-29", `Fecha quiebre esperada 2026-10-29, obtenida: ${forecast.fechaQuiebre}`);

  assert(collections.totalFacturasVencidas >= 400, "Debe haber más de 400 facturas vencidas");
  assert(collections.priorityCounts.critica > 0, "Debe haber facturas con prioridad crítica");
  assert(collections.paretoCount > 0, "Debe calcular el foco 80/20 (Pareto)");

  console.log("✅ Todos los checks del motor financiero pasaron exitosamente.");
  console.log(`- Facturas vencidas en mora: ${collections.totalFacturasVencidas}`);
  console.log(`- Cuentas críticas (Score >= 80): ${collections.priorityCounts.critica}`);
  console.log(`- Fecha de quiebre proyectada: ${forecast.fechaQuiebre} (${forecast.runwayDias} días de runway)`);
}

runCheck().catch(err => {
  console.error("❌ Falló la verificación:", err.message);
  process.exit(1);
});
