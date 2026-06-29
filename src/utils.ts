/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import * as XLSX from "xlsx";
import type { TireRecord } from "./types";

export function normalizeHeader(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // removes accents
    .replace(/[°º.]/g, "") // removes degrees, ordinals and dots for cleaner matching
    .replace(/\s+/g, " "); // collapse multiple spaces
}

// Create mapping from normalized header terms to our keys
const headerMap: { [key: string]: string } = {
  "fecha baja": "fechaBaja",
  "fechabaja": "fechaBaja",
  "fecha_baja": "fechaBaja",
  "f baja": "fechaBaja",
  "fbaja": "fechaBaja",
  "codigo": "codigo",
  "nro codigo": "codigo",
  "nro_codigo": "codigo",
  "serie": "serie",
  "nro serie": "serie",
  "nro_serie": "serie",
  "marca": "marca",
  "dimension": "dimension",
  "medida": "dimension",
  "tipo": "tipo",
  "prof orig": "profOrig",
  "proforig": "profOrig",
  "prof_orig": "profOrig",
  "profundidad original": "profOrig",
  "prof efect": "profEfect",
  "profefect": "profEfect",
  "prof_efect": "profEfect",
  "profundidad efectiva": "profEfect",
  "int": "int",
  "ext": "ext",
  "prof br": "profBr",
  "profbr": "profBr",
  "prof_br": "profBr",
  "profundidad banda": "profBr",
  "pro": "pro",
  "promedio": "pro",
  "ren %": "renPercent",
  "renpercent": "renPercent",
  "porcentaje de rendimiento": "renPercent",
  "% ren": "renPercent",
  "util %": "utilPercent",
  "utilpercent": "utilPercent",
  "porcentaje de utilidad": "utilPercent",
  "% util": "utilPercent",
  "hrs ant rep": "hrsAntRep",
  "hrsantrep": "hrsAntRep",
  "horas antes": "hrsAntRep",
  "hrs desp rep": "hrsDespRep",
  "hrsdesprep": "hrsDespRep",
  "horas despues": "hrsDespRep",
  "hrs totales": "hrsTotales",
  "hrstotales": "hrsTotales",
  "horas totales": "hrsTotales",
  "horas_totales": "hrsTotales",
  "kms-millas": "kmsMillas",
  "kmsmillas": "kmsMillas",
  "kms_millas": "kmsMillas",
  "kilometros": "kmsMillas",
  "kms": "kmsMillas",
  "ton": "ton",
  "tonelaje": "ton",
  "toneladas": "ton",
  "hrs/mm": "hrsMm",
  "horas por milimetro": "hrsMm",
  "hrs mm": "hrsMm",
  "kms-millas/mm": "kmsMillasMm",
  "kms/mm": "kmsMillasMm",
  "kilometros por milimetro": "kmsMillasMm",
  "costo orig": "costoOrig",
  "costoorig": "costoOrig",
  "costo original": "costoOrig",
  "costo repar": "costoRepar",
  "costorepar": "costoRepar",
  "costo reparacion": "costoRepar",
  "costo total": "costoTotal",
  "costototal": "costoTotal",
  "perdida $": "perdidaUsd",
  "perdidausd": "perdidaUsd",
  "perdida usd": "perdidaUsd",
  "perdida": "perdidaUsd",
  "us$/hrs": "usdHrs",
  "usd/hrs": "usdHrs",
  "usd hrs": "usdHrs",
  "us$/kms": "usdKms",
  "usd/kms": "usdKms",
  "usd kms": "usdKms",
  "flota": "flota",
  "equipo": "equipo",
  "pos": "pos",
  "posicion": "pos",
  "observacion": "observacion",
  "observaciones": "observacion",
  "mir": "mir",
  "fecha ingreso": "fechaIngreso",
  "fecha_ingreso": "fechaIngreso",
  "fechaingreso": "fechaIngreso",
  "f ingreso": "fechaIngreso",
  "f_ingreso": "fechaIngreso",
  "fecha ret": "fechaRet",
  "fecharet": "fechaRet",
  "fecha_ret": "fechaRet",
  "f ret": "fechaRet",
  "tipo retiro": "tipoRetiro",
  "tiporetiro": "tipoRetiro",
  "motivo retiro": "tipoRetiro",
  "f 1era inst": "fecha1Inst",
  "fecha 1era inst": "fecha1Inst",
  "f 1inst": "fecha1Inst",
  "fecha 1inst": "fecha1Inst",
  "fecha primera inst": "fecha1Inst",
  "nre": "nRe",
  "n re": "nRe",
  "nro re": "nRe",
  "nro_re": "nRe",
  "estadistica": "estadistica",
  "es prueba": "esPrueba",
  "esprueba": "esPrueba",
  "es_prueba": "esPrueba",
  "motivo baja": "motivoBaja",
  "motivobaja": "motivoBaja",
  "motivo_baja": "motivoBaja",
  "motivo": "motivoBaja",
  "causa": "motivoBaja",
  "item baja": "itemBaja",
  "itembaja": "itemBaja"
};

