"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  Mail,
  MessageSquare,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CollectionsItem } from "@/lib/financial";

interface Props {
  item: CollectionsItem | null;
  onClose: () => void;
}

export default function AiMessageModal({ item, onClose }: Props) {
  const [canal, setCanal] = useState<"whatsapp" | "email">("whatsapp");
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState("");
  const [source, setSource] = useState<"ai" | "fallback">("fallback");
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDraft = async (selectedCanal: "whatsapp" | "email") => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: item.razon_social,
          contacto_nombre: item.contacto_nombre,
          contacto_telefono: item.contacto_telefono,
          contacto_email: item.contacto_email,
          id_documento: item.id_documento,
          monto: item.saldo_pendiente,
          dias_mora: item.dias_mora,
          en_disputa: item.en_disputa,
          es_vip: item.es_vip,
          canal: selectedCanal,
        }),
      });

      const data = await res.json();
      setDraft(data.draft || "");
      setTone(data.tone || "Estándar");
      setSource(data.source || "fallback");
      setModelName(data.model || "");
    } catch (err) {
      console.error("Error al obtener borrador:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (item) {
      setCopied(false);
      fetchDraft(canal);
    }
  }, [item, canal]);

  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (canal === "whatsapp") {
      // Clean phone number (remove spaces, plus, dashes)
      const cleanPhone = (item.contacto_telefono || "").replace(/[^0-9]/g, "");
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draft)}`;
      window.open(url, "_blank");
    } else {
      const subject = `Estado de factura ${item.id_documento} - Nortia Supply`;
      const url = `mailto:${item.contacto_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              <span className="font-semibold uppercase tracking-wider text-slate-900">
                Asistente de Comunicación Contextual
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              {item.razon_social}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-slate-500">
              <span className="font-mono text-slate-800 font-semibold">{item.id_documento}</span>
              <span>•</span>
              <span>Saldo: ${Math.round(item.saldo_pendiente).toLocaleString("es-CL")}</span>
              <span>•</span>
              <span>Mora: {item.dias_mora}d</span>
              {item.es_vip && (
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 font-bold text-[9px] border border-slate-200">
                  VIP
                </span>
              )}
              {item.en_disputa && (
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px] border border-amber-200">
                  En Disputa
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selection & Tone Indicator */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Channel selector */}
          <div className="inline-flex bg-white p-0.5 rounded border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCanal("whatsapp")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                canal === "whatsapp"
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setCanal("email")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                canal === "email"
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Correo</span>
            </button>
          </div>

          {/* Tone & Engine tag */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">Tono:</span>
            <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {tone || "Calibrando..."}
            </span>
          </div>
        </div>

        {/* Text Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Mensaje sugerido (editable antes de enviar):</span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                  source === "ai"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {source === "ai" ? `✨ ${modelName || "Gemini IA"}` : "Motor de Reglas (Determinista)"}
              </span>
              <button
                type="button"
                onClick={() => fetchDraft(canal)}
                disabled={loading}
                title="Regenerar mensaje"
                className="p-1 hover:text-slate-900"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-44 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded border border-slate-200">
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
              <p className="text-slate-400 text-xs">Redactando mensaje contextual...</p>
            </div>
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-sans text-xs focus:outline-hidden focus:bg-white focus:border-slate-400 resize-none"
            />
          )}

          {item.en_disputa && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/80">
              ⚠️ <strong>Regla Comercial de Rodrigo:</strong> Esta cuenta tiene una factura en disputa. El mensaje evita presiones de pago y propone coordinar la revisión del documento.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !draft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !draft}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{canal === "whatsapp" ? "Abrir WhatsApp" : "Abrir Correo"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
