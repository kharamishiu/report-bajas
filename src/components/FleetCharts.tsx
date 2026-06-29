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
  PieChart,
  Pie
} from "recharts";
import { LayoutGrid, BarChart3, PieChartIcon, Award, Calendar, Filter } from "lucide-react";
import type { TireRecord } from "../types";

interface FleetChartsProps {
  records: TireRecord[];
}

const ReasonTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl">
        <p className="text-xs font-bold text-white mb-2">Motivo: {data.name}</p>
        <div className="space-y-1.5 text-[11px] font-mono">
          <p className="text-cyan-400 flex justify-between gap-4">
            <span>KM Promedio:</span>
            <span className="font-bold text-right">{Number(data.value).toLocaleString("es-ES")} km</span>
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

export default function FleetCharts({ records }: FleetChartsProps) {
  const [activeTab, setActiveTab] = useState<"avg" | "sum" | "reasons" | "type_reasons">("avg");
  const [selectedMonth, setSelectedMonth] = useState<string>("TODOS");

  // Extract month options for filtering
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

  // Filter records specifically for Type Reasons based on selectedMonth
  const filteredRecordsForTypeReasons = useMemo(() => {
    if (selectedMonth === "TODOS") return records;
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
      return label === selectedMonth;
    });
  }, [records, selectedMonth]);

  // Colors for each fleet
  const CHART_COLORS = [
    "#6366f1", // indigo-500
    "#14b8a6", // teal-500
    "#3b82f6", // blue-500
    "#818cf8", // indigo-400
    "#a855f7", // purple-500
    "#4f46e5", // indigo-600
    "#ec4899"  // pink-500
  ];

  const REASON_COLORS: { [key: string]: string } = {
    "Corte": "#EF4444",                // rojo
    "Desgastes Anormales": "#EAB308",  // amarillo
    "Fallas": "#3B82F6",               // azul

    "Separación": "#A855F7",           // violeta
    "Desgarro": "#10B981",             // verde

    "Desgaste": "#84CC16",             // lima
    "Fatiga": "#F97316",               // naranja
    "Impacto": "#8B5E3C",              // café / tierra

    "Otros": "#94A3B8"                 // gris
  };

  // Group data for the charts
  const fleetData = useMemo(() => {
    const groups: { [key: string]: TireRecord[] } = {};
    records.forEach((rec) => {
      const fleet = rec.flota || "Sin Flota Especificada";
      if (!groups[fleet]) groups[fleet] = [];
      groups[fleet].push(rec);
    });

    return Object.keys(groups).map((fleetName) => {
      const fleetRecords = groups[fleetName];
      const count = fleetRecords.length;
      const hoursSum = fleetRecords.reduce((sum, r) => sum + r.hrsTotales, 0);
      const hoursAvg = count > 0 ? hoursSum / count : 0;
      const costSum = fleetRecords.reduce((sum, r) => sum + r.costoTotal, 0);
      const lossSum = fleetRecords.reduce((sum, r) => sum + r.perdidaUsd, 0);

      // Counts of reasons for decommissioning
      const reasons: { [key: string]: number } = {};
      fleetRecords.forEach((r) => {
        const reason = r.motivoBaja || "Otros";
        reasons[reason] = (reasons[reason] || 0) + 1;
      });

      return {
        name: fleetName.replace(" Haul Truck", "").replace(" [Tripulated]", " (Trip)").replace(" [Autonomy]", " (Aut)"),
        fullName: fleetName,
        "Promedio de Horas": Math.round(hoursAvg),
        "Horas Totales": hoursSum,
        "Cantidad": count,
        "Pérdida USD": lossSum,
        reasons
      };
    });
  }, [records]);

  // Transform data for Reason distribution chart (based on average kilometers)
  const reasonData = useMemo(() => {
    const groups: { [key: string]: { kmsSum: number; count: number } } = {};
    records.forEach((r) => {
      const reason = r.motivoBaja || "Otros";
      if (!groups[reason]) {
        groups[reason] = { kmsSum: 0, count: 0 };
      }
      groups[reason].kmsSum += r.kmsMillas || 0;
      groups[reason].count += 1;
    });

    return Object.keys(groups).map((reasonName) => {
      const g = groups[reasonName];
      const avgKms = g.count > 0 ? Math.round(g.kmsSum / g.count) : 0;
      return {
        name: reasonName,
        value: avgKms, // average kilometers as chart value
        count: g.count
      };
    });
  }, [records]);


  const chartData = reasonData.map((item) => ({
    ...item,
    fill: REASON_COLORS[item.name] ?? "#64748b",
  }));

  // Transform data for Reason distribution by Tire Type
  const typeReasonsData = useMemo(() => {
    const uniqueReasons = new Set<string>();
    const groups: { [key: string]: { [reason: string]: number } } = {};
    const typeCounts: { [key: string]: number } = {};

    filteredRecordsForTypeReasons.forEach((rec) => {
      const type = rec.tipo || "Sin Tipo Especificado";
      const reason = rec.motivoBaja || "Otros";
      uniqueReasons.add(reason);

      if (!groups[type]) {
        groups[type] = {};
        typeCounts[type] = 0;
      }
      groups[type][reason] = (groups[type][reason] || 0) + 1;
      typeCounts[type] += 1;
    });

    const list = Object.keys(groups).map((type) => {
      const item: any = {
        name: type,
        displayName: type.length > 25 ? type.substring(0, 22) + "..." : type,
        total: typeCounts[type]
      };
      Array.from(uniqueReasons).forEach((reason) => {
        item[reason] = groups[type][reason] || 0;
      });
      return item;
    }).sort((a, b) => b.total - a.total);

    return {
      list,
      allReasons: Array.from(uniqueReasons)
    };
  }, [filteredRecordsForTypeReasons]);

  // Find fleet with best average life
  const topFleet = useMemo(() => {
    if (fleetData.length === 0) return null;
    return [...fleetData].sort((a, b) => b["Promedio de Horas"] - a["Promedio de Horas"])[0];
  }, [fleetData]);

  // Find fleet with most accumulated hours
  const mostUsedFleet = useMemo(() => {
    if (fleetData.length === 0) return null;
    return [...fleetData].sort((a, b) => b["Horas Totales"] - a["Horas Totales"])[0];
  }, [fleetData]);

  return (
    <div id="fleet-charts-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={20} />
            Visualización Comparativa de la Flota
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Compara rendimientos utilizando variables clave del ciclo de vida del neumático</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs w-fit">
          <button
            id="tab-avg-hours"
            onClick={() => setActiveTab("avg")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === "avg" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
          >
            Promedio de Horas
          </button>
          <button
            id="tab-sum-hours"
            onClick={() => setActiveTab("sum")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === "sum" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
          >
            Horas Totales (Suma)
          </button>
          <button
            id="tab-reasons"
            onClick={() => setActiveTab("reasons")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === "reasons" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
          >
            Motivos de Baja
          </button>
          <button
            id="tab-type-reasons"
            onClick={() => setActiveTab("type_reasons")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === "type_reasons" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
          >
            Motivos por Tipo
          </button>
        </div>
      </div>

      {/* Quick metrics row for charts context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topFleet && (
          <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-4 flex items-start space-x-3">
            <div className="bg-teal-500/10 p-2 rounded-lg text-teal-400 mt-0.5">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono">MAYOR RENDIMIENTO PROMEDIO</p>
              <h4 className="text-sm font-bold text-white mt-1">{topFleet.fullName}</h4>
              <p className="text-xs text-teal-400 font-medium font-mono mt-0.5">
                {topFleet["Promedio de Horas"].toLocaleString()} horas de vida promedio
              </p>
            </div>
          </div>
        )}

        {mostUsedFleet && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start space-x-3">
            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 mt-0.5">
              <LayoutGrid size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono">MAYOR DESGASTE ACUMULADO (Suma)</p>
              <h4 className="text-sm font-bold text-white mt-1">{mostUsedFleet.fullName}</h4>
              <p className="text-xs text-blue-400 font-medium font-mono mt-0.5">
                {mostUsedFleet["Horas Totales"].toLocaleString()} horas totales de baja
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Render selected chart */}
      <div id="chart-viewport" className={`${activeTab === "type_reasons" ? "min-h-[460px] lg:h-[460px]" : "h-[360px]"} w-full bg-slate-950/20 p-4 border border-slate-800/40 rounded-xl transition-all`}>
        {activeTab === "avg" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fleetData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit=" hr" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                itemStyle={{ color: "#2dd4bf" }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} horas`, "Promedio de Vida"]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
              <Bar dataKey="Promedio de Horas" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                {fleetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "sum" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fleetData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit=" hr" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                itemStyle={{ color: "#3b82f6" }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} horas`, "Horas Totales Sumadas"]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
              <Bar dataKey="Horas Totales" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {fleetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "reasons" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Pie Chart of reason breakdown */}
            <div className="h-full flex flex-col justify-center">
              <h5 className="text-xs font-mono text-slate-400 text-center mb-1">Distribución Global de Motivos (KM Promedio)</h5>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  {/*reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={REASON_COLORS[entry.name] || "#64748b"} />
                    ))*/}


                  <Tooltip content={<ReasonTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {reasonData.map((entry, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REASON_COLORS[entry.name] || "#64748b" }} />
                    <span>
                      {entry.name}: <strong className="text-slate-300">{Number(entry.value).toLocaleString("es-ES")} km</strong> <span className="text-slate-500 font-mono">({entry.count} u.)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* List breakdown by fleet */}
            <div className="overflow-y-auto px-2 space-y-3 h-full pr-1">
              <h5 className="text-xs font-mono text-slate-400 border-b border-slate-800 pb-1.5">Motivos Desglosados por Flota</h5>
              {fleetData.map((fleet, idx) => (
                <div key={idx} className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-200 mb-1.5">
                    <span>{fleet.fullName}</span>
                    <span className="text-slate-500 font-mono font-normal">N = {fleet.Cantidad}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(fleet.reasons).map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[10px] px-2 py-0.5 rounded-full border flex items-center space-x-1"
                        style={{
                          backgroundColor: `${REASON_COLORS[reason] || "#64748b"}10`,
                          borderColor: `${REASON_COLORS[reason] || "#64748b"}40`,
                          color: REASON_COLORS[reason] || "#cbd5e1"
                        }}
                      >
                        <span>{reason}:</span>
                        <strong className="font-mono">{fleet.reasons[reason]}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "type_reasons" && (
          <div className="flex flex-col h-full space-y-4">
            {/* Inline Month Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-400 shrink-0 animate-pulse" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Filtro de Desgaste por Mes</h4>
                  <p className="text-[10px] text-slate-400">Analiza los motivos de baja agrupados por tipo para un periodo específico</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Filter size={10} />
                  MES DE BAJA:
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-mono font-semibold"
                >
                  <option value="TODOS">Todos los meses (Histórico)</option>
                  {monthOptions.map((opt, i) => (
                    <option key={i} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
              {/* Horizontal Stacked Bar Chart */}
              <div className="h-full flex flex-col justify-center min-h-0">
                <h5 className="text-xs font-mono text-slate-400 text-center mb-1.5">Distribución de Motivos por Tipo de Neumático</h5>
                <div className="flex-1 min-h-[260px] w-full bg-slate-950/20 p-2 border border-slate-800/40 rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={typeReasonsData.list}
                      layout="vertical"
                      margin={{ top: 10, right: 15, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis dataKey="displayName" type="category" stroke="#64748b" fontSize={9} tickLine={false} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                        labelStyle={{ fontWeight: "bold", color: "#f8fafc", fontSize: "11px" }}
                        itemStyle={{ fontSize: "11px" }}
                        formatter={(value: any, name: any) => [`${value} neumáticos`, name]}
                      />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }} />
                      {typeReasonsData.allReasons.map((reason, idx) => (
                        <Bar
                          key={idx}
                          dataKey={reason}
                          name={reason}
                          stackId="a"
                          fill={REASON_COLORS[reason] || "#64748b"}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* List breakdown by tire type */}
              <div className="overflow-y-auto px-2 space-y-3 h-full pr-1 min-h-0">
                <h5 className="text-xs font-mono text-slate-400 border-b border-slate-800 pb-1.5 flex justify-between">
                  <span>Desglose Detallado por Tipo</span>
                  <span className="text-indigo-400 font-bold">{selectedMonth === "TODOS" ? "Todos los meses" : selectedMonth}</span>
                </h5>
                {typeReasonsData.list.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-600 font-mono">
                    No hay registros para el mes seleccionado
                  </div>
                ) : (
                  typeReasonsData.list.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200 mb-1.5">
                        <span className="truncate max-w-[70%]">{item.fullName}</span>
                        <span className="text-slate-500 font-mono font-normal shrink-0">N = {item.total}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {typeReasonsData.allReasons.map((reason, rIdx) => {
                          const count = item[reason] || 0;
                          if (count === 0) return null;
                          const percentage = item.total > 0 ? Math.round((count / item.total) * 100) : 0;
                          return (
                            <span
                              key={rIdx}
                              className="text-[10px] px-2 py-0.5 rounded-full border flex items-center space-x-1"
                              style={{
                                backgroundColor: `${REASON_COLORS[reason] || "#64748b"}10`,
                                borderColor: `${REASON_COLORS[reason] || "#64748b"}40`,
                                color: REASON_COLORS[reason] || "#cbd5e1"
                              }}
                            >
                              <span>{reason}:</span>
                              <strong className="font-mono">{count}</strong>
                              <span className="text-[9px] opacity-60">({percentage}%)</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
