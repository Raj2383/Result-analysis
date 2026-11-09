import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { extractText } from '../src/parsers/pdfCoordinateReader';
import { parseResultText } from '../src/parsers/resultPageStateMachine';
import type { ParsedResultDocument } from '../src/types/parser.types';

config();

const PDF_PATH = path.resolve(process.cwd(), '..', 'Result Exam BCA 5th Semester Dec 2024 Jan 2025.pdf');
const EXPECTED_PAGES = 383;
const EXPECTED_STUDENT_BLOCKS = 2634;
const EDGE_CASE_ROLLS = ['00911102022', '00112002021', '02615102022', '35321402022'];

export async function verifyRealPdf(): Promise<void> {
  const file = 'Result Exam BCA 5th Semester Dec 2024 Jan 2025.pdf';
  const abs = PDF_PATH;
  if (!fs.existsSync(abs)) {
    throw new Error(`Real PDF fixture not found at ${abs}`);
  }
  const buffer = fs.readFileSync(abs);
  console.log(`Loaded ${file} (${buffer.length} bytes)`);

  const { pages } = await extractText(buffer);
  if (pages.length !== EXPECTED_PAGES) {
    throw new Error(`Expected ${EXPECTED_PAGES} pages in GGSIPU tabulation PDF, parsed ${pages.length}`);
  }
  console.log(`Parsed ${pages.length} pages.`);

  const parsed: ParsedResultDocument = parseResultText(pages);
  console.log(
    `Parsed ${parsed.students.length} student blocks, ${parsed.results.length} results, ${parsed.meta.warnings.length} warnings.`
  );

  if (parsed.students.length !== EXPECTED_STUDENT_BLOCKS) {
    throw new Error(`Expected ${EXPECTED_STUDENT_BLOCKS} student blocks, parsed ${parsed.students.length}`);
  }

  const seen = new Set(parsed.students.map((s) => s.roll_no));
  for (const roll of EDGE_CASE_ROLLS) {
    if (!seen.has(roll)) {
      throw new Error(`Edge-case roll ${roll} was not parsed from the real PDF`);
    }
  }

  console.log(
    `Institutions: ${parsed.institutions.map((i) => i.code).join(', ') || 'none'}; schemes: ${parsed.schemes.length}; papers: ${parsed.papers.length}; exams: ${parsed.exams.length}.`
  );
}

if (process.argv[1] && process.argv[1].endsWith('verify-real-pdf.ts')) {
  void verifyRealPdf().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
