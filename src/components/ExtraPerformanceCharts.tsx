"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
  LabelList
} from "recharts";
import { Calendar, Cpu, TrendingUp, Award, Layers, Zap, SlidersHorizontal } from "lucide-react";
import type { TireRecord } from "../types";

const AutonomyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl">
        <p className="text-xs font-bold text-white mb-2">{data.displayName || label}</p>
        <div className="space-y-1.5 text-[11px] font-mono">
          <p className="text-purple-300 flex justify-between gap-4">
            <span>Horas Promedio:</span>
            <span className="font-bold text-right">{data["Horas Promedio"]?.toLocaleString("es-ES")} hrs</span>
          </p>
          <p className="text-teal-300 flex justify-between gap-4">
            <span>KM Promedio:</span>
            <span className="font-bold text-right">{data["KM Promedio"]?.toLocaleString("es-ES")} km</span>
          </p>
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between gap-4 text-slate-400">
            <span>Cantidad Neumáticos:</span>
            <span className="font-bold text-amber-400 text-right">{data.count} u.</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ModelPerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl">
        <p className="text-xs font-bold text-white mb-2">{data.fullModel || label}</p>
        <div className="space-y-1.5 text-[11px] font-mono">
          <p className="text-cyan-400 flex justify-between gap-4">
            <span>KM Promedio:</span>
            <span className="font-bold text-right">{data["KM Promedio"]?.toLocaleString("es-ES")} km</span>
          </p>
          <p className="text-purple-400 flex justify-between gap-4">
            <span>Horas Promedio:</span>
            <span className="font-bold text-right">{data["Horas Promedio"]?.toLocaleString("es-ES")} hrs</span>
          </p>
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between gap-4 text-slate-400">
            <span>Cantidad Neumáticos:</span>
            <span className="font-bold text-amber-400 text-right">{data.count} u.</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ComparisonTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl shadow-2xl border-slate-800">
        <p className="text-xs font-bold text-white mb-2 font-mono">Mes: {label}</p>
        <div className="space-y-1.5 text-[11px] font-mono">
          <p className="text-sky-300 flex justify-between gap-6">
            <span>KM Promedio:</span>
            <span className="font-bold text-right">{data["KM Promedio"]?.toLocaleString("es-ES")} km</span>
          </p>
          <p className="text-pink-300 flex justify-between gap-6">
            <span>Horas Promedio:</span>
            <span className="font-bold text-right">{data["Horas Promedio"]?.toLocaleString("es-ES")} hrs</span>
          </p>
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between gap-6 text-slate-400">
            <span>Cantidad de Bajas (N):</span>
            <span className="font-bold text-amber-400 text-right">{data.count} u.</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const getMonthLabelAndValue = (fechaBaja?: string) => {
  if (!fechaBaja) return null;
  const cleanDate = fechaBaja.replace(/\//g, "-");
  const parts = cleanDate.split("-");
  if (parts.length < 3) return null;

  let month = parseInt(parts[1]);
  let year = parseInt(parts[2]);
  if (parts[0].length === 4) {
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
  }
  if (isNaN(month) || isNaN(year)) return null;

  const realMonthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  const mName = realMonthNames[month - 1] || "Unknown";
  const yy = String(year).slice(-2);
  const label = `${mName}-${yy}`;
  const sortValue = year * 100 + month;
  return { label, sortValue };
};

interface ExtraPerformanceChartsProps {
  records: TireRecord[];
}

export default function ExtraPerformanceCharts({ records }: ExtraPerformanceChartsProps) {
  // Month Multi-selector state
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["TODOS"]);

  // Monthly historical comparison filter state
  const [selectedComparisonMonths, setSelectedComparisonMonths] = useState<string[]>(["TODOS"]);

  // Detect Autonomía
  const isAutonomy = (fleetName: string): boolean => {
    const norm = (fleetName || "").toLowerCase();
    return norm.includes("autonomy") || norm.includes("autonom");
  };

  // Month options specifically for historical comparison
  const comparisonMonthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    const monthList: { label: string; sortValue: number }[] = [];

    records.forEach((record) => {
      const info = getMonthLabelAndValue(record.fechaBaja);
      if (!info) return;

      if (!monthsSet.has(info.label)) {
        monthsSet.add(info.label);
        monthList.push(info);
      }
    });

    return monthList.sort((a, b) => a.sortValue - b.sortValue);
  }, [records]);

  // Toggle monthly filter for comparison
  const toggleComparisonMonth = (monthLabel: string) => {
    if (monthLabel === "TODOS") {
      setSelectedComparisonMonths(["TODOS"]);
    } else {
      let next = selectedComparisonMonths.filter(m => m !== "TODOS");
      if (next.includes(monthLabel)) {
        next = next.filter(m => m !== monthLabel);
      } else {
        next.push(monthLabel);
      }
      if (next.length === 0) {
        setSelectedComparisonMonths(["TODOS"]);
      } else {
        setSelectedComparisonMonths(next);
      }
    }
  };

  // Compute monthly data for Manned and Autonomous
  const monthlyHistoricalData = useMemo(() => {
    const monthsToPlot = comparisonMonthOptions.filter(opt => {
      if (selectedComparisonMonths.includes("TODOS")) return true;
      return selectedComparisonMonths.includes(opt.label);
    });

    const mannedData = monthsToPlot.map(monthOpt => {
      const recsInMonth = records.filter(rec => {
        const info = getMonthLabelAndValue(rec.fechaBaja);
        return info && info.label === monthOpt.label && !isAutonomy(rec.flota || "");
      });

      const count = recsInMonth.length;
      const totalKms = recsInMonth.reduce((sum, r) => sum + (r.kmsMillas || 0), 0);
      const totalHrs = recsInMonth.reduce((sum, r) => sum + (r.hrsTotales || 0), 0);

      return {
        month: monthOpt.label,
        "KM Promedio": count > 0 ? Math.round(totalKms / count) : 0,
        "Horas Promedio": count > 0 ? Math.round(totalHrs / count) : 0,
        count
      };
    });

    const autonomyData = monthsToPlot.map(monthOpt => {
      const recsInMonth = records.filter(rec => {
        const info = getMonthLabelAndValue(rec.fechaBaja);
        return info && info.label === monthOpt.label && isAutonomy(rec.flota || "");
      });

      const count = recsInMonth.length;
      const totalKms = recsInMonth.reduce((sum, r) => sum + (r.kmsMillas || 0), 0);
      const totalHrs = recsInMonth.reduce((sum, r) => sum + (r.hrsTotales || 0), 0);

      return {
        month: monthOpt.label,
        "KM Promedio": count > 0 ? Math.round(totalKms / count) : 0,
        "Horas Promedio": count > 0 ? Math.round(totalHrs / count) : 0,
        count
      };
    });

    return { mannedData, autonomyData };
  }, [records, comparisonMonthOptions, selectedComparisonMonths]);

  // 1. Month options extraction
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

  // Handle Month Toggle
  const toggleMonth = (monthLabel: string) => {
    if (monthLabel === "TODOS") {
      setSelectedMonths(["TODOS"]);
    } else {
      let next = selectedMonths.filter(m => m !== "TODOS");
      if (next.includes(monthLabel)) {
        next = next.filter(m => m !== monthLabel);
      } else {
        next.push(monthLabel);
      }
      if (next.length === 0) {
        setSelectedMonths(["TODOS"]);
      } else {
        setSelectedMonths(next);
      }
    }
  };

  // 2. Filter records for Tire Models charts based on selected months
  const filteredRecordsForModels = useMemo(() => {
    if (selectedMonths.includes("TODOS")) return records;
    return records.filter((record) => {
      if (!record.fechaBaja) return false;
      const cleanDate = record.fechaBaja.replace(/\//g, "-");
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
      return selectedMonths.includes(label);
    });
  }, [records, selectedMonths]);

  // 3. Autonomy vs. All Fleets Data computation
  const fleetAutonomyData = useMemo(() => {
    let autonomySumHrs = 0;
    let autonomySumKms = 0;
    let autonomyCount = 0;

    let convSumHrs = 0;
    let convSumKms = 0;
    let convCount = 0;

    records.forEach((rec) => {
      const isAuto = isAutonomy(rec.flota || "");
      if (isAuto) {
        autonomySumHrs += rec.hrsTotales || 0;
        autonomySumKms += rec.kmsMillas || 0;
        autonomyCount += 1;
      } else {
        convSumHrs += rec.hrsTotales || 0;
        convSumKms += rec.kmsMillas || 0;
        convCount += 1;
      }
    });

    const overallAutonomyHrs = autonomyCount > 0 ? Math.round(autonomySumHrs / autonomyCount) : 0;
    const overallAutonomyKms = autonomyCount > 0 ? Math.round(autonomySumKms / autonomyCount) : 0;
    const overallConvHrs = convCount > 0 ? Math.round(convSumHrs / convCount) : 0;
    const overallConvKms = convCount > 0 ? Math.round(convSumKms / convCount) : 0;

    const percentDiffHrs = overallConvHrs > 0
      ? Math.round(((overallAutonomyHrs - overallConvHrs) / overallConvHrs) * 100)
      : 0;

    const fleetsList = [
      {
        displayName: "Autónomo (AUT)",
        "Horas Promedio": overallAutonomyHrs,
        "KM Promedio": overallAutonomyKms,
        isAuto: true,
        count: autonomyCount
      },
      {
        displayName: "Convencional",
        "Horas Promedio": overallConvHrs,
        "KM Promedio": overallConvKms,
        isAuto: false,
        count: convCount
      }
    ];

    return {
      fleetsList,
      overallAutonomyHrs,
      overallAutonomyKms,
      overallConvHrs,
      overallConvKms,
      percentDiffHrs
    };
  }, [records]);

  // 4. Group by Tire Model ("Tipo") with best performance
  const modelPerformanceData = useMemo(() => {
    const groups: { [key: string]: { kmsSum: number; hrsSum: number; count: number } } = {};

    filteredRecordsForModels.forEach((rec) => {
      const model = rec.tipo || "Otros Modelos";
      if (!groups[model]) {
        groups[model] = { kmsSum: 0, hrsSum: 0, count: 0 };
      }
      groups[model].kmsSum += rec.kmsMillas || 0;
      groups[model].hrsSum += rec.hrsTotales || 0;
      groups[model].count += 1;
    });

    const data = Object.keys(groups).map((model) => {
      const g = groups[model];
      return {
        model: model.length > 25 ? model.substring(0, 22) + "..." : model,
        fullModel: model,
        "KM Promedio": g.count > 0 ? Math.round(g.kmsSum / g.count) : 0,
        "Horas Promedio": g.count > 0 ? Math.round(g.hrsSum / g.count) : 0,
        count: g.count
      };
    });

    return data;
  }, [filteredRecordsForModels]);

  // Sort by highest average values
  const modelsSortedByKm = useMemo(() => {
    return [...modelPerformanceData].sort((a, b) => b["KM Promedio"] - a["KM Promedio"]);
  }, [modelPerformanceData]);

  const modelsSortedByHrs = useMemo(() => {
    return [...modelPerformanceData].sort((a, b) => b["Horas Promedio"] - a["Horas Promedio"]);
  }, [modelPerformanceData]);

  // Dynamic vertical label for vertical bar charts inside bars
  const ExtraVerticalBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === undefined || value === null || value === "" || value === 0) return null;
    if (height < 32) return null; // Only show if height is enough to draw inside

    const formattedValue = typeof value === "number" ? value.toLocaleString("es-ES") : String(value);
    const cx = x + width / 2;
    const cy = y + height / 2;

    return (
      <text
        x={cx}
        y={cy}
        fill="#ffffff"
        fontSize={9}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(-90, ${cx}, ${cy})`}
        className="pointer-events-none select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] font-mono"
      >
        {formattedValue}
      </text>
    );
  };

  return (
    <div id="extra-charts-section" className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* 1. Autonomy vs. Other Fleets Chart */}
      <div className="xl:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="text-purple-400 shrink-0 animate-pulse" size={18} />
                Flotas Autónomas vs. Convencionales
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Comparativa directa enfatizando la operación de Autonomía</p>
            </div>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">
              IA / AUT
            </span>
          </div>

          {/* Quick Autonomy KPI Summary */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase block">PROM. HORAS AUTÓNOMO</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold text-purple-300 font-mono">
                  {fleetAutonomyData.overallAutonomyHrs.toLocaleString("es-ES")}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">hrs</span>
              </div>
              <span className="text-[10px] text-purple-400 font-medium font-mono mt-1 block flex items-center gap-1">
                <TrendingUp size={10} />
                {fleetAutonomyData.percentDiffHrs > 0 ? `+${fleetAutonomyData.percentDiffHrs}%` : `${fleetAutonomyData.percentDiffHrs}%`} vs Convencional
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase block">PROM. KM AUTÓNOMO</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base font-bold text-teal-300 font-mono">
                  {fleetAutonomyData.overallAutonomyKms.toLocaleString("es-ES")}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">km</span>
              </div>
              <span className="text-[9px] text-slate-500 block font-mono mt-1">
                Flota Convencional: {fleetAutonomyData.overallConvKms.toLocaleString("es-ES")} km
              </span>
            </div>
          </div>

          {/* Fleet Chart Comparison */}
          <div className="h-[220px] w-full mt-5 bg-slate-950/30 rounded-xl p-2 border border-slate-800/40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetAutonomyData.fleetsList} margin={{ top: 15, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="displayName" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip content={<AutonomyTooltip />} />
                <Bar dataKey="Horas Promedio" fill="#475569" radius={[3, 3, 0, 0]}>
                  {fleetAutonomyData.fleetsList.map((entry, index) => {
                    const isAuto = entry.isAuto;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isAuto ? "#a855f7" : "#334155"}
                        stroke={isAuto ? "#c084fc" : undefined}
                        strokeWidth={isAuto ? 1 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
            <Zap size={12} className="text-amber-500 animate-pulse" />
            La flota de autonomía destaca en color morado
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-semibold">N = {records.length}</span>
        </div>
      </div>

      {/* 2 & 3. Tire Models ("Tipo") Performance Charts */}
      <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="text-teal-400 shrink-0" size={18} />
                Modelos de Neumáticos (Tipo) de Mayor Rendimiento
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Análisis de kilómetros y horas promedio agrupado por Tipo</p>
            </div>

            {/* Multi-selector de meses */}
            <div className="flex flex-col space-y-1 min-w-[200px] max-w-full">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase flex items-center gap-1">
                <SlidersHorizontal size={10} />
                FILTRAR POR MESES (MULTI-SELECTOR)
              </span>
              <div className="flex flex-wrap gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 max-h-[80px] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => toggleMonth("TODOS")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${selectedMonths.includes("TODOS")
                      ? "bg-teal-500 text-slate-950"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Todos
                </button>
                {monthOptions.map((opt, i) => {
                  const isSelected = selectedMonths.includes(opt.label);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleMonth(opt.label)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-900 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unified Composed Chart for Models: KM and Hours */}
          <div className="mt-5">
            <div className="bg-slate-950/20 rounded-xl p-4 border border-slate-800/40">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-2 font-mono">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block"></span>
                  KILÓMETROS PROMEDIO (BARRAS)
                  <span className="text-slate-500">vs</span>
                  <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block"></span>
                  HORAS PROMEDIO (LÍNEA)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Ordenado por Kilometraje Descendente</span>
              </div>

              <div className="h-[280px] w-full">
                {modelsSortedByKm.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
                    No hay datos disponibles en este mes
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={modelsSortedByKm} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="model"
                        stroke="#64748b"
                        fontSize={8}
                        tickLine={false}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />

                      {/* Left Y-Axis for Kilometers (Cyan) */}
                      <YAxis
                        yAxisId="left"
                        stroke="#06b6d4"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />

                      {/* Right Y-Axis for Hours (Purple) */}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#a855f7"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.toLocaleString("es-ES")}
                      />

                      <Tooltip content={<ModelPerformanceTooltip />} />

                      <Legend
                        verticalAlign="top"
                        height={32}
                        wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", paddingBottom: "10px" }}
                      />

                      {/* Bar for KM Promedio */}
                      <Bar
                        yAxisId="left"
                        dataKey="KM Promedio"
                        name="KM Promedio"
                        fill="#06b6d4"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={45}
                      >
                        <LabelList dataKey="KM Promedio" content={<ExtraVerticalBarLabel />} />
                        {modelsSortedByKm.map((entry, idx) => {
                          const colors = ["#06b6d4", "#0891b2", "#0e7490", "#115e59", "#134e4a"];
                          return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                        })}
                      </Bar>

                      {/* Line for Horas Promedio */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="Horas Promedio"
                        name="Horas Promedio"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#c084fc", stroke: "#0f172a", strokeWidth: 1.5 }}
                        activeDot={{ r: 6 }}
                      >
                        <LabelList
                          dataKey="Horas Promedio"
                          position="top"
                          offset={10}
                          formatter={(val: any) => `${Number(val).toLocaleString("es-ES")} h`}
                          style={{ fill: "#c084fc", fontSize: 9, fontWeight: "bold", fontFamily: "monospace" }}
                        />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Calendar size={12} className="text-indigo-400" />
            Los gráficos anteriores se calculan en base a los meses seleccionados
          </span>
          {selectedMonths.includes("TODOS") ? (
            <span className="text-[10px] text-slate-400 font-mono">Filtrando: Todos los meses</span>
          ) : (
            <span className="text-[10px] text-indigo-400 font-mono font-bold">
              Meses: {selectedMonths.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* 4. Historical Monthly Comparison: Manned vs. Autonomous */}
      <div className="xl:col-span-3 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between mt-6">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="text-indigo-400 shrink-0" size={18} />
                Rendimiento de Neumáticos: Tripulados vs. Autonomía por Mes
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comparativa de kilómetros promedio (barras) y horas promedio (líneas) por tipo de flota a lo largo de los meses
              </p>
            </div>

            {/* Multi-selector de meses para comparación */}
            <div className="flex flex-col space-y-1 min-w-[200px] max-w-full">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase flex items-center gap-1">
                <SlidersHorizontal size={10} />
                FILTRAR POR MESES (MULTIPLE)
              </span>
              <div className="flex flex-wrap gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 max-h-[80px] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => toggleComparisonMonth("TODOS")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${selectedComparisonMonths.includes("TODOS")
                      ? "bg-indigo-500 text-slate-950"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                >
                  Todos
                </button>
                {comparisonMonthOptions.map((opt, i) => {
                  const isSelected = selectedComparisonMonths.includes(opt.label);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleComparisonMonth(opt.label)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-900 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unified layout of two side-by-side charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            {/* Left Chart: Tripulados (Manned) */}
            <div className="bg-slate-950/20 rounded-xl p-4 border border-slate-800/40">
              <div className="text-center mb-3">
                <h4 className="text-xs font-bold text-sky-400 font-mono">
                  Rendimiento de Ntcos flota de Tripulados
                </h4>
                <p className="text-[9px] text-slate-500 font-mono">
                  (CAT 797, CAT 798 tripulados, KOM 960E)
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2 rounded bg-blue-600 inline-block"></span>
                  KMs (BARRAS)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span>
                  HORAS (LÍNEA)
                </span>
              </div>

              <div className="h-[250px] w-full">
                {monthlyHistoricalData.mannedData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
                    No hay datos disponibles para los meses seleccionados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyHistoricalData.mannedData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#64748b"
                        fontSize={8}
                        tickLine={false}
                      />

                      {/* Left Y-Axis for Kilometers */}
                      <YAxis
                        yAxisId="left"
                        stroke="#2563eb"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />

                      {/* Right Y-Axis for Hours */}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#38bdf8"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.toLocaleString("es-ES")}
                      />

                      <Tooltip content={<ComparisonTooltip />} />

                      {/* Bar for KM Promedio */}
                      <Bar
                        yAxisId="left"
                        dataKey="KM Promedio"
                        name="KM Promedio"
                        fill="#2563eb"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={40}
                      >
                        <LabelList dataKey="KM Promedio" content={<ExtraVerticalBarLabel />} />
                      </Bar>

                      {/* Line for Horas Promedio */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="Horas Promedio"
                        name="Horas Promedio"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#0ea5e9", stroke: "#0f172a", strokeWidth: 1.5 }}
                        activeDot={{ r: 5 }}
                      >
                        <LabelList
                          dataKey="Horas Promedio"
                          position="top"
                          offset={8}
                          formatter={(val: any) => `${Number(val).toLocaleString("es-ES")} h`}
                          style={{ fill: "#38bdf8", fontSize: 8, fontWeight: "bold", fontFamily: "monospace" }}
                        />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right Chart: Autónomos (Autonomous) */}
            <div className="bg-slate-950/20 rounded-xl p-4 border border-slate-800/40">
              <div className="text-center mb-3">
                <h4 className="text-xs font-bold text-amber-500 font-mono">
                  Rendimiento de Ntcos flota de Autonomía
                </h4>
                <p className="text-[9px] text-slate-500 font-mono">
                  (CAT 798AC Autónomos)
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2 rounded bg-amber-600 inline-block"></span>
                  KMs (BARRAS)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-rose-400 inline-block"></span>
                  HORAS (LÍNEA)
                </span>
              </div>

              <div className="h-[250px] w-full">
                {monthlyHistoricalData.autonomyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
                    No hay datos disponibles para los meses seleccionados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyHistoricalData.autonomyData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#64748b"
                        fontSize={8}
                        tickLine={false}
                      />

                      {/* Left Y-Axis for Kilometers */}
                      <YAxis
                        yAxisId="left"
                        stroke="#d97706"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />

                      {/* Right Y-Axis for Hours */}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#f43f5e"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.toLocaleString("es-ES")}
                      />

                      <Tooltip content={<ComparisonTooltip />} />

                      {/* Bar for KM Promedio */}
                      <Bar
                        yAxisId="left"
                        dataKey="KM Promedio"
                        name="KM Promedio"
                        fill="#d97706"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={40}
                      >
                        <LabelList dataKey="KM Promedio" content={<ExtraVerticalBarLabel />} />
                      </Bar>

                      {/* Line for Horas Promedio */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="Horas Promedio"
                        name="Horas Promedio"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#fb7185", stroke: "#0f172a", strokeWidth: 1.5 }}
                        activeDot={{ r: 5 }}
                      >
                        <LabelList
                          dataKey="Horas Promedio"
                          position="top"
                          offset={8}
                          formatter={(val: any) => `${Number(val).toLocaleString("es-ES")} h`}
                          style={{ fill: "#fb7185", fontSize: 8, fontWeight: "bold", fontFamily: "monospace" }}
                        />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Calendar size={12} className="text-indigo-400 font-bold" />
            Los gráficos comparativos se calculan de manera independiente en base a la flota
          </span>
          {selectedComparisonMonths.includes("TODOS") ? (
            <span className="text-[10px] text-slate-400 font-mono">Filtrando: Todos los meses</span>
          ) : (
            <span className="text-[10px] text-indigo-400 font-mono font-bold">
              Meses: {selectedComparisonMonths.join(", ")}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
