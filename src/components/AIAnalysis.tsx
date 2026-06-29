"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";

import { Brain, FileText, Printer, Loader2, RefreshCw, ChevronRight } from "lucide-react";
import Markdown from "react-markdown";
import type { TireRecord } from "../types";

interface AIAnalysisProps {
  records: TireRecord[];
}

export default function AIAnalysis({ records }: AIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const handleGenerateReport = async (presetQuery?: string) => {
    setLoading(true);
    setError(null);
    const selectedQuery = presetQuery || query;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset: records.map(r => ({
            codigo: r.codigo,
            serie: r.serie,
            marca: r.marca,
            flota: r.flota,
            equipo: r.equipo,
            hrsTotales: r.hrsTotales,
            kmsMillas: r.kmsMillas,
            motivoBaja: r.motivoBaja,
            itemBaja: r.itemBaja,
            utilPercent: r.utilPercent,
            costoTotal: r.costoTotal,
            perdidaUsd: r.perdidaUsd
          })),
          query: selectedQuery,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al generar el análisis.");
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de conexión con el servidor de análisis.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const PRESETS = [
    {
      title: "Análisis General y Optimización",
      prompt: "Analiza el promedio de las horas en que se dieron de baja los neumáticos según su flota, calculando el total de horas por flota y danos recomendaciones de optimización preventivas"
    },
    {
      title: "Causas y Diagnóstico de Fallas",
      prompt: "Identifica cuáles son las flotas con mayor incidencia de bajas prematuras por cortes o daños estructurales y brinda un diagnóstico detallado"
    },
    {
      title: "Eficiencia de Costos y Pérdidas",
      prompt: "Analiza las pérdidas económicas asociadas a los retiros imprevistos por flota. ¿Cuáles neumáticos representan la mayor pérdida financiera y qué se aconseja?"
    }
  ];

  return (
    <div id="ai-analysis-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="text-indigo-400 animate-pulse" size={22} />
            Generador de Reportes Técnicos con IA
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Analiza el comportamiento operativo y recibe recomendaciones de mantenimiento preventivo automáticas</p>
        </div>

        {analysis && (
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-lg transition-all"
          >
            <Printer size={16} />
            <span>Imprimir / Descargar PDF</span>
          </button>
        )}
      </div>

      {!analysis && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-slate-300">Selecciona o escribe un enfoque de análisis:</h4>

            <div className="space-y-3">
              {PRESETS.map((p, idx) => (
                <button
                  id={`preset-${idx}`}
                  key={idx}
                  onClick={() => handleGenerateReport(p.prompt)}
                  className="w-full text-left p-3.5 bg-slate-950/40 hover:bg-slate-800/20 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all flex items-start space-x-3 group"
                >
                  <div className="bg-indigo-500/10 text-indigo-400 p-1.5 rounded-lg mt-0.5 group-hover:bg-indigo-500/20 transition-all">
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{p.title}</h5>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.prompt}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-500 font-mono">O PERSONALIZA TU CONSULTA</span>
              <div className="flex space-x-2 mt-2">
                <input
                  id="query-input"
                  type="text"
                  placeholder="Ej: ¿Qué marca rinde mejor en la flota CAT 798 AC?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  id="btn-submit-custom"
                  onClick={() => handleGenerateReport()}
                  disabled={!query.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5"
                >
                  <Brain size={14} />
                  <span>Generar</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <h5 className="text-xs font-mono text-indigo-400 uppercase tracking-wider">¿Cómo funciona?</h5>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                El motor analiza de forma segura el rendimiento de desgaste del neumático (utilizando variables como <strong className="text-white">Hrs. Totales</strong>, <strong className="text-white">Profundidad</strong>, y <strong className="text-white">Motivos de baja</strong>) agrupados por flota.
              </p>
              <ul className="text-xs text-slate-400 mt-3 space-y-1.5 list-inside list-disc leading-relaxed">
                <li>Detecta fallas operativas recurrentes</li>
                <li>Compara rendimiento por marcas y flotas</li>
                <li>Genera un plan de ingeniería inmediato</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <button
                id="btn-generate-main"
                onClick={() => handleGenerateReport()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10"
              >
                <Brain size={16} />
                <span>Generar Reporte Completo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div id="ai-loading-state" className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="animate-spin text-indigo-400" size={40} />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-200 animate-pulse">Analizando variables del ciclo de vida...</p>
            <p className="text-xs text-slate-400">La IA está procesando las horas de retiro y calculando los planes de mantenimiento.</p>
          </div>
          <div className="flex space-x-2 bg-slate-950 px-3 py-1 rounded border border-slate-800 text-[10px] text-slate-500 font-mono mt-2">
            <span>MODO: Ingeniero Experto OTR</span>
            <span>•</span>
            <span>MODELO: Gemini 3.5 Flash</span>
          </div>
        </div>
      )}

      {error && (
        <div id="ai-error-state" className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 space-y-2">
          <p className="text-sm font-bold flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Fallo en la conexión del análisis</span>
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          <div className="pt-2">
            <button
              id="btn-retry-ai"
              onClick={() => handleGenerateReport()}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded transition-all flex items-center space-x-1"
            >
              <RefreshCw size={12} />
              <span>Reintentar Análisis</span>
            </button>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div id="ai-report-view" className="space-y-4">
          <div className="flex justify-between items-center bg-indigo-950/30 border border-indigo-500/20 px-4 py-3 rounded-xl">
            <div className="flex items-center space-x-2 text-indigo-300">
              <FileText size={16} />
              <span className="text-xs font-semibold">Informe Técnico Generado con Inteligencia Artificial</span>
            </div>
            <button
              id="btn-regenerate"
              onClick={() => handleGenerateReport()}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 font-mono transition-all"
            >
              <RefreshCw size={12} />
              <span>Regenerar</span>
            </button>
          </div>

          {/* Styled report body (printable) */}
          <div className="print:bg-white print:text-slate-900 bg-slate-950/40 border border-slate-800/80 p-8 rounded-2xl shadow-inner max-h-[600px] overflow-y-auto custom-scrollbar">
            <div className="print:block hidden mb-8 border-b-2 border-slate-900 pb-4 text-slate-900">
              <h1 className="text-2xl font-bold uppercase tracking-wider">Reporte Técnico de Rendimiento de Neumáticos OTR</h1>
              <p className="text-xs font-mono mt-1">Generado el: {new Date().toLocaleDateString()} | Analítica de Flotas AI</p>
            </div>

            <div className="prose prose-invert print:prose-slate max-w-none text-slate-300 leading-relaxed text-sm space-y-4">
              <Markdown>{analysis}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
