"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ArrowRight } from "lucide-react";

interface IngestResults {
  clientes?: number;
  facturas?: number;
  pagos?: number;
  obligaciones?: number;
}

export default function CsvUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<IngestResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EXPECTED_FILES = [
    { key: "clientes", label: "clientes.csv", desc: "1 registro por cliente, plazos y límites" },
    { key: "facturas", label: "facturas.csv", desc: "Facturas y notas de crédito" },
    { key: "pagos", label: "pagos.csv", desc: "Pagos recibidos de clientes" },
    { key: "obligaciones", label: "obligaciones.csv", desc: "Egresos, sueldos, arriendos y bancos" },
  ];

  const handleFiles = (fileList: FileList | File[]) => {
    setError(null);
    setResults(null);
    const updated = { ...files };

    Array.from(fileList).forEach((file) => {
      const name = file.name.toLowerCase();
      if (name.includes("cliente")) updated.clientes = file;
      else if (name.includes("factura")) updated.facturas = file;
      else if (name.includes("pago")) updated.pagos = file;
      else if (name.includes("obligacion")) updated.obligaciones = file;
    });

    setFiles(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) {
      setError("Por favor arrastra o selecciona al menos un archivo CSV.");
      return;
    }

    setUploading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    for (const key of fileKeys) {
      formData.append(key, files[key]);
    }

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar los archivos");
      }

      setResults(data.results);
      if (onUploadComplete) onUploadComplete();
    } catch (err: any) {
      setError(err.message || "Error inesperado al conectar con el servidor.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl w-full mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
          Carga de Exportación ERP (Juan - TI)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Arrastra los archivos CSV diarios exportados por el ERP. La carga es idempotente: no duplicará registros.
        </p>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-cyan-500 bg-cyan-950/20 scale-[1.01]"
            : "border-slate-700 hover:border-slate-500 bg-slate-950/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-slate-800/80 rounded-full text-cyan-400">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Arrastra aquí tus archivos <span className="text-cyan-400">.csv</span> o haz clic para explorar
          </p>
          <p className="text-xs text-slate-500">
            Acepta: clientes.csv, facturas.csv, pagos.csv, obligaciones.csv
          </p>
        </div>
      </div>

      {/* File status pills */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {EXPECTED_FILES.map(({ key, label, desc }) => {
          const loaded = !!files[key];
          return (
            <div
              key={key}
              className={`p-3 rounded-lg border text-left transition-all ${
                loaded
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                  : "bg-slate-800/40 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {label}
                </span>
                {loaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Pendiente</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{desc}</p>
            </div>
          );
        })}
      </div>

      {/* Error notification */}
      {error && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success notification */}
      {results && (
        <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-300 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ¡Ingesta completada con éxito!
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
            {results.clientes !== undefined && <div>• Clientes cargados: {results.clientes.toLocaleString()}</div>}
            {results.facturas !== undefined && <div>• Facturas/NC cargadas: {results.facturas.toLocaleString()}</div>}
            {results.pagos !== undefined && <div>• Pagos recibidos: {results.pagos.toLocaleString()}</div>}
            {results.obligaciones !== undefined && <div>• Obligaciones cargadas: {results.obligaciones.toLocaleString()}</div>}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-5 flex justify-end gap-3">
        {Object.keys(files).length > 0 && (
          <button
            type="button"
            onClick={() => setFiles({})}
            className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Limpiar selección
          </button>
        )}
        <button
          type="button"
          disabled={uploading || Object.keys(files).length === 0}
          onClick={handleUpload}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg transition"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando e ingestado...
            </>
          ) : (
            <>
              Cargar datos en Supabase
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
