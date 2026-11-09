import type { ExtractedPages, PdfTextItem } from '../types/parser.types';

/** Y-tolerance (pt) for horizontal line clustering on the tabulation pages. */
export const LINE_Y_TOLERANCE = 2;

export interface LineToken {
  x: number;
  str: string;
}

export interface LineRow {
  y: number;
  parts: LineToken[];
}

/**
 * Group raw pdfjs text items into lines.
 * Items within ±LINE_Y_TOLERANCE of each other form one row (Y grows upwards in PDF space);
 * tokens inside a row are sorted by ascending x (left to right).
 */
export function groupItemsIntoLines(items: PdfTextItem[] | null | undefined): string[] {
  if (!items || !items.length) return [];
  
  const cleanItems = items.map((it) => ({
    str: it && it.str ? it.str.trim() : '',
    x: it && it.transform ? it.transform[4] || 0 : 0,
    y: it && it.transform ? it.transform[5] || 0 : 0,
  })).filter((it) => it.str.length > 0);

  if (!cleanItems.length) return [];

  // Check page type:
  const hasTabulationHeader = cleanItems.some((it) => 
    it.str.includes('RESULT TABULATION') || 
    it.str.includes('CS/Remarks') ||
    it.str.includes('Roll no./Name')
  );
  
  const hasSchemeHeader = cleanItems.some((it) =>
    it.str.includes('(SCHEME OF EXAMINATIONS)') ||
    it.str.includes('Scheme of Programme Code:')
  );

  if (hasTabulationHeader) {
    return groupTabulationPage(cleanItems);
  }

  if (hasSchemeHeader) {
    return groupSchemePage(cleanItems);
  }

  return standardHorizontalGrouping(cleanItems);
}

