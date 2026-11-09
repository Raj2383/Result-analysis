import { useRef, useState } from 'react';
import { FiUploadCloud, FiFileText, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Button from '../../../components/ui/Button.jsx';
import { usePdfUpload } from '../hooks/useUpload.js';
import UploadProgress from './UploadProgress.jsx';

const MAX_MB = Number(import.meta.env.VITE_MAX_PDF_MB || 10);

export default function PdfDropzone() {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const { mutate, isPending, isSuccess, isError, error, data, progress, reset } = usePdfUpload();
  const [fileName, setFileName] = useState('');

  const serverError =
    error?.response?.status === 409
      ? 'This PDF was already uploaded – see history below.'
      : error?.response?.data?.message || (isError ? 'Upload failed – try again.' : null);

  const pick = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return;
    if (file.size > MAX_MB * 1024 * 1024) return;
    setFileName(file.name);
    reset();
    mutate(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload result PDF"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`card flex cursor-pointer flex-col items-center gap-3 sm:gap-3.5 border-2 border-dashed px-8 py-12 sm:py-16 text-center transition-colors ${
          dragOver ? 'border-brand-light bg-brand-soft/30' : 'border-brand-light/70 bg-card'
        }`}
      >
        <FiUploadCloud size={36} className="text-brand" aria-hidden />
        <h2 className="h2">Result PDF</h2>
        <p className="lbl max-w-md">Drag &amp; drop your result PDF here, or browse your files</p>
        <Button variant="accent" size="lg" tabIndex={-1} aria-hidden className="pointer-events-none mt-2 font-semibold shadow-sm">
          Choose file
        </Button>
        <p className="lbl mt-2 text-xs">PDF only · up to {MAX_MB} MB · re-uploads are rejected</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {fileName && (
        <p className="mt-2 flex items-center gap-2 text-sm text-ink">
          <FiFileText aria-hidden className="text-ink-soft" /> {fileName}
        </p>
      )}
      {isPending && (
        <div className="mt-3">
          <UploadProgress progress={progress} />
        </div>
      )}
      {serverError && (
        <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-bad">
          <FiAlertCircle aria-hidden /> {serverError}
        </p>
      )}
      {isSuccess && data && (
        <div className="card mt-3 border-ok/30 p-4 text-sm">
          <p className="flex items-center gap-2 font-bold text-ok">
            <FiCheckCircle aria-hidden /> Upload #{data.upload.id} ingested
          </p>
          <p className="mt-1 text-ink">
            {data.stats.students} students · {data.stats.papers} papers · {data.stats.marks} marks · {data.stats.results} results
          </p>
          {data.warnings?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-700">
              {data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
