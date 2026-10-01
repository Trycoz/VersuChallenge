import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: List access requests (users in Supabase Auth with status === 'pending')
export async function GET() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const pendingUsers = (data?.users || [])
      .filter((u) => u.user_metadata?.status === "pending")
      .map((u) => ({
        id: u.id,
        email: u.email || "",
        nombre: u.user_metadata?.name || u.email?.split("@")[0] || "Usuario",
        rol_solicitado: u.user_metadata?.role || "cobranzas",
        motivo: u.user_metadata?.motivo || "Solicitud de acceso operativo",
        estado: "pendiente" as const,
        creado_el: u.created_at,
      }));

    return NextResponse.json({ requests: pendingUsers, tablePending: false });
  } catch (err: any) {
    console.error("Error listing requests:", err);
    return NextResponse.json({ error: err.message || "Error al listar solicitudes" }, { status: 500 });
  }
}

// POST: Public submission of a new access request with custom personal password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, nombre, rol_solicitado, motivo } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
    );

    if (existing) {
      if (existing.user_metadata?.status === "pending") {
        return NextResponse.json(
          { error: "Ya existe una solicitud pendiente de aprobación para este correo." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Ya existe una cuenta activa registrada con este correo electrónico." },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth with personal password and status 'pending'
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: nombre.trim(),
        role: rol_solicitado || "cobranzas",
        motivo: motivo || "Solicitud de acceso operativo a Nortia Supply",
        status: "pending",
      },
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Solicitud registrada con éxito. El administrador revisará tu cuenta.",
      userId: data.user.id,
    });
  } catch (err: any) {
    console.error("Error creating access request:", err);
    return NextResponse.json({ error: err.message || "Error al procesar solicitud" }, { status: 500 });
  }
}

// PATCH: Approve or reject an access request
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: "ID y estado requeridos" }, { status: 400 });
    }

    if (estado === "aprobada") {
      // Activate user by updating metadata status to 'approved'
      const { data: user, error: updateErr } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: { status: "approved" },
      });

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true, estado: "aprobada", user });
    }

    if (estado === "rechazada") {
      // Remove pending user record from Supabase Auth
      const { error: deleteErr } = await supabase.auth.admin.deleteUser(id);
      if (deleteErr) throw deleteErr;

      return NextResponse.json({ success: true, estado: "rechazada" });
    }

    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  } catch (err: any) {
    console.error("Error updating access request:", err);
    return NextResponse.json({ error: err.message || "Error al actualizar solicitud" }, { status: 500 });
  }
}
