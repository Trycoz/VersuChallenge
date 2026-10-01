"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  Trash2,
  AlertCircle,
  Loader2,
  Inbox,
  Key,
  ShieldCheck,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface RequestItem {
  id: string;
  email: string;
  nombre: string;
  rol_solicitado: string;
  motivo: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  creado_el: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountManagerModal({ isOpen, onClose }: Props) {
  // Default to requests tab: accounts are created exclusively via requests
  const [activeSubTab, setActiveSubTab] = useState<"requests" | "users">("requests");

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [tablePending, setTablePending] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al obtener usuarios");
      setUsers(data.users || []);
    } catch (err: any) {
      setUserError(err.message || "Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/admin/requests");
      const data = await res.json();
      setRequests(data.requests || []);
      setTablePending(!!data.tablePending);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchRequests();
    }
  }, [isOpen]);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users?id=${userToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar el usuario");
      }
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar usuario");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleProcessRequest = async (id: string, estado: "aprobada" | "rechazada") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar solicitud");

      fetchRequests();
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Error al procesar solicitud");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const pendingRequestsCount = requests.filter((r) => r.estado === "pendiente").length;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return { label: "Admin General", color: "bg-purple-50 text-purple-800 border-purple-200" };
      case "finanzas":
        return { label: "Finanzas (Carolina)", color: "bg-blue-50 text-blue-800 border-blue-200" };
      case "cobranzas":
        return { label: "Cobranzas (Marta & Rodrigo)", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "erp":
        return { label: "Operaciones ERP (Juan)", color: "bg-slate-100 text-slate-800 border-slate-200" };
      default:
        return { label: role, color: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-800" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Administración de Cuentas por Solicitud
              </h2>
              <p className="text-[11px] text-slate-500">
                Aprobación de solicitudes de acceso recibidas y control de usuarios activos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="px-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setActiveSubTab("requests")}
              className={`py-2.5 text-xs font-medium border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "requests"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Solicitudes de Acceso</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold text-[10px]">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("users")}
              className={`py-2.5 text-xs font-medium border-b-2 transition cursor-pointer ${
                activeSubTab === "users"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Cuentas Activas ({users.length})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Altas controladas por solicitud</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {userError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{userError}</span>
            </div>
          )}

          {/* TAB 1: SOLICITUDES DE ACCESO */}
          {activeSubTab === "requests" && (
            <div className="space-y-4">
              {loadingRequests ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-600" />
                  Cargando solicitudes de acceso...
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Inbox className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-700">No hay solicitudes pendientes.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Los colaboradores que requieran acceso deben completar el formulario en la pantalla de inicio de sesión (&quot;¿No tienes cuenta? Solicitar acceso&quot;).
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Solicitante</th>
                        <th className="py-2.5 px-3">Correo</th>
                        <th className="py-2.5 px-3">Rol Solicitado</th>
                        <th className="py-2.5 px-3">Motivo</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {r.nombre}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {r.email}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {r.rol_solicitado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[160px] truncate" title={r.motivo}>
                            {r.motivo}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                r.estado === "pendiente"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : r.estado === "aprobada"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {r.estado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {r.estado === "pendiente" ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={processingId === r.id}
                                  onClick={() => handleProcessRequest(r.id, "aprobada")}
                                  className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                                  title="Aprobar solicitud y activar cuenta con la contraseña del usuario"
                                >
                                  {processingId === r.id ? "Aprobando..." : "Aprobar Cuenta"}
                                </button>
                                <button
                                  type="button"
                                  disabled={processingId === r.id}
                                  onClick={() => handleProcessRequest(r.id, "rechazada")}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] hover:bg-slate-200 transition disabled:opacity-50 cursor-pointer"
                                >
                                  Rechazar
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Procesada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUENTAS ACTIVAS */}
          {activeSubTab === "users" && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] flex items-center justify-between">
                <span>
                  Las cuentas se habilitan exclusivamente aprobando solicitudes de acceso recibidas.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("requests")}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Ver solicitudes ({pendingRequestsCount}) →
                </button>
              </div>

              {/* Users Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Usuario</th>
                      <th className="py-2.5 px-3">Correo</th>
                      <th className="py-2.5 px-3">Rol</th>
                      <th className="py-2.5 px-3">Fecha Alta</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-600" />
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const roleInfo = getRoleLabel(u.role);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {u.name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {u.email}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.color}`}
                              >
                                {roleInfo.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {new Date(u.created_at).toLocaleDateString("es-CL")}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {u.email !== "admin@nortia.cl" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setUserToDelete(u);
                                  }}
                                  className="text-slate-400 hover:text-red-700 p-1 rounded transition cursor-pointer"
                                  title="Revocar acceso y eliminar cuenta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Principal</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>Cada usuario define su contraseña personal al solicitar acceso. Al aprobar, ingresa de inmediato con su clave.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Custom Confirmation Popup for Deleting User */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                Revocar Acceso de Usuario
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar la cuenta de{" "}
                <strong className="text-slate-900">{userToDelete.name}</strong>?
              </p>
              <p className="text-[11px] text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                {userToDelete.email}
              </p>
              <p className="text-[11px] text-slate-400">
                El colaborador perderá el acceso inmediato a la plataforma.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={confirmDeleteUser}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {deletingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingUser ? "Eliminando..." : "Eliminar Cuenta"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
