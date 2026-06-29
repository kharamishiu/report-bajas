"use client";

import { useState, useMemo, useEffect } from "react";

import { 
  Calendar, 
  Search, 
  Tag, 
  Settings, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Compass, 
  MapPin, 
  DollarSign, 
  Eye, 
  Filter, 
  FileText,
  RefreshCw,
  TrendingUp,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  X,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { TireRecord } from "../types";

interface TireInspectorProps {
  records: TireRecord[];
}

// Extract valid image URL or base64 from the observacion column; returns null if none is present
function getTireImage(record: TireRecord): string | null {
  const obs = (record.observacion || "").trim();
  if (!obs) return null;
  
  // If observacion starts with a standard web image URL or base64 data, return it
  if (obs.startsWith("http://") || obs.startsWith("https://") || obs.startsWith("data:image/")) {
    // Convert generic Google Drive share links to direct web view URLs to display properly
    if (obs.includes("drive.google.com/file/d/")) {
      const match = obs.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return obs;
  }
  
  // Look for any HTTP/HTTPS URL embedded within the observation text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = obs.match(urlRegex);
  if (match && match[0]) {
    const foundUrl = match[0];
    if (foundUrl.includes("drive.google.com/file/d/")) {
      const gMatch = foundUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (gMatch && gMatch[1]) {
        return `https://docs.google.com/uc?export=view&id=${gMatch[1]}`;
      }
    }
    return foundUrl;
  }
  
  return null;
}

// Convert DD-MM-YYYY or YYYY-MM-DD string to a Date object safely
function parseRecordDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/\//g, "-").trim();
  const parts = clean.split("-");
  if (parts.length < 3) return null;
  
  let day = parseInt(parts[0]);
  let month = parseInt(parts[1]);
  let year = parseInt(parts[2]);
  
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  }
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, day);
}