/**
 * Helper to build empty base TireRecord structure
 */
function createEmptyRecord(id: string): TireRecord {
  return {
    id,
    fechaBaja: "",
    codigo: "",
    serie: "",
    marca: "Genérica",
    dimension: "59/80R63",
    tipo: "OTR",
    profOrig: 100,
    profEfect: 50,
    int: 0,
    ext: 0,
    profBr: 0,
    pro: 0,
    renPercent: 0,
    utilPercent: 0,
    hrsAntRep: 0,
    hrsDespRep: 0,
    hrsTotales: 0,
    kmsMillas: 0,
    ton: 0,
    hrsMm: 0,
    kmsMillasMm: 0,
    costoOrig: 0,
    costoRepar: 0,
    costoTotal: 0,
    perdidaUsd: 0,
    usdHrs: 0,
    usdKms: 0,
    flota: "General",
    equipo: "",
    pos: 1,
    observacion: "",
    mir: "",
    fechaIngreso: "",
    fechaRet: "",
    tipoRetiro: "",
    fecha1Inst: "",
    nRe: 0,
    estadistica: true,
    esPrueba: false,
    motivoBaja: "Desgaste",
    itemBaja: ""
  };
}

/**
 * Parses a TSV (tab-separated) or CSV (comma/semicolon-separated) string
 * into a structured list of TireRecord objects.
 * Supports standard headers exported from spreadsheets or copy-pasted.
 */
export function parseTireData(text: string): TireRecord[] {
  if (!text || !text.trim()) return [];

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Detect delimiter (tab, semicolon, or comma)
  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (firstLine.includes(";")) {
    delimiter = ";";
  }

  // Parse headers
  const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
  const parsedRecords: TireRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(delimiter).map(v => v.trim());
    const record: any = createEmptyRecord(`parsed-${i}-${Date.now()}`);

    headers.forEach((header, index) => {
      const mappedKey = headerMap[header];
      if (!mappedKey) return;

      const rawVal = values[index];
      if (rawVal === undefined || rawVal === null) return;

      // Type conversion based on key
      if (
        [
          "profOrig", "profEfect", "int", "ext", "profBr", "pro",
          "renPercent", "utilPercent", "hrsAntRep", "hrsDespRep",
          "hrsTotales", "kmsMillas", "ton", "hrsMm", "kmsMillasMm",
          "costoOrig", "costoRepar", "costoTotal", "perdidaUsd",
          "usdHrs", "usdKms", "pos", "nRe"
        ].includes(mappedKey)
      ) {
        // Parse numeric value removing standard formatting like %, $, etc.
        const cleanNum = rawVal.replace(/[%\s$,]/g, "");
        record[mappedKey] = parseFloat(cleanNum) || 0;
      } else if (["estadistica", "esPrueba"].includes(mappedKey)) {
        record[mappedKey] = rawVal.toLowerCase() === "si" || rawVal.toLowerCase() === "yes" || rawVal.toLowerCase() === "true";
      } else {
        record[mappedKey] = rawVal;
      }
    });

    // Fallback: If Hrs Totales is 0, but we have Hrs.Ant.Rep + Hrs.Desp.Rep, calculate it
    if (record.hrsTotales === 0 && (record.hrsAntRep > 0 || record.hrsDespRep > 0)) {
      record.hrsTotales = record.hrsAntRep + record.hrsDespRep;
    }

    parsedRecords.push(record as TireRecord);
  }

  return parsedRecords;
}

/**
 * Safely extracts primitive cell values from sheetJS cells
 */
function getCellValue(cell: any): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object") {
    if (cell.v !== undefined) return String(cell.v);
    if (cell.w !== undefined) return String(cell.w);
    return "";
  }
  return String(cell);
}

/**
 * Parses a binary excel ArrayBuffer (.xlsx / .xls) into TireRecord objects.
 * Scans all sheets in the workbook and automatically locates the header row
 * (including Fila 2) by matching column headers.
 */
