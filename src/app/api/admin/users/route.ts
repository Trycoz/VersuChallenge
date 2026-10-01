import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: List all active/approved users from Supabase Auth
export async function GET() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    // Filter out users with status 'pending' (those are shown in Solicitudes de Acceso)
    const activeUsers = (data?.users || [])
      .filter((u) => u.user_metadata?.status !== "pending")
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || u.email?.split("@")[0] || "Usuario",
        role: u.user_metadata?.role || "viewer",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

    return NextResponse.json({ users: activeUsers });
  } catch (err: any) {
    console.error("Error listing users:", err);
    return NextResponse.json({ error: err.message || "Error al listar usuarios" }, { status: 500 });
  }
}

// DELETE: Revoke/delete user account
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return NextResponse.json({ error: err.message || "Error al eliminar usuario" }, { status: 500 });
  }
}