function standardHorizontalGrouping(items: { str: string; x: number; y: number }[]): string[] {
  const rows: { y: number; parts: { str: string; x: number; y: number }[] }[] = [];
  for (const it of items) {
    let row = rows.find((r) => Math.abs(r.y - it.y) <= 3);
    if (!row) {
      row = { y: it.y, parts: [] };
      rows.push(row);
    }
    row.parts.push(it);
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) =>
    r.parts
      .sort((a, b) => a.x - b.x)
      .map((p) => p.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function groupSchemePage(items: { str: string; x: number; y: number }[]): string[] {
  const lines: string[] = [];
  
  // Headers (x < 200)
  const headerItems = items.filter((it) => it.x < 200 || it.y < 30 || it.y > 1150);
  lines.push(...standardHorizontalGrouping(headerItems));

  // Find all paper IDs on the scheme page (around y = 30..45, 5-6 digit codes)
  const paperIdItems = items.filter((it) => it.x >= 200 && it.y >= 30 && it.y <= 45 && /^\d{5,6}$/.test(it.str));
  paperIdItems.sort((a, b) => a.x - b.x);

  for (const pid of paperIdItems) {
    const colItems = items.filter((it) => Math.abs(it.x - pid.x) <= 8.5);
    
    const snoItem = colItems.find((it) => it.y >= 5 && it.y <= 25 && /^\d+$/.test(it.str));
    const codeItem = colItems.find((it) => it.y >= 75 && it.y <= 100);
    const subItem = colItems.find((it) => it.y >= 115 && it.y <= 160);
    const creditItem = colItems.find((it) => it.y >= 750 && it.y <= 780 && /^\d+$/.test(it.str));
    const typeItem = colItems.find((it) => it.y >= 785 && it.y <= 820 && /^(THEORY|PRACTICAL)$/i.test(it.str));
    const modeItem = colItems.find((it) => it.y >= 840 && it.y <= 880 && /^(UES|NUES)$/i.test(it.str));
    const kindItems = colItems.filter((it) => it.y >= 890 && it.y <= 970);
    kindItems.sort((a, b) => a.y - b.y);
    const kindStr = kindItems.map((k) => k.str).join(' ');
    const minorItem = colItems.find((it) => it.y >= 1000 && it.y <= 1030);
    const majorItem = colItems.find((it) => it.y >= 1050 && it.y <= 1080 && /^\d+$/.test(it.str));
    const maxItem = colItems.find((it) => it.y >= 1100 && it.y <= 1130 && /^\d+$/.test(it.str));
    const passItem = colItems.find((it) => it.y >= 1150 && it.y <= 1180 && /^\d+$/.test(it.str));

    const sno = snoItem ? snoItem.str : '01';
    const paperId = pid.str;
    const code = codeItem ? codeItem.str : `BCA${paperId.slice(-3)}`;
    const name = subItem ? subItem.str : code;
    const credit = creditItem ? creditItem.str : '4';
    const type = typeItem ? typeItem.str.toUpperCase() : 'THEORY';
    const mode = modeItem ? modeItem.str.toUpperCase() : 'UES';
    const kind = kindStr ? kindStr.toUpperCase() : 'COMPULSORY DROPPABLE';
    const minor = minorItem ? minorItem.str : '25';
    const major = majorItem ? majorItem.str : '75';
    const max = maxItem ? maxItem.str : '100';
    const pass = passItem ? passItem.str : '40';

    lines.push(`${sno} ${paperId} ${code} ${name} ${credit} ${type} ${mode} ${kind} ${minor} ${major} ${max} ${pass}`);
  }

  return lines;
}

function groupTabulationPage(items: { str: string; x: number; y: number }[]): string[] {
  const lines: string[] = [];

  // 1. Header (x < 195)
  const headerItems = items.filter((it) => it.x < 195);
  lines.push(...standardHorizontalGrouping(headerItems));

  // 2. Student Columns (x >= 195)
  const studentItems = items.filter((it) => it.x >= 195 && it.x < 745);
  const colMap = new Map<number, { str: string; x: number; y: number }[]>();
  for (const it of studentItems) {
    const colIdx = Math.floor((it.x - 195.0) / 54.0);
    if (colIdx >= 0 && colIdx < 10) {
      if (!colMap.has(colIdx)) colMap.set(colIdx, []);
      colMap.get(colIdx)!.push(it);
    }
  }

  const sortedColIndices = Array.from(colMap.keys()).sort((a, b) => a - b);
  for (const colIdx of sortedColIndices) {
    const colItems = colMap.get(colIdx)!;
    
    // Check if this column has a student
    const rollItem = colItems.find((it) => /^\d{11}$/.test(it.str));
    if (!rollItem) continue;

    // Student Header line
    const stuLineItems = colItems.filter((it) => Math.abs(it.y - rollItem.y) <= 5);
    stuLineItems.sort((a, b) => a.x - b.x);
    const studentHeader = stuLineItems.map((p) => p.str).join(' ').replace(/\s+/g, ' ').trim();
    lines.push(studentHeader);

    // Subject marks
    const paperItems = colItems.filter((it) => /^\d{5,6}\(\d+\)$/.test(it.str));
    paperItems.sort((a, b) => b.y - a.y);

    for (const pItem of paperItems) {
      lines.push(pItem.str);

      const nearby = colItems.filter((it) => it !== pItem && it.y >= pItem.y - 8 && it.y <= pItem.y + 35);
      const totalItem = nearby.find((it) => /^(A|\d+)\s*\([^)]+\)\*?$/i.test(it.str));
      const scoreItems = nearby.filter((it) => it !== totalItem && /^(-|\d+|A)$/i.test(it.str));
      scoreItems.sort((a, b) => b.y - a.y);

      if (scoreItems.length >= 2) {
        const ext = scoreItems[0].str;
        const int = scoreItems[1].str;
        lines.push(`${int} ${ext}`);
      } else if (scoreItems.length === 1) {
        lines.push(`- ${scoreItems[0].str}`);
      }

      if (totalItem) {
        lines.push(totalItem.str);
      }
    }

    const creditsItem = colItems.find((it) => it.y > 1100 && /^\d+$/.test(it.str));
    if (creditsItem) {
      lines.push(creditsItem.str);
    }
  }

  return lines;
}

/**
 * Extract text from a PDF buffer via pdfjs-dist (lazily imported so unit tests
 * and cold starts never pay for the engine). I/O boundary only – no parsing here.
 */
export async function extractText(buffer: Buffer): Promise<ExtractedPages> {
  if (!buffer || buffer.length === 0) throw new Error('Empty PDF buffer');
  const moduleName = 'pdfjs-dist/legacy/build/pdf.mjs';
  const pdfjs = (await import(moduleName)) as unknown as {
    getDocument: (cfg: { data: Uint8Array; useSystemFonts?: boolean }) => {
      promise: Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: PdfTextItem[] }>; cleanup: () => Promise<void> }>;
        destroy: () => Promise<void>;
      }>;
    };
  };
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(groupItemsIntoLines(content.items).join('\n'));
    await page.cleanup();
  }
  await doc.destroy();
  return { pages, numPages: doc.numPages };
}

export default { groupItemsIntoLines, extractText };
