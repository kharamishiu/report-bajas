"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceLine
} from "recharts";

import { Calendar, Compass, ShieldAlert, Layers } from "lucide-react";
import type { TireRecord } from "../types";
import { parseDateStringToMs } from "../utils";


interface MonthlyPerformanceChartProps {
  records: TireRecord[];
  selectedBrands: string[];
  isBaseFilterActive?: boolean;
  baseStartDate?: string;
  baseEndDate?: string;
  allTires?: TireRecord[];
}

interface MonthlyData {
  name: string; // e.g. "jun-25"
  sortValue: number; // e.g. 202506
  overallAvgKms: number;
  overallAvgHrs: number;
  overallCount: number;
  [key: string]: any; // Allow dynamic brand averages (e.g. avgKms_Michelin)
}

const BRAND_COLORS: { [key: string]: { bar: string; line: string } } = {
  "Michelin": { bar: "#3b82f6", line: "#f97316" },     // Blue bar, Orange line
  "Bridgestone": { bar: "#14b8a6", line: "#ec4899" },  // Teal bar, Pink line
  "Genérica": { bar: "#6366f1", line: "#a855f7" }
};

const getBrandColor = (brand: string, index: number) => {
  if (BRAND_COLORS[brand]) return BRAND_COLORS[brand];
  const defaults = [
    { bar: "#818cf8", line: "#f43f5e" }, // Purple / Coral
    { bar: "#a855f7", line: "#eab308" }  // Orchid / Yellow
  ];
  return defaults[index % defaults.length];
};

const VerticalBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null || value === "" || value === 0) return null;

  // Only display if the bar height is enough to hold the label
  if (height < 30) return null;

  const formattedValue = typeof value === "number" ? value.toLocaleString("es-ES") : String(value);
  const cx = x + width / 2;
  // Center it vertically inside the bar
  const cy = y + height / 2;

  return (
    <text
      x={cx}
      y={cy}
      fill="#ffffff"
      fontSize={13}
      fontWeight="bold"
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(-90, ${cx}, ${cy})`}
      className="pointer-events-none select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] font-mono"
    >
      {formattedValue}
    </text>
  );
};

export default function MonthlyPerformanceChart({
  records,
  selectedBrands,
  isBaseFilterActive,
  baseStartDate,
  baseEndDate,
  allTires
}: MonthlyPerformanceChartProps) {
  // Compute baseline averages for visualization reference
  const baselineAverages = useMemo(() => {
    if (!isBaseFilterActive || !baseStartDate || !baseEndDate) return null;

    const startMs = new Date(baseStartDate + "T00:00:00").getTime();
    const endMs = new Date(baseEndDate + "T23:59:59").getTime();

    // Use full tires list to compute the benchmark
    const sourceTires = allTires || records;
    const baselineRecords = sourceTires.filter((t) => {
      const tMs = parseDateStringToMs(t.fechaBaja);
      return tMs >= startMs && tMs <= endMs;
    });

    if (baselineRecords.length === 0) return null;

    const totalKms = baselineRecords.reduce((sum, r) => sum + (r.kmsMillas || 0), 0);
    const totalHrs = baselineRecords.reduce((sum, r) => sum + (r.hrsTotales || 0), 0);
    const count = baselineRecords.length;

    return {
      avgKms: Math.round(totalKms / count),
      avgHrs: Math.round(totalHrs / count),
      count,
      startDateLabel: baseStartDate.split("-").reverse().join("/"),
      endDateLabel: baseEndDate.split("-").reverse().join("/")
    };
  }, [allTires, records, isBaseFilterActive, baseStartDate, baseEndDate]);

  // Extract specific active brands (ignoring "TODAS")
  const activeBrands = useMemo(() => {
    return selectedBrands.filter(b => b !== "TODAS");
  }, [selectedBrands]);

  const isComparing = activeBrands.length > 1;

  const chartData = useMemo(() => {
    const groups: {
      [key: string]: {
        sortValue: number;
        brandData: {
          [brand: string]: { kmsSum: number; hrsSum: number; count: number }
        };
        kmsSum: number;
        hrsSum: number;
        count: number;
      }
    } = {};

    records.forEach((record) => {
      if (!record.fechaBaja) return;

      // Parse date format: DD-MM-YYYY or similar
      const cleanDate = record.fechaBaja.replace(/\//g, "-");
      const parts = cleanDate.split("-");
      if (parts.length < 3) return;

      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);

      // Check for YYYY-MM-DD
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
      }

      if (isNaN(month) || isNaN(year)) return;

      const realMonthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
      const mName = realMonthNames[month - 1] || "unknown";
      const yy = String(year).slice(-2);
      const label = `${mName}-${yy}`;
      const sortValue = year * 100 + month;

      if (!groups[label]) {
        groups[label] = { sortValue, brandData: {}, kmsSum: 0, hrsSum: 0, count: 0 };
      }

      const grp = groups[label];
      grp.kmsSum += record.kmsMillas || 0;
      grp.hrsSum += record.hrsTotales || 0;
      grp.count += 1;

      const brand = record.marca || "Genérica";
      if (!grp.brandData[brand]) {
        grp.brandData[brand] = { kmsSum: 0, hrsSum: 0, count: 0 };
      }
      grp.brandData[brand].kmsSum += record.kmsMillas || 0;
      grp.brandData[brand].hrsSum += record.hrsTotales || 0;
      grp.brandData[brand].count += 1;
    });

    const result: MonthlyData[] = Object.keys(groups).map((key) => {
      const g = groups[key];
      const dataObj: MonthlyData = {
        name: key,
        sortValue: g.sortValue,
        overallAvgKms: Math.round(g.kmsSum / g.count),
        overallAvgHrs: Math.round(g.hrsSum / g.count),
        overallCount: g.count,
      };

      // Add average per brand
      Object.keys(g.brandData).forEach((brand) => {
        const bd = g.brandData[brand];
        dataObj[`avgKms_${brand}`] = Math.round(bd.kmsSum / bd.count);
        dataObj[`avgHrs_${brand}`] = Math.round(bd.hrsSum / bd.count);
        dataObj[`count_${brand}`] = bd.count;
      });

      return dataObj;
    });

    // Sort chronologically
    return result.sort((a, b) => a.sortValue - b.sortValue);
  }, [records]);

  // Handle custom tooltips to match the dark sleek theme
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl shadow-xl backdrop-blur-sm min-w-[240px]">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{dataPoint.name}</p>

          {isComparing ? (
            <div className="space-y-3">
              {activeBrands.map((brand, idx) => {
                const colors = getBrandColor(brand, idx);
                const kms = dataPoint[`avgKms_${brand}`];
                const hrs = dataPoint[`avgHrs_${brand}`];
                const count = dataPoint[`count_${brand}`] || 0;

                if (kms === undefined && hrs === undefined) return null;

                return (
                  <div key={brand} className="border-t border-slate-800/80 pt-2 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.bar }} />
                      <span className="text-xs font-bold text-white">{brand}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({count} uds)</span>
                    </div>
                    <div className="space-y-0.5 pl-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Kms. Promedio:</span>
                        <span className="font-mono font-bold text-blue-400">{kms ? kms.toLocaleString("es-ES") : "N/D"} Km</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Hrs. Promedio:</span>
                        <span className="font-mono font-bold text-orange-400">{hrs ? hrs.toLocaleString("es-ES") : "N/D"} Hrs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-4 justify-between">
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Kms. Promedio:
                </span>
                <span className="text-xs font-bold text-white">
                  {dataPoint.overallAvgKms?.toLocaleString("es-ES")} Km
                </span>
              </div>
              <div className="flex items-center gap-4 justify-between">
                <span className="text-xs text-orange-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Hrs. Promedio:
                </span>
                <span className="text-xs font-bold text-white">
                  {dataPoint.overallAvgHrs?.toLocaleString("es-ES")} Hrs
                </span>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1 mt-1 text-right">
                Muestras: {dataPoint.overallCount} neumáticos
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="monthly-performance-panel" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="text-indigo-400" size={20} />
            Rendimiento Mensual de Neumáticos (Kms vs Horas)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Vista comparativa del kilometraje acumulado versus la vida útil promedio en horas de baja por mes de retiro
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-indigo-500/10 text-indigo-300 font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/10">
          {isComparing ? <Layers size={14} className="text-teal-400" /> : <Compass size={14} />}
          <span>{isComparing ? "Modo Comparación Multi-Marca Activo" : "Modelo de Referencia: 59/80R63"}</span>
        </div>
      </div>

      {isBaseFilterActive && baselineAverages && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-amber-200/90 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-slate-300">Referencia de Línea Base Activa: <strong className="text-white font-bold">{baselineAverages.startDateLabel}</strong> - <strong className="text-white font-bold">{baselineAverages.endDateLabel}</strong></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">KMs Ref:</span>
              <strong className="text-blue-400 font-extrabold">{baselineAverages.avgKms.toLocaleString("es-ES")} km</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Hrs Ref:</span>
              <strong className="text-orange-400 font-extrabold">{baselineAverages.avgHrs.toLocaleString("es-ES")} hrs</strong>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">({baselineAverages.count} u.)</span>
          </div>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 gap-2">
          <ShieldAlert size={32} className="text-slate-600" />
          <p className="text-sm font-medium">No hay suficientes registros para el gráfico mensual</p>
          <p className="text-xs text-slate-600">Asegúrate de cargar datos con fechas válidas (ej. DD-MM-YYYY)</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Subtitle / Header similar to picture */}
          <div className="text-center mb-6 space-y-1">
            <h4 className="text-md font-bold text-slate-200 tracking-tight font-display">
              {isComparing ? "Comparativa de Rendimientos por Marca" : "Rendimientos en 59/80R63"}
            </h4>

            {isComparing ? (
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs mt-2 bg-slate-950/40 py-2 px-4 rounded-xl max-w-2xl mx-auto border border-slate-900/50">
                {activeBrands.map((brand, idx) => {
                  const colors = getBrandColor(brand, idx);
                  return (
                    <div key={brand} className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: colors.bar }} />
                        <span className="text-slate-300 font-medium">{brand} (Kms)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: colors.line }} />
                        <span className="text-slate-400">{brand} (Hrs)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />
                  <span>Kms. Promedio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 bg-orange-500 rounded-full inline-block" />
                  <span>Hrs. Promedio</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 25, right: 30, left: 20, bottom: 10 }}
                barGap={3}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 45, right: 45 }} // Spacing on sides so first month bar (Jun-25) has plenty of room
                />

                {/* Left Y-Axis for Kilometers (Grounded to 0) */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 90000]}
                  tickFormatter={(val) => val.toLocaleString("es-ES")}
                />

                {/* Right Y-Axis for Hours (Grounded to 0) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f97316"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 5000]}
                  tickFormatter={(val) => val.toLocaleString("es-ES")}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} />

                {/* Reference Baseline Horizontal Lines */}
                {/*isBaseFilterActive && baselineAverages && (
                  <>
                    <ReferenceLine
                      yAxisId="left"
                      y={baselineAverages.avgKms}
                      stroke="#3b82f6"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: `Ref Kms: ${baselineAverages.avgKms.toLocaleString("es-ES")}`,
                        position: "insideBottomLeft",
                        fill: "#60a5fa",
                        fontSize: 10,
                        fontWeight: "bold",
                        className: "font-mono select-none pointer-events-none"
                      }}
                    />
                    <ReferenceLine
                      yAxisId="right"
                      y={baselineAverages.avgHrs}
                      stroke="#f97316"
                      strokeDasharray="4 4" 
                      strokeWidth={2}
                      label={{
                        value: `Ref Hrs: ${baselineAverages.avgHrs.toLocaleString("es-ES")}`,
                        position: "insideTopRight",
                        fill: "#fb923c",
                        fontSize: 10,
                        fontWeight: "bold",
                        className: "font-mono select-none pointer-events-none"
                      }}
                    />
                  </>
                )*/}

                {/* Rendering logic based on mode */}
                {isComparing ? (
                  activeBrands.map((brand, idx) => {
                    const colors = getBrandColor(brand, idx);
                    return (
                      <Bar
                        key={`bar-${brand}`}
                        yAxisId="left"
                        dataKey={`avgKms_${brand}`}
                        name={`${brand} Kms`}
                        fill={colors.bar}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      >
                        <LabelList
                          dataKey={`avgKms_${brand}`}
                          content={<VerticalBarLabel />}
                        />
                      </Bar>
                    );
                  })
                ) : (
                  <Bar
                    yAxisId="left"
                    dataKey="overallAvgKms"
                    name="Kms. Promedio"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  >
                    <LabelList
                      dataKey="overallAvgKms"
                      content={<VerticalBarLabel />}
                    />
                  </Bar>
                )}

                {isComparing ? (
                  activeBrands.map((brand, idx) => {
                    const colors = getBrandColor(brand, idx);
                    return (
                      <Line
                        key={`line-${brand}`}
                        yAxisId="right"
                        type="monotone"
                        dataKey={`avgHrs_${brand}`}
                        name={`${brand} Horas`}
                        stroke={colors.line}
                        strokeWidth={2.5}
                        dot={{ r: 4.5, fill: colors.line, stroke: "#0f172a", strokeWidth: 1.5 }}
                        activeDot={{ r: 6 }}
                      >
                        <LabelList
                          dataKey={`avgHrs_${brand}`}
                          position="top"
                          fill={colors.line}
                          fontSize={9}
                          fontWeight="bold"
                          offset={8}
                          formatter={(val: number) => val ? val.toLocaleString("es-ES") : ""}
                        />
                      </Line>
                    );
                  })
                ) : (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="overallAvgHrs"
                    name="Hrs. Promedio"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f97316", stroke: "#0f172a", strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList
                      dataKey="overallAvgHrs"
                      position="top"
                      fill="#f97316"
                      fontSize={11}
                      fontWeight="bold"
                      offset={10}
                      formatter={(val: number) => val ? val.toLocaleString("es-ES") : ""}
                    />
                  </Line>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
