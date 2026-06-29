/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TireRecord {
  id: string;
  fechaBaja: string;
  codigo: string;
  serie: string;
  marca: string;
  dimension: string;
  tipo: string;
  profOrig: number;
  profEfect: number;
  int: number;
  ext: number;
  profBr: number;
  pro: number;
  renPercent: number;
  utilPercent: number;
  hrsAntRep: number;
  hrsDespRep: number;
  hrsTotales: number;
  kmsMillas: number;
  ton: number;
  hrsMm: number;
  kmsMillasMm: number;
  costoOrig: number;
  costoRepar: number;
  costoTotal: number;
  perdidaUsd: number;
  usdHrs: number;
  usdKms: number;
  flota: string;
  equipo: string;
  pos: number;
  observacion: string;
  mir: string;
  fechaIngreso: string;
  fechaRet: string;
  tipoRetiro: string;
  fecha1Inst: string;
  nRe: number;
  estadistica: boolean;
  esPrueba: boolean;
  motivoBaja: string;
  itemBaja: string;
}

export interface FleetStats {
  flota: string;
  cantidad: number;
  horasTotalesSum: number;
  horasTotalesAvg: number;
  costoTotalSum: number;
  perdidaTotalSum: number;
  kmsMillasAvg: number;
  utilPercentAvg: number;
}
