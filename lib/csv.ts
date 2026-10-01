export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const needsQuotes = /[",\r\n]/.test(s) || s !== s.trim();
  return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s;
}

// يبني نص CSV (الفاصل فاصلة). ضيف BOM بنفسك عند التنزيل عشان Excel يقرأ العربي صح.
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}

// يكتشف الفاصل من أول سطر: فاصلة أو فاصلة منقوطة أو Tab
// (Excel بالإعدادات العربية غالبًا يحفظ بفاصلة منقوطة)
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (c === "\n" || c === "\r") break;
      if (c in counts) counts[c] += 1;
    }
  }
  let best = ",";
  if (counts[";"] > counts[best]) best = ";";
  if (counts["\t"] > counts[best]) best = "\t";
  return best;
}

export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === "") {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
