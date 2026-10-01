import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    // Ping Supabase
    const { count, error } = await supabase
      .from("clientes")
      .select("*", { count: "exact", head: true });

    const latencyMs = Date.now() - startTime;

    if (error && error.code !== "PGRST205") {
      // PGRST205 means table doesn't exist yet, but DB is reached
      return NextResponse.json(
        {
          status: "degraded",
          database: "error",
          error: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      tablesReady: !error,
      clientesCount: count ?? 0,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
