"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";

import { TrendingUp, DollarSign, Clock, Truck } from "lucide-react";
import type { FleetStats, TireRecord } from "../types";

interface FleetTableProps {
  records: TireRecord[];
}

export default function FleetTable({ records }: FleetTableProps) {
  const fleetStats = useMemo<FleetStats[]>(() => {
    const groups: { [key: string]: TireRecord[] } = {};
    
    records.forEach((rec) => {
      const fleet = rec.flota || "Sin Flota Especificada";
      if (!groups[fleet]) {
        groups[fleet] = [];
      }
      groups[fleet].push(rec);
    });

    return Object.keys(groups).map((fleetName) => {
      const fleetRecords = groups[fleetName];
      const count = fleetRecords.length;
      const horasTotalesSum = fleetRecords.reduce((sum, r) => sum + r.hrsTotales, 0);
      const horasTotalesAvg = count > 0 ? horasTotalesSum / count : 0;
      const costoTotalSum = fleetRecords.reduce((sum, r) => sum + r.costoTotal, 0);
      const perdidaTotalSum = fleetRecords.reduce((sum, r) => sum + r.perdidaUsd, 0);
      const kmsMillasSum = fleetRecords.reduce((sum, r) => sum + r.kmsMillas, 0);
      const kmsMillasAvg = count > 0 ? kmsMillasSum / count : 0;
      const utilPercentSum = fleetRecords.reduce((sum, r) => sum + r.utilPercent, 0);
      const utilPercentAvg = count > 0 ? utilPercentSum / count : 0;

      return {
        flota: fleetName,
        cantidad: count,
        horasTotalesSum,
        horasTotalesAvg,
        costoTotalSum,
        perdidaTotalSum,
        kmsMillasAvg,
        utilPercentAvg,
      };
    });
  }, [records]);

  // Overall totals
  const totals = useMemo(() => {
    const cantidad = records.length;
    const horasTotalesSum = records.reduce((sum, r) => sum + r.hrsTotales, 0);
    const horasTotalesAvg = cantidad > 0 ? horasTotalesSum / cantidad : 0;
    const costoTotalSum = records.reduce((sum, r) => sum + r.costoTotal, 0);
    const perdidaTotalSum = records.reduce((sum, r) => sum + r.perdidaUsd, 0);

    return {
      cantidad,
      horasTotalesSum,
      horasTotalesAvg,
      costoTotalSum,
      perdidaTotalSum,
    };
  }, [records]);

  return (
    <div id="fleet-stats-panel" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Total Tires */}
        <div id="card-total-tires" className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Neumáticos de Baja</p>
            <h3 className="text-3xl font-bold text-white mt-1 font-sans">{totals.cantidad} <span className="text-xs font-normal text-slate-500">uds</span></h3>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
            <Truck size={20} />
          </div>
        </div>

        {/* Card 2: Average Lifespan (Accentuated style from theme) */}
        <div id="card-avg-lifespan" className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl border-l-4 border-l-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Promedio de Horas</p>
            <h3 className="text-3xl font-bold text-indigo-400 mt-1 font-sans">
              {Math.round(totals.horasTotalesAvg).toLocaleString()} <span className="text-xs font-normal text-slate-500">Hrs</span>
            </h3>
          </div>
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
            <Clock size={20} />
          </div>
        </div>

        {/* Card 3: Total Hours */}
        <div id="card-total-hours" className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Hrs Totales Acumuladas</p>
            <h3 className="text-3xl font-bold text-white mt-1 font-sans">
              {totals.horasTotalesSum.toLocaleString()} <span className="text-xs font-normal text-slate-500">Hrs</span>
            </h3>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Card 4: Lost Costs */}
        <div id="card-lost-costs" className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Pérdida Económica Baja</p>
            <h3 className="text-3xl font-bold text-rose-400 mt-1 font-sans">
              ${totals.perdidaTotalSum.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
            </h3>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Table block */}
      <div id="table-container" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Resumen de Rendimiento de Neumáticos por Flota</h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculado a partir de la columna &quot;Hrs. Totales&quot; y variables de desgaste</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-1 rounded-full">
            {fleetStats.length} Flotas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table id="fleet-comparison-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono text-xs uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Flota / Equipo Tipo</th>
                <th className="py-3 px-4 text-center font-medium">Bajas (Uds)</th>
                <th className="py-3 px-4 text-right font-medium">Horas Totales (Sum)</th>
                <th className="py-3 px-4 text-right font-medium text-teal-400">Promedio de Vida (Hrs)</th>
                <th className="py-3 px-4 text-right font-medium">Prom. Kilometraje</th>
                <th className="py-3 px-4 text-right font-medium">Inversión Total</th>
                <th className="py-3 px-4 text-right font-medium text-rose-400">Pérdida Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {fleetStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{stat.flota}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-slate-300 font-mono font-medium">
                    {stat.cantidad}
                  </td>
                  <td className="py-4 px-4 text-right text-slate-300 font-mono">
                    {stat.horasTotalesSum.toLocaleString()} <span className="text-xs text-slate-500">hrs</span>
                  </td>
                  <td className="py-4 px-4 text-right text-teal-400 font-mono font-semibold">
                    {Math.round(stat.horasTotalesAvg).toLocaleString()} <span className="text-xs text-teal-500/70">hrs</span>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-400 font-mono text-xs">
                    {Math.round(stat.kmsMillasAvg).toLocaleString()} mil
                  </td>
                  <td className="py-4 px-4 text-right text-slate-300 font-mono">
                    ${stat.costoTotalSum.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-rose-400 font-mono font-medium">
                    ${stat.perdidaTotalSum.toLocaleString()}
                  </td>
                </tr>
              ))}
              
              {/* Grand Totals Row */}
              <tr className="bg-slate-950/50 font-bold border-t-2 border-slate-800 text-white">
                <td className="py-4 px-6">TOTAL GENERAL</td>
                <td className="py-4 px-4 text-center font-mono">{totals.cantidad}</td>
                <td className="py-4 px-4 text-right font-mono">{totals.horasTotalesSum.toLocaleString()} hrs</td>
                <td className="py-4 px-4 text-right text-teal-400 font-mono">
                  {Math.round(totals.horasTotalesAvg).toLocaleString()} hrs
                </td>
                <td className="py-4 px-4 text-right text-slate-400 font-mono text-xs">-</td>
                <td className="py-4 px-4 text-right font-mono">${totals.costoTotalSum.toLocaleString()}</td>
                <td className="py-4 px-4 text-right text-rose-400 font-mono">${totals.perdidaTotalSum.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
