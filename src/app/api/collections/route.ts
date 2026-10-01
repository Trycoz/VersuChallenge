import { NextResponse } from "next/server";
import { getCollectionsQueue } from "@/lib/financial";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCollectionsQueue();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error en /api/collections:", err);
    return NextResponse.json(
      { error: err.message || "Error al obtener cola de cobranza" },
      { status: 500 }
    );
  }
}