export function parseExcelBuffer(buffer: ArrayBuffer): TireRecord[] {
  // Read with cellDates: true to parse Excel dates as Date objects
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  // Helper to format dates to DD-MM-YYYY format
  const formatExcelDate = (val: any): string => {
    if (val instanceof Date) {
      const d = val.getDate();
      const m = val.getMonth() + 1;
      const y = val.getFullYear();
      return `${d < 10 ? '0' : ''}${d}-${m < 10 ? '0' : ''}${m}-${y}`;
    }
    if (typeof val === 'number' && val > 20000 && val < 60000) {
      // Excel serial date number
      const date = new Date((val - 25569) * 86400 * 1000);
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      return `${d < 10 ? '0' : ''}${d}-${m < 10 ? '0' : ''}${m}-${y}`;
    }
    return String(val || '');
  };

  // Loop through all sheets to find the one with valid data
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Extract content as a 2D array [row][column]
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
    if (!rawData || rawData.length < 1) continue;

    // Robust header detector: scan first 20 rows of this sheet
    let headerIndex = -1;
    let headerRow: any[] = [];
    
    for (let r = 0; r < Math.min(rawData.length, 20); r++) {
      const row = rawData[r];
      if (Array.isArray(row)) {
        const matchCount = row.filter(cell => {
          const val = normalizeHeader(getCellValue(cell));
          return headerMap[val] !== undefined;
        }).length;
        
        // If a row has 4 or more columns matching our known headers, it's the header row!
        if (matchCount >= 4) {
          headerIndex = r;
          headerRow = row;
          break;
        }
      }
    }

    // Fallback: If no robust header row was detected but rawData[1] is non-empty, assume row index 1 (Fila 2) as requested
    if (headerIndex === -1) {
      if (rawData[1] && Array.isArray(rawData[1]) && rawData[1].length > 2) {
        headerIndex = 1;
        headerRow = rawData[1];
      } else if (rawData[0] && Array.isArray(rawData[0]) && rawData[0].length > 2) {
        headerIndex = 0;
        headerRow = rawData[0];
      }
    }

    if (headerIndex === -1) continue;

    const headers = headerRow.map(h => normalizeHeader(getCellValue(h)));
    const parsedRecords: TireRecord[] = [];

    // Start reading data from the row immediately following the header
    const startRowIndex = headerIndex + 1;
    for (let i = startRowIndex; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const record: any = createEmptyRecord(`xlsx-${sheetName}-${i}-${Date.now()}`);
      let hasAnyData = false;

      headers.forEach((header, index) => {
        const mappedKey = headerMap[header];
        if (!mappedKey) return;

        const rawVal = row[index];
        if (rawVal === undefined || rawVal === null || rawVal === "") return;

        hasAnyData = true;

        // Type conversion based on key
        if (
          [
            "profOrig", "profEfect", "int", "ext", "profBr", "pro",
            "renPercent", "utilPercent", "hrsAntRep", "hrsDespRep",
            "hrsTotales", "kmsMillas", "ton", "hrsMm", "kmsMillasMm",
            "costoOrig", "costoRepar", "costoTotal", "perdidaUsd",
            "usdHrs", "usdKms", "pos", "nRe"
          ].includes(mappedKey)
        ) {
          if (typeof rawVal === 'number') {
            record[mappedKey] = rawVal;
          } else {
            const cleanNum = String(rawVal).replace(/[%\s$,]/g, "");
            record[mappedKey] = parseFloat(cleanNum) || 0;
          }
        } else if (["estadistica", "esPrueba"].includes(mappedKey)) {
          const valStr = String(rawVal).toLowerCase();
          record[mappedKey] = valStr === "si" || valStr === "yes" || valStr === "true" || rawVal === true;
        } else if (["fechaBaja", "fechaIngreso", "fechaRet", "fecha1Inst"].includes(mappedKey)) {
          record[mappedKey] = formatExcelDate(rawVal);
        } else {
          record[mappedKey] = String(rawVal);
        }
      });

      if (!hasAnyData) continue;

      // Fallback: If Hrs Totales is 0, but we have Hrs.Ant.Rep + Hrs.Desp.Rep, calculate it
      if (record.hrsTotales === 0 && (record.hrsAntRep > 0 || record.hrsDespRep > 0)) {
        record.hrsTotales = record.hrsAntRep + record.hrsDespRep;
      }

      parsedRecords.push(record as TireRecord);
    }

    // If we parsed successfully, return the records from this sheet
    if (parsedRecords.length > 0) {
      return parsedRecords;
    }
  }

  return [];
}

/**
 * Safely parses various date formats (DD-MM-YYYY, YYYY-MM-DD, ISO) into a millisecond timestamp
 */
export function parseDateStringToMs(dateStr: string): number {
  if (!dateStr) return 0;
  
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day).getTime();
      }
    } else {
      // DD-MM-YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month, day).getTime();
      }
    }
  }

  const fallback = Date.parse(dateStr);
  return isNaN(fallback) ? 0 : fallback;
}


