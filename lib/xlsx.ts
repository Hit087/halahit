import { deflateRawSync, inflateRawSync } from "zlib";
import type { CsvCell } from "@/lib/csv";

const MAX_UNCOMPRESSED = 20 * 1024 * 1024; // حماية من الملفات المضغوطة الضخمة
const MAX_ROWS = 5000;
const MAX_COLS = 100;

// ==================== أدوات عامة ====================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function colName(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function colIndex(letters: string): number {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

function xmlEscape(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function xmlUnescape(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// ==================== كتابة xlsx ====================

function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const localParts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf8");
    const compressed = deflateRawSync(f.data);
    const useDeflate = compressed.length < f.data.length;
    const body = useDeflate ? compressed : f.data;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(f.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x0021, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, body);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(method, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0x0021, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(f.data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt16LE(0, 30);
    cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34);
    cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);

    offset += 30 + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, end]);
}

// الصف الأول يعتبر عناوين (خط عريض). الورقة من اليمين لليسار عشان العربي.
export function buildXlsx(rows: CsvCell[][], columnWidths: number[] = []): Buffer {
  const sheetRows: string[] = [];

  rows.forEach((row, r) => {
    const cells: string[] = [];
    row.forEach((value, c) => {
      if (value === null || value === undefined || value === "") return;
      const ref = `${colName(c)}${r + 1}`;
      const style = r === 0 ? ' s="1"' : "";
      if (typeof value === "number" && Number.isFinite(value)) {
        cells.push(`<c r="${ref}"${style}><v>${value}</v></c>`);
      } else {
        const text = xmlEscape(String(value));
        cells.push(
          `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`
        );
      }
    });
    sheetRows.push(`<row r="${r + 1}">${cells.join("")}</row>`);
  });

  const cols =
    columnWidths.length > 0
      ? `<cols>${columnWidths
          .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
          .join("")}</cols>`
      : "";

  const sheetXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView rightToLeft="1" workbookViewId="0">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    cols +
    `<sheetData>${sheetRows.join("")}</sheetData></worksheet>`;

  const files = [
    {
      name: "[Content_Types].xml",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      name: "_rels/.rels",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="Products" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
        `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
        `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
        `</styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", data: sheetXml },
  ].map((f) => ({ name: f.name, data: Buffer.from(f.data, "utf8") }));

  return buildZip(files);
}

// ==================== قراءة xlsx ====================

function readZip(buf: Buffer): Map<string, Buffer> {
  let eocd = -1;
  const lowest = Math.max(0, buf.length - 22 - 65535);
  for (let i = buf.length - 22; i >= lowest; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  let total = 0;

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip directory");
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const uncompressedSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;

    // نقرأ بس ملفات xml اللي نحتاجها
    if (!name.startsWith("xl/") || !(name.endsWith(".xml") || name.endsWith(".rels"))) {
      continue;
    }

    total += uncompressedSize;
    if (uncompressedSize > MAX_UNCOMPRESSED || total > MAX_UNCOMPRESSED) {
      throw new Error("file too large");
    }

    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(start, start + compressedSize);

    let data: Buffer;
    if (method === 0) {
      data = Buffer.from(raw);
    } else if (method === 8) {
      data = inflateRawSync(raw, { maxOutputLength: MAX_UNCOMPRESSED });
    } else {
      throw new Error("unsupported compression");
    }
    files.set(name, data);
  }

  return files;
}

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(` ${attrs}`);
  return m ? m[1] : undefined;
}

function textRuns(xml: string): string {
  const withoutPhonetic = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  const parts: string[] = [];
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withoutPhonetic)) !== null) {
    parts.push(xmlUnescape(m[1]));
  }
  return parts.join("");
}

// يقرأ أول ورقة من الملف ويرجّعها كجدول نصوص
export function parseXlsx(buf: Buffer): string[][] {
  const files = readZip(buf);

  const shared: string[] = [];
  const sharedXml = files.get("xl/sharedStrings.xml")?.toString("utf8");
  if (sharedXml) {
    const re = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sharedXml)) !== null) {
      shared.push(textRuns(m[1]));
    }
  }

  // نحدد أول ورقة من workbook.xml
  let sheetPath = "xl/worksheets/sheet1.xml";
  const workbookXml = files.get("xl/workbook.xml")?.toString("utf8");
  const relsXml = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (workbookXml && relsXml) {
    const sheetTag = /<sheet\b([^>]*)\/?>/.exec(workbookXml);
    const rid = sheetTag ? attr(sheetTag[1], "r:id") : undefined;
    if (rid) {
      const relRe = /<Relationship\b([^>]*)\/?>/g;
      let m: RegExpExecArray | null;
      while ((m = relRe.exec(relsXml)) !== null) {
        if (attr(m[1], "Id") === rid) {
          const target = attr(m[1], "Target");
          if (target) {
            const clean = target.replace(/^\//, "");
            sheetPath = clean.startsWith("xl/") ? clean : `xl/${clean}`;
          }
          break;
        }
      }
    }
  }

  const sheetXml = files.get(sheetPath)?.toString("utf8");
  if (!sheetXml) throw new Error("sheet not found");

  const grid: string[][] = [];
  let maxRow = -1;
  let maxCol = -1;

  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(sheetXml)) !== null) {
    const attrs = m[1];
    const inner = m[2] ?? "";
    const ref = /^([A-Z]+)(\d+)$/.exec(attr(attrs, "r") ?? "");
    if (!ref) continue;

    const c = colIndex(ref[1]);
    const r = parseInt(ref[2], 10) - 1;
    if (r < 0 || r >= MAX_ROWS || c < 0 || c >= MAX_COLS) continue;

    const type = attr(attrs, "t");
    const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
    let value = "";

    if (type === "s") {
      value = v !== undefined ? shared[parseInt(v, 10)] ?? "" : "";
    } else if (type === "inlineStr") {
      value = textRuns(inner);
    } else if (type === "str") {
      value = v !== undefined ? xmlUnescape(v) : "";
    } else if (type === "b") {
      value = v === "1" ? "true" : "false";
    } else if (type === "e") {
      value = "";
    } else {
      value = v !== undefined ? xmlUnescape(v).trim() : "";
    }

    if (value === "") continue;
    if (!grid[r]) grid[r] = [];
    grid[r][c] = value;
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }

  const rows: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const src = grid[r] ?? [];
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) row.push(src[c] ?? "");
    rows.push(row);
  }
  return rows;
}
