"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Settings,
  Calendar,
  Save,

  Check,

  RotateCcw,
  AlertCircle
} from "lucide-react";
import type { TireRecord } from "../types";
import { parseDateStringToMs } from "../utils";



interface SearchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tires: TireRecord[];
  baseStartDate: string;
  baseEndDate: string;
  isBaseFilterActive: boolean;
  onSave: (start: string, end: string, active: boolean) => void;
}

export default function SearchSettingsModal({
  isOpen,
  onClose,
  tires,
  baseStartDate,
  baseEndDate,
  isBaseFilterActive,
  onSave,
}: SearchSettingsModalProps) {
  const [tempStart, setTempStart] = useState(baseStartDate);
  const [tempEnd, setTempEnd] = useState(baseEndDate);
  const [tempActive, setTempActive] = useState(isBaseFilterActive);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when modal opens or base values change
  useEffect(() => {
    if (isOpen) {
      setTempStart(baseStartDate);
      setTempEnd(baseEndDate);
      setTempActive(isBaseFilterActive);
      setSaveSuccess(false);
    }
  }, [isOpen, baseStartDate, baseEndDate, isBaseFilterActive]);

  // Extract min/max dates dynamically from dataset
  /*const datasetDateRange = useEffect(() => {}, [tires]);*/

  const { minDateStr, maxDateStr, minDateLabel, maxDateLabel } = (() => {
    const datesMs = tires
      .map((t) => parseDateStringToMs(t.fechaBaja))
      .filter((ms) => ms > 0);

    if (datesMs.length === 0) {
      return { minDateStr: "", maxDateStr: "", minDateLabel: "N/A", maxDateLabel: "N/A" };
    }

    const minMs = Math.min(...datesMs);
    const maxMs = Math.max(...datesMs);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const formatDateLabel = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return {
      minDateStr: formatDate(new Date(minMs)),
      maxDateStr: formatDate(new Date(maxMs)),
      minDateLabel: formatDateLabel(new Date(minMs)),
      maxDateLabel: formatDateLabel(new Date(maxMs)),
    };
  })();

  const applyPreset = (preset: "all" | "y2025" | "last6m" | "first6m") => {
    //const today = new Date();

    if (preset === "all") {
      setTempStart(minDateStr);
      setTempEnd(maxDateStr);
    } else if (preset === "y2025") {
      setTempStart("2025-01-01");
      setTempEnd("2025-12-31");
    } else if (preset === "last6m") {
      // 2025-07-01 to 2025-12-31
      setTempStart("2025-07-01");
      setTempEnd("2025-12-31");
    } else if (preset === "first6m") {
      // 2025-01-01 to 2025-06-30
      setTempStart("2025-01-01");
      setTempEnd("2025-06-30");
    }
  };

  const handleSave = () => {
    onSave(tempStart, tempEnd, tempActive);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setTempStart("");
    setTempEnd("");
    setTempActive(false);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end md:justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Settings Drawer / Box */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md h-full md:h-auto md:max-h-[90vh] bg-slate-900 border-l md:border border-slate-800 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Upper Glow decoration */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Configuración de Referencia
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Parámetros base de consultas
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Context info banner */}
              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider block">
                  Información del Dataset
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">FECHA MÍNIMA:</span>
                    <span className="font-bold">{minDateLabel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">FECHA MÁXIMA:</span>
                    <span className="font-bold">{maxDateLabel}</span>
                  </div>
                </div>
              </div>

              {/* Toggle Baseline Filter */}
              <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white block">
                    Activar Filtro de Referencia Base
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Aplica la restricción de fechas en todo el sistema.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempActive(!tempActive)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-200 cursor-pointer ${tempActive ? "bg-indigo-600" : "bg-slate-800"
                    }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-all duration-200 ${tempActive ? "translate-x-5.5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              {/* Date selection form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  <Calendar size={14} className="text-teal-400" />
                  <span>Rango de Fechas Base</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-mono block">DESDE (FECHA DE BAJA)</label>
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      min={minDateStr}
                      max={maxDateStr}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-mono block">HASTA (FECHA DE BAJA)</label>
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      min={minDateStr}
                      max={maxDateStr}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Validation alert */}
                {tempStart && tempEnd && tempStart > tempEnd && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex items-start gap-2 text-[10px]">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>La fecha de inicio ("Desde") no puede ser posterior a la fecha de fin ("Hasta").</span>
                  </div>
                )}
              </div>

              {/* Presets Shortcuts */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                  Atajos y Ajustes Rápidos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("all")}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="font-bold font-mono">Todo el Historial</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Rango completo del set</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("y2025")}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="font-bold font-mono">Año Completo 2025</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Ene 2025 - Dic 2025</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("first6m")}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="font-bold font-mono">1er Semestre 2025</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Ene 2025 - Jun 2025</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("last6m")}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="font-bold font-mono">2do Semestre 2025</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Jul 2025 - Dic 2025</div>
                  </button>
                </div>
              </div>

              {/* Extra instructions */}
              <p className="text-[10px] text-slate-400 italic leading-normal p-3 bg-slate-950/20 border border-slate-800/40 rounded-xl">
                * El estado guardado actuará como el filtro de referencia principal para todos los reportes, gráficos y análisis de IA del panel.
              </p>

            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
              {/* Reset state */}
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-slate-800"
              >
                <RotateCcw size={13} />
                <span>Limpiar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={tempStart && tempEnd && tempStart > tempEnd ? true : false}
                  className={`px-4.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${tempStart && tempEnd && tempStart > tempEnd
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50 shadow-none"
                      : saveSuccess
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-emerald-500/10"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/15"
                    }`}
                >
                  {saveSuccess ? (
                    <>
                      <Check size={14} />
                      <span>Guardado!</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Guardar Filtro Base</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
