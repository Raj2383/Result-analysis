import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { verifyRealPdf } from '../../scripts/verify-real-pdf';

const PDF_PATH = path.resolve(process.cwd(), '..', 'Result Exam BCA 5th Semester Dec 2024 Jan 2025.pdf');

const maybeDescribe = fs.existsSync(PDF_PATH) ? describe : describe.skip;

maybeDescribe('realPdfVerification – real GGSIPU tabulation PDF', () => {
  it('locates the real PDF fixture', () => {
    expect(fs.existsSync(PDF_PATH)).toBe(true);
  });

  it('runs the full extraction pipeline without crashing', async () => {
    await expect(verifyRealPdf()).resolves.toBeUndefined();
  });
});
