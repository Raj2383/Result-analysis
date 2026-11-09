/**
 * GGSIPU PDF parser – composition root for the parsing pipeline.
 *
 * Layers:
 *   1. pdfCoordinateReader  – pdfjs-dist items -> Y-clustered lines (±2.0 pt) with x-ordered tokens
 *   2. ggsipuTokenParser      – token normalization (institution / scheme / exam / student / paper / score / total)
 *   3. schemePageParser       – scheme catalogue mutations (institutions, schemes, papers)
 *   4. resultPageStateMachine– result-tabulation state machine -> parsed document
 *
 * Entry point: parsePdfText(pages) folds every extracted page text into a ParsedResultDocument.
 */
import { parseResultText } from './resultPageStateMachine';
import { groupItemsIntoLines, extractText } from './pdfCoordinateReader';
import type { ParsedResultDocument } from '../types/parser.types';

export interface GgsipuPdfParseInput {
  pages: string[];
}

export function parsePdfText(input: GgsipuPdfParseInput | string[]): ParsedResultDocument {
  const pages = Array.isArray(input) ? input : input.pages;
  return parseResultText(pages);
}

/** Re-group raw pdfjs text items into coordinate lines (thin alias over the reader for the orchestrator API). */
export function groupToLines(items: Parameters<typeof groupItemsIntoLines>[0]): string[] {
  return groupItemsIntoLines(items);
}

export { extractText };

export default { parsePdfText, groupToLines, extractText };
