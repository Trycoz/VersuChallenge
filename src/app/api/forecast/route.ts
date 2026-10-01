import { NextResponse } from "next/server";
import { calculateCashForecast } from "@/lib/financial";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const forecast = await calculateCashForecast();
    return NextResponse.json(forecast);
  } catch (err: any) {
    console.error("Error en /api/forecast:", err);
    return NextResponse.json(
      { error: err.message || "Error al calcular proyección financiera" },
      { status: 500 }
    );
  }
}
