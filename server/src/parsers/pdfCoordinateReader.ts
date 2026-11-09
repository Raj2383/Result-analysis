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
  const rows: LineRow[] = [];
  for (const item of items || []) {
    const str = (item && item.str) || '';
    if (!str.trim()) continue;
    const t = (item && item.transform) || [0, 0, 0, 0, 0, 0];
    const x = t[4] || 0;
    const y = t[5] || 0;
    let row = rows.find((r) => Math.abs(r.y - y) <= LINE_Y_TOLERANCE);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, str });
  }
  rows.sort((a, b) => b.y - a.y); // PDF y grows upwards
  return rows.map((r) =>
    r.parts
      .sort((a, b) => a.x - b.x)
      .map((p) => p.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
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
