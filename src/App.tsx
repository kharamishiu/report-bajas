

import { useState, useMemo } from 'react'

import './App.css'
import { SAMPLE_TIRES } from "./data";
import FleetCharts from "./components/FleetCharts";
import ExtraPerformanceCharts from "./components/ExtraPerformanceCharts";
import AIAnalysis from "./components/AIAnalysis";
import MonthlyPerformanceChart from "./components/MonthlyPerformanceChart";
import TireInspector from "./components/TireInspector";
import SearchSettingsModal from "./components/SearchSettingsModal";
import {

  Upload,
  RotateCcw,
  FileSpreadsheet,
  Filter,
  X,
  FileText,

  CheckCircle2,
  AlertCircle,
  TrendingUp,

  LayoutGrid,
  Calendar,
  Truck,
  Settings
} from "lucide-react";
import type { TireRecord } from './types'
import { parseDateStringToMs, parseExcelBuffer, parseTireData } from './utils'
import FleetTable from './components/FleetTable'

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("Storage access blocked by iframe sandbox restriction:", e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("Storage write blocked by iframe sandbox restriction:", e);
    }
  }
};

function App() {

  const [tires, setTires] = useState<TireRecord[]>(SAMPLE_TIRES);
  const [currentView, setCurrentView] = useState<"dashboard" | "inspector">("dashboard");
  const [selectedFleet, setSelectedFleet] = useState<string>("TODAS");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(["TODAS"]);
  const [selectedReason, setSelectedReason] = useState<string>("TODAS");

  // Base reference date filter states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [baseStartDate, setBaseStartDate] = useState<string>(() => {
    return safeLocalStorage.getItem("base_start_date") || "";
  });
  const [baseEndDate, setBaseEndDate] = useState<string>(() => {
    return safeLocalStorage.getItem("base_end_date") || "";
  });
  const [isBaseFilterActive, setIsBaseFilterActive] = useState<boolean>(() => {
    return safeLocalStorage.getItem("is_base_filter_active") === "true";
  });

  const handleSaveSettings = (start: string, end: string, active: boolean) => {
    setBaseStartDate(start);
    setBaseEndDate(end);
    setIsBaseFilterActive(active);
    safeLocalStorage.setItem("base_start_date", start);
    safeLocalStorage.setItem("base_end_date", end);
    safeLocalStorage.setItem("is_base_filter_active", String(active));
  };

  const [rawPaste, setRawPaste] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to safely navigate to segments when switching from inspector view
  const navigateToSection = (sectionId: string) => {
    setCurrentView("dashboard");
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Dynamic filter lists derived from active dataset
  const fleetOptions = useMemo(() => {
    const list = Array.from(new Set(tires.map(t => t.flota).filter(Boolean)));
    return ["TODAS", ...list];
  }, [tires]);

  const brandOptions = useMemo(() => {
    const list = Array.from(new Set(tires.map(t => t.marca).filter(Boolean)));
    return ["TODAS", ...list];
  }, [tires]);

  const reasonOptions = useMemo(() => {
    const list = Array.from(new Set(tires.map(t => t.motivoBaja).filter(Boolean)));
    return ["TODAS", ...list];
  }, [tires]);

  // Brand toggle function for multi-selection
  const toggleBrand = (brand: string) => {
    if (brand === "TODAS") {
      setSelectedBrands(["TODAS"]);
    } else {
      let next = selectedBrands.filter(b => b !== "TODAS");
      if (next.includes(brand)) {
        next = next.filter(b => b !== brand);
      } else {
        next.push(brand);
      }
      if (next.length === 0) {
        setSelectedBrands(["TODAS"]);
      } else {
        setSelectedBrands(next);
      }
    }
  };

  // Handle data pasting from Excel
  const handlePasteSubmit = () => {
    try {
      if (!rawPaste.trim()) {
        setErrorMsg("Por favor pega datos en formato TSV (de Excel) o CSV.");
        return;
      }
      const parsed = parseTireData(rawPaste);
      if (parsed.length === 0) {
        throw new Error("No se pudo detectar ninguna fila con datos legibles. Verifica las cabeceras.");
      }
      setTires(parsed);
      setRawPaste("");
      setShowUploader(false);
      setSuccessMsg(`Se cargaron correctamente ${parsed.length} neumáticos dados de baja.`);
      setErrorMsg(null);

      // Reset filters
      setSelectedFleet("TODAS");
      setSelectedBrands(["TODAS"]);
      setSelectedReason("TODAS");

      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar el texto pegado.");
    }
  };

  // Handle standard file uploads (CSV/TSV/XLSX/XLS)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let parsed: TireRecord[] = [];
        if (isExcel) {
          const buffer = event.target?.result as ArrayBuffer;
          parsed = parseExcelBuffer(buffer);
        } else {
          const text = event.target?.result as string;
          parsed = parseTireData(text);
        }

        if (parsed.length === 0) {
          throw new Error("El archivo está vacío o no contiene el formato esperado con las cabeceras requeridas.");
        }
        setTires(parsed);
        setShowUploader(false);
        setSuccessMsg(`Se importaron exitosamente ${parsed.length} neumáticos desde el archivo Excel/CSV.`);
        setErrorMsg(null);
        setSelectedFleet("TODAS");
        setSelectedBrands(["TODAS"]);
        setSelectedReason("TODAS");
        setTimeout(() => setSuccessMsg(null), 5000);
      } catch (err: any) {
        setErrorMsg(err.message || "Error al leer el archivo.");
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Re-load the premium dataset
  const handleResetData = () => {
    setTires(SAMPLE_TIRES);
    setSelectedFleet("TODAS");
    setSelectedBrands(["TODAS"]);
    setSelectedReason("TODAS");
    setSuccessMsg("Se restauraron los datos del informe original de la flota.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Filter tires matching selections
  const filteredTires = useMemo(() => {
    return tires.filter((t) => {
      // 1. Reference baseline date range filter
      if (isBaseFilterActive) {
        const tMs = parseDateStringToMs(t.fechaBaja);
        console.log(t.fechaBaja)
        console.log('///////////////////')
        console.log(tMs)

        if (tMs > 0) {
          if (baseStartDate) {
            const startMs = new Date(baseStartDate + "T00:00:00").getTime();
            if (tMs < startMs) return false;
          }
          if (baseEndDate) {
            const endMs = new Date(baseEndDate + "T23:59:59").getTime();
            if (tMs > endMs) return false;
          }
        }
      }

      // 2. Regular filters
      const matchFleet = selectedFleet === "TODAS" || t.flota === selectedFleet;
      const matchBrand = selectedBrands.includes("TODAS") || selectedBrands.includes(t.marca);
      const matchReason = selectedReason === "TODAS" || t.motivoBaja === selectedReason;
      return matchFleet && matchBrand && matchReason;
    });
  }, [tires, selectedFleet, selectedBrands, selectedReason, isBaseFilterActive, baseStartDate, baseEndDate]);




  return (
    <>
      <div id="app-root" className="h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden relative">

        {/* Upper ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 bg-gradient-to-b from-indigo-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 no-print shrink-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white italic">T</div>
            <h1 className="text-lg font-semibold tracking-tight font-display">
              FleetMonitor <span className="text-slate-500 font-normal">/ Analítica de Neumáticos</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Sistema Activo
            </div>

            <div className="flex items-center space-x-3 border-l border-slate-800 pl-6">
              <button
                id="btn-toggle-uploader"
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-xs font-semibold text-slate-200 px-3.5 py-2 rounded-lg transition-all"
              >
                <Upload size={14} />
                <span>Cargar Spreadsheet / Excel</span>
              </button>
              <button
                id="btn-restore-data"
                onClick={handleResetData}
                title="Restaurar datos de muestra"
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="w-10 h-10 bg-indigo-950/40 text-indigo-300 rounded-full border border-slate-800 flex items-center justify-center text-xs font-bold font-mono">
              JD
            </div>
          </div>
        </header>

        {/* Main Body with Sidebar Rail */}
        <div className="flex-1 flex overflow-hidden">

          {/* Navigation Rail */}
          <nav className="hidden md:flex w-20 border-r border-slate-800 flex-col items-center py-8 gap-8 bg-slate-900/20 no-print shrink-0">
            <button
              onClick={() => navigateToSection("controls-panel")}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${currentView === "dashboard"
                ? "bg-indigo-600/10 text-indigo-400 border-indigo-600/20"
                : "text-slate-500 hover:text-indigo-400 hover:bg-slate-900/40 border-transparent hover:border-slate-800"
                }`}
              title="Dashboard"
            >
              <LayoutGrid size={22} />
            </button>
            <button
              onClick={() => navigateToSection("fleet-charts-panel")}
              className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-slate-900/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-800"
              title="Gráficos Comparativos"
            >
              <TrendingUp size={22} />
            </button>
            <button
              onClick={() => navigateToSection("monthly-chart-container")}
              className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-slate-900/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-800"
              title="Rendimiento Mensual"
            >
              <Calendar size={22} />
            </button>
            <button
              onClick={() => setCurrentView("inspector")}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${currentView === "inspector"
                ? "bg-indigo-600/10 text-indigo-400 border-indigo-600/20"
                : "text-slate-500 hover:text-indigo-400 hover:bg-slate-900/40 border-transparent hover:border-slate-800"
                }`}
              title="Auditor de Bajas por Camión"
            >
              <Truck size={22} />
            </button>
            <button
              onClick={() => navigateToSection("ai-analysis-panel")}
              className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-slate-900/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-800"
              title="Informe de IA"
            >
              <FileText size={22} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${isBaseFilterActive
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "text-slate-500 hover:text-indigo-400 hover:bg-slate-900/40 border-transparent hover:border-slate-800"
                }`}
              title="Configuración de Referencia Base"
            >
              <Settings size={22} className="transition-transform duration-500 group-hover:rotate-90" />
              {isBaseFilterActive && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-950 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Main Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar relative">

            {currentView === "dashboard" ? (
              <>
                {/* Banner with title */}
                <div className="no-print text-center max-w-2xl mx-auto space-y-3 pb-4">
                  <span className="text-xs bg-indigo-500/15 text-indigo-400 font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Control de Vida Útil de Neumáticos OTR
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                    Análisis de Horas de Baja según Flota
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Obtén de forma interactiva el promedio de horas, totales acumulados de neumáticos gigantes, motivos críticos de retiro de servicio y reportes de ingeniería por IA.
                  </p>
                </div>

                {/* Action feedback notifications */}
                {successMsg && (
                  <div id="success-notification" className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex items-start space-x-3 text-teal-300 max-w-3xl mx-auto">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span className="text-xs font-medium">{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div id="error-notification" className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3 text-rose-300 max-w-3xl mx-auto">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="text-xs font-medium">{errorMsg}</span>
                  </div>
                )}

                {/* Excel / Paste Uploader Drawer */}
                {showUploader && (
                  <div id="uploader-drawer" className="no-print bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-indigo-400" size={16} />
                        Subir Planilla Excel (.xlsx, .xls) o Pegar Copia Directa
                      </h3>
                      <button
                        id="btn-close-uploader"
                        onClick={() => setShowUploader(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-300">Pega directamente las filas de tu hoja de cálculo (incluida la cabecera):</p>
                      <textarea
                        id="pastebox"
                        rows={6}
                        value={rawPaste}
                        onChange={(e) => setRawPaste(e.target.value)}
                        placeholder="Fecha Baja&#9;Código&#9;Serie&#9;Marca&#9;Dimensión&#9;Tipo&#9;Prof. Orig.&#9;...&#9;Hrs.Totales&#9;Flota&#10;01-06-2025&#9;C-19743&#9;PLP0597E2A&#9;Michelin&#9;59/80R63&#9;XDR4&#9;100&#9;...&#9;4325&#9;Komatsu 960E"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 placeholder-slate-700 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="flex items-center space-x-3">
                        <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center space-x-1.5 border border-slate-700/80">
                          <Upload size={14} className="text-indigo-400" />
                          <span>Seleccionar Excel (.xlsx, .xls) o CSV</span>
                          <input
                            id="file-input"
                            type="file"
                            accept=".xlsx,.xls,.csv,.tsv,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Soporta: Excel, CSV, TSV</span>
                      </div>

                      <button
                        id="btn-import-paste"
                        onClick={handlePasteSubmit}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-teal-500/10 w-full sm:w-auto justify-center"
                      >
                        <CheckCircle2 size={14} />
                        <span>Importar Datos Pegados</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Reference Baseline Active Indicator Banner */}
                {isBaseFilterActive && (
                  <div className="no-print bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl mx-auto text-amber-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                        <Settings size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono uppercase tracking-wide">Filtro de Referencia Base Activo</h4>
                        <p className="text-[11px] text-amber-300/80 mt-0.5">
                          Mostrando datos de baja desde <strong className="text-white font-mono">{baseStartDate ? baseStartDate.split("-").reverse().join("/") : "el inicio"}</strong> hasta <strong className="text-white font-mono">{baseEndDate ? baseEndDate.split("-").reverse().join("/") : "el final"}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        Editar Rango
                      </button>
                      <button
                        onClick={() => {
                          setIsBaseFilterActive(false);
                          safeLocalStorage.setItem("is_base_filter_active", "false");
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer"
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Filters Bar */}
                <div id="controls-panel" className="no-print bg-slate-900/30 backdrop-blur-md border border-slate-900 rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs font-mono uppercase tracking-wider">
                    <Filter size={14} className="text-indigo-400" />
                    <span>Filtros Operativos:</span>
                  </div>

                  <div className="flex flex-wrap gap-3 flex-1 justify-end min-w-[280px]">
                    {/* Fleet Filter */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono">SELECCIONAR FLOTA</label>
                      <select
                        id="filter-fleet"
                        value={selectedFleet}
                        onChange={(e) => setSelectedFleet(e.target.value)}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg text-xs text-slate-300 px-3 py-2 w-48 focus:outline-none focus:border-indigo-500"
                      >
                        {fleetOptions.map((opt, i) => (
                          <option key={i} value={opt}>{opt === "TODAS" ? "🚚 Todas las Flotas" : opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Brand Filter (Multi-selector) */}
                    <div className="flex flex-col space-y-1.5 min-w-[240px]">
                      <label className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">MARCAS (MULTI-SELECCIÓN)</label>
                      <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
                        {brandOptions.map((opt, i) => {
                          const isSelected = selectedBrands.includes(opt);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => toggleBrand(opt)}
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer border ${isSelected
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/10"
                                : "bg-slate-900 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                }`}
                            >
                              {opt === "TODAS" ? "🏷️ Todas" : opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reason Filter */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono">MOTIVO DE RETIRO</label>
                      <select
                        id="filter-reason"
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="bg-slate-950 border border-slate-800/80 rounded-lg text-xs text-slate-300 px-3 py-2 w-44 focus:outline-none focus:border-indigo-500 height-full"
                      >
                        {reasonOptions.map((opt, i) => (
                          <option key={i} value={opt}>{opt === "TODAS" ? "⚠️ Todos los Motivos" : opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fleet statistics and Table */}
                <FleetTable records={filteredTires} />

                {/* Graphical dashboard comparative charts */}
                <FleetCharts records={filteredTires} />

                {/* Monthly Kilometers and Hours Dual-Axis Chart */}
                <div id="monthly-chart-container" className="scroll-mt-6">
                  <MonthlyPerformanceChart
                    records={filteredTires}
                    selectedBrands={selectedBrands}
                    isBaseFilterActive={isBaseFilterActive}
                    baseStartDate={baseStartDate}
                    baseEndDate={baseEndDate}
                    allTires={tires}
                  />
                </div>

                {/* New Requested Performance Charts (Autonomy and Tire Model performance with month multi-filter) */}
                <ExtraPerformanceCharts records={filteredTires} />

                {/* AI report section */}
                <AIAnalysis records={filteredTires} />
              </>
            ) : (
              <>
                {/* Banner with title for Inspector */}
                <div className="no-print text-center max-w-2xl mx-auto space-y-3 pb-4">
                  <span className="text-xs bg-indigo-500/15 text-indigo-400 font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Módulo de Auditoría de Campo
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                    Auditoría Visual de Bajas por Camión
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Inspecciona fichas de desgaste individuales. Filtra por mes de baja o por un rango exacto del calendario para ver la información en dos columnas con sus fotos correspondientes.
                  </p>
                </div>

                <TireInspector records={tires} />
              </>
            )}

          </main>
        </div>

        {/* Global Search and Baseline settings modal */}
        <SearchSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          tires={tires}
          baseStartDate={baseStartDate}
          baseEndDate={baseEndDate}
          isBaseFilterActive={isBaseFilterActive}
          onSave={handleSaveSettings}
        />
      </div>
    </>
  )
}

export default App