// Extracted helper for formatting dates to YYYY-MM-DD for standard input fields
function dateToInputString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TireInspector({ records }: TireInspectorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("TODOS");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // States for advanced image rotation & move modal
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [dragKey, setDragKey] = useState<number>(0);

  // Close modal on Escape key press
  useEffect(() => {
    if (!modalImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalImage]);

  // Extract month options for dropdown
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    const monthList: { label: string; sortValue: number }[] = [];

    records.forEach((record) => {
      if (!record.fechaBaja) return;
      const cleanDate = record.fechaBaja.replace(/\//g, "-");
      const parts = cleanDate.split("-");
      if (parts.length < 3) return;

      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
      }
      if (isNaN(month) || isNaN(year)) return;

      const realMonthNames = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
      ];
      const mName = realMonthNames[month - 1] || "Unknown";
      const yy = String(year).slice(-2);
      const label = `${mName}-${yy}`;

      if (!monthsSet.has(label)) {
        monthsSet.add(label);
        monthList.push({ label, sortValue: year * 100 + month });
      }
    });

    return monthList.sort((a, b) => a.sortValue - b.sortValue);
  }, [records]);

  // Filter tire records based on month and date range
  const filteredTires = useMemo(() => {
    return records.filter((r) => {
      // 1. Month Filter
      if (selectedMonth !== "TODOS") {
        if (!r.fechaBaja) return false;
        const cleanDate = r.fechaBaja.replace(/\//g, "-");
        const parts = cleanDate.split("-");
        if (parts.length < 3) return false;

        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        if (parts[0].length === 4) {
          year = parseInt(parts[0]);
          month = parseInt(parts[1]);
        }
        if (isNaN(month) || isNaN(year)) return false;

        const realMonthNames = [
          "Ene", "Feb", "Mar", "Abr", "May", "Jun",
          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
        ];
        const mName = realMonthNames[month - 1] || "Unknown";
        const yy = String(year).slice(-2);
        const label = `${mName}-${yy}`;
        
        if (label !== selectedMonth) return false;
      }

      // 2. Date Range Filter
      if (startDate || endDate) {
        const itemDate = parseRecordDate(r.fechaBaja);
        if (!itemDate) return false;

        if (startDate) {
          const sDate = new Date(startDate + "T00:00:00");
          if (itemDate < sDate) return false;
        }

        if (endDate) {
          const eDate = new Date(endDate + "T23:59:59");
          if (itemDate > eDate) return false;
        }
      }

      // 3. Simple Search Term Filter (Serie or Equipo)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSerie = (r.serie || "").toLowerCase().includes(query);
        const matchesEquipo = (r.equipo || "").toLowerCase().includes(query);
        const matchesFlota = (r.flota || "").toLowerCase().includes(query);
        if (!matchesSerie && !matchesEquipo && !matchesFlota) return false;
      }

      return true;
    });
  }, [records, selectedMonth, startDate, endDate, searchTerm]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedMonth("TODOS");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  // Get currently active selected tire record
  const selectedRecord = useMemo(() => {
    if (filteredTires.length === 0) return null;
    if (selectedId) {
      const found = filteredTires.find(t => t.id === selectedId);
      if (found) return found;
    }
    return filteredTires[0];
  }, [filteredTires, selectedId]);

  return (
    <div id="tire-inspector-section" className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header and Filter Block */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Módulo de Inspección
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
              Buscador & Auditor de Neumáticos Dados de Baja
            </h3>
            <p className="text-xs text-slate-400">
              Usa los filtros temporales para encontrar registros y visualizar la ficha de baja junto con la foto de observaciones.
            </p>
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
          >
            <RefreshCw size={12} />
            <span>Restablecer Filtros</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Month Search Dropdown */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Filter size={10} />
              BUSCAR POR MES
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3.5 py-2.5 w-full focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
            >
              <option value="TODOS">Todos los meses (Histórico)</option>
              {monthOptions.map((opt, i) => (
                <option key={i} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range - From */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Calendar size={10} />
              RANGO DESDE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 w-full focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Date range - To */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Calendar size={10} />
              RANGO HASTA
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 w-full focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Free text search */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Search size={10} />
              BUSCADOR RÁPIDO
            </label>
            <input
              type="text"
              placeholder="Serie, Equipo o Flota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3.5 py-2.5 w-full focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>
      </div>

      {/* Main 2-Column Inspector Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[550px]">
        
        {/* Column 1: List of tire records (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between max-h-[600px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-xs font-mono font-bold text-slate-400">
              Registros Encontrados: <strong className="text-indigo-400">{filteredTires.length}</strong>
            </span>
            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">
              Listado
            </span>
          </div>

          {filteredTires.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <AlertTriangle className="text-amber-500/80" size={32} />
              <div>
                <p className="text-sm font-bold text-slate-300">Ningún registro coincide</p>
                <p className="text-xs text-slate-500 max-w-[220px] mx-auto mt-1">
                  Intenta cambiar el mes de búsqueda, ampliar el rango de fechas o limpiar el buscador.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {filteredTires.map((item) => {
                const isSelected = selectedRecord?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500/80 shadow-md shadow-indigo-600/5 text-slate-100"
                        : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/50 hover:border-slate-700/80 text-slate-300"
                    }`}
                  >
                    {/* Conditional visual indicator of damage or photo */}
                    {getTireImage(item) ? (
                      <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden shrink-0 relative flex items-center justify-center">
                        <img 
                          src={getTireImage(item)!} 
                          alt="Mini" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-80" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-amber-400">
                          {item.pos}°
                        </span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-600/5 border border-indigo-500/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] text-slate-500 font-mono">Pos</span>
                        <span className="text-xs font-bold font-mono text-indigo-400">
                          {item.pos}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-xs text-indigo-300 truncate">
                          {item.serie}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {item.fechaBaja}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="text-slate-200 font-bold bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/40">
                          {item.equipo}
                        </span>
                        <span>•</span>
                        <span>Pos: {item.pos}</span>
                      </div>

                      {/* Unified Motivo Baja & Item Baja with "Ver" indicator */}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="text-[10px] text-slate-400 bg-slate-950/20 px-2 py-1 rounded-md border border-slate-800/20 truncate flex items-center gap-1 flex-1">
                          <AlertTriangle size={10} className="text-amber-500 shrink-0" />
                          <span className="truncate">
                            {item.motivoBaja} / <strong className="text-slate-300">{item.itemBaja || "General"}</strong>
                          </span>
                        </div>
                        {getTireImage(item) && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(item.id);
                              setModalImage(getTireImage(item));
                              setModalTitle(`Serie: ${item.serie} - Equipo: ${item.equipo}`);
                              setRotation(0);
                              setZoom(1);
                              setFlipH(false);
                              setFlipV(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedId(item.id);
                                setModalImage(getTireImage(item));
                                setModalTitle(`Serie: ${item.serie} - Equipo: ${item.equipo}`);
                                setRotation(0);
                                setZoom(1);
                                setFlipH(false);
                                setFlipV(false);
                              }
                            }}
                            className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded border border-indigo-500/20 transition-all shrink-0 flex items-center gap-1 cursor-pointer select-none active:scale-95"
                          >
                            <Eye size={10} />
                            <span>Ver</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-800/60 pt-3 mt-3 text-[10px] text-slate-500 font-mono text-center">
            Mostrando {filteredTires.length} de {records.length} bajas de neumáticos
          </div>
        </div>

        {/* Column 2: Detailed visual tire card inspector (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
          {selectedRecord ? (() => {
            const detailImageUrl = getTireImage(selectedRecord);
            return (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* Photo Area from Observacion column - Conditional Rendering */}
                {detailImageUrl ? (
                  <div className="h-56 w-full relative bg-slate-950 overflow-hidden border-b border-slate-800 flex items-center justify-center shrink-0">
                    <img 
                      src={detailImageUrl} 
                      alt={`Neumático ${selectedRecord.serie}`} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-all duration-500"
                    />
                    
                    {/* Visual Glassmorphism overlay on photo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/10 pointer-events-none" />

                    {/* Badge for position */}
                    <span className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur border border-indigo-500 text-white font-mono font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg">
                      POSICIÓN: {selectedRecord.pos}
                    </span>

                    {/* Left side details on top of photo */}
                    <div className="absolute bottom-4 left-5 right-5 text-left">
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">
                        {selectedRecord.flota}
                      </span>
                      <h4 className="text-lg font-black text-white font-mono mt-1.5 flex items-center gap-2">
                        SERIE: {selectedRecord.serie}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <MapPin size={11} className="text-slate-500" />
                        Equipo: <strong className="text-indigo-400">{selectedRecord.equipo}</strong> | Baja: {selectedRecord.fechaBaja}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/80 p-6 border-b border-slate-800 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] bg-amber-500/15 text-amber-400 font-mono font-bold px-2.5 py-1 rounded border border-amber-500/20">
                          {selectedRecord.flota}
                        </span>
                        <h4 className="text-xl font-black text-white font-mono mt-2 flex items-center gap-2">
                          SERIE: {selectedRecord.serie}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-1.5 flex items-center gap-1.5">
                          <MapPin size={11} className="text-slate-500" />
                          Equipo: <strong className="text-indigo-400">{selectedRecord.equipo}</strong> | Baja: {selectedRecord.fechaBaja}
                        </p>
                      </div>
                      <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-xl shrink-0 text-center sm:text-right">
                        <div className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider">POSICIÓN</div>
                        <div className="text-lg font-black text-white font-mono leading-none mt-1">{selectedRecord.pos}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data & Breakdown Content */}
                <div className="p-5 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                  
                  {/* Unified Motivo de Baja and Item de Baja Display with Ver Button */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase flex items-center gap-1">
                        <AlertTriangle size={11} className="text-red-400 animate-pulse" />
                        MOTIVO DE BAJA E ÍTEM DE BAJA (UNIFICADO)
                      </span>
                      <p className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5 truncate">
                        <span className="truncate">{selectedRecord.motivoBaja}</span>
                        <span className="text-slate-600 font-normal">/</span> 
                        <span className="text-indigo-400 truncate">{selectedRecord.itemBaja || "Sin Ítem Especial"}</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {detailImageUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setModalImage(detailImageUrl);
                            setModalTitle(`Serie: ${selectedRecord.serie} - Equipo: ${selectedRecord.equipo}`);
                            setRotation(0);
                            setZoom(1);
                            setFlipH(false);
                            setFlipV(false);
                            setDragKey(prev => prev + 1);
                          }}
                          className="px-3.5 py-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <Eye size={12} />
                          <span>Ver Foto</span>
                        </button>
                      ) : (
                        <span className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-1.5 opacity-60 cursor-not-allowed">
                          <Eye size={12} />
                          <span>Ver</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid details (2 columns in details box) */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Left subgrid: Operational details */}
                    <div className="space-y-3.5 bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/40">
                      <h5 className="text-[10px] font-mono text-slate-400 border-b border-slate-800/60 pb-1 flex items-center gap-1">
                        <Activity size={10} className="text-cyan-400" />
                        Rendimiento Operacional
                      </h5>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock size={11} className="text-slate-500" />
                          Horas Totales:
                        </span>
                        <strong className="text-slate-200 font-mono">{selectedRecord.hrsTotales?.toLocaleString("es-ES")} h</strong>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <TrendingUp size={11} className="text-slate-500" />
                          Kilómetros:
                        </span>
                        <strong className="text-slate-200 font-mono">{selectedRecord.kmsMillas?.toLocaleString("es-ES")} km</strong>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Compass size={11} className="text-slate-500" />
                          Utilización %:
                        </span>
                        <strong className="text-slate-200 font-mono">{selectedRecord.utilPercent}%</strong>
                      </div>
                    </div>

                    {/* Right subgrid: Costs details */}
                    <div className="space-y-3.5 bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/40">
                      <h5 className="text-[10px] font-mono text-slate-400 border-b border-slate-800/60 pb-1 flex items-center gap-1">
                        <DollarSign size={10} className="text-emerald-400" />
                        Auditoría de Costos
                      </h5>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Costo Total:</span>
                        <strong className="text-slate-200 font-mono">${selectedRecord.costoTotal?.toLocaleString("es-ES")} USD</strong>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Pérdida USD:</span>
                        <strong className="text-red-400 font-mono">${selectedRecord.perdidaUsd?.toLocaleString("es-ES")} USD</strong>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">USD/Hora:</span>
                        <strong className="text-slate-200 font-mono">${selectedRecord.usdHrs} /hr</strong>
                      </div>
                    </div>

                  </div>

                  {/* Full-width Observation Render */}
                  <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/40 space-y-1">
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase flex items-center gap-1">
                      <FileText size={10} className="text-indigo-400" />
                      DETALLES DE OBSERVACIÓN
                    </span>
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 shrink-0 text-slate-400">
                        <ImageIcon size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {selectedRecord.observacion || "No se especificaron observaciones para este neumático."}
                        </p>
                        {detailImageUrl && (
                          <p className="text-[10px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
                            <span>●</span> Foto detectada e indexada correctamente
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Footer Status */}
                <div className="bg-slate-900 border-t border-slate-800/60 px-5 py-3.5 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
                  <span className="flex items-center gap-1">
                    <Settings size={12} className="text-slate-400 spin-slow" />
                    ID: {selectedRecord.id}
                  </span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-indigo-400 font-bold border border-slate-800/60">
                    {selectedRecord.marca} {selectedRecord.dimension}
                  </span>
                </div>

              </div>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Eye className="text-slate-600 animate-pulse" size={40} />
              <div>
                <p className="text-sm font-bold text-slate-400">Ningún neumático seleccionado</p>
                <p className="text-xs text-slate-600 max-w-[240px] mx-auto mt-1">
                  Selecciona uno de los registros del listado izquierdo para auditar los detalles y su fotografía.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modern, Premium rotatable & draggable Image Modal */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
            onClick={() => setModalImage(null)}
          >
            {/* Modal Window Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-600/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono leading-tight">
                      {modalTitle || "Visualización de Neumático"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Auditoría Visual de Daños & Posición
                    </p>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setModalImage(null)}
                  className="p-1.5 rounded-lg bg-slate-855 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800 cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body with Draggable Canvas Area */}
              <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-6">
                
                {/* Indicator badge for mobility */}
                <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pointer-events-none">
                  <Move size={11} className="text-indigo-400" />
                  <span>Haz clic y arrastra para mover la foto | Rueda del ratón para Zoom</span>
                </div>

                {/* Draggable Viewport */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                  <motion.div
                    key={dragKey}
                    drag
                    dragMomentum={false}
                    dragTransition={{ power: 0.1, timeConstant: 100 }}
                    className="cursor-grab active:cursor-grabbing flex items-center justify-center"
                  >
                    {/* Rotated & Zoomed Photo Element */}
                    <motion.img
                      src={modalImage}
                      alt="Inspección Detallada"
                      referrerPolicy="no-referrer"
                      className="max-h-[60vh] max-w-[80vw] object-contain rounded-lg select-none shadow-xl pointer-events-none"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      onWheel={(e) => {
                        if (e.deltaY < 0) {
                          setZoom(prev => Math.min(prev + 0.15, 4));
                        } else {
                          setZoom(prev => Math.max(prev - 0.15, 0.4));
                        }
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Status stats */}
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-4">
                  <div>Rotación: <span className="text-indigo-400 font-bold">{rotation}°</span></div>
                  <div>Zoom: <span className="text-indigo-400 font-bold">{Math.round(zoom * 100)}%</span></div>
                  {(flipH || flipV) && <span className="text-amber-500 font-bold">Modo Espejo Activo</span>}
                </div>

                {/* Buttons Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  
                  {/* Rotate CCW */}
                  <button
                    onClick={() => setRotation(prev => (prev - 90) % 360)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Girar 90° a la izquierda"
                  >
                    <RotateCcw size={14} />
                    <span>Girar Izq</span>
                  </button>

                  {/* Rotate CW */}
                  <button
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Girar 90° a la derecha"
                  >
                    <RotateCw size={14} />
                    <span>Girar Der</span>
                  </button>

                  <div className="h-5 w-px bg-slate-800 mx-1" />

                  {/* Flip H */}
                  <button
                    onClick={() => setFlipH(prev => !prev)}
                    className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                      flipH 
                        ? "bg-indigo-600 border-indigo-500 text-white" 
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                    title="Espejo horizontal"
                  >
                    <span className="font-mono text-[10px]">↔</span>
                    <span>Espejo H</span>
                  </button>

                  {/* Flip V */}
                  <button
                    onClick={() => setFlipV(prev => !prev)}
                    className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                      flipV 
                        ? "bg-indigo-600 border-indigo-500 text-white" 
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                    title="Espejo vertical"
                  >
                    <span className="font-mono text-[10px]">↕</span>
                    <span>Espejo V</span>
                  </button>

                  <div className="h-5 w-px bg-slate-800 mx-1" />

                  {/* Zoom Out */}
                  <button
                    onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Alejar"
                  >
                    <ZoomOut size={14} />
                  </button>

                  {/* Zoom In */}
                  <button
                    onClick={() => setZoom(prev => Math.min(prev + 0.2, 4))}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Acercar"
                  >
                    <ZoomIn size={14} />
                  </button>

                  <div className="h-5 w-px bg-slate-800 mx-1" />

                  {/* Reset Everything */}
                  <button
                    onClick={() => {
                      setRotation(0);
                      setZoom(1);
                      setFlipH(false);
                      setFlipV(false);
                      setDragKey(prev => prev + 1);
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Restablecer"
                  >
                    <RefreshCw size={13} className="text-amber-500" />
                    <span>Restablecer</span>
                  </button>

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
