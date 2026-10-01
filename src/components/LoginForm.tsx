"use client";

import React, { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, CheckCircle2, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";

interface Props {
  onLoginSuccess: (user: any) => void;
}

export default function LoginForm({ onLoginSuccess }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [email, setEmail] = useState("admin@nortia.cl");
  const [password, setPassword] = useState("Admin123*Nortia");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request form state
  const [reqNombre, setReqNombre] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [reqConfirmPassword, setReqConfirmPassword] = useState("");
  const [reqRol, setReqRol] = useState("cobranzas");
  const [reqMotivo, setReqMotivo] = useState("");
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Credenciales inválidas. Verifica tu correo y contraseña.");
        }
        throw new Error(authError.message);
      }

      if (data?.user) {
        // Block pending unapproved accounts from accessing the system
        if (data.user.user_metadata?.status === "pending") {
          await supabaseClient.auth.signOut();
          throw new Error("Tu solicitud de acceso está en revisión. El administrador debe aprobar tu cuenta antes de que puedas ingresar.");
        }

        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setReqError(null);

    if (reqPassword.length < 6) {
      setReqError("La contraseña debe tener al menos 6 caracteres.");
      setReqLoading(false);
      return;
    }

    if (reqPassword !== reqConfirmPassword) {
      setReqError("Las contraseñas no coinciden. Por favor verifícalas.");
      setReqLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: reqNombre,
          email: reqEmail,
          password: reqPassword,
          rol_solicitado: reqRol,
          motivo: reqMotivo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar la solicitud");
      }

      setReqSuccess(true);
    } catch (err: any) {
      setReqError(err.message || "Error al enviar la solicitud");
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold tracking-wider text-slate-900 uppercase">
          Nortia Supply
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Plataforma de Control Financiero & Gestión de Cobranzas
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        {!isRequesting ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Iniciar Sesión</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresa con tu cuenta corporativa autorizada
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@nortia.cl"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Contraseña
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <span>Ingresar a la Plataforma</span>
              )}
            </button>

            {/* Quick Demo Credentials */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Credenciales de Administrador:</p>
                <p className="text-slate-600 font-mono mt-0.5">admin@nortia.cl / Admin123*Nortia</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRequesting(true);
                  setReqSuccess(false);
                  setReqError(null);
                  setReqPassword("");
                  setReqConfirmPassword("");
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>¿No tienes cuenta? Solicitar acceso</span>
              </button>
            </div>
          </form>
        ) : (
          /* SOLICITAR ACCESO FORM */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRequesting(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Solicitar Cuenta</h2>
                <p className="text-xs text-slate-500">
                  Crea tu solicitud con tu propia contraseña personal
                </p>
              </div>
            </div>

            {reqSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-emerald-900">
                  ¡Solicitud Enviada con Éxito!
                </p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Tu solicitud para <strong>{reqEmail}</strong> ha sido registrada con tu contraseña personal. Podrás ingresar en cuanto el administrador apruebe tu cuenta.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRequesting(false)}
                  className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium cursor-pointer"
                >
                  Volver al Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="space-y-3">
                {reqError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {reqError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={reqNombre}
                    onChange={(e) => setReqNombre(e.target.value)}
                    placeholder="Ej. Rodrigo Fernández"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Correo Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    placeholder="nombre@nortia.cl"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
                  />
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={reqPassword}
                      onChange={(e) => setReqPassword(e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={reqConfirmPassword}
                      onChange={(e) => setReqConfirmPassword(e.target.value)}
                      placeholder="Repetir clave"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Área o Rol Solicitado
                  </label>
                  <select
                    value={reqRol}
                    onChange={(e) => setReqRol(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:bg-white focus:border-slate-400"
                  >
                    <option value="cobranzas">Cobranzas (Marta & Rodrigo)</option>
                    <option value="finanzas">Finanzas (Carolina)</option>
                    <option value="erp">Operaciones / ERP (Juan)</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Motivo / Cargo
                  </label>
                  <textarea
                    rows={2}
                    value={reqMotivo}
                    onChange={(e) => setReqMotivo(e.target.value)}
                    placeholder="Ej. Gestión de cobranzas asignadas al área comercial..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-slate-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequesting(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={reqLoading}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {reqLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Enviar Solicitud</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <p className="mt-8 text-center text-xs text-slate-400">
        Nortia Supply SpA • Acceso Seguro Supabase Auth
      </p>
    </div>
  );
}
